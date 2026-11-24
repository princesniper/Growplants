"use client";

import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { SOCIAL_LINKS } from "@/lib/constants";

/**
 * WhatsAppButton — floating WhatsApp chat button.
 * Source: HOMEPAGE_AUDIT_REPORT.md §11.1 ("WhatsApp Chat Floating Button —
 * A persistent floating WhatsApp button that follows the user across all pages.
 * Currently, WhatsApp is only in the FAQ section and Footer.")
 *
 * Fixed to bottom-right on desktop (above MobileBottomNav on mobile).
 * Links to the GrowPlants WhatsApp number from constants.
 *
 * Colour: WhatsApp's own brand green is kept deliberately (recognisable
 * chat affordance, as on Ugaoo's WhatsApp support) — but via the
 * --brand-wa-green CSS variable, never a hardcoded hex.
 */
export function WhatsAppButton({ className }: { className?: string }) {
  return (
    <a
      href={SOCIAL_LINKS.whatsapp}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "fixed bottom-20 right-4 md:bottom-6 md:right-6 z-30",
        "size-14 rounded-full bg-[var(--brand-wa-green)] text-white",
        "flex items-center justify-center shadow-lg",
        "hover:scale-110 transition-transform duration-200 ease-fast",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
      aria-label="Chat with us on WhatsApp"
    >
      <MessageCircle className="size-7 fill-white" aria-hidden="true" />
    </a>
  );
}
