import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";

export const metadata: Metadata = {
  title: "Create Account",
  description:
    "Create a GrowPlants account to shop plants, planters, and book gardening services in Sonipat.",
  robots: { index: false, follow: false },
};

export default function RegisterPage() {
  return <AuthCard initialView="register" />;
}
