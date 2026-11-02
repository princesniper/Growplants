"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, ArrowRight, ShieldCheck, Clock, Users, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/common/Container";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/utils";
import { SERVICES, BOOKING_STEPS, SERVICE_TRUST_BADGES, SERVICE_CATEGORIES_STRIP } from "@/data/homepageData";

const TRUST_ICONS = [ShieldCheck, Star, Clock, Users];

export function ServicesSection() {
  return (
    <>
      {/* Service categories strip */}
      <section className="border-y border-slate-200 bg-white">
        <Container>
          <ul className="flex items-center justify-between overflow-x-auto py-3 gap-4">
            {SERVICE_CATEGORIES_STRIP.map((cat) => (
              <li key={cat} className="shrink-0">
                <Link href={`/services?category=${cat.toLowerCase().replace(/\s+/g, "-")}`} className="flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-[#16382B] transition-colors whitespace-nowrap">
                  <span className="size-1.5 rounded-full bg-[#16382B]" aria-hidden="true" />{cat}
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="section-padding bg-[#F3F8F1]">
        <Container>
          <div className="mb-8 space-y-2">
            <p className="text-xs font-bold tracking-widest uppercase text-[#C6A15B]">Professional Services</p>
            <h2 className="text-2xl md:text-4xl font-bold text-[#16382B]">Expert Gardeners, At Your Doorstep</h2>
            <p className="text-base text-slate-600 max-w-2xl">From balcony garden setup to monthly maintenance — our verified experts handle every task, every time.</p>
          </div>

          {/* Service cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-12">
            {SERVICES.map((service) => (
              <div key={service.id} className="flex flex-col rounded-lg border border-slate-200 bg-white overflow-hidden hover:shadow-md hover:border-[#16382B]/30 transition-all">
                <div className="relative aspect-[16/10] bg-slate-100 overflow-hidden">
                  <Image src={service.image} alt={service.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" loading="lazy" />
                  <span className="absolute top-3 left-3 px-2 py-1 rounded text-xs font-bold bg-[#16382B] text-white">{service.categoryBadge}</span>
                  <span className="absolute top-3 right-3 px-2 py-1 rounded text-xs font-bold bg-white/90 text-[#16382B]">{service.serviceType}</span>
                </div>
                <div className="p-5 flex flex-col gap-3 flex-1">
                  <h3 className="text-lg font-semibold text-slate-800">{service.name}</h3>
                  <p className="text-sm text-slate-600 line-clamp-3">{service.description}</p>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="flex items-center gap-1">
                      <Star className="size-4 fill-[#C6A15B] text-[#C6A15B]" aria-hidden="true" />
                      <span className="font-semibold text-slate-800 tabular-nums">{service.rating.toFixed(1)}</span>
                      <span className="text-slate-500">({service.reviewCount} reviews)</span>
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-600">{service.bookingCount}+ bookings</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-auto pt-3 border-t border-slate-100">
                    <div>
                      <p className="text-xs text-slate-500">Price starts at</p>
                      <p className="text-lg font-bold text-[#16382B] tabular-nums">
                        {service.pricingType === "quote_based" ? "Custom Quote" : formatINR(service.priceFrom)}
                        {service.priceUnit && <span className="text-sm font-normal text-slate-500"> / {service.priceUnit}</span>}
                      </p>
                    </div>
                    <Button asChild size="sm" className="gap-1.5 bg-[#16382B] hover:bg-[#A8843F]">
                      <Link href={service.href}>
                        {service.pricingType === "quote_based" ? "Custom Quote" : "Book Now"}
                        <ArrowRight className="size-4" aria-hidden="true" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* How Booking Works */}
          <div className="rounded-xl bg-[#16382B] text-white p-6 md:p-10 mb-12">
            <div className="text-center mb-8">
              <h3 className="text-xl md:text-2xl font-bold">How Booking Works — 4 Simple Steps</h3>
            </div>
            <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {BOOKING_STEPS.map((step) => (
                <li key={step.step} className="flex flex-col items-center text-center gap-2">
                  <div className="size-14 rounded-full bg-white/15 text-white flex items-center justify-center text-xl font-bold tabular-nums border-2 border-white/30">{step.step}</div>
                  <h4 className="text-sm font-semibold">{step.title}</h4>
                  <p className="text-sm text-white/80 max-w-xs">{step.description}</p>
                </li>
              ))}
            </ol>
            <div className="text-center">
              <Button asChild className="bg-[#C6A15B] hover:bg-[#A8843F] text-[#0E241C] gap-2">
                <Link href="/services">Browse All Services <ArrowRight className="size-4" aria-hidden="true" /></Link>
              </Button>
            </div>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {SERVICE_TRUST_BADGES.map((badge, i) => {
              const Icon = TRUST_ICONS[i] ?? CheckCircle2;
              return (
                <div key={badge} className="flex items-center gap-3 p-3 rounded-lg bg-white border border-slate-200">
                  <div className="size-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "#C6A15B15" }}>
                    <Icon className="size-5" style={{ color: "#C6A15B" }} aria-hidden="true" />
                  </div>
                  <p className="text-sm font-semibold text-slate-800">{badge}</p>
                </div>
              );
            })}
          </div>
        </Container>
      </section>
    </>
  );
}
