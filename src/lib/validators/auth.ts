import { z } from "zod";

/**
 * Password validation rule as mandated by the problem statement:
 * - More than 8 characters (at least 9)
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one special character
 */
export const passwordSchema = z
  .string()
  .min(9, "Password must be more than 8 characters")
  .regex(/[A-Z]/, "Add an uppercase letter")
  .regex(/[a-z]/, "Add a lowercase letter")
  .regex(/[^A-Za-z0-9]/, "Add a special character");

export const signupSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .transform((val) => val.toLowerCase()),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .transform((val) => val.toLowerCase()),
  password: z.string().min(1, "Password is required"),
});

export const requestResetSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .transform((val) => val.toLowerCase()),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: passwordSchema,
});

export const createStaffSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z
    .string()
    .trim()
    .email("Enter a valid email address")
    .transform((val) => val.toLowerCase()),
  password: passwordSchema,
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RequestResetInput = z.infer<typeof requestResetSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type CreateStaffInput = z.infer<typeof createStaffSchema>;

