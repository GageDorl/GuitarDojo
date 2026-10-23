import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { getEnv } from "@/server/env";

export interface EmailMessage {
  readonly to: string;
  readonly subject: string;
  readonly text: string;
  readonly html: string;
}

let transporter: import("nodemailer").Transporter | undefined;

/**
 * Send an email. With EMAIL_TRANSPORT=smtp it goes through your provider; with "log" (local
 * development and tests) it is written to MAIL_LOG_DIR as JSON and printed, so verification and
 * reset links can be followed without a mail server.
 */
export async function sendEmail(message: EmailMessage): Promise<void> {
  const env = getEnv();
  if (env.EMAIL_TRANSPORT === "log") {
    await mkdir(env.MAIL_LOG_DIR, { recursive: true });
    const file = path.join(env.MAIL_LOG_DIR, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.json`);
    await writeFile(file, JSON.stringify({ ...message, sentAt: new Date().toISOString() }, null, 2));
    console.info(`[email:log] to=${message.to} subject="${message.subject}"\n${message.text}`);
    return;
  }
  if (!transporter) {
    const nodemailer = await import("nodemailer");
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      requireTLS: !env.SMTP_SECURE,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    });
  }
  await transporter.sendMail({ from: env.EMAIL_FROM, ...message });
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** A plain, accessible transactional email with one button-style link. */
export function actionEmail(options: { to: string; subject: string; heading: string; body: string; action: string; url: string; footer: string }): EmailMessage {
  const { to, subject, heading, body, action, url, footer } = options;
  return {
    to,
    subject,
    text: `${heading}\n\n${body}\n\n${action}: ${url}\n\n${footer}\n`,
    html: `<!doctype html><html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#1d1b18;max-width:520px;margin:0 auto;padding:24px">
<h1 style="font-size:20px">${escapeHtml(heading)}</h1>
<p>${escapeHtml(body)}</p>
<p><a href="${escapeHtml(url)}" style="display:inline-block;background:#d9480f;color:#fff;padding:10px 18px;border-radius:999px;text-decoration:none;font-weight:600">${escapeHtml(action)}</a></p>
<p style="font-size:13px;color:#69645a">If the button doesn't work, copy this link into your browser:<br>${escapeHtml(url)}</p>
<p style="font-size:13px;color:#69645a">${escapeHtml(footer)}</p>
</body></html>`,
  };
}
