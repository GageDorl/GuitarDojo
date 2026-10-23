import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard } from "@/components/account/forms";
import { SignInForm } from "@/components/account/SignInForm";
import { getEnv } from "@/server/env";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default function SignInPage() {
  return (
    <AuthCard title="Sign in" subtitle="Pick up where you left off on any device.">
      <Suspense>
        <SignInForm registrationOpen={getEnv().registrationOpen} />
      </Suspense>
    </AuthCard>
  );
}
