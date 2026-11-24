import { ShieldCheck, PackageCheck, Truck, MessageCircleHeart } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

/**
 * TrustBadges — trust strip directly under the hero (blueprint D1.4).
 * Research rhythm: guarantee + packaging story + delivery promise + human
 * support, never buried in the footer.
 */
interface TrustBadge {
  icon: LucideIcon;
  title: string;
  subtitle: string;
}

const BADGES: TrustBadge[] = [
  { icon: ShieldCheck, title: "30-Day Replacement Promise", subtitle: "Photo within 48h → free replacement" },
  { icon: PackageCheck, title: "Nursery-Fresh, Packed for Transit", subtitle: "Moisture-locked breathable wrap" },
  { icon: Truck, title: "Free Delivery over ₹499", subtitle: "1–2 business days in Sonipat" },
  { icon: MessageCircleHeart, title: "Plant Doctor on WhatsApp", subtitle: "Free advice, photo bhejo" },
];

export interface TrustBadgesProps {
  className?: string;
}

export function TrustBadges({ className }: TrustBadgesProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4",
        className
      )}
      role="list"
      aria-label="Why shop with GrowPlants"
    >
      {BADGES.map((badge) => (
        <div
          key={badge.title}
          className="flex items-center gap-3 p-3.5 md:p-4 rounded-2xl bg-paper border border-line shadow-[0_8px_24px_rgba(22,56,43,0.06)]"
          role="listitem"
        >
          <div className="size-11 rounded-full bg-pine text-brass flex items-center justify-center shrink-0">
            <badge.icon className="size-5" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-body-sm font-semibold text-pine leading-tight">
              {badge.title}
            </p>
            <p className="text-caption text-ink-soft leading-tight mt-0.5">
              {badge.subtitle}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
