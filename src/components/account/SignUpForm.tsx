"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/Button";
import { Field, FormMessage, authErrorMessage, safeNext } from "./forms";

export function SignUpForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get("email")).trim();
    setPending(true);
    setError(null);
    const { error } = await authClient.signUp.email({
      name: String(form.get("name")).trim() || email.split("@")[0]!,
      email,
      password: String(form.get("password")),
      callbackURL: `/account?verified=1&next=${encodeURIComponent(next)}`,
    });
    setPending(false);
    if (error) return setError(authErrorMessage(error));
    router.push(`/check-email?email=${encodeURIComponent(email)}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate={false}>
      {error && <FormMessage kind="error">{error}</FormMessage>}
      <Field label="Name" name="name" autoComplete="nickname" maxLength={80} placeholder="What should we call you?" />
      <Field label="Email" name="email" type="email" autoComplete="email" required />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={10}
        maxLength={128}
        required
        hint="At least 10 characters. A few random words work well."
      />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating account…" : "Create account"}
      </Button>
      <p className="text-center text-sm text-muted">
        Already have an account?{" "}
        <Link className="font-semibold text-accent" href={`/sign-in?next=${encodeURIComponent(next)}`}>
          Sign in
        </Link>
      </p>
    </form>
  );
}
