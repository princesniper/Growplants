"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, Clock, ArrowRight, CalendarCheck, Sprout, BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/common/Container";
import { PageHero } from "@/components/common/PageHero";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SERVICES, SERVICE_CATEGORIES, type Service } from "@/data/services-data";
import { formatINR } from "@/lib/utils";

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "rating", label: "Best Rated" },
];

/** D7 "How it works" — static, end-to-end framing: book → expert at your door → pay after service. */
const HOW_IT_WORKS = [
  { icon: CalendarCheck, title: "Book your slot", desc: "Pick a date and time that suits you — as early as tomorrow." },
  { icon: Sprout, title: "Expert at your door", desc: "A verified gardener arrives with tools, soil and plants included." },
  { icon: BadgeCheck, title: "Pay after service", desc: "Transparent pricing, no hidden charges. Free cancellation up to 24h before." },
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
      <PageHero overline="Gardening Services" title="Book Verified Gardeners" subtitle="From balcony setup to monthly maintenance — our verified experts handle every task, every time. Book a slot, and we take care of the rest, end to end." breadcrumbs={[{ label: "Home", href: "/" }, { label: "Services" }]} />

      <section className="py-10 md:py-14 bg-ivory">
        <Container>
          {/* Category tabs + sort */}
          <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {SERVICE_CATEGORIES.map((cat) => (
                <button key={cat.slug} onClick={() => setCategory(cat.slug)} className={cn("px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors", category === cat.slug ? "bg-pine text-ivory" : "bg-paper text-ink-soft border border-line hover:border-pine/40")}>
                  {cat.name}
                </button>
              ))}
            </div>
            <Select value={sort} onValueChange={setSort}>
              <SelectTrigger className="w-[200px] rounded-full border-line bg-paper text-sm font-medium text-ink" aria-label="Sort services">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Service cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filtered.map((service) => (
              <article key={service.id} className="flex flex-col rounded-2xl border border-line bg-paper overflow-hidden card-hover">
                <Link href={`/services/${service.slug}`} className="relative aspect-[16/10] bg-stone overflow-hidden">
                  <Image src={service.image} alt={service.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover img-zoom" loading="lazy" />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold bg-pine text-ivory">{service.category}</span>
                  {service.pricingType === "quote_based" && <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-bold bg-gold-tint text-pine">Custom Quote</span>}
                </Link>
                <div className="p-5 flex flex-col gap-3 flex-1">
                  <Link href={`/services/${service.slug}`}><h3 className="font-display text-h4 text-ink hover:text-pine transition-colors">{service.name}</h3></Link>
                  <p className="text-body-sm text-ink-soft line-clamp-2">{service.shortDescription}</p>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="flex items-center gap-1"><Star className="size-4 fill-brass text-brass" /><span className="font-semibold text-ink">{service.rating.toFixed(1)}</span><span className="text-ink-soft">({service.reviewCount})</span></span>
                    <span className="text-line">·</span>
                    <span className="text-ink-soft">{service.bookingCount}+ bookings</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-ink-soft"><Clock className="size-3.5" />{service.duration}</div>
                  <div className="flex items-center justify-between gap-2 mt-auto pt-4 border-t border-line">
                    <div>
                      <p className="text-caption text-ink-soft">Price starts at</p>
                      <p className="text-lg font-bold text-pine tabular-nums">{service.pricingType === "quote_based" ? "Custom Quote" : formatINR(service.priceFrom)}{service.priceUnit && <span className="text-sm font-normal text-ink-soft"> / {service.priceUnit}</span>}</p>
                    </div>
                    <Button asChild size="sm" className="rounded-full bg-pine hover:bg-brass-deep gap-1.5"><Link href={`/services/${service.slug}`}>Book Now<ArrowRight className="size-4" /></Link></Button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>

      {/* How it works — end-to-end service framing (blueprint D7) */}
      <section className="py-12 md:py-16 bg-sage-wash border-t border-line">
        <Container>
          <div className="text-center mb-10 max-w-2xl mx-auto">
            <p className="text-overline text-brass-deep mb-2">How It Works</p>
            <h2 className="font-display text-h2 text-pine">Ghar baithe plant care — end to end</h2>
            <p className="text-body text-ink-soft mt-2">Booking se lekar service tak, sab kuch hum sambhalte hain.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <div key={step.title} className="relative rounded-2xl border border-line bg-paper p-6 text-center">
                <span aria-hidden="true" className="absolute top-4 right-5 font-display text-h2 text-brass/40 tabular-nums">{i + 1}</span>
                <div className="size-12 rounded-full bg-gold-tint text-brass-deep flex items-center justify-center mx-auto mb-4">
                  <step.icon className="size-6" aria-hidden="true" />
                </div>
                <h3 className="font-display text-h4 text-pine mb-1">{step.title}</h3>
                <p className="text-body-sm text-ink-soft">{step.desc}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-body-sm text-ink-soft mt-8">
            Vetted experts · Transparent pricing · No hidden charges · Free cancellation up to 24h before
          </p>
        </Container>
      </section>
    </>
  );
}
