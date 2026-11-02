"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Eye,
  EyeOff,
  Mail,
  Phone,
  Lock,
  User,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PasswordStrengthMeter } from "@/components/auth/PasswordStrengthMeter";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { useAuth } from "@/contexts/AuthContext";
import { useBilingual } from "@/store/useBilingual";
import { appToast } from "@/lib/toast";
import { useRouter } from "next/navigation";
import { normalizeIndianPhone } from "@/lib/utils";

export interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const { t } = useBilingual();
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState("");
  const [passwordValue, setPasswordValue] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    setServerError("");
    const result = await registerUser({
      fullName: data.fullName,
      email: data.email,
      phone: normalizeIndianPhone(data.phone),
      password: data.password,
    });
    if (result.success) {
      appToast.success("Welcome to GrowPlants!", "Your account has been created.");
      router.push("/");
    } else {
      setServerError(result.error ?? "Registration failed. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* Full name */}
      <div className="space-y-2">
        <Label htmlFor="register-name" className="text-body-sm font-medium">
          {t("auth.fullName")}
        </Label>
        <div className="relative">
          <User
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <Input
            id="register-name"
            type="text"
            autoComplete="name"
            placeholder="Priya Sharma"
            className="pl-9 h-12 rounded-md"
            aria-invalid={!!errors.fullName}
            aria-describedby={errors.fullName ? "register-name-error" : undefined}
            {...register("fullName")}
          />
        </div>
        {errors.fullName && (
          <p id="register-name-error" className="text-caption text-error">
            {errors.fullName.message}
          </p>
        )}
      </div>

      {/* Email + Phone (2-col on desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="register-email" className="text-body-sm font-medium">
            {t("auth.email")}
          </Label>
          <div className="relative">
            <Mail
              className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            />
            <Input
              id="register-email"
              type="email"
              autoComplete="email"
              placeholder="you@email.com"
              className="pl-9 h-12 rounded-md"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "register-email-error" : undefined}
              {...register("email")}
            />
          </div>
          {errors.email && (
            <p id="register-email-error" className="text-caption text-error">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="register-phone" className="text-body-sm font-medium">
            {t("auth.phone")}
          </Label>
          <div className="relative">
            <Phone
              className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
              aria-hidden="true"
            />
            <Input
              id="register-phone"
              type="tel"
              autoComplete="tel"
              placeholder="9876543210"
              className="pl-9 h-12 rounded-md"
              aria-invalid={!!errors.phone}
              aria-describedby={errors.phone ? "register-phone-error" : undefined}
              {...register("phone")}
            />
          </div>
          {errors.phone && (
            <p id="register-phone-error" className="text-caption text-error">
              {errors.phone.message}
            </p>
          )}
        </div>
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="register-password" className="text-body-sm font-medium">
          {t("auth.password")}
        </Label>
        <div className="relative">
          <Lock
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <Input
            id="register-password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            className="pl-9 pr-9 h-12 rounded-md"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "register-password-error" : undefined}
            {...register("password", {
              onChange: (e) => setPasswordValue(e.target.value),
            })}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {errors.password && (
          <p id="register-password-error" className="text-caption text-error">
            {errors.password.message}
          </p>
        )}
        <PasswordStrengthMeter password={passwordValue} />
      </div>

      {/* Confirm password */}
      <div className="space-y-2">
        <Label htmlFor="register-confirm" className="text-body-sm font-medium">
          {t("auth.confirmPassword")}
        </Label>
        <div className="relative">
          <Lock
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <Input
            id="register-confirm"
            type={showConfirm ? "text" : "password"}
            autoComplete="new-password"
            placeholder="••••••••"
            className="pl-9 pr-9 h-12 rounded-md"
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={errors.confirmPassword ? "register-confirm-error" : undefined}
            {...register("confirmPassword")}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label={showConfirm ? "Hide password" : "Show password"}
          >
            {showConfirm ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p id="register-confirm-error" className="text-caption text-error">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      {/* Terms acceptance */}
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <input
            type="checkbox"
            id="register-terms"
            className="size-4 accent-[#16382B] mt-0.5"
            aria-invalid={!!errors.acceptTerms}
            aria-describedby={errors.acceptTerms ? "register-terms-error" : undefined}
            {...register("acceptTerms")}
          />
          <Label htmlFor="register-terms" className="text-body-sm text-muted-foreground cursor-pointer leading-snug">
            {t("auth.acceptTerms")}
          </Label>
        </div>
        {errors.acceptTerms && (
          <p id="register-terms-error" className="text-caption text-error">
            {errors.acceptTerms.message}
          </p>
        )}
      </div>

      {/* Server error */}
      {serverError && (
        <Alert variant="destructive">
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      {/* Submit */}
      <Button
        type="submit"
        disabled={isSubmitting}
        className="w-full h-12 gap-2"
        size="lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Creating account...
          </>
        ) : (
          <>
            {t("auth.registerCta")}
            <ArrowRight className="size-4" aria-hidden="true" />
          </>
        )}
      </Button>

      {/* Switch to login */}
      <p className="text-center text-body-sm text-muted-foreground">
        {t("auth.hasAccount")}{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-semibold text-primary hover:text-primary-hover hover:underline underline-offset-4"
        >
          {t("auth.loginCta")}
        </button>
      </p>
    </form>
  );
}
