"use client";

import { useState } from "react";
import { CheckCircle2, Clock, Play, Camera, XCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/common/Container";
import { Button } from "@/components/ui/button";
import { useBookings, BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS, type BookingStatus } from "@/contexts/BookingsContext";
import { formatINR, formatDate } from "@/lib/utils";
import { appToast } from "@/lib/toast";

const FILTERS: { label: string; value: BookingStatus | "all" }[] = [
  { label: "All", value: "all" }, { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" }, { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
];

// Mock provider bookings (since real bookings may be empty)
const MOCK_BOOKINGS = [
  { id: "pb-1", bookingNumber: "GB-DEMO01", serviceName: "Balcony Garden Setup", customerName: "Priya Sharma", customerPhone: "+91 98765 43210", date: "2026-07-09", timeSlot: "09:00-11:00", status: "confirmed" as BookingStatus, address: "123 Green St, Sonipat", price: 1499, notes: "Bring extra soil" },
  { id: "pb-2", bookingNumber: "GB-DEMO02", serviceName: "Garden Maintenance", customerName: "Rajesh Kumar", customerPhone: "+91 98123 45678", date: "2026-07-10", timeSlot: "14:00-16:00", status: "pending" as BookingStatus, address: "45 Park Road, Sonipat", price: 799, notes: "" },
  { id: "pb-3", bookingNumber: "GB-DEMO03", serviceName: "Plant Installation", customerName: "Anita Mehta", customerPhone: "+91 99887 76655", date: "2026-07-07", timeSlot: "11:00-13:00", status: "completed" as BookingStatus, address: "78 Lake View, Sonipat", price: 299, notes: "5 plants to install" },
];

export default function ProviderBookingsPage() {
  const { bookings } = useBookings();
  const [filter, setFilter] = useState<BookingStatus | "all">("all");
  const [selected, setSelected] = useState<typeof MOCK_BOOKINGS[0] | null>(null);

  // Use mock bookings for demo (real bookings from context may be empty)
  const allBookings = MOCK_BOOKINGS;
  const filtered = filter === "all" ? allBookings : allBookings.filter((b) => b.status === filter);

  const handleAction = (id: string, action: string) => {
    appToast.success(action, `Booking ${id} updated to ${action}`);
    setSelected(null);
  };

  return (
    <Container className="py-6 md:py-8">
      <h1 className="text-2xl font-bold text-[#16382B] mb-6">My Bookings</h1>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {FILTERS.map((f) => <button key={f.value} onClick={() => setFilter(f.value)} className={cn("px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors", filter === f.value ? "bg-[#16382B] text-white" : "bg-white text-slate-700 border border-slate-200")}>{f.label}</button>)}
      </div>

      {/* Booking list */}
      <div className="space-y-3">
        {filtered.map((b) => (
          <div key={b.id} className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between gap-3 mb-2">
              <div><p className="text-sm font-bold text-slate-800">{b.bookingNumber}</p><p className="text-xs text-slate-500">{b.serviceName}</p></div>
              <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", BOOKING_STATUS_COLORS[b.status])}>{BOOKING_STATUS_LABELS[b.status]}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-600 mb-3">
              <div><span className="font-medium text-slate-700">Customer:</span> {b.customerName}</div>
              <div><span className="font-medium text-slate-700">Date:</span> {formatDate(b.date)}</div>
              <div><span className="font-medium text-slate-700">Time:</span> {b.timeSlot}</div>
              <div><span className="font-medium text-slate-700">Amount:</span> {formatINR(b.price)}</div>
            </div>
            <p className="text-xs text-slate-500 mb-3">📍 {b.address}</p>
            {b.notes && <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded mb-3">📝 {b.notes}</p>}
            <div className="flex flex-wrap gap-2">
              {b.status === "pending" && <Button size="sm" className="bg-[#16382B] hover:bg-[#A8843F] gap-1.5" onClick={() => handleAction(b.id, "Confirmed")}><CheckCircle2 className="size-3.5" />Confirm</Button>}
              {b.status === "confirmed" && <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white gap-1.5" onClick={() => handleAction(b.id, "In Progress")}><Play className="size-3.5" />Start Service</Button>}
              {b.status === "in_progress" && <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white gap-1.5" onClick={() => handleAction(b.id, "Completed")}><Camera className="size-3.5" />Complete + Upload Photos</Button>}
              {(b.status === "pending" || b.status === "confirmed") && <Button size="sm" variant="outline" className="border-red-500 text-red-500 gap-1.5" onClick={() => handleAction(b.id, "Cancelled")}><XCircle className="size-3.5" />Cancel</Button>}
              <Button size="sm" variant="outline" className="border-slate-300 text-slate-600 gap-1.5" onClick={() => setSelected(b)}><ChevronRight className="size-3.5" />Details</Button>
            </div>
          </div>
        ))}
      </div>

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full space-y-3" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-slate-900">{selected.bookingNumber}</h2>
            <div className="space-y-1 text-sm">
              <p><strong>Service:</strong> {selected.serviceName}</p>
              <p><strong>Customer:</strong> {selected.customerName}</p>
              <p><strong>Phone:</strong> {selected.customerPhone}</p>
              <p><strong>Date:</strong> {formatDate(selected.date)}</p>
              <p><strong>Time:</strong> {selected.timeSlot}</p>
              <p><strong>Address:</strong> {selected.address}</p>
              <p><strong>Amount:</strong> {formatINR(selected.price)}</p>
              {selected.notes && <p><strong>Notes:</strong> {selected.notes}</p>}
            </div>
            <Button variant="outline" className="w-full" onClick={() => setSelected(null)}>Close</Button>
          </div>
        </div>
      )}
    </Container>
  );
}
