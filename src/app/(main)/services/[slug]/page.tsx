"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Star, Clock, Check, X, ChevronRight, Calendar, ArrowRight, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/common/Container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { getServiceBySlug, PROVIDERS, type Service } from "@/data/services-data";
import { TIME_SLOTS } from "@/contexts/BookingsContext";
import { formatINR } from "@/lib/utils";
import { appToast } from "@/lib/toast";

const PENDING_BOOKING_KEY = "growplants-pending-booking";

export default function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const service = getServiceBySlug(slug);
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  if (!service) {
    return (
      <Container className="py-16 text-center">
        <h1 className="text-xl font-bold text-gray-900">Service not found</h1>
        <Button asChild className="mt-4 bg-[#1A6B3C] hover:bg-[#16A34A]">
          <Link href="/services">← All Services</Link>
        </Button>
      </Container>
    );
  }

  const availableProviders = PROVIDERS.filter((p) =>
    p.services.some((s) => s.toLowerCase().includes(service.name.toLowerCase().split(" ")[0]))
  );

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split("T")[0];

  // ─── Proceed to Checkout ───
  // Validates date/time/provider, stores pending booking in sessionStorage,
  // and redirects to the booking checkout page where address + payment are collected.
  const handleProceedToCheckout = () => {
    if (!selectedDate) {
      appToast.error("Date required", "Please select a date for your service.");
      return;
    }
    if (!selectedSlot) {
      appToast.error("Time slot required", "Please select a time slot.");
      return;
    }

    const pending = {
      serviceSlug: service.slug,
      date: selectedDate,
      timeSlot: selectedSlot,
      providerId: selectedProvider,
      notes: notes.trim(),
    };

    try {
      sessionStorage.setItem(PENDING_BOOKING_KEY, JSON.stringify(pending));
      router.push("/checkout?mode=booking");
    } catch (err) {
      appToast.error(
        "Could not proceed",
        "Failed to save your booking details. Please try again."
      );
    }
  };

  const priceLabel =
    service.pricingType === "quote_based"
      ? "Custom Quote"
      : formatINR(service.priceFrom) + (service.priceUnit ? ` / ${service.priceUnit}` : "");

  return (
    <Container className="py-6 md:py-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
        <Link href="/" className="hover:text-[#1A6B3C]">Home</Link>
        <ChevronRight className="size-3" />
        <Link href="/services" className="hover:text-[#1A6B3C]">Services</Link>
        <ChevronRight className="size-3" />
        <span className="text-slate-800 font-semibold truncate">{service.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left: Service info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Gallery */}
          <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-slate-100">
            <Image
              src={service.gallery[0] ?? service.image}
              alt={service.name}
              fill
              sizes="(max-width: 1024px) 100vw, 66vw"
              className="object-cover"
              priority
            />
          </div>

          {/* Title + rating */}
          <div>
            <span className="text-[11px] font-bold text-[#1A6B3C] uppercase tracking-wider bg-[#F0FAF4] px-2.5 py-1 rounded-full border border-[#BBF7D0]">
              {service.category}
            </span>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">{service.name}</h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <div className="flex items-center gap-1">
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={cn(
                        "size-4",
                        s <= Math.round(service.rating) ? "fill-[#E8930A] text-[#E8930A]" : "text-gray-200"
                      )}
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold text-slate-800">{service.rating.toFixed(1)}</span>
              </div>
              <span className="text-sm text-slate-500">({service.reviewCount} reviews)</span>
              <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                {service.bookingCount}+ bookings
              </span>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-slate-600 leading-relaxed">{service.description}</p>

          {/* What's included / excluded */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#F3F8F1] rounded-lg p-4">
              <h3 className="text-sm font-bold text-slate-800 mb-3">What&apos;s Included</h3>
              <ul className="space-y-2">
                {service.whatsIncluded.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                    <Check className="size-4 text-green-600 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white border border-slate-100 rounded-lg p-4">
              <h3 className="text-sm font-bold text-slate-800 mb-3">Not Included</h3>
              <ul className="space-y-2">
                {service.whatsExcluded.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-500">
                    <X className="size-4 text-slate-400 shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Providers */}
          {availableProviders.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-4">
                Available Gardeners ({availableProviders.length})
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableProviders.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedProvider(p.id)}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg border-2 transition-all text-left",
                      selectedProvider === p.id
                        ? "border-[#1A6B3C] bg-[#F3F8F1]"
                        : "border-slate-200 hover:border-slate-300"
                    )}
                  >
                    <div className="relative size-12 rounded-full overflow-hidden bg-slate-100 shrink-0">
                      <Image src={p.avatarImage} alt={p.name} fill sizes="48px" className="object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{p.name}</p>
                      <p className="text-xs text-slate-500">
                        {p.rating.toFixed(1)}★ · {p.experienceYears} yrs · {p.bookingCount} bookings
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* FAQ */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-4">FAQ</h2>
            <div className="space-y-2">
              {service.faqs.map((faq, i) => (
                <details key={i} className="group bg-white rounded-lg border border-slate-100 overflow-hidden">
                  <summary className="flex items-center justify-between gap-3 p-4 cursor-pointer text-sm font-medium text-slate-800 hover:bg-slate-50 list-none">
                    {faq.q}
                    <ChevronRight className="size-4 text-slate-400 group-open:rotate-90 transition-transform shrink-0" />
                  </summary>
                  <div className="px-4 pb-4 text-sm text-slate-600">{faq.a}</div>
                </details>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Booking panel (sticky) — date/time/notes only, NO address/payment */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white border border-slate-200 rounded-xl p-5 space-y-4">
            <div>
              <p className="text-xs text-slate-500">Price starts at</p>
              <p className="text-2xl font-bold text-[#1A6B3C] tabular-nums">{priceLabel}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Clock className="size-4 text-[#1A6B3C]" />
              {service.duration}
            </div>
            <Separator />

            {/* Date */}
            <div className="space-y-1.5">
              <Label className="text-sm flex items-center gap-1.5">
                <Calendar className="size-4" /> Select Date *
              </Label>
              <Input
                type="date"
                min={minDateStr}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-11"
              />
            </div>

            {/* Time slot */}
            <div className="space-y-1.5">
              <Label className="text-sm">Select Time Slot *</Label>
              <div className="grid grid-cols-2 gap-2">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedSlot(slot)}
                    className={cn(
                      "px-3 py-2 rounded-lg border-2 text-xs font-medium transition-all",
                      selectedSlot === slot
                        ? "border-[#1A6B3C] bg-[#F3F8F1] text-[#1A6B3C]"
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    )}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes for gardener (optional) */}
            <div className="space-y-1.5">
              <Label className="text-sm">Notes for Gardener (optional)</Label>
              <Textarea
                rows={2}
                placeholder="Any specific instructions for the gardener…"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-sm"
              />
            </div>

            <Separator />

            {/* Proceed to Checkout */}
            <Button
              onClick={handleProceedToCheckout}
              className="w-full bg-[#1A6B3C] hover:bg-[#16A34A] gap-2 h-12"
            >
              Proceed to Checkout <ArrowRight className="size-4" />
            </Button>

            {/* Hint about what's next */}
            <div className="rounded-md bg-[#F3F8F1] border border-[#BBF7D0] p-2.5 flex items-start gap-1.5">
              <AlertCircle className="size-3.5 text-[#1A6B3C] shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-600">
                You&apos;ll enter your delivery address and choose a payment method on the next step.
              </p>
            </div>

            <p className="text-xs text-slate-400 text-center">Free cancellation up to 24h before</p>
          </div>
        </div>
      </div>
    </Container>
  );
}
