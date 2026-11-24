"use client";

import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useBilingual, type Language } from "@/store/useBilingual";

/**
 * LanguageToggle — instant EN ↔ HI language switch.
 * Persists to localStorage via the Zustand store.
 *
 * Variants:
 *   - button (default): pill button with globe icon + target language label
 *   - segmented: two-segment toggle showing both EN | HI
 *   - icon: icon-only button (for compact headers)
 *
 * Used in: Header (desktop + mobile), Account Settings, Auth pages.
 */
export interface LanguageToggleProps {
  variant?: "button" | "segmented" | "icon";
  className?: string;
  size?: "sm" | "md" | "lg";
}

const OPPOSITE: Record<Language, Language> = {
  en: "hi",
  hi: "en",
};

export function LanguageToggle({
  variant = "button",
  className,
  size = "sm",
}: LanguageToggleProps) {
  const { language, setLanguage, toggleLanguage, t } = useBilingual();

  if (variant === "segmented") {
    return (
      <div
        role="radiogroup"
        aria-label="Language"
        className={cn(
          "inline-flex items-center rounded-full border border-border bg-card p-0.5",
          className
        )}
      >
        {(["en", "hi"] as const).map((lang) => (
          <button
            key={lang}
            role="radio"
            aria-checked={language === lang}
            onClick={() => setLanguage(lang)}
            className={cn(
              "px-3 py-1 text-body-sm font-medium rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              language === lang
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            )}
          >
            {lang === "en" ? "EN" : "हि"}
          </button>
        ))}
      </div>
    );
  }

  if (variant === "icon") {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleLanguage}
        className={cn(className)}
        aria-label={`Switch to ${language === "en" ? "Hindi" : "English"}`}
      >
        <Languages className="size-4" aria-hidden="true" />
      </Button>
    );
  }

  return (
    <Button
      variant="ghost"
      size={size === "md" ? "default" : size}
      onClick={toggleLanguage}
      className={cn("gap-2 font-medium rounded-full", className)}
      aria-label={`Switch to ${OPPOSITE[language] === "en" ? "English" : "Hindi"}`}
    >
      <Languages className="size-4" aria-hidden="true" />
      {t("language.toggle")}
    </Button>
  );
}
