import React, { Suspense } from "react";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata = {
  title: "New Password - Brightloop Billing",
  description: "Set a new password for Brightloop Billing",
};

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-zinc-400 text-xs">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

