"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Star, ChevronLeft, ChevronRight, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/common/Container";
import { TESTIMONIALS, TESTIMONIAL_STATS } from "@/data/homepageData";

const AUTOPLAY_MS = 7000;

export function TestimonialsSection() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const ref = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goTo = (idx: number) => setActive((prev) => (idx + TESTIMONIALS.length) % TESTIMONIALS.length);

  useEffect(() => {
    if (paused || TESTIMONIALS.length <= 1) return;
    const prm = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prm) return;
    ref.current = setTimeout(() => setActive((p) => (p + 1) % TESTIMONIALS.length), AUTOPLAY_MS);
    return () => { if (ref.current) clearTimeout(ref.current); };
  }, [active, paused]);

  return (
    <section id="testimonials" style={{ backgroundColor: "#0F2A20" }} className="text-white scroll-mt-20">
      <Container className="py-12 md:py-16">
        <div className="text-center mb-8">
          <p className="text-xs font-bold tracking-widest uppercase text-[#C6A15B] mb-2">Customer Reviews</p>
          <h2 className="text-2xl md:text-4xl font-bold text-white">What Sonipat Says About Us</h2>
        </div>

        {/* Carousel */}
        <div className="relative max-w-3xl mx-auto" role="region" aria-roledescription="carousel" aria-label="Customer testimonials" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
          {TESTIMONIALS.map((t, idx) => {
            const isActive = idx === active;
            return (
              <div key={t.id} role="group" aria-roledescription="slide" aria-label={`Testimonial ${idx + 1} of ${TESTIMONIALS.length}`} aria-hidden={!isActive} className={cn("transition-opacity duration-500", isActive ? "opacity-100 relative" : "opacity-0 absolute inset-0 pointer-events-none")}>
                <div className="flex flex-col items-center text-center gap-4">
                  <div className="relative size-16 rounded-full overflow-hidden bg-white/10 ring-2 ring-white/20">
                    <Image src={t.avatarImage} alt={t.customerName} fill sizes="64px" className="object-cover" loading="lazy" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-lg font-semibold text-white">{t.customerName}</h3>
                    <BadgeCheck className="size-5 text-green-400" aria-hidden="true" />
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="size-4 fill-[#C6A15B] text-[#C6A15B]" aria-hidden="true" />)}
                  </div>
                  <blockquote className="text-lg leading-relaxed max-w-2xl text-white/90">&ldquo;{t.text}&rdquo;</blockquote>
                  <p className="text-sm text-white/60">{t.attribution}</p>
                </div>
              </div>
            );
          })}

          {TESTIMONIALS.length > 1 && (
            <>
              <button type="button" onClick={() => goTo(active - 1)} className="absolute left-0 top-1/2 -translate-y-1/2 size-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition-all" aria-label="Previous testimonial">
                <ChevronLeft className="size-5" aria-hidden="true" />
              </button>
              <button type="button" onClick={() => goTo(active + 1)} className="absolute right-0 top-1/2 -translate-y-1/2 size-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-white hover:bg-white/20 transition-all" aria-label="Next testimonial">
                <ChevronRight className="size-5" aria-hidden="true" />
              </button>
              <div className="flex items-center justify-center gap-2 mt-6" role="tablist" aria-label="Testimonial navigation">
                {TESTIMONIALS.map((t, idx) => (
                  <button key={t.id} type="button" role="tab" aria-selected={idx === active} aria-label={`Go to testimonial ${idx + 1}`} onClick={() => goTo(idx)} className={cn("h-2.5 rounded-full transition-all duration-300", idx === active ? "w-8 bg-[#C6A15B]" : "w-2.5 bg-white/30 hover:bg-white/50")} />
                ))}
              </div>
            </>
          )}
        </div>
      </Container>

      {/* Stats bar */}
      <div className="border-t border-white/10">
        <Container className="py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {TESTIMONIAL_STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-2xl md:text-3xl font-bold text-white tabular-nums">{s.value}</p>
                <p className="text-sm text-white/70 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </Container>
      </div>
    </section>
  );
}
