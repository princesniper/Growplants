"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Mail, Phone, Lock, Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { useAuth } from "@/contexts/AuthContext";
import { useBilingual } from "@/store/useBilingual";
import { appToast } from "@/lib/toast";
import { useRouter } from "next/navigation";

export interface LoginFormProps {
  onForgotPassword: () => void;
  onSwitchToRegister: () => void;
}

export function LoginForm({ onForgotPassword, onSwitchToRegister }: LoginFormProps) {
  const { t } = useBilingual();
  const { login } = useAuth();
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: "", password: "" },
  });

  const onSubmit = async (data: LoginInput) => {
    setServerError("");
    const result = await login(data.identifier, data.password);
    if (result.success) {
      appToast.success(t("auth.login.title"), "Welcome back to GrowPlants!");
      router.push("/");
    } else {
      setServerError(result.error ?? "Login failed. Please try again.");
    }
  };

  const isEmail = (val: string) => val.includes("@");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* B15 FIX: Email-only login (phone OTP not implemented) */}
      <div className="space-y-2">
        <Label htmlFor="login-identifier" className="text-body-sm font-medium">
          {t("auth.identifier")}
        </Label>
        <div className="relative">
          <Mail
            className={cn(
              "absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
            )}
            aria-hidden="true"
          />
          <Input
            id="login-identifier"
            type="email"
            autoComplete="email"
            placeholder="you@email.com"
            className="pl-9 h-12 rounded-md"
            aria-invalid={!!errors.identifier}
            aria-describedby={errors.identifier ? "login-identifier-error" : undefined}
            {...register("identifier")}
          />
        </div>
        {errors.identifier && (
          <p id="login-identifier-error" className="text-caption text-error">
            {errors.identifier.message}
          </p>
        )}
      </div>

      {/* Password */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="login-password" className="text-body-sm font-medium">
            {t("auth.password")}
          </Label>
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-caption text-primary hover:text-primary-hover font-medium hover:underline underline-offset-4"
          >
            {t("auth.forgotPassword")}
          </button>
        </div>
        <div className="relative">
          <Lock
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            className="pl-9 pr-9 h-12 rounded-md"
            aria-invalid={!!errors.password}
            aria-describedby={errors.password ? "login-password-error" : undefined}
            {...register("password")}
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
          <p id="login-password-error" className="text-caption text-error">
            {errors.password.message}
          </p>
        )}
      </div>

      {/* Remember me */}
      <div className="flex items-center gap-2">
        <Checkbox id="login-remember" />
        <Label htmlFor="login-remember" className="text-body-sm text-muted-foreground cursor-pointer">
          Keep me signed in
        </Label>
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
            Signing in...
          </>
        ) : (
          <>
            {t("auth.loginCta")}
            <ArrowRight className="size-4" aria-hidden="true" />
          </>
        )}
      </Button>

      {/* Switch to register */}
      <p className="text-center text-body-sm text-muted-foreground">
        {t("auth.noAccount")}{" "}
        <button
          type="button"
          onClick={onSwitchToRegister}
          className="font-semibold text-primary hover:text-primary-hover hover:underline underline-offset-4"
        >
          {t("auth.registerCta")}
        </button>
      </p>
    </form>
  );
}
