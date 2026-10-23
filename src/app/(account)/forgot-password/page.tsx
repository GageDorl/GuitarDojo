import type { Metadata } from "next";
import { AuthCard } from "@/components/account/forms";
import { ForgotPasswordForm } from "@/components/account/PasswordForms";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <AuthCard title="Reset your password" subtitle="We'll email you a link to choose a new one.">
      <ForgotPasswordForm />
    </AuthCard>
  );
}
