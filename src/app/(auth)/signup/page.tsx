import React, { Suspense } from "react";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata = {
  title: "Create Account - Brightloop Billing",
  description: "Create a new Brightloop customer account",
};

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="text-zinc-400 text-xs">Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}

