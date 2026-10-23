"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/Button";
import { Field, FormMessage, authErrorMessage, safeNext } from "./forms";

export function SignInForm({ registrationOpen }: { registrationOpen: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPending(true);
    setError(null);
    const { error } = await authClient.signIn.email({
      email: String(form.get("email")).trim(),
      password: String(form.get("password")),
    });
    setPending(false);
    if (error) return setError(authErrorMessage(error));
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {params.get("reset") === "1" && <FormMessage kind="success">Password changed. Sign in with your new password.</FormMessage>}
      {error && <FormMessage kind="error">{error}</FormMessage>}
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <Field label="Password" name="password" type="password" autoComplete="current-password" required />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <div className="flex flex-wrap justify-between gap-2 text-sm">
        <Link className="font-semibold text-accent" href="/forgot-password">
          Forgot password?
        </Link>
        {registrationOpen && (
          <Link className="font-semibold text-accent" href={`/sign-up?next=${encodeURIComponent(next)}`}>
            Create an account
          </Link>
        )}
      </div>
    </form>
  );
}
