import crypto from "crypto";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import {
  signupSchema,
  createStaffSchema,
  resetPasswordSchema,
  type SignupInput,
  type CreateStaffInput,
  type ResetPasswordInput,
} from "@/lib/validators/auth";
import {
  requireRole,
  ConflictError,
  NotFoundError,
  ForbiddenError,
} from "@/server/policies/permissions";
import { Resend } from "resend";

const BCRYPT_ROUNDS = 10; // User requirement 4: cost 10

/**
 * Register a new Customer account.
 * - Enforces case-insensitive email uniqueness.
 * - Always assigns Role.CUSTOMER (AUTH-5).
 * - Catches Prisma P2002 unique constraint error with friendly message (User change 2).
 */
export async function signupCustomer(input: SignupInput) {
  const parsed = signupSchema.parse(input);
  const normalizedEmail = parsed.email.toLowerCase().trim();

  // Pre-check for existing account
  const existing = await db.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    throw new ConflictError(
      "An account with this email already exists. Please sign in instead."
    );
  }

  const passwordHash = await bcrypt.hash(parsed.password, BCRYPT_ROUNDS);

  try {
    const user = await db.user.create({
      data: {
        name: parsed.name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: "CUSTOMER",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  } catch (error) {
    // User change 2: Catch Prisma unique constraint error (P2002)
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ConflictError(
        "An account with this email already exists. Please sign in instead."
      );
    }
    throw error;
  }
}

/**
 * Create a Staff account (Admin only).
 */
export async function createStaffAccount(input: CreateStaffInput) {
  await requireRole(["ADMIN"]);
  const parsed = createStaffSchema.parse(input);
  const normalizedEmail = parsed.email.toLowerCase().trim();

  const existing = await db.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    throw new ConflictError(
      "An account with this email already exists."
    );
  }

  const passwordHash = await bcrypt.hash(parsed.password, BCRYPT_ROUNDS);

  try {
    const user = await db.user.create({
      data: {
        name: parsed.name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: "STAFF",
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return user;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ConflictError("An account with this email already exists.");
    }
    throw error;
  }
}

/**
 * List all team members (Admin and Staff) - Admin only page.
 */
export async function listTeamMembers() {
  await requireRole(["ADMIN"]);
  return db.user.findMany({
    where: {
      role: {
        in: ["ADMIN", "STAFF"],
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: [{ role: "asc" }, { createdAt: "desc" }],
  });
}

/**
 * Request password reset link.
 * - Always returns success to prevent user enumeration (AUTH-3).
 * - Hashed single-use token expiring in 30 minutes.
 * - Delivers via Resend or logs to terminal if placeholder (User change 6).
 */
export async function requestPasswordReset(email: string) {
  const normalizedEmail = email.toLowerCase().trim();
  const user = await db.user.findUnique({
    where: { email: normalizedEmail },
  });

  // If user does not exist, silently return success without revealing non-existence
  if (!user) {
    return { success: true };
  }

  // Generate 32-byte secure random token
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

  // Invalidate any active unused tokens for this user
  await db.passwordReset.deleteMany({
    where: {
      userId: user.id,
      usedAt: null,
    },
  });

  await db.passwordReset.create({
    data: {
      userId: user.id,
      tokenHash,
      expiresAt,
    },
  });

  const appUrl = process.env.APP_URL || "http://localhost:3000";
  const resetUrl = `${appUrl}/reset-password?token=${rawToken}`;

  const resendApiKey = process.env.RESEND_API_KEY;
  const isPlaceholderKey =
    !resendApiKey ||
    resendApiKey.startsWith("re_sample") ||
    resendApiKey.startsWith("re_...") ||
    resendApiKey.length < 10;

  // User change 6: If RESEND_API_KEY is a placeholder, log the reset link to the terminal in dev
  if (isPlaceholderKey || process.env.NODE_ENV !== "production") {
    console.log("\n=======================================================");
    console.log(`[DEV PASSWORD RESET LINK] User: ${user.email}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log("=======================================================\n");
  }

  if (!isPlaceholderKey && resendApiKey) {
    try {
      const resend = new Resend(resendApiKey);
      const emailFrom = process.env.EMAIL_FROM || "Brightloop <onboarding@resend.dev>";
      await resend.emails.send({
        from: emailFrom,
        to: user.email,
        subject: "Reset your Brightloop Billing password",
        html: `
          <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
            <h2 style="color: #6d5dfc;">Brightloop Billing</h2>
            <p>Hello ${user.name},</p>
            <p>You requested a password reset for your Brightloop Billing account. Click the button below to set a new password:</p>
            <p style="margin: 28px 0;">
              <a href="${resetUrl}" style="background-color: #6d5dfc; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </p>
            <p style="color: #71717a; font-size: 13px;">This link will expire in 30 minutes. If you did not request this, you can safely ignore this email.</p>
          </div>
        `,
      });
    } catch (err) {
      console.error("[Resend Error] Failed to send reset email:", err);
    }
  }

  return { success: true };
}

/**
 * Complete password reset using token.
 * - Single-use token validation.
 * - Updates user passwordHash with cost 10.
 * - Marks token usedAt = now in a transaction.
 */
export async function resetPasswordWithToken(input: ResetPasswordInput) {
  const parsed = resetPasswordSchema.parse(input);
  const tokenHash = crypto
    .createHash("sha256")
    .update(parsed.token)
    .digest("hex");

  const resetRecord = await db.passwordReset.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!resetRecord) {
    throw new NotFoundError(
      "Invalid or expired password reset link. Please request a new one."
    );
  }

  if (resetRecord.usedAt !== null) {
    throw new ForbiddenError(
      "This password reset link has already been used. Please request a new one."
    );
  }

  if (new Date() > resetRecord.expiresAt) {
    throw new ForbiddenError(
      "This password reset link has expired. Please request a new one."
    );
  }

  const newPasswordHash = await bcrypt.hash(parsed.password, BCRYPT_ROUNDS);

  // In a transaction: update user password and mark token used
  await db.$transaction([
    db.user.update({
      where: { id: resetRecord.userId },
      data: { passwordHash: newPasswordHash },
    }),
    db.passwordReset.update({
      where: { id: resetRecord.id },
      data: { usedAt: new Date() },
    }),
  ]);

  return { success: true };
}

