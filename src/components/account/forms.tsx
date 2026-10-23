"use client";

import type { InputHTMLAttributes, ReactNode } from "react";

/** Small form primitives for the account pages. */

export function AuthCard({ title, subtitle, children }: { title: string; subtitle?: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-10 sm:py-16">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      {subtitle && <p className="mt-2 text-muted">{subtitle}</p>}
      <div className="mt-8 rounded-3xl border border-border bg-surface p-5 sm:p-7">{children}</div>
    </div>
  );
}

export function Field({ label, hint, ...props }: { label: string; hint?: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <input
        {...props}
        className="mt-1.5 block h-12 w-full rounded-xl border border-border bg-bg px-3.5 text-base text-text outline-none focus:border-accent focus:ring-2 focus:ring-accent/25"
      />
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function FormMessage({ kind, children }: { kind: "error" | "success" | "info"; children: ReactNode }) {
  const styles = {
    error: "border-incorrect/40 bg-incorrect-soft text-incorrect",
    success: "border-correct/40 bg-correct-soft text-correct",
    info: "border-border bg-surface-2 text-text",
  }[kind];
  return (
    <p role={kind === "error" ? "alert" : "status"} className={`rounded-xl border p-3 text-sm ${styles}`}>
      {children}
    </p>
  );
}

/** Only allow same-site relative redirects (prevents open-redirect abuse of ?next=). */
export function safeNext(next: string | null | undefined, fallback = "/learn"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}

/** Map Better Auth error responses to friendly messages. */
export function authErrorMessage(error: { status?: number; code?: string; message?: string } | null | undefined): string {
  if (!error) return "Something went wrong. Please try again.";
  if (error.status === 429) return "Too many attempts. Please wait a minute and try again.";
  switch (error.code) {
    case "INVALID_EMAIL_OR_PASSWORD":
      return "That email and password don't match.";
    case "EMAIL_NOT_VERIFIED":
      return "Please confirm your email first. We've sent you a new confirmation link.";
    case "PASSWORD_TOO_SHORT":
      return "Use at least 10 characters for your password.";
    case "PASSWORD_TOO_LONG":
      return "That password is too long (128 characters at most).";
    case "INVALID_TOKEN":
      return "This link is invalid or has expired. Request a new one.";
    case "EMAIL_PASSWORD_SIGN_UP_DISABLED":
      return "Registration is currently closed.";
    case "INVALID_PASSWORD":
      return "Your current password is incorrect.";
    default:
      return error.message || "Something went wrong. Please try again.";
  }
}
