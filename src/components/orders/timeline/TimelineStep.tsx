"use client";

/**
 * GrowPlants — TimelineStep
 * ============================================================================
 * Individual stage card in the premium timeline.
 *
 * Desktop (horizontal): circle on top, label below, connector line to right.
 * Mobile (vertical): circle on left, content card on right, connector below.
 *
 * States:
 *   - completed       → green circle + checkmark, full label, soft success bg
 *   - current         → accent color + pulse glow, elevated card, prominent
 *   - upcoming        → grey circle, muted label, lower opacity
 *   - cancelled_step  → red circle + X, "Cancelled" label override
 *
 * Premium stage (Quality Inspection) gets a special "Exclusive" badge.
 * ============================================================================
 */
import { cn } from "@/lib/utils";
import { TimelineIcon } from "./TimelineIcon";
import { TimelineConnector } from "./TimelineConnector";
import { StatusBadge } from "./StatusBadge";
import type { TimelineStage, StepState } from "./timeline-stages";

interface DisplayField {
  key: string;
  label: string;
  value: string | undefined;
  critical?: boolean;
}

interface TimelineStepProps {
  stage: TimelineStage;
  state: StepState;
  stepIndex: number;
  totalSteps: number;
  orientation: "horizontal" | "vertical";
  /** Date when this stage was completed (from statusHistory) */
  completedDate?: string;
  /** Display fields for this stage (courier, tracking #, etc.) */
  displayFields?: DisplayField[];
  /** Delay for staggered fade-in animation (ms) */
  animationDelay?: number;
}

export function TimelineStep({
  stage,
  state,
  stepIndex,
  totalSteps,
  orientation,
  completedDate,
  displayFields = [],
  animationDelay = 0,
}: TimelineStepProps) {
  const isLast = stepIndex === totalSteps - 1;
  const isCancelled = state === "cancelled_step";
  const displayLabel = isCancelled ? "Cancelled" : stage.label;

  // Format completed date
  const formattedDate = completedDate
    ? new Date(completedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : undefined;
  const formattedTime = completedDate
    ? new Date(completedDate).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
    : undefined;

  /* ====================================================================
   * DESKTOP (horizontal)
   * ==================================================================== */
  if (orientation === "horizontal") {
    return (
      <div
        className={cn(
          "relative flex flex-col items-center gap-2 flex-1 min-w-0 group",
          "animate-fade-in-up",
        )}
        style={{ animationDelay: `${animationDelay}ms` }}
        role="listitem"
        aria-label={`Step ${stepIndex + 1}: ${displayLabel}, ${state}`}
      >
        <TimelineConnector
          state={state}
          orientation="horizontal"
          isLast={isLast}
        />

        <TimelineIcon
          name={stage.iconName}
          accentColor={stage.accentColor}
          iconColor={stage.iconColor}
          state={state}
          size="md"
        />

        {/* Premium badge (Quality Inspection) */}
        {stage.isBotanical && state !== "upcoming" && (
          <span className="absolute -top-1 right-1/2 translate-x-7 px-1.5 py-0.5 rounded-full bg-[#16382B] text-white text-[8px] font-bold uppercase tracking-wide shadow-sm">
            Exclusive
          </span>
        )}

        {/* Label */}
        <p
          className={cn(
            "text-center text-xs font-semibold leading-tight transition-colors",
            state === "completed" && "text-slate-800",
            state === "current" && "text-[#16382B] text-sm",
            state === "upcoming" && "text-slate-400",
            isCancelled && "text-red-600",
          )}
        >
          {displayLabel}
        </p>

        {/* Subtitle */}
        {stage.isBotanical && state === "current" && (
          <p className="text-[9px] text-slate-500 text-center leading-tight italic">
            GrowPlants Exclusive
          </p>
        )}

        {/* Date (when completed) */}
        {formattedDate && state === "completed" && (
          <p className="text-[9px] text-slate-400 text-center leading-tight">
            {formattedDate}
          </p>
        )}
        {formattedDate && state === "current" && (
          <p className="text-[9px] text-[#16382B] text-center leading-tight font-medium">
            {formattedDate} · {formattedTime}
          </p>
        )}
      </div>
    );
  }

  /* ====================================================================
   * MOBILE (vertical)
   * ==================================================================== */
  return (
    <li
      className="relative flex items-start gap-3 pb-5 last:pb-0 animate-fade-in-up"
      style={{ animationDelay: `${animationDelay}ms` }}
      role="listitem"
      aria-label={`Step ${stepIndex + 1}: ${displayLabel}, ${state}`}
    >
      <TimelineConnector
        state={state}
        orientation="vertical"
        isLast={isLast}
      />

      <TimelineIcon
        name={stage.iconName}
        accentColor={stage.accentColor}
        iconColor={stage.iconColor}
        state={state}
        size="md"
      />

      {/* Content card */}
      <div
        className={cn(
          "flex-1 min-w-0 rounded-xl p-3 transition-all duration-300",
          state === "current" && "bg-[#F3F8F1] border border-[#16382B]/20 shadow-sm",
          state === "completed" && "bg-green-50/50 border border-green-100",
          state === "upcoming" && "bg-transparent",
          isCancelled && "bg-red-50 border border-red-200",
        )}
      >
        {/* Header row */}
        <div className="flex items-center gap-2 flex-wrap">
          <p
            className={cn(
              "text-sm font-semibold leading-tight",
              state === "completed" && "text-slate-800",
              state === "current" && "text-[#16382B]",
              state === "upcoming" && "text-slate-400",
              isCancelled && "text-red-600",
            )}
          >
            {displayLabel}
          </p>

          {state === "current" && (
            <StatusBadge
              label="Current"
              color="green"
              variant="solid"
              size="xs"
            />
          )}
          {stage.isBotanical && state !== "upcoming" && (
            <StatusBadge
              label="Exclusive"
              color="green"
              variant="soft"
              size="xs"
            />
          )}
          {isCancelled && (
            <StatusBadge label="Cancelled" color="red" variant="solid" size="xs" />
          )}
        </div>

        {/* Description (only show for current and completed states to reduce clutter) */}
        {state !== "upcoming" && (
          <p
            className={cn(
              "text-xs mt-1 leading-relaxed",
              state === "completed" && "text-slate-600",
              state === "current" && "text-slate-700",
              isCancelled && "text-red-600",
            )}
          >
            {isCancelled ? "This order was cancelled after being placed." : stage.description}
          </p>
        )}

        {/* Date row */}
        {formattedDate && state !== "upcoming" && (
          <p
            className={cn(
              "text-[10px] mt-1.5 flex items-center gap-1",
              state === "current" ? "text-[#16382B] font-medium" : "text-slate-400",
            )}
          >
            <span>📅</span> {formattedDate} · {formattedTime}
          </p>
        )}

        {/* Display fields (courier, tracking #, etc.) */}
        {state !== "upcoming" && displayFields.length > 0 && (
          <dl className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1">
            {displayFields.map((field) =>
              field.value ? (
                <div key={field.key} className="min-w-0">
                  <dt className="text-[9px] text-slate-400 uppercase tracking-wide font-medium">
                    {field.label}
                  </dt>
                  <dd
                    className={cn(
                      "text-xs truncate",
                      field.critical ? "text-slate-800 font-bold" : "text-slate-700 font-medium",
                    )}
                  >
                    {field.value}
                  </dd>
                </div>
              ) : null,
            )}
          </dl>
        )}
      </div>
    </li>
  );
}
