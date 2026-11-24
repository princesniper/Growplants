import { Sun, Droplets, PawPrint, Sprout } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * CareBadgeRow — at-a-glance care signals on product cards and PDP headers.
 * Reads the plant data model directly (sunInfo, waterInfo, isPetSafe, difficulty)
 * so shoppers can de-risk in 2 seconds without opening the PDP.
 * Renders nothing when no care data is present.
 */
export interface CareBadgeRowProps {
  sunInfo?: string | null;
  waterInfo?: string | null;
  isPetSafe?: boolean | null;
  difficulty?: string | null;
  className?: string;
}

const DIFFICULTY_LABEL: Record<string, string> = {
  Easy: "Beginner",
  Moderate: "Moderate",
  Expert: "Advanced",
};

export function CareBadgeRow({ sunInfo, waterInfo, isPetSafe, difficulty, className }: CareBadgeRowProps) {
  const badges: { icon: typeof Sun; label: string; title: string }[] = [];

  if (sunInfo) badges.push({ icon: Sun, label: sunInfo, title: `Light: ${sunInfo}` });
  if (waterInfo) badges.push({ icon: Droplets, label: waterInfo, title: `Water: ${waterInfo}` });
  if (isPetSafe) badges.push({ icon: PawPrint, label: "Pet-safe", title: "Safe for pets" });
  if (difficulty) {
    badges.push({
      icon: Sprout,
      label: DIFFICULTY_LABEL[difficulty] ?? difficulty,
      title: `Care level: ${difficulty}`,
    });
  }

  if (badges.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)} aria-label="Care information">
      {badges.map((b, i) => (
        <span
          key={i}
          title={b.title}
          className="inline-flex items-center gap-1 rounded-full bg-sage-wash px-2 py-0.5 text-[11px] font-medium text-pine"
        >
          <b.icon className="size-3 shrink-0" aria-hidden="true" />
          <span className="truncate max-w-[110px]">{b.label}</span>
        </span>
      ))}
    </div>
  );
}
