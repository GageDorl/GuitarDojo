"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/Button";
import { Field, FormMessage, authErrorMessage } from "./forms";

export function ForgotPasswordForm() {
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPending(true);
    setError(null);
    const { error } = await authClient.requestPasswordReset({ email: String(form.get("email")).trim(), redirectTo: "/reset-password" });
    setPending(false);
    if (error) return setError(authErrorMessage(error));
    setSent(true);
  }

  if (sent) {
    return (
      <FormMessage kind="success">
        If an account exists for that email, we&apos;ve sent a link to reset the password. It expires in one hour.
      </FormMessage>
    );
  }
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <FormMessage kind="error">{error}</FormMessage>}
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(params.get("error") ? authErrorMessage({ code: "INVALID_TOKEN" }) : null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const password = String(form.get("password"));
    if (password !== String(form.get("confirm"))) return setError("The two passwords don't match.");
    if (!token) return setError(authErrorMessage({ code: "INVALID_TOKEN" }));
    setPending(true);
    setError(null);
    const { error } = await authClient.resetPassword({ newPassword: password, token });
    setPending(false);
    if (error) return setError(authErrorMessage(error));
    router.push("/sign-in?reset=1");
  }

  if (!token) {
    return (
      <div className="space-y-4">
        <FormMessage kind="error">{error ?? authErrorMessage({ code: "INVALID_TOKEN" })}</FormMessage>
        <Link className="font-semibold text-accent" href="/forgot-password">
          Request a new link
        </Link>
      </div>
    );
  }
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <FormMessage kind="error">{error}</FormMessage>}
      <Field label="New password" name="password" type="password" autoComplete="new-password" minLength={10} maxLength={128} required />
      <Field label="Confirm new password" name="confirm" type="password" autoComplete="new-password" minLength={10} maxLength={128} required />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Saving…" : "Set new password"}
      </Button>
      <p className="text-xs text-muted">For your security, this signs you out on every other device.</p>
    </form>
  );
}
