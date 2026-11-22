"use client";

import Link from "next/link";
import { Calendar, IndianRupee, TrendingUp, Clock, ArrowRight, CheckCircle2 } from "lucide-react";
import { Container } from "@/components/common/Container";
import { cn } from "@/lib/utils";
import { formatINR, formatDate } from "@/lib/utils";
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS } from "@/contexts/BookingsContext";
import { useBookings } from "@/contexts/BookingsContext";

// Mock provider stats
const PROVIDER_STATS = {
  todayBookings: 2,
  upcomingBookings: 5,
  weekEarnings: 4200,
  monthEarnings: 16800,
  pendingPayout: 2400,
  totalBookings: 214,
  rating: 4.9,
  completionRate: 98,
};

export default function ProviderDashboardPage() {
  const { bookings } = useBookings();
  const upcoming = bookings.filter((b) => !["completed", "cancelled"].includes(b.status)).slice(0, 5);

  const stats = [
    { label: "Today's Bookings", value: PROVIDER_STATS.todayBookings, icon: Calendar, color: "bg-stone text-pine" },
    { label: "Upcoming (7 days)", value: PROVIDER_STATS.upcomingBookings, icon: Clock, color: "bg-gold-tint text-brass-deep" },
    { label: "This Week", value: formatINR(PROVIDER_STATS.weekEarnings), icon: IndianRupee, color: "bg-sage-wash text-moss" },
    { label: "This Month", value: formatINR(PROVIDER_STATS.monthEarnings), icon: TrendingUp, color: "bg-clay text-terracotta" },
  ];

  return (
    <Container className="py-6 md:py-8">
      <h1 className="text-2xl font-bold text-pine mb-2">Provider Dashboard</h1>
      <p className="text-xs text-ink-soft mb-6">Demo figures hain — live provider data abhi connected nahi hai.</p>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-paper border border-line rounded-[18px] p-4">
            <div className={cn("size-10 rounded-lg flex items-center justify-center mb-2", s.color)}><s.icon className="size-5" /></div>
            <p className="text-lg font-bold text-charcoal tabular-nums">{s.value}</p>
            <p className="text-xs text-ink-soft">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Earnings summary */}
      <div className="bg-gradient-to-r from-pine to-brass-deep text-ivory rounded-[18px] p-5 mb-6 flex items-center justify-between">
        <div>
          <p className="text-sm text-white/80">Pending Payout</p>
          <p className="text-2xl font-bold tabular-nums">{formatINR(PROVIDER_STATS.pendingPayout)}</p>
        </div>
        <Link href="/provider/earnings" className="px-4 py-2 bg-white/15 rounded-lg text-sm font-medium hover:bg-white/25 transition-colors">Request Payout</Link>
      </div>

      {/* Upcoming bookings */}
      <div className="bg-paper border border-line rounded-[18px] p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-charcoal">Upcoming Bookings</h2>
          <Link href="/provider/bookings" className="text-xs font-medium text-pine hover:underline flex items-center gap-0.5">View All <ArrowRight className="size-3" /></Link>
        </div>
        {upcoming.length === 0 ? (
          <div className="space-y-2">
            {/* Mock upcoming bookings for demo */}
            {[
              { id: "demo-1", bookingNumber: "GB-DEMO01", serviceName: "Balcony Garden Setup", date: "2026-07-09", timeSlot: "09:00-11:00", status: "confirmed" as const },
              { id: "demo-2", bookingNumber: "GB-DEMO02", serviceName: "Garden Maintenance", date: "2026-07-10", timeSlot: "14:00-16:00", status: "pending" as const },
            ].map((b) => (
              <div key={b.id} className="flex items-center justify-between gap-2 p-3 rounded-lg bg-sand">
                <div><p className="text-sm font-medium text-charcoal">{b.serviceName}</p><p className="text-xs text-ink-soft">{b.bookingNumber} · {formatDate(b.date)} · {b.timeSlot}</p></div>
                <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", BOOKING_STATUS_COLORS[b.status])}>{BOOKING_STATUS_LABELS[b.status]}</span>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map((b) => (
              <Link key={b.id} href={`/provider/bookings`} className="flex items-center justify-between gap-2 p-3 rounded-lg bg-sand hover:bg-stone transition-colors">
                <div><p className="text-sm font-medium text-charcoal">{b.service.serviceName}</p><p className="text-xs text-ink-soft">{b.bookingNumber} · {formatDate(b.date)} · {b.timeSlot}</p></div>
                <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", BOOKING_STATUS_COLORS[b.status])}>{BOOKING_STATUS_LABELS[b.status]}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-paper border border-line rounded-[18px] p-4 text-center"><p className="text-2xl font-bold text-pine tabular-nums">{PROVIDER_STATS.totalBookings}</p><p className="text-xs text-ink-soft">Total Bookings Completed</p></div>
        <div className="bg-paper border border-line rounded-[18px] p-4 text-center"><p className="text-2xl font-bold text-brass-deep tabular-nums">{PROVIDER_STATS.rating}★</p><p className="text-xs text-ink-soft">Average Rating</p></div>
        <div className="bg-paper border border-line rounded-[18px] p-4 text-center"><p className="text-2xl font-bold text-moss tabular-nums">{PROVIDER_STATS.completionRate}%</p><p className="text-xs text-ink-soft">Completion Rate</p></div>
      </div>
    </Container>
  );
}
