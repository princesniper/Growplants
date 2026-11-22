"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Phone, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/validations/auth";
import { useAuth } from "@/contexts/AuthContext";
import { useBilingual } from "@/store/useBilingual";

export interface ForgotPasswordFormProps {
  onBackToLogin: () => void;
}

export function ForgotPasswordForm({ onBackToLogin }: ForgotPasswordFormProps) {
  const { t } = useBilingual();
  const { resetPassword } = useAuth();
  const [serverError, setServerError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedIdentifier, setSubmittedIdentifier] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { identifier: "" },
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setServerError("");
    const result = await resetPassword(data.identifier);
    if (result.success) {
      setSubmittedIdentifier(data.identifier);
      setIsSuccess(true);
    } else {
      setServerError(result.error ?? "Could not send reset link. Please try again.");
    }
  };

  if (isSuccess) {
    return (
      <div className="space-y-6 text-center">
        <div className="size-16 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto">
          <CheckCircle2 className="size-8" aria-hidden="true" />
        </div>
        <div className="space-y-2">
          <h3 className="font-display text-h4 font-semibold text-foreground">Check your inbox</h3>
          <p className="text-body-sm text-muted-foreground max-w-sm mx-auto">
            We&apos;ve sent a password reset link to{" "}
            <span className="font-semibold text-foreground">{submittedIdentifier}</span>.
            The link is valid for 30 minutes.
          </p>
        </div>
        <Alert>
          <AlertDescription className="text-body-sm">
            Didn&apos;t receive the email? Check your spam folder, or{" "}
            <button
              type="button"
              onClick={() => setIsSuccess(false)}
              className="font-semibold text-primary hover:underline underline-offset-4"
            >
              try a different address
            </button>
            .
          </AlertDescription>
        </Alert>
        <Button onClick={onBackToLogin} variant="outline" className="w-full gap-2 rounded-full">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      {/* Identifier */}
      <div className="space-y-2">
        <Label htmlFor="forgot-identifier" className="text-body-sm font-medium">
          {t("auth.identifier")}
        </Label>
        <div className="relative">
          <Mail
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none"
            aria-hidden="true"
          />
          <Input
            id="forgot-identifier"
            type="text"
            autoComplete="username"
            placeholder="you@email.com or +91 98765 43210"
            className="pl-9 h-12 rounded-xl"
            aria-invalid={!!errors.identifier}
            aria-describedby={errors.identifier ? "forgot-identifier-error" : undefined}
            {...register("identifier")}
          />
        </div>
        {errors.identifier && (
          <p id="forgot-identifier-error" className="text-caption text-error">
            {errors.identifier.message}
          </p>
        )}
      </div>

      {/* Info alert */}
      <Alert>
        <AlertDescription className="text-body-sm">
          Enter your registered email or phone number. We&apos;ll send you a secure
          link to reset your password.
        </AlertDescription>
      </Alert>

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
        className="w-full h-12 gap-2 rounded-full"
        size="lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Sending reset link...
          </>
        ) : (
          "Send Reset Link"
        )}
      </Button>

      {/* Back to login */}
      <button
        type="button"
        onClick={onBackToLogin}
        className="flex items-center gap-1.5 text-body-sm text-muted-foreground hover:text-foreground font-medium mx-auto"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        {t("auth.hasAccount")} {t("auth.loginCta")}
      </button>
    </form>
  );
}
