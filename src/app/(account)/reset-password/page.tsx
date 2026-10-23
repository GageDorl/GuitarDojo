import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthCard } from "@/components/account/forms";
import { ResetPasswordForm } from "@/components/account/PasswordForms";

export const metadata: Metadata = { title: "Choose a new password", referrer: "no-referrer" };

export default function ResetPasswordPage() {
  return (
    <AuthCard title="Choose a new password">
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  );
}
