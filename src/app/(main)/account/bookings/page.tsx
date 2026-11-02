"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, ChevronRight, BellRing } from "lucide-react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/common/Container";
import { EmptyState } from "@/components/common/EmptyState";
import { useBookings, BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS, type BookingStatus } from "@/contexts/BookingsContext";
import { formatINR, formatDate } from "@/lib/utils";

const FILTERS: { label: string; value: BookingStatus | "all" }[] = [
  { label: "All", value: "all" }, { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" }, { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

export default function BookingsPage() {
  const { bookings } = useBookings();
  const [filter, setFilter] = useState<BookingStatus | "all">("all");
  const filtered = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  if (bookings.length === 0) {
    return <Container className="py-16"><EmptyState icon={Calendar} title="No bookings yet" description="Book a gardening service and your bookings will appear here." action={{ label: "Browse Services", href: "/services" }} size="lg" /></Container>;
  }

  return (
    <Container className="py-8 md:py-10">
      <h1 className="text-2xl font-bold text-[#16382B] mb-6">My Bookings</h1>
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {FILTERS.map((f) => <button key={f.value} onClick={() => setFilter(f.value)} className={cn("px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors", filter === f.value ? "bg-[#16382B] text-white" : "bg-white text-slate-700 border border-slate-200")}>{f.label}</button>)}
      </div>
      <div className="space-y-3">
        {filtered.length === 0 ? <p className="text-sm text-slate-500 text-center py-8">No {filter} bookings found.</p> : filtered.map((b) => (
          <Link key={b.id} href={`/account/bookings/${b.id}`} className="block bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div><p className="text-sm font-bold text-slate-800">{b.bookingNumber}</p><p className="text-xs text-slate-500">{formatDate(b.createdAt)}</p></div>
              <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", BOOKING_STATUS_COLORS[b.status])}>{BOOKING_STATUS_LABELS[b.status]}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative size-10 rounded-lg overflow-hidden bg-slate-50 shrink-0"><Image src={b.service.image} alt={b.service.serviceName} fill sizes="40px" className="object-cover" /></div>
              <div className="flex-1 min-w-0"><p className="text-sm font-medium text-slate-800 truncate">{b.service.serviceName}</p><p className="text-xs text-slate-500">{formatDate(b.date)} · {b.timeSlot}</p></div>
              <p className="text-xs text-slate-500">{b.service.providerName ?? "Auto-assign"}</p>
              <ChevronRight className="size-4 text-[#16382B]" />
            </div>
          </Link>
        ))}
      </div>
    </Container>
  );
}
