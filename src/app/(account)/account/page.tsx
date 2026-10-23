import type { Metadata } from "next";
import { Suspense } from "react";
import { AccountPanel } from "@/components/account/AccountPanel";
import { AuthCard } from "@/components/account/forms";

export const metadata: Metadata = { title: "Account" };

export default function AccountPage() {
  return (
    <AuthCard title="Your account">
      <Suspense>
        <AccountPanel />
      </Suspense>
    </AuthCard>
  );
}
