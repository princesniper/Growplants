import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Sprout, Heart, ShieldCheck, Truck, Leaf, Users, ArrowRight, Sparkles } from "lucide-react";
import { Container } from "@/components/common/Container";
import { PageHero } from "@/components/common/PageHero";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "GrowPlants is Sonipat's first premium plant store and gardening service marketplace. Learn about our mission, values, and the team bringing nature to your home.",
  alternates: { canonical: "/about" },
};

const VALUES = [
  { icon: Sprout, title: "Quality First", desc: "Every plant is hand-picked and inspected before delivery. We never ship a wilting plant — if it wouldn't thrive in our own home, it doesn't reach yours." },
  { icon: Heart, title: "Customer Love", desc: "We treat every customer like a neighbour. From WhatsApp plant care support to 24-hour damage replacements, your satisfaction is our priority." },
  { icon: ShieldCheck, title: "Trust & Transparency", desc: "Verified gardeners, honest pricing, and clear policies. No hidden charges, no surprise fees — just straightforward, fair service." },
  { icon: Leaf, title: "Green Values", desc: "Eco-friendly packaging, sustainable sourcing, and biodegradable pots. We care about your garden and the planet we share." },
];

const STATS = [
  { value: "1,200+", label: "Happy Customers" },
  { value: "3,400+", label: "Plants Delivered" },
  { value: "500+", label: "Services Completed" },
  { value: "4.8★", label: "Average Rating" },
];

export default function AboutPage() {
  return (
    <>
      <PageHero
        overline="Our Story"
        title="Bringing Nature Home to Sonipat"
        subtitle="GrowPlants is Sonipat's first premium plant store and gardening service marketplace — built on quality, trust, and green values."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "About Us" }]}
      />

      <section className="py-12 md:py-16 bg-paper">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="space-y-4">
              <p className="text-overline text-brass-deep">How It Started</p>
              <h2 className="font-display text-h2 text-pine">From a Small Nursery to Sonipat&apos;s Trusted Plant Store</h2>
              <div className="space-y-3 text-body text-ink-soft leading-relaxed">
                <p>GrowPlants began with a simple observation: finding healthy, quality plants in Sonipat was harder than it should be. Local nurseries had limited variety, online stores shipped damaged plants, and booking a reliable gardener felt like a gamble.</p>
                <p>We set out to change that. What started as a small nursery in Sonipat has grown into Haryana&apos;s most trusted botanical marketplace — combining a curated plant store with a verified gardening service platform. Today, we serve over 1,200 happy customers across Sonipat, with plans to expand to every major city in Haryana.</p>
                <p>Our mission is simple: make it easy for every Sonipat home to have healthy plants and expert gardening help. Whether you&apos;re a first-time plant parent or a seasoned gardener, we&apos;re here to help you grow.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <Button asChild className="rounded-full bg-pine hover:bg-brass-deep gap-2"><Link href="/shop">Shop Plants <ArrowRight className="size-4" aria-hidden="true" /></Link></Button>
                <Button asChild variant="outline" className="rounded-full border-pine text-pine hover:bg-pine hover:text-ivory gap-2"><Link href="/contact">Contact Us <ArrowRight className="size-4" aria-hidden="true" /></Link></Button>
              </div>
            </div>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-stone">
              <Image src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&q=80" alt="GrowPlants nursery with healthy plants" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" loading="lazy" />
            </div>
          </div>
        </Container>
      </section>

      {/* Founder story — family-nursery roots, nursery name kept generic (unconfirmed) */}
      <section className="py-12 md:py-16 bg-sage-wash border-y border-line">
        <Container>
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <p className="text-overline text-brass-deep">Our Roots</p>
            <h2 className="font-display text-h2 text-pine">Anyone can be a plant parent!</h2>
            <p className="text-body-lg text-ink-soft leading-relaxed">
              That&apos;s what our family nursery taught us — long before GrowPlants existed.
              Growing up around soil, saplings and Sunday watering routines, we learned that
              plants don&apos;t need an expert, just a little care and the right guidance.
              GrowPlants is that same family nursery, grown up: the same hands picking your
              plants, the same honest advice, now delivered to your doorstep across Sonipat.
            </p>
            <p className="text-body-sm text-ink-soft">
              No jargon, no judgement — just healthy plants and people who genuinely love growing them.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-10 bg-pine text-ivory">
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s) => (<div key={s.label} className="text-center"><p className="font-display text-h2 tabular-nums">{s.value}</p><p className="text-body-sm text-ivory/80 mt-1">{s.label}</p></div>))}
          </div>
        </Container>
      </section>

      <section className="py-12 md:py-16 bg-sage-wash">
        <Container>
          <div className="max-w-3xl mx-auto text-center space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pine/10 text-pine text-sm font-medium"><Sparkles className="size-4" aria-hidden="true" />Our Mission</span>
            <h2 className="font-display text-h2 text-pine">Make Every Sonipat Home a Little Greener</h2>
            <p className="text-body-lg text-ink-soft leading-relaxed">We believe everyone deserves access to healthy plants and expert gardening help. That&apos;s why we&apos;ve built a platform that combines a carefully curated plant store with a network of verified, background-checked gardeners — all dedicated to helping you create and maintain beautiful green spaces, whether it&apos;s a single indoor plant or a full balcony garden transformation.</p>
          </div>
        </Container>
      </section>

      <section className="py-12 md:py-16 bg-paper">
        <Container>
          <div className="text-center mb-10 max-w-2xl mx-auto">
            <p className="text-overline text-brass-deep mb-2">What We Stand For</p>
            <h2 className="font-display text-h2 text-pine">Our Core Values</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {VALUES.map((v) => (
              <div key={v.title} className="flex flex-col items-start gap-3 p-5 rounded-2xl bg-sage-wash border border-line card-hover">
                <div className="size-12 rounded-xl flex items-center justify-center shrink-0 bg-gold-tint text-brass-deep"><v.icon className="size-6" aria-hidden="true" /></div>
                <div><h3 className="font-display text-h4 text-ink mb-1">{v.title}</h3><p className="text-body-sm text-ink-soft">{v.desc}</p></div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="py-12 md:py-16 bg-sage-wash">
        <Container>
          <div className="relative overflow-hidden rounded-2xl bg-pine text-ivory p-8 md:p-12 text-center">
            <div className="relative z-10 max-w-2xl mx-auto space-y-4">
              <h2 className="font-display text-h2">Ready to Start Your Green Journey?</h2>
              <p className="text-ivory/80">Shop healthy plants, book verified gardeners, or get free plant care advice on WhatsApp. We&apos;re here to help your garden thrive.</p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Button asChild size="lg" className="rounded-full bg-brass hover:bg-brass-deep text-pine hover:text-ivory gap-2"><Link href="/shop">Shop Plants <ArrowRight className="size-4" aria-hidden="true" /></Link></Button>
                <Button asChild size="lg" variant="outline" className="rounded-full bg-white/10 backdrop-blur border-white/30 text-white hover:bg-white/20 hover:text-white gap-2"><Link href="/services">Book a Gardener <ArrowRight className="size-4" aria-hidden="true" /></Link></Button>
              </div>
            </div>
            <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none" aria-hidden="true"><svg width="200" height="200" viewBox="0 0 200 200" fill="none"><path d="M100 20 C 60 60, 60 140, 100 180 C 140 140, 140 60, 100 20 Z" fill="currentColor" /></svg></div>
          </div>
        </Container>
      </section>
    </>
  );
}
