"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, Clock, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/common/Container";
import { PageHero } from "@/components/common/PageHero";
import { Button } from "@/components/ui/button";
import { SERVICES, SERVICE_CATEGORIES, type Service } from "@/data/services-data";
import { formatINR } from "@/lib/utils";

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Best Rated" },
];

export default function ServicesPage() {
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("featured");

  const filtered = useMemo(() => {
    let result = category === "all" ? [...SERVICES] : SERVICES.filter((s) => s.categorySlug === category);
    switch (sort) {
      case "price_asc": result.sort((a, b) => a.priceFrom - b.priceFrom); break;
      case "price_desc": result.sort((a, b) => b.priceFrom - a.priceFrom); break;
      case "rating": result.sort((a, b) => b.rating - a.rating); break;
      default: result.sort((a, b) => b.bookingCount - a.bookingCount); break;
    }
    return result;
  }, [category, sort]);

  return (
    <>
      <PageHero overline="Gardening Services" title="Book Verified Gardeners" subtitle="From balcony setup to monthly maintenance — our verified experts handle every task, every time." breadcrumbs={[{ label: "Home", href: "/" }, { label: "Services" }]} />

      <section className="py-8 md:py-12 bg-white">
        <Container>
          {/* Category tabs + sort */}
          <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {SERVICE_CATEGORIES.map((cat) => (
                <button key={cat.slug} onClick={() => setCategory(cat.slug)} className={cn("px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors", category === cat.slug ? "bg-[#16382B] text-white" : "bg-white text-slate-700 border border-slate-200 hover:border-[#16382B]/30")}>
                  {cat.name}
                </button>
              ))}
            </div>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="appearance-none bg-white border border-slate-200 rounded-md pl-3 pr-9 py-2 text-sm font-medium text-slate-700 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#16382B]/20">
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Service cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filtered.map((service) => (
              <div key={service.id} className="flex flex-col rounded-lg border border-slate-200 bg-white overflow-hidden hover:shadow-md hover:border-[#16382B]/30 transition-all">
                <Link href={`/services/${service.slug}`} className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                  <Image src={service.image} alt={service.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" loading="lazy" />
                  <span className="absolute top-3 left-3 px-2 py-1 rounded text-xs font-bold bg-[#16382B] text-white">{service.category}</span>
                  {service.pricingType === "quote_based" && <span className="absolute top-3 right-3 px-2 py-1 rounded text-xs font-bold bg-white/90 text-[#16382B]">Custom Quote</span>}
                </Link>
                <div className="p-5 flex flex-col gap-3 flex-1">
                  <Link href={`/services/${service.slug}`}><h3 className="text-lg font-semibold text-slate-800 hover:text-[#16382B]">{service.name}</h3></Link>
                  <p className="text-sm text-slate-600 line-clamp-2">{service.shortDescription}</p>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="flex items-center gap-1"><Star className="size-4 fill-[#C6A15B] text-[#C6A15B]" /><span className="font-semibold text-slate-800">{service.rating.toFixed(1)}</span><span className="text-slate-500">({service.reviewCount})</span></span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-600">{service.bookingCount}+ bookings</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-500"><Clock className="size-3.5" />{service.duration}</div>
                  <div className="flex items-center justify-between gap-2 mt-auto pt-3 border-t border-slate-100">
                    <div>
                      <p className="text-xs text-slate-500">Price starts at</p>
                      <p className="text-lg font-bold text-[#16382B] tabular-nums">{service.pricingType === "quote_based" ? "Custom Quote" : formatINR(service.priceFrom)}{service.priceUnit && <span className="text-sm font-normal text-slate-500"> / {service.priceUnit}</span>}</p>
                    </div>
                    <Button asChild size="sm" className="bg-[#16382B] hover:bg-[#A8843F] gap-1.5"><Link href={`/services/${service.slug}`}>Book Now<ArrowRight className="size-4" /></Link></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
