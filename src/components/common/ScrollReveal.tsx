"use client";

/**
 * GrowPlants — ScrollReveal
 * ============================================================================
 * Wraps children with a scroll-triggered reveal animation.
 * Uses IntersectionObserver — no external library needed.
 *
 * Usage:
 *   <ScrollReveal>
 *     <div>This will fade in when scrolled into view</div>
 *   </ScrollReveal>
 *
 *   <ScrollReveal variant="left">
 *     <div>This will slide in from left</div>
 *   </ScrollReveal>
 *
 *   <ScrollReveal variant="scale">
 *     <div>This will scale in</div>
 *   </ScrollReveal>
 *
 *   <ScrollReveal delay={200}>
 *     <div>This will delay 200ms before revealing</div>
 *   </ScrollReveal>
 * ============================================================================
 */
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ScrollRevealProps {
  children: ReactNode;
  variant?: "up" | "left" | "scale";
  delay?: number; // ms
  className?: string;
  threshold?: number; // 0-1, how much of element visible before triggering
  once?: boolean; // if true, only animate once
}

export function ScrollReveal({
  children,
  variant = "up",
  delay = 0,
  className,
  threshold = 0.15,
  once = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect reduced motion — skip animation
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("revealed");
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (delay > 0) {
              setTimeout(() => el.classList.add("revealed"), delay);
            } else {
              el.classList.add("revealed");
            }
            if (once) observer.unobserve(el);
          } else if (!once) {
            el.classList.remove("revealed");
          }
        });
      },
      { threshold, rootMargin: "0px 0px -50px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay, threshold, once]);

  const variantClass =
    variant === "left" ? "scroll-reveal-left" :
    variant === "scale" ? "scroll-reveal-scale" :
    "scroll-reveal";

  return (
    <div ref={ref} className={cn(variantClass, className)}>
      {children}
    </div>
  );
}
