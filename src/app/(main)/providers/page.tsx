"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Star, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/common/Container";
import { PageHero } from "@/components/common/PageHero";
import { Button } from "@/components/ui/button";
import { PROVIDERS } from "@/data/services-data";

export default function ProvidersPage() {
  const [filter, setFilter] = useState("all");
  const allServices = Array.from(new Set(PROVIDERS.flatMap((p) => p.services)));
  const filtered = filter === "all" ? PROVIDERS : PROVIDERS.filter((p) => p.services.includes(filter));

  return (
    <>
      <PageHero overline="Our Experts" title="Meet Our Verified Gardeners" subtitle="Every gardener is personally interviewed, background-checked, and approved by our team." breadcrumbs={[{ label: "Home", href: "/" }, { label: "Gardeners" }]} />

      <section className="py-8 md:py-12 bg-white">
        <Container>
          {/* Filter */}
          <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
            <button onClick={() => setFilter("all")} className={cn("px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors", filter === "all" ? "bg-[#16382B] text-white" : "bg-white text-slate-700 border border-slate-200")}>All Gardeners</button>
            {allServices.map((s) => <button key={s} onClick={() => setFilter(s)} className={cn("px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors", filter === s ? "bg-[#16382B] text-white" : "bg-white text-slate-700 border border-slate-200")}>{s}</button>)}
          </div>

          {/* Provider grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filtered.map((p) => (
              <div key={p.id} className="flex flex-col bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-[#16382B]/30 transition-all">
                <div className="flex items-start gap-3 mb-3">
                  <div className="relative size-16 rounded-full overflow-hidden bg-slate-100 ring-2 ring-[#16382B]/10 shrink-0"><Image src={p.avatarImage} alt={p.name} fill sizes="64px" className="object-cover" /></div>
                  <div className="flex flex-col gap-1.5 mt-1">
                    {p.verified && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-600 text-xs font-semibold w-fit"><BadgeCheck className="size-3" />Verified</span>}
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#F3F8F1] text-[#16382B] text-xs font-semibold w-fit">{p.experienceYears} yrs exp.</span>
                  </div>
                </div>
                <h3 className="text-base font-semibold text-slate-800">{p.name}</h3>
                <div className="flex items-center gap-1 mt-0.5"><Star className="size-4 fill-[#C6A15B] text-[#C6A15B]" /><span className="text-sm font-semibold text-slate-800">{p.rating.toFixed(1)}</span><span className="text-sm text-slate-500">{p.city} · {p.reviewCount} reviews</span></div>
                <p className="text-sm text-slate-600 mt-2 line-clamp-2">{p.bio}</p>
                <div className="flex flex-wrap gap-1 mt-2">{p.services.map((s) => <span key={s} className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded">{s}</span>)}</div>
                <p className="text-xs text-slate-500 mt-2">{p.bookingCount} bookings completed</p>
                <Button asChild size="sm" className="w-full mt-3 bg-[#16382B] hover:bg-[#A8843F] gap-1.5"><Link href="/services">Book Now<ArrowRight className="size-3.5" /></Link></Button>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
