"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { Container } from "@/components/common/Container";
import { Button } from "@/components/ui/button";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// Mock calendar bookings
const CALENDAR_BOOKINGS: Record<string, { time: string; service: string; customer: string; status: string }[]> = {
  "2026-07-09": [{ time: "09:00-11:00", service: "Balcony Garden Setup", customer: "Priya S.", status: "confirmed" }],
  "2026-07-10": [{ time: "14:00-16:00", service: "Garden Maintenance", customer: "Rajesh K.", status: "pending" }, { time: "16:00-18:00", service: "Lawn Care", customer: "Amit S.", status: "confirmed" }],
  "2026-07-12": [{ time: "11:00-13:00", service: "Plant Installation", customer: "Sneha R.", status: "confirmed" }],
  "2026-07-15": [{ time: "09:00-11:00", service: "Plant Health Inspection", customer: "Vikram G.", status: "pending" }],
};

export default function ProviderCalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 6, 1)); // July 2026
  const [selectedDate, setSelectedDate] = useState<string | null>("2026-07-09");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const dateKey = (day: number) => `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  return (
    <Container className="py-6 md:py-8">
      <h1 className="text-2xl font-bold text-[#16382B] mb-6">Calendar</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-800">{MONTHS[month]} {year}</h2>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" onClick={prevMonth} className="size-8 border-slate-200"><ChevronLeft className="size-4" /></Button>
              <Button variant="outline" size="icon" onClick={nextMonth} className="size-8 border-slate-200"><ChevronRight className="size-4" /></Button>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {DAYS.map((d) => <div key={d} className="text-center text-xs font-semibold text-slate-400 py-1">{d}</div>)}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const key = dateKey(day);
              const hasBookings = CALENDAR_BOOKINGS[key];
              const isSelected = selectedDate === key;
              return (
                <button key={day} onClick={() => setSelectedDate(key)} className={cn("aspect-square rounded-lg border text-sm font-medium transition-all relative", isSelected ? "bg-[#16382B] text-white border-[#16382B]" : hasBookings ? "bg-[#F3F8F1] border-[#16382B]/20 text-[#16382B] hover:border-[#16382B]" : "border-slate-100 text-slate-600 hover:bg-slate-50")}>
                  {day}
                  {hasBookings && <span className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">{hasBookings.map((_, j) => <span key={j} className={cn("size-1 rounded-full", isSelected ? "bg-white" : "bg-[#C6A15B]")} />)}</span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected date bookings */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-bold text-slate-800 mb-3">{selectedDate ? formatDate(selectedDate) : "Select a date"}</h3>
          {selectedDate && CALENDAR_BOOKINGS[selectedDate] ? (
            <div className="space-y-2">
              {CALENDAR_BOOKINGS[selectedDate].map((b, i) => (
                <div key={i} className="p-3 rounded-lg bg-[#F3F8F1] border border-[#16382B]/10">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-semibold text-[#16382B]">{b.time}</p>
                    <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", b.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700")}>{b.status}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-800">{b.service}</p>
                  <p className="text-xs text-slate-500">{b.customer}</p>
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-slate-400 text-center py-6">No bookings on this date</p>}
        </div>
      </div>
    </Container>
  );
}
