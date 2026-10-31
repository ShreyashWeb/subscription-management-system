"use server";

import { signIn, signOut } from "@/lib/auth";
import { AuthError } from "next-auth";
import {
  signupCustomer,
  createStaffAccount,
  requestPasswordReset,
  resetPasswordWithToken,
} from "@/server/services/auth";
import {
  signupSchema,
  createStaffSchema,
  requestResetSchema,
  resetPasswordSchema,
  type SignupInput,
  type CreateStaffInput,
  type ResetPasswordInput,
} from "@/lib/validators/auth";
import { revalidatePath } from "next/cache";

export type ActionResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

/**
 * Server Action for User Signup (creates CUSTOMER).
 */
export async function signupAction(
  data: SignupInput
): Promise<ActionResponse<{ id: string; email: string }>> {
  try {
    const parsed = signupSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid input data",
      };
    }

    const user = await signupCustomer(parsed.data);
    return { success: true, data: { id: user.id, email: user.email } };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to create account. Please try again.",
    };
  }
}

/**
 * Server Action for Requesting Password Reset.
 */
export async function requestResetAction(
  email: string
): Promise<ActionResponse> {
  try {
    const parsed = requestResetSchema.safeParse({ email });
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Enter a valid email",
      };
    }

    await requestPasswordReset(parsed.data.email);
    return { success: true };
  } catch (err: any) {
    // Keep response generic to prevent email enumeration
    return { success: true };
  }
}

/**
 * Server Action for Completing Password Reset.
 */
export async function resetPasswordAction(
  data: ResetPasswordInput
): Promise<ActionResponse> {
  try {
    const parsed = resetPasswordSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid password",
      };
    }

    await resetPasswordWithToken(parsed.data);
    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to reset password. Link may be expired.",
    };
  }
}

/**
 * Server Action for Creating Staff Account (Admin only).
 */
export async function createStaffAction(
  data: CreateStaffInput
): Promise<ActionResponse> {
  try {
    const parsed = createStaffSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message || "Invalid staff details",
      };
    }

    await createStaffAccount(parsed.data);
    revalidatePath("/staff");
    return { success: true };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Failed to create staff account.",
    };
  }
}

/**
 * Server Action for User Login.
 * User requirement 3: Login failures always return the generic message "Invalid email or password".
 */
export async function loginAction(
  formData: FormData | Record<string, string>
): Promise<ActionResponse> {
  const email =
    formData instanceof FormData
      ? (formData.get("email") as string)
      : formData.email;
  const password =
    formData instanceof FormData
      ? (formData.get("password") as string)
      : formData.password;

  if (!email || !password) {
    return { success: false, error: "Invalid email or password" };
  }

  try {
    await signIn("credentials", {
      email: email.toLowerCase().trim(),
      password,
      redirect: false,
    });
    return { success: true };
  } catch (err: any) {
    if (err instanceof AuthError) {
      return { success: false, error: "Invalid email or password" };
    }
    // Return generic error message on any credentials failure
    return { success: false, error: "Invalid email or password" };
  }
}

/**
 * Server Action for Sign Out.
 */
export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

