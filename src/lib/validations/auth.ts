/**
 * GrowPlants — Zod Validation Schemas
 * Source: PRD §07 (Auth), §32.2 (config), form requirements across pages
 *
 * Co-located per domain. Used by React Hook Form via @hookform/resolvers.
 */
import { z } from "zod";
import {
  isValidIndianPhone,
  isValidPincode,
  normalizeIndianPhone,
} from "@/lib/utils";
import {
  OTP_MAX_ATTEMPTS,
  REVIEW_MAX_IMAGES,
  REVIEW_WINDOW_DAYS,
} from "@/lib/constants";

/* ---------- Auth ---------- */

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, "Email or phone is required")
    .refine(
      (v) => z.string().email().safeParse(v).success || isValidIndianPhone(v),
      "Enter a valid email or Indian phone number"
    ),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(128, "Password is too long"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    fullName: z
      .string()
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name is too long"),
    email: z.string().email("Enter a valid email").max(150),
    phone: z
      .string()
      .refine(isValidIndianPhone, "Enter a valid Indian phone number"),
    password: z
      .string()
      .min(6, "Password must be at least 6 characters")
      .max(128, "Password is too long"),
    confirmPassword: z.string(),
    acceptTerms: z
      .boolean()
      .refine((v) => v === true, "You must accept the Terms to continue"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotPasswordSchema = z.object({
  identifier: z
    .string()
    .min(1, "Email or phone is required")
    .refine(
      (v) => z.string().email().safeParse(v).success || isValidIndianPhone(v),
      "Enter a valid email or Indian phone number"
    ),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    otp: z
      .string()
      .length(6, "OTP must be 6 digits")
      .regex(/^\d{6}$/, "OTP must be digits only"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128)
      .regex(/[A-Z]/, "Add at least one uppercase letter")
      .regex(/[a-z]/, "Add at least one lowercase letter")
      .regex(/[0-9]/, "Add at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const otpSchema = z.object({
  otp: z
    .string()
    .length(6, "OTP must be 6 digits")
    .regex(/^\d{6}$/, "OTP must be digits only"),
});
export type OtpInput = z.infer<typeof otpSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(128)
      .regex(/[A-Z]/, "Add at least one uppercase letter")
      .regex(/[a-z]/, "Add at least one lowercase letter")
      .regex(/[0-9]/, "Add at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

/* ---------- Profile ---------- */

export const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().max(50).optional().or(z.literal("")),
  email: z.string().email("Enter a valid email").max(150),
  phone: z
    .string()
    .refine(isValidIndianPhone, "Enter a valid Indian phone number")
    .transform(normalizeIndianPhone),
  gender: z.enum(["male", "female", "other", "prefer_not"]).optional(),
  dateOfBirth: z
    .string()
    .optional()
    .refine(
      (v) => !v || !isNaN(new Date(v).getTime()),
      "Enter a valid date of birth"
    ),
  preferredLanguage: z.enum(["en", "hi"]).default("en"),
});
export type ProfileInput = z.infer<typeof profileSchema>;

/* ---------- Helper exports ---------- */

export const OTP_MAX = OTP_MAX_ATTEMPTS;
export const REVIEW_IMAGE_MAX = REVIEW_MAX_IMAGES;
export const REVIEW_WINDOW = REVIEW_WINDOW_DAYS;
