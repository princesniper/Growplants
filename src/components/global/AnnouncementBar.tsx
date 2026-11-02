"use client";

import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBilingual } from "@/store/useBilingual";

/**
 * AnnouncementBar — top promotional strip above the Header.
 *
 * Rotating messages (blueprint C3): free-shipping threshold · 30-day
 * replacement promise · COD available. Dismissable (session-persisted),
 * respects prefers-reduced-motion.
 */
const MESSAGES_EN = [
  "Free delivery in Sonipat on orders above ₹499",
  "30-day replacement promise — photo within 48h",
  "COD available across Sonipat",
];

const MESSAGES_HI = [
  "सोनीपत में ₹499 से ऊपर के ऑर्डर पर मुफ़्त डिलीवरी",
  "30-दिन रिप्लेसमेंट प्रॉमिस — 48 घंटे के अंदर फोटो भेजें",
  "सोनीपत में COD उपलब्ध",
];

const DISMISS_KEY = "growplants-announcement-dismissed";

export function AnnouncementBar() {
  const { language } = useBilingual();
  const messages = language === "hi" ? MESSAGES_HI : MESSAGES_EN;
  const [index, setIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(DISMISS_KEY) === "1") {
      setDismissed(true);
    }
  }, []);

  useEffect(() => {
    if (dismissed) return;
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const interval = setInterval(() => {
      setIndex((i) => (i + 1) % messages.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [dismissed, messages.length]);

  const handleDismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(DISMISS_KEY, "1");
    }
  };

  if (dismissed) return null;

  return (
    <div
      className={cn(
        "relative w-full bg-pine-deep text-ivory",
        "px-4 py-2 text-body-sm text-center",
        "flex items-center justify-center gap-2"
      )}
      role="region"
      aria-label="Announcement"
    >
      <Sparkles className="size-3.5 shrink-0 text-brass" aria-hidden="true" />
      <p
        className="font-medium transition-opacity duration-300"
        key={index}
        aria-live="polite"
      >
        {messages[index]}
      </p>
      <span className="hidden sm:inline-block h-3 w-px bg-brass/40" aria-hidden="true" />
      <button
        type="button"
        onClick={handleDismiss}
        className={cn(
          "absolute right-2 top-1/2 -translate-y-1/2",
          "size-6 inline-flex items-center justify-center rounded-sm",
          "hover:bg-ivory/10 transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass"
        )}
        aria-label="Dismiss announcement"
      >
        <X className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
