import { Sprout, PackageCheck, Truck, Home, Camera } from "lucide-react";
import { Container } from "@/components/common/Container";
import { SectionHeader } from "@/components/common/SectionHeader";

/**
 * TravelStorySection — "How your plant travels" (blueprint D1.8).
 * De-risks the #1 purchase barrier (transit anxiety) in the homepage's second
 * viewport: 4-step packaging story + expectation microcopy + damage-claim steps.
 */

const STEPS = [
  {
    icon: Sprout,
    title: "Nursery-fresh pick",
    desc: "Aapka plant order ke baad nursery se hand-picked hota hai — health check ke saath.",
  },
  {
    icon: PackageCheck,
    title: "Moisture-locked wrap",
    desc: "Breathable, moisture-locked packaging — mitti gili, patte surakshit.",
  },
  {
    icon: Truck,
    title: "Same-week dispatch",
    desc: "Sonipat ke liye turant dispatch — bheed mein plant intezaar nahi karta.",
  },
  {
    icon: Home,
    title: "At your door in 1–2 days",
    desc: "Sonipat mein 1–2 business days. Box kholo, paani do, enjoy karo.",
  },
];

const CLAIM_STEPS = [
  "Photo bhejein 48h ke andar (WhatsApp par)",
  "Free replacement — koi sawaal nahi",
  "Purana plant aapke paas hi rehta hai",
];

export function TravelStorySection() {
  return (
    <section className="section-padding bg-pine-deep text-ivory" aria-label="How your plant travels">
      <Container>
        <SectionHeader
          title="How your plant travels"
          subtitle="Live plant order karna thoda daring lagta hai — isliye hum har step dikhate hain."
          align="center"
          className="mb-12 [&_h2]:!text-ivory [&_p]:!text-ivory/70"
        />

        {/* 4 steps */}
        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="relative rounded-[20px] border border-ivory/10 bg-ivory/[0.04] p-5 backdrop-blur-sm"
            >
              <span
                className="absolute top-4 right-5 font-display text-4xl text-ivory/15 select-none"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <span className="inline-flex size-11 items-center justify-center rounded-full bg-brass text-pine-ink mb-4">
                <step.icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="font-display text-xl text-ivory">{step.title}</h3>
              <p className="mt-1.5 text-sm text-ivory/70 leading-relaxed">{step.desc}</p>
            </li>
          ))}
        </ol>

        {/* Expectation + damage claim */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <div className="rounded-[20px] border border-brass/30 bg-brass/10 p-5 md:p-6">
            <p className="text-sm font-semibold text-brass uppercase tracking-[0.12em] mb-2">Honest expectations</p>
            <p className="text-ivory/85 leading-relaxed">
              Transit mein 1–2 patte jhadna <strong className="text-ivory">completely normal</strong> hai —
              plant naye ghar mein adjust ho raha hai. 2 hafte mein naye patte aa jayenge.
            </p>
          </div>
          <div className="rounded-[20px] border border-ivory/10 bg-ivory/[0.04] p-5 md:p-6">
            <p className="flex items-center gap-2 text-sm font-semibold text-brass uppercase tracking-[0.12em] mb-3">
              <Camera className="size-4" aria-hidden="true" />
              Damage claim — 3 steps
            </p>
            <ol className="space-y-2">
              {CLAIM_STEPS.map((s, i) => (
                <li key={s} className="flex items-start gap-2.5 text-sm text-ivory/85">
                  <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-moss text-ivory text-[11px] font-bold mt-0.5">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Container>
    </section>
  );
}
