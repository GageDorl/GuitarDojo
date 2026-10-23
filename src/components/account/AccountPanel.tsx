"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useState } from "react";
import { authClient, useSession } from "@/lib/auth-client";
import { useSyncStatus } from "@/components/progress/ProgressProvider";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Field, FormMessage, authErrorMessage, safeNext } from "./forms";

const STATUS_TEXT = {
  local: "Saved on this device",
  synced: "Saved to your account",
  syncing: "Saving…",
  offline: "Offline: changes will sync when you reconnect",
  "signed-out": "Session ended: sign in again to sync",
} as const;

export function AccountPanel() {
  const router = useRouter();
  const params = useSearchParams();
  const { data: session, isPending } = useSession();
  const sync = useSyncStatus();
  const [signingOut, setSigningOut] = useState(false);

  if (isPending) return <p className="text-muted">Loading…</p>;
  if (params.get("error")) {
    return (
      <div className="space-y-4">
        <FormMessage kind="error">That confirmation link is invalid or has expired. Sign in to receive a new one.</FormMessage>
        <ButtonLink href="/sign-in">Sign in</ButtonLink>
      </div>
    );
  }
  if (!session) {
    return (
      <div className="space-y-4">
        <p>You&apos;re not signed in. Lessons work without an account; signing in syncs progress across devices.</p>
        <div className="flex gap-3">
          <ButtonLink href="/sign-in?next=/account">Sign in</ButtonLink>
          <ButtonLink href="/sign-up" variant="secondary">
            Create account
          </ButtonLink>
        </div>
      </div>
    );
  }

  async function signOut() {
    setSigningOut(true);
    await sync.signOutCleanup();
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {params.get("verified") === "1" && (
        <FormMessage kind="success">
          Email confirmed, welcome! Any progress you made on this device has been added to your account.{" "}
          <Link className="font-semibold underline" href={safeNext(params.get("next"))}>
            Continue learning
          </Link>
        </FormMessage>
      )}
      <dl className="grid gap-3 text-sm sm:grid-cols-[8rem_1fr]">
        <dt className="font-semibold">Name</dt>
        <dd>{session.user.name}</dd>
        <dt className="font-semibold">Email</dt>
        <dd className="break-all">{session.user.email}</dd>
        <dt className="font-semibold">Progress</dt>
        <dd data-testid="sync-status" data-status={sync.status}>
          {STATUS_TEXT[sync.status]}
          {sync.pending > 0 && sync.status !== "syncing" ? ` (${sync.pending} queued)` : ""}
        </dd>
      </dl>
      <ChangePasswordForm />
      <Button variant="secondary" onClick={signOut} disabled={signingOut} data-testid="sign-out">
        {signingOut ? "Signing out…" : "Sign out"}
      </Button>
    </div>
  );
}

function ChangePasswordForm() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    setPending(true);
    const { error } = await authClient.changePassword({
      currentPassword: String(form.get("current")),
      newPassword: String(form.get("password")),
      revokeOtherSessions: true,
    });
    setPending(false);
    setMessage(error ? { kind: "error", text: authErrorMessage(error) } : { kind: "success", text: "Password changed. Other devices were signed out." });
    if (!error) formEl.reset();
  }

  if (!open) {
    return (
      <button type="button" className="text-sm font-semibold text-accent" onClick={() => setOpen(true)}>
        Change password
      </button>
    );
  }
  return (
    <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border border-border p-4">
      {message && <FormMessage kind={message.kind}>{message.text}</FormMessage>}
      <Field label="Current password" name="current" type="password" autoComplete="current-password" required />
      <Field label="New password" name="password" type="password" autoComplete="new-password" minLength={10} maxLength={128} required />
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Change password"}
      </Button>
    </form>
  );
}
