"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatINR } from "@/lib/utils";

/**
 * PotPairingSelector — plant + pot combo as the default PDP configuration
 * (blueprint D3, research: Patch "tap to preview in a pot", Ugaoo named-planter
 * grid). Pot gallery with live preview; per-pot placeholder pricing from the
 * pots data (displayed as-is). "Plant only" stays a secondary tab in the panel.
 */

export interface PotOption {
  slug: string;
  name: string;
  image: string;
  sizeLabel: string;
  price: number;
}

export interface PotPairingSelectorProps {
  plantName: string;
  options: PotOption[];
  selectedSlug: string | null;
  onSelect: (option: PotOption | null) => void;
}

export function PotPairingSelector({ plantName, options, selectedSlug, onSelect }: PotPairingSelectorProps) {
  const selected = options.find((o) => o.slug === selectedSlug) ?? null;

  if (options.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-semibold text-pine">Choose your pot — tap to preview</p>
        <p className="text-xs text-ink-soft">{options.length} pots</p>
      </div>

      {/* Pot gallery */}
      <div className="grid grid-cols-3 gap-2.5" role="radiogroup" aria-label="Choose a pot">
        {options.map((pot) => {
          const isSelected = pot.slug === selectedSlug;
          return (
            <button
              key={pot.slug}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onSelect(isSelected ? null : pot)}
              className={cn(
                "group relative flex flex-col items-center gap-1.5 rounded-2xl border-2 p-2 transition-all min-h-[44px]",
                isSelected
                  ? "border-brass bg-gold-tint/50 shadow-[0_8px_20px_rgba(198,161,91,0.25)]"
                  : "border-line bg-paper hover:border-brass/60"
              )}
            >
              <span className="relative block size-16 overflow-hidden rounded-xl bg-sand">
                {pot.image ? (
                  <Image
                    src={pot.image}
                    alt={pot.name}
                    fill
                    sizes="64px"
                    className="object-cover"
                    loading="lazy"
                  />
                ) : null}
              </span>
              <span className="text-[11px] font-medium text-charcoal leading-tight text-center line-clamp-2 min-h-[2em]">
                {pot.name}
              </span>
              <span className="text-[11px] font-bold text-pine tabular-nums">
                {formatINR(pot.price)}
              </span>
              {isSelected && (
                <span className="absolute -top-2 -right-2 size-6 rounded-full bg-brass text-pine-ink flex items-center justify-center shadow">
                  <Check className="size-3.5" aria-hidden="true" />
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Live preview of the selected pot */}
      {selected && (
        <div className="flex items-center gap-3 rounded-2xl border border-brass/40 bg-gold-tint/40 p-3 animate-scale-in">
          <span className="relative block size-16 shrink-0 overflow-hidden rounded-xl bg-sand">
            {selected.image ? (
              <Image src={selected.image} alt={selected.name} fill sizes="64px" className="object-cover" />
            ) : null}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-pine truncate">
              {plantName} <span className="text-ink-soft font-normal">in</span> {selected.name}
            </p>
            <p className="text-xs text-ink-soft mt-0.5">
              Size {selected.sizeLabel} · Fits most 4–6 inch nursery pots
            </p>
            <p className="text-sm font-bold text-pine tabular-nums mt-0.5">
              + {formatINR(selected.price)} <span className="text-xs font-normal text-ink-soft">for the pot</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
