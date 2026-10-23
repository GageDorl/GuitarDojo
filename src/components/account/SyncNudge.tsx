"use client";

import Link from "next/link";
import { useSyncStatus } from "@/components/progress/ProgressProvider";
import { useSession } from "@/lib/auth-client";

/**
 * A gentle, dismissible-by-ignoring prompt for anonymous learners. Accounts are optional:
 * everything works without one; an account adds cross-device sync and a permanent history.
 */
export function SyncNudge({ className = "" }: { className?: string }) {
  const { data: session, isPending } = useSession();
  const { status, pending } = useSyncStatus();
  if (isPending) return null;
  if (session) {
    if (status === "offline" || status === "signed-out") {
      return (
        <p className={`rounded-xl border border-border bg-surface-2 p-3 text-sm ${className}`} role="status">
          {status === "offline"
            ? `Offline: ${pending} change${pending === 1 ? "" : "s"} will sync when you're back online.`
            : "Your session ended. Sign in again to sync your latest progress."}
        </p>
      );
    }
    return null;
  }
  return (
    <p className={`rounded-xl border border-border bg-surface-2 p-3 text-sm ${className}`}>
      Progress is saved on this device.{" "}
      <Link href="/sign-up" className="font-semibold text-accent underline-offset-2 hover:underline">
        Create a free account
      </Link>{" "}
      to keep it across devices.
    </p>
  );
}
