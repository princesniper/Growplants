"use client";

import { use, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { CheckCircle2, User, Calendar, Clock, MapPin, X, ArrowLeft, BellRing } from "lucide-react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/common/Container";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useBookings, BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS } from "@/contexts/BookingsContext";
import { formatINR, formatDate } from "@/lib/utils";
import { appToast } from "@/lib/toast";

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { getBooking, cancelBooking } = useBookings();
  const [showCancel, setShowCancel] = useState(false);
  const [reason, setReason] = useState("");
  const booking = getBooking(id);

  if (!booking) {
    return <Container className="py-16 text-center space-y-4"><h1 className="text-xl font-bold text-gray-900">Booking not found</h1><Button asChild className="bg-[#16382B] hover:bg-[#A8843F]"><Link href="/account/bookings">← Back to Bookings</Link></Button></Container>;
  }

  const canCancel = booking.status === "pending" || booking.status === "confirmed";
  const timeline = [
    { icon: CheckCircle2, label: "Booking Placed", done: true, date: booking.createdAt },
    { icon: User, label: "Confirmed", done: ["confirmed", "in_progress", "completed"].includes(booking.status), date: null },
    { icon: Clock, label: "In Progress", done: ["in_progress", "completed"].includes(booking.status), date: null },
    { icon: CheckCircle2, label: "Completed", done: booking.status === "completed", date: null },
  ];

  const handleCancel = () => { cancelBooking(booking.id, reason || "Cancelled by customer"); setShowCancel(false); appToast.success("Booking cancelled", `Booking ${booking.bookingNumber} cancelled`); };

  return (
    <Container className="py-6 md:py-10">
      <Link href="/account/bookings" className="flex items-center gap-1 text-sm text-slate-500 hover:text-[#16382B] mb-4"><ArrowLeft className="size-3.5" />Back to Bookings</Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div><h1 className="text-xl font-bold text-[#16382B]">{booking.bookingNumber}</h1><p className="text-sm text-slate-500">Booked on {formatDate(booking.createdAt)}</p></div>
            <span className={cn("text-xs font-semibold px-3 py-1 rounded-full", BOOKING_STATUS_COLORS[booking.status])}>{BOOKING_STATUS_LABELS[booking.status]}</span>
          </div>

          {/* Timeline */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <h2 className="text-sm font-bold text-slate-800 mb-4">Booking Status</h2>
            <div className="space-y-3">{timeline.map((s, i) => (
              <div key={i} className="flex items-center gap-3"><div className={cn("size-8 rounded-full flex items-center justify-center shrink-0", s.done ? "bg-[#16382B] text-white" : "bg-slate-100 text-slate-400")}><s.icon className="size-4" /></div><div><p className={cn("text-sm", s.done ? "text-slate-800 font-medium" : "text-slate-400")}>{s.label}</p>{s.date && <p className="text-xs text-slate-400">{formatDate(s.date)}</p>}</div></div>
            ))}</div>
            {booking.status === "cancelled" && <div className="mt-3 p-3 bg-red-50 rounded-lg"><p className="text-sm text-red-600 font-medium">Booking Cancelled</p><p className="text-xs text-red-500">{booking.statusHistory.find((s) => s.status === "cancelled")?.note ?? "Cancelled"}</p></div>}
          </div>

          {/* Service info */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-800">Service Details</h2>
            <Separator />
            <div className="flex gap-3 items-center">
              <div className="relative size-14 rounded-lg overflow-hidden bg-slate-50 shrink-0"><Image src={booking.service.image} alt={booking.service.serviceName} fill sizes="56px" className="object-cover" /></div>
              <div><p className="text-sm font-medium text-slate-800">{booking.service.serviceName}</p><p className="text-xs text-slate-500">{booking.service.providerName ? `Provider: ${booking.service.providerName}` : "Provider: Auto-assigned"}</p></div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-slate-600"><Calendar className="size-4 text-[#16382B]" />{formatDate(booking.date)}</div>
              <div className="flex items-center gap-2 text-slate-600"><Clock className="size-4 text-[#16382B]" />{booking.timeSlot}</div>
            </div>
            {booking.notes && <div className="p-3 bg-[#F3F8F1] rounded-lg"><p className="text-xs font-semibold text-slate-500 uppercase mb-1">Notes</p><p className="text-sm text-slate-600">{booking.notes}</p></div>}
          </div>

          {canCancel && <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-50 gap-2" onClick={() => setShowCancel(true)}><X className="size-4" />Cancel Booking</Button>}
        </div>

        {/* Right */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4"><h3 className="text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-1.5"><MapPin className="size-3.5" />Service Address</h3><p className="text-sm font-medium text-slate-800">{booking.address.fullName}</p><p className="text-xs text-slate-600">{booking.address.addressLine1}</p><p className="text-xs text-slate-600">{booking.address.city}, {booking.address.state} - {booking.address.pincode}</p><p className="text-xs text-slate-600 mt-1">📞 {booking.address.phone}</p></div>
          <div className="bg-white border border-slate-200 rounded-xl p-4"><h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">Payment</h3><p className="text-sm font-medium text-slate-800">{booking.paymentMethod === "cod" ? "Cash on Delivery" : "Online (Razorpay)"}</p><p className="text-xs">Status: <span className={booking.paymentStatus === "paid" ? "text-green-600 font-medium" : "text-amber-600 font-medium"}>{booking.paymentStatus === "paid" ? "Paid" : "Pending"}</span></p></div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2"><h3 className="text-xs font-semibold text-slate-500 uppercase mb-1">Price Details</h3><div className="flex justify-between text-sm"><span className="text-slate-600">{booking.service.serviceName}</span><span className="tabular-nums">{booking.service.pricingType === "quote_based" ? "Custom" : formatINR(booking.service.priceFrom)}</span></div><Separator /><div className="flex justify-between items-baseline"><span className="text-sm font-bold">Total</span><span className="text-lg font-bold text-[#16382B] tabular-nums">{booking.service.pricingType === "quote_based" ? "Custom" : formatINR(booking.service.priceFrom)}</span></div></div>
        </div>
      </div>

      {showCancel && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setShowCancel(false)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-4" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900">Cancel Booking?</h2>
            <p className="text-sm text-slate-500">Cancel booking {booking.bookingNumber}? Free cancellation up to 24h before the scheduled time.</p>
            <div className="space-y-1.5"><Label className="text-sm">Reason (optional)</Label><Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} /></div>
            <div className="flex gap-3"><Button variant="outline" className="flex-1" onClick={() => setShowCancel(false)}>Keep Booking</Button><Button className="flex-1 bg-red-500 hover:bg-red-600 text-white" onClick={handleCancel}>Yes, Cancel</Button></div>
          </div>
        </div>
      )}
    </Container>
  );
}
