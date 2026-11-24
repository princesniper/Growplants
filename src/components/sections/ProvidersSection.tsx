import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Container } from "@/components/common/Container";
import { ProviderCard } from "@/components/services/ProviderCard";
import { Button } from "@/components/ui/button";
import { PROVIDERS } from "@/data/homepageData";

export function ProvidersSection() {
  return (
    <section className="section-padding bg-[#F3F8F1]">
      <Container>
        <div className="flex items-end justify-between gap-4 flex-wrap mb-8">
          <div className="space-y-2 max-w-2xl">
            <p className="text-xs font-bold tracking-widest uppercase text-[#C6A15B]">Meet Our Experts</p>
            <h2 className="text-2xl md:text-4xl font-bold text-[#16382B]">Sonipat&apos;s Top Gardeners</h2>
            <p className="text-base text-slate-600">Every gardener is personally interviewed, background-checked, and approved by our team.</p>
          </div>
          <Button asChild variant="outline" className="gap-2 border-[#16382B] text-[#16382B] hover:bg-[#16382B] hover:text-white shrink-0">
            <Link href="/providers">View All Gardeners <ArrowRight className="size-4" aria-hidden="true" /></Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          {PROVIDERS.map((p) => <ProviderCard key={p.id} provider={p} />)}
        </div>

        {/* Become a Provider CTA */}
        <div className="relative overflow-hidden rounded-xl bg-[#16382B] text-white p-6 md:p-8">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-2 max-w-xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-white text-sm font-medium">
                <Sparkles className="size-3.5" aria-hidden="true" />Are You a Gardener?
              </span>
              <h3 className="text-xl font-bold">Join GrowPlants and grow your gardening business across Sonipat.</h3>
            </div>
            <Button asChild size="lg" className="shrink-0 gap-2 bg-[#C6A15B] hover:bg-[#A8843F] text-[#0E241C]">
              <Link href="/become-provider">Become a Provider <ArrowRight className="size-4" aria-hidden="true" /></Link>
            </Button>
          </div>
          <div className="absolute -right-8 -bottom-8 opacity-10 pointer-events-none" aria-hidden="true">
            <svg width="200" height="200" viewBox="0 0 200 200" fill="none"><path d="M100 20 C 60 60, 60 140, 100 180 C 140 140, 140 60, 100 20 Z" fill="currentColor" /></svg>
          </div>
        </div>
      </Container>
    </section>
  );
}
