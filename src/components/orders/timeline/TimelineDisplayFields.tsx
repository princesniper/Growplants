"use client";

/**
 * TimelineDisplayFields — Renders contextual key-value fields for a step.
 * Used for stages like Shipped (courier, tracking#), Out For Delivery (driver, location),
 * Delivered (delivery time, recipient).
 *
 * Layout:
 *   - Horizontal (desktop): fields in a 2-col grid below the label
 *   - Vertical (mobile): fields stacked, each on its own line
 */
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { TimelineDisplayField } from "./types";

export interface TimelineDisplayFieldsProps {
  fields: TimelineDisplayField[];
  orientation: "horizontal" | "vertical";
  compact?: boolean;
  className?: string;
}

export function TimelineDisplayFields({
  fields,
  orientation,
  compact = false,
  className,
}: TimelineDisplayFieldsProps) {
  if (!fields.length) return null;
  const isHorizontal = orientation === "horizontal";

  return (
    <dl
      className={cn(
        "mt-2 grid gap-1.5",
        isHorizontal ? "grid-cols-1 text-left" : "grid-cols-2 gap-x-3 gap-y-1.5",
        compact && "mt-1.5",
        className,
      )}
    >
      {fields.map((field, i) => (
        <div
          key={i}
          className={cn(
            "flex items-start gap-1.5 min-w-0",
            !isHorizontal && "py-1 px-2 rounded-md bg-slate-50/70",
          )}
        >
          {field.icon && <field.icon className="size-3 text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />}
          <div className="min-w-0 flex-1">
            <dt className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 leading-tight">
              {field.label}
            </dt>
            <dd className="text-[11px] font-medium text-slate-700 truncate">
              {field.href ? (
                <Link
                  href={field.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1A6B3C] hover:underline"
                >
                  {field.value}
                </Link>
              ) : (
                field.value
              )}
            </dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
