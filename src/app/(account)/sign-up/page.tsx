import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthCard } from "@/components/account/forms";
import { SignUpForm } from "@/components/account/SignUpForm";
import { getEnv } from "@/server/env";

export const metadata: Metadata = { title: "Create account" };
// Registration can be switched off by environment variable, so read it at request time.
export const dynamic = "force-dynamic";

export default function SignUpPage() {
  const open = getEnv().registrationOpen;
  return (
    <AuthCard title="Create your free account" subtitle="Sync your progress across devices and keep your exercise history. Lessons stay free either way.">
      {open ? (
        <Suspense>
          <SignUpForm />
        </Suspense>
      ) : (
        <p>
          Registration is closed for now. You can still use every lesson without an account.{" "}
          <Link className="font-semibold text-accent" href="/learn">
            Start learning
          </Link>
        </p>
      )}
    </AuthCard>
  );
}
