"use client";

import Link from "next/link";
import { useSession } from "@/lib/auth-client";

/** Header entry point: "Sign in" for visitors, the account page for students. */
export function AccountLink() {
  const { data: session, isPending } = useSession();
  if (isPending) return <span className="inline-block h-9 w-16" aria-hidden />;
  if (!session) {
    return (
      <Link href="/sign-in" className="rounded-full px-3 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-text" data-testid="header-sign-in">
        Sign in
      </Link>
    );
  }
  const initial = (session.user.name || session.user.email).charAt(0).toUpperCase();
  return (
    <Link
      href="/account"
      className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-contrast"
      aria-label={`Account (${session.user.email})`}
      data-testid="header-account"
    >
      {initial}
    </Link>
  );
}
