/**
 * GrowPlants — Address Validation
 * Source: PRD DB-002 user_addresses, FR-CHECKOUT-001
 */
import { z } from "zod";
import { isValidIndianPhone, isValidPincode } from "@/lib/utils";

export const addressSchema = z.object({
  label: z
    .string()
    .max(50, "Label is too long")
    .optional()
    .or(z.literal("")),
  fullName: z
    .string()
    .min(2, "Recipient name is required")
    .max(100, "Name is too long"),
  phone: z
    .string()
    .refine(isValidIndianPhone, "Enter a valid Indian phone number"),
  addressLine1: z
    .string()
    .min(5, "Address is too short")
    .max(255, "Address is too long"),
  addressLine2: z
    .string()
    .max(255)
    .optional()
    .or(z.literal("")),
  landmark: z
    .string()
    .max(100)
    .optional()
    .or(z.literal("")),
  city: z.string().min(2, "City is required").max(100),
  state: z.string().min(2, "State is required").max(100),
  pincode: z
    .string()
    .refine(isValidPincode, "Enter a valid 6-digit Indian pincode"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  locationSource: z
    .enum(["gps", "manual"])
    .optional()
    .or(z.literal("")),
  locationVerified: z
    .boolean()
    .refine((v) => v === true, "Location verification is required"),
  isDefault: z.boolean().default(false),
});
export type AddressInput = z.infer<typeof addressSchema>;

export const pincodeCheckSchema = z.object({
  pincode: z
    .string()
    .refine(isValidPincode, "Enter a valid 6-digit Indian pincode"),
});
export type PincodeCheckInput = z.infer<typeof pincodeCheckSchema>;
