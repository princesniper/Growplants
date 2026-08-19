"use client";

import { useMemo } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * PasswordStrengthMeter — real-time password strength indicator.
 * Shows a 4-segment bar + simple requirements.
 *
 * Minimum: 6 characters (no uppercase/lowercase/number required)
 */
export interface PasswordStrengthMeterProps {
  password: string;
  className?: string;
}

interface Requirement {
  label: string;
  test: (pw: string) => boolean;
}

const REQUIREMENTS: Requirement[] = [
  { label: "At least 6 characters", test: (pw) => pw.length >= 6 },
];

function calculateStrength(password: string): {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  color: string;
  barColor: string;
} {
  if (!password) return { score: 0, label: "", color: "", barColor: "" };

  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  // Cap at 4
  score = Math.min(score, 4) as 0 | 1 | 2 | 3 | 4;

  if (score <= 1) return { score: 1, label: "Weak", color: "text-error", barColor: "bg-error" };
  if (score === 2) return { score: 2, label: "Fair", color: "text-warning", barColor: "bg-warning" };
  if (score === 3) return { score: 3, label: "Good", color: "text-leaf-green", barColor: "bg-leaf-green" };
  return { score: 4, label: "Strong", color: "text-success", barColor: "bg-success" };
}

export function PasswordStrengthMeter({ password, className }: PasswordStrengthMeterProps) {
  const strength = useMemo(() => calculateStrength(password), [password]);

  if (!password) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {/* Strength bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex gap-1">
          {[1, 2, 3, 4].map((segment) => (
            <div
              key={segment}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors duration-200",
                segment <= strength.score ? strength.barColor : "bg-muted"
              )}
            />
          ))}
        </div>
        <span className={cn("text-caption font-medium tabular-nums", strength.color)}>
          {strength.label}
        </span>
      </div>

      {/* Simple requirement */}
      <ul className="grid grid-cols-1 gap-1">
        {REQUIREMENTS.map((req) => {
          const met = req.test(password);
          return (
            <li
              key={req.label}
              className={cn(
                "flex items-center gap-1.5 text-caption transition-colors",
                met ? "text-success" : "text-muted-foreground"
              )}
            >
              {met ? (
                <Check className="size-3 shrink-0" aria-hidden="true" />
              ) : (
                <X className="size-3 shrink-0" aria-hidden="true" />
              )}
              {req.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
