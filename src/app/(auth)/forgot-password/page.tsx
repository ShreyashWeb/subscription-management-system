import React, { Suspense } from "react";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata = {
  title: "Reset Password - Brightloop Billing",
  description: "Request a password reset link for Brightloop Billing",
};

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="text-zinc-400 text-xs">Loading...</div>}>
      <ForgotPasswordForm />
    </Suspense>
  );
}

