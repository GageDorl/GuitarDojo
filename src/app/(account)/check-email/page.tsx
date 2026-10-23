import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/account/forms";

export const metadata: Metadata = { title: "Check your email" };

export default function CheckEmailPage() {
  return (
    <AuthCard title="Check your email">
      <div className="space-y-4">
        <p>
          We&apos;ve sent a confirmation link. Open it on this device to finish creating your account. Any progress you&apos;ve made
          here will be added to it.
        </p>
        <p className="text-sm text-muted">
          No email after a few minutes? Check your spam folder, or{" "}
          <Link className="font-semibold text-accent" href="/sign-in">
            sign in
          </Link>{" "}
          to get a new link.
        </p>
      </div>
    </AuthCard>
  );
}
