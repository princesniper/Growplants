"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sun, Droplets, PawPrint, ShieldCheck } from "lucide-react";
import { Container } from "@/components/common/Container";
import { PincodeChecker } from "@/components/global/PincodeChecker";
import { ScrollReveal } from "@/components/common/ScrollReveal";

/**
 * HeroSection — editorial hero (blueprint D1.3).
 * Serif H1 → subline → dual CTA (quiz + bestsellers) → trust microline with
 * inline pincode checker. Right: lifestyle image with floating care-badge chips.
 * Mobile: stacked, image first.
 */
export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-ivory" aria-label="Welcome to GrowPlants">
      {/* soft botanical wash */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(60% 80% at 85% 20%, rgba(198,161,91,0.12) 0%, transparent 60%), radial-gradient(50% 70% at 10% 90%, rgba(22,56,43,0.06) 0%, transparent 60%)",
        }}
      />
      <Container className="relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center py-12 md:py-16 lg:py-24">
          {/* Image first on mobile */}
          <ScrollReveal variant="scale" className="order-1 lg:order-2">
            <div className="relative mx-auto max-w-[520px]">
              <div className="relative aspect-[4/5] sm:aspect-[5/5] lg:aspect-[4/4.6] overflow-hidden rounded-[28px] shadow-[0_24px_60px_rgba(22,56,43,0.18)]">
                <Image
                  src="https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=1200&q=80"
                  alt="Healthy indoor plants styled in a bright Sonipat home"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-pine-ink/25 via-transparent to-transparent" aria-hidden="true" />
              </div>

              {/* Floating care-badge chips */}
              <div className="absolute top-6 -left-2 sm:left-4 flex items-center gap-1.5 rounded-full bg-ivory/95 backdrop-blur px-3 py-2 shadow-lg border border-line animate-float">
                <Sun className="size-4 text-brass-deep" aria-hidden="true" />
                <span className="text-xs font-semibold text-pine">Bright indirect light</span>
              </div>
              <div
                className="absolute top-1/3 -right-2 sm:right-4 flex items-center gap-1.5 rounded-full bg-ivory/95 backdrop-blur px-3 py-2 shadow-lg border border-line animate-float"
                style={{ animationDelay: "0.8s" }}
              >
                <Droplets className="size-4 text-brass-deep" aria-hidden="true" />
                <span className="text-xs font-semibold text-pine">Weekly watering</span>
              </div>
              <div
                className="absolute bottom-8 left-4 sm:left-8 flex items-center gap-1.5 rounded-full bg-ivory/95 backdrop-blur px-3 py-2 shadow-lg border border-line animate-float"
                style={{ animationDelay: "1.6s" }}
              >
                <PawPrint className="size-4 text-brass-deep" aria-hidden="true" />
                <span className="text-xs font-semibold text-pine">Pet-safe picks</span>
              </div>
            </div>
          </ScrollReveal>

          {/* Copy */}
          <ScrollReveal variant="up" className="order-2 lg:order-1">
            <div className="max-w-xl">
              <p className="inline-flex items-center gap-1.5 rounded-full border border-brass/40 bg-gold-tint/70 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-brass-deep">
                <ShieldCheck className="size-3.5" aria-hidden="true" />
                Sonipat&apos;s nursery-fresh plant store
              </p>
              <h1 className="font-display text-pine mt-5 text-[2.75rem] leading-[1.05] sm:text-6xl lg:text-[4.25rem]">
                Plants, <em className="text-brass-deep">chosen</em> for your home.
              </h1>
              <p className="mt-5 text-lg text-ink-soft leading-relaxed">
                Nursery-fresh plants, delivered in Sonipat in 1–2 days — with pots that actually fit.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href="/plant-finder"
                  className="inline-flex items-center gap-2 rounded-full bg-pine px-7 py-3.5 text-base font-semibold text-ivory shadow-[0_12px_28px_rgba(22,56,43,0.25)] transition-all hover:bg-brass-deep hover:text-ivory hover:-translate-y-0.5 active:translate-y-0 min-h-[48px]"
                >
                  Find my plant
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/shop"
                  className="inline-flex items-center gap-2 rounded-full border-2 border-pine/25 px-7 py-3.5 text-base font-semibold text-pine transition-all hover:border-pine hover:bg-pine hover:text-ivory min-h-[48px]"
                >
                  Shop bestsellers
                </Link>
              </div>

              {/* Trust microline + pincode checker */}
              <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-3 text-sm text-ink-soft">
                <span className="font-medium text-pine">30-day replacement · COD available</span>
                <span className="hidden sm:inline h-4 w-px bg-line" aria-hidden="true" />
                <PincodeChecker variant="compact" />
              </div>
            </div>
          </ScrollReveal>
        </div>
      </Container>
    </section>
  );
}
