import { cn } from "@/lib/utils";
import { Sun, Droplets, Sprout, PawPrint } from "lucide-react";
import type {
  SunlightRequirement,
  WaterFrequency,
  DifficultyLevel,
} from "@/lib/enums";

/**
 * CareSpecs — quick-glance care specifications row for plants.
 * Renders sunlight, water, difficulty, and pet-safety as labelled icon chips.
 * Used on: ProductCard (compact), PDP (full), PlantDetail sidebar.
 *
 * Bilingual: the enum values map to EN/HI labels via a passed-in dictionary
 * OR by resolving through useBilingual — kept presentational here so the
 * caller decides whether to localize. Defaults are EN.
 */
export interface CareSpecsProps {
  sunlight?: SunlightRequirement | null;
  water?: WaterFrequency | null;
  difficulty?: DifficultyLevel | null;
  isPetSafe?: boolean | null;
  variant?: "compact" | "full";
  className?: string;
}

const SUNLIGHT_LABELS: Record<SunlightRequirement, string> = {
  full_sun: "Full Sun",
  partial_shade: "Partial Shade",
  shade: "Shade",
  indirect: "Indirect",
};

const WATER_LABELS: Record<WaterFrequency, string> = {
  daily: "Daily",
  alternate_day: "Every Other Day",
  weekly: "Weekly",
  monthly: "Monthly",
};

const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  easy: "Easy",
  moderate: "Moderate",
  expert: "Expert",
};

export function CareSpecs({
  sunlight,
  water,
  difficulty,
  isPetSafe,
  variant = "compact",
  className,
}: CareSpecsProps) {
  const specs: { icon: typeof Sun; label: string; value?: string; tone?: string }[] = [];

  if (sunlight) {
    specs.push({
      icon: Sun,
      label: "Sunlight",
      value: SUNLIGHT_LABELS[sunlight],
      tone: "text-warning",
    });
  }
  if (water) {
    specs.push({
      icon: Droplets,
      label: "Water",
      value: WATER_LABELS[water],
      tone: "text-moss",
    });
  }
  if (difficulty) {
    specs.push({
      icon: Sprout,
      label: "Care",
      value: DIFFICULTY_LABELS[difficulty],
      tone: "text-primary",
    });
  }
  if (isPetSafe !== null && isPetSafe !== undefined) {
    specs.push({
      icon: PawPrint,
      label: "Pet Safe",
      value: isPetSafe ? "Yes" : "No",
      tone: isPetSafe ? "text-success" : "text-destructive",
    });
  }

  if (specs.length === 0) return null;

  if (variant === "compact") {
    return (
      <div
        className={cn("flex items-center gap-3 flex-wrap", className)}
        aria-label="Care specifications"
      >
        {specs.map((spec) => (
          <span
            key={spec.label}
            className={cn("inline-flex items-center gap-1 text-body-sm", spec.tone)}
            title={`${spec.label}: ${spec.value}`}
          >
            <spec.icon className="size-3.5" aria-hidden="true" />
            <span className="text-muted-foreground">{spec.value}</span>
          </span>
        ))}
      </div>
    );
  }

  return (
    <dl
      className={cn("grid grid-cols-2 gap-3", className)}
      aria-label="Care specifications"
    >
      {specs.map((spec) => (
        <div
          key={spec.label}
          className="flex items-start gap-2 p-3 rounded-[18px] bg-sage-wash/60 border border-line"
        >
          <spec.icon className={cn("size-5 mt-0.5", spec.tone)} aria-hidden="true" />
          <div className="flex flex-col">
            <dt className="text-caption text-muted-foreground">{spec.label}</dt>
            <dd className="text-body-sm font-medium text-foreground">{spec.value}</dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
