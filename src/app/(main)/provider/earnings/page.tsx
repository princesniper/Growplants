"use client";

import { Container } from "@/components/common/Container";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { IndianRupee, TrendingUp, Download, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatINR, formatDate } from "@/lib/utils";
import { appToast } from "@/lib/toast";

interface EarningEntry { id: string; bookingNumber: string; serviceName: string; date: string; grossAmount: number; commissionPercent: number; commissionAmount: number; netAmount: number; status: "pending" | "processed"; }

const EARNINGS: EarningEntry[] = [
  { id: "e1", bookingNumber: "GB-DEMO01", serviceName: "Balcony Garden Setup", date: "2026-07-09", grossAmount: 1499, commissionPercent: 20, commissionAmount: 300, netAmount: 1199, status: "pending" },
  { id: "e2", bookingNumber: "GB-DEMO02", serviceName: "Garden Maintenance", date: "2026-07-10", grossAmount: 799, commissionPercent: 20, commissionAmount: 160, netAmount: 639, status: "pending" },
  { id: "e3", bookingNumber: "GB-DEMO03", serviceName: "Plant Installation", date: "2026-07-07", grossAmount: 299, commissionPercent: 20, commissionAmount: 60, netAmount: 239, status: "processed" },
  { id: "e4", bookingNumber: "GB-DEMO04", serviceName: "Lawn Care", date: "2026-07-05", grossAmount: 499, commissionPercent: 20, commissionAmount: 100, netAmount: 399, status: "processed" },
  { id: "e5", bookingNumber: "GB-DEMO05", serviceName: "Garden Maintenance", date: "2026-07-03", grossAmount: 799, commissionPercent: 20, commissionAmount: 160, netAmount: 639, status: "processed" },
];

const PAYOUTS = [
  { id: "p1", date: "2026-07-01", amount: 3200, method: "NEFT", status: "Completed" },
  { id: "p2", date: "2026-06-15", amount: 2800, method: "UPI", status: "Completed" },
  { id: "p3", date: "2026-06-01", amount: 4500, method: "NEFT", status: "Completed" },
];

export default function ProviderEarningsPage() {
  const pendingEarnings = EARNINGS.filter((e) => e.status === "pending").reduce((sum, e) => sum + e.netAmount, 0);
  const totalEarnings = EARNINGS.reduce((sum, e) => sum + e.netAmount, 0);
  const processedEarnings = EARNINGS.filter((e) => e.status === "processed").reduce((sum, e) => sum + e.netAmount, 0);

  const stats = [
    { label: "Pending Payout", value: formatINR(pendingEarnings), icon: Wallet, color: "bg-amber-50 text-amber-600" },
    { label: "Processed", value: formatINR(processedEarnings), icon: TrendingUp, color: "bg-green-50 text-green-600" },
    { label: "Total Earnings", value: formatINR(totalEarnings), icon: IndianRupee, color: "bg-blue-50 text-blue-600" },
  ];

  return (
    <Container className="py-6 md:py-8">
      <h1 className="text-2xl font-bold text-[#16382B] mb-6">Earnings & Payouts</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4">
            <div className={cn("size-10 rounded-lg flex items-center justify-center mb-2", s.color)}><s.icon className="size-5" /></div>
            <p className="text-xl font-bold text-slate-800 tabular-nums">{s.value}</p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Request payout */}
      <div className="bg-gradient-to-r from-[#16382B] to-[#A8843F] text-white rounded-xl p-5 mb-6 flex items-center justify-between">
        <div><p className="text-sm text-white/80">Available for Payout</p><p className="text-2xl font-bold tabular-nums">{formatINR(pendingEarnings)}</p></div>
        <Button onClick={() => appToast.success("Payout requested", "We'll process your payout within 3-5 business days")} className="bg-white text-[#16382B] hover:bg-white/90">Request Payout</Button>
      </div>

      {/* Earnings table */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
        <div className="flex items-center justify-between mb-4"><h2 className="text-base font-bold text-slate-800">Earnings Breakdown</h2><Button variant="outline" size="sm" className="border-slate-300 text-slate-600 gap-1.5"><Download className="size-3.5" />Export</Button></div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-100"><th className="text-left py-2 px-2 font-semibold text-slate-500 text-xs">Booking</th><th className="text-left py-2 px-2 font-semibold text-slate-500 text-xs">Date</th><th className="text-right py-2 px-2 font-semibold text-slate-500 text-xs">Gross</th><th className="text-right py-2 px-2 font-semibold text-slate-500 text-xs">Commission (20%)</th><th className="text-right py-2 px-2 font-semibold text-slate-500 text-xs">Net</th><th className="text-center py-2 px-2 font-semibold text-slate-500 text-xs">Status</th></tr></thead>
            <tbody>
              {EARNINGS.map((e) => (
                <tr key={e.id} className="border-b border-slate-50">
                  <td className="py-2 px-2"><p className="font-medium text-slate-800">{e.serviceName}</p><p className="text-xs text-slate-400">{e.bookingNumber}</p></td>
                  <td className="py-2 px-2 text-slate-600">{formatDate(e.date)}</td>
                  <td className="py-2 px-2 text-right text-slate-600 tabular-nums">{formatINR(e.grossAmount)}</td>
                  <td className="py-2 px-2 text-right text-red-500 tabular-nums">-{formatINR(e.commissionAmount)}</td>
                  <td className="py-2 px-2 text-right font-bold text-[#16382B] tabular-nums">{formatINR(e.netAmount)}</td>
                  <td className="py-2 px-2 text-center"><span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", e.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700")}>{e.status === "pending" ? "Pending" : "Paid"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout history */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h2 className="text-base font-bold text-slate-800 mb-4">Payout History</h2>
        <div className="space-y-2">
          {PAYOUTS.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-2 p-3 rounded-lg bg-slate-50">
              <div><p className="text-sm font-medium text-slate-800">{formatINR(p.amount)}</p><p className="text-xs text-slate-500">{formatDate(p.date)} · {p.method}</p></div>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">{p.status}</span>
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
}
