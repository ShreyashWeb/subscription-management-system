import React, { Suspense } from "react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Sign In - Brightloop Billing",
  description: "Sign in to your Brightloop Billing account",
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-zinc-400 text-xs">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}

