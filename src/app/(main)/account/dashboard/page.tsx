"use client";

import Link from "next/link";
import { Package, Calendar, Heart, ShoppingBag, TrendingUp, ArrowRight, MapPin } from "lucide-react";
import { Container } from "@/components/common/Container";
import { useAuth } from "@/contexts/AuthContext";
import { useOrders } from "@/contexts/OrdersContext";
import { useBookings } from "@/contexts/BookingsContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { formatINR, formatDate } from "@/lib/utils";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from "@/contexts/OrdersContext";
import { BOOKING_STATUS_LABELS, BOOKING_STATUS_COLORS } from "@/contexts/BookingsContext";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const STORAGE_KEY = "growplants-addresses";

export default function DashboardPage() {
  const { user } = useAuth();
  const { orders } = useOrders();
  const { bookings } = useBookings();
  const { count: wishlistCount } = useWishlist();
  const [addressCount, setAddressCount] = useState(0);

  useEffect(() => {
    try { const list = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); setAddressCount(Array.isArray(list) ? list.length : 0); } catch (_e) {}
  }, []);

  const totalSpent = orders.filter((o) => o.orderStatus !== "cancelled").reduce((sum, o) => sum + o.total, 0);
  const activeOrders = orders.filter((o) => !["delivered", "cancelled"].includes(o.orderStatus)).length;
  const activeBookings = bookings.filter((b) => !["completed", "cancelled"].includes(b.status)).length;

  const stats = [
    { label: "Total Orders", value: orders.length, icon: Package, color: "bg-blue-50 text-blue-600" },
    { label: "Active Orders", value: activeOrders, icon: ShoppingBag, color: "bg-amber-50 text-amber-600" },
    { label: "Total Bookings", value: bookings.length, icon: Calendar, color: "bg-purple-50 text-purple-600" },
    { label: "Wishlist Items", value: wishlistCount, icon: Heart, color: "bg-red-50 text-red-500" },
  ];

  return (
    <Container className="py-6 md:py-8">
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#16382B]">Welcome back, {user?.fullName?.split(" ")[0] ?? "Guest"}!</h1>
        <p className="text-sm text-slate-500 mt-1">Here&apos;s what&apos;s happening with your account.</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white border border-slate-200 rounded-xl p-4">
            <div className={cn("size-10 rounded-lg flex items-center justify-center mb-2", stat.color)}>
              <stat.icon className="size-5" />
            </div>
            <p className="text-2xl font-bold text-slate-800 tabular-nums">{stat.value}</p>
            <p className="text-xs text-slate-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Total spent */}
      {totalSpent > 0 && (
        <div className="bg-gradient-to-r from-[#16382B] to-[#A8843F] text-white rounded-xl p-5 mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-white/80">Total Spent on GrowPlants</p>
            <p className="text-2xl font-bold tabular-nums">{formatINR(totalSpent)}</p>
          </div>
          <TrendingUp className="size-10 text-white/40" />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent orders */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-800">Recent Orders</h2>
            <Link href="/account/orders" className="text-xs font-medium text-[#16382B] hover:underline flex items-center gap-0.5">View All <ArrowRight className="size-3" /></Link>
          </div>
          {orders.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No orders yet</p>
          ) : (
            <div className="space-y-2">
              {orders.slice(0, 3).map((o) => (
                <Link key={o.id} href={`/account/orders/${o.id}`} className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{o.orderNumber}</p>
                    <p className="text-xs text-slate-500">{formatDate(o.createdAt)} · {o.items.length} items</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", ORDER_STATUS_COLORS[o.orderStatus])}>{ORDER_STATUS_LABELS[o.orderStatus]}</span>
                    <span className="text-sm font-bold text-[#16382B] tabular-nums">{formatINR(o.total)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent bookings */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-800">Recent Bookings</h2>
            <Link href="/account/bookings" className="text-xs font-medium text-[#16382B] hover:underline flex items-center gap-0.5">View All <ArrowRight className="size-3" /></Link>
          </div>
          {bookings.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No bookings yet</p>
          ) : (
            <div className="space-y-2">
              {bookings.slice(0, 3).map((b) => (
                <Link key={b.id} href={`/account/bookings/${b.id}`} className="flex items-center justify-between gap-2 p-2 rounded-lg hover:bg-slate-50 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{b.service.serviceName}</p>
                    <p className="text-xs text-slate-500">{b.bookingNumber} · {formatDate(b.date)}</p>
                  </div>
                  <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full shrink-0", BOOKING_STATUS_COLORS[b.status])}>{BOOKING_STATUS_LABELS[b.status]}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        <Link href="/shop" className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#16382B] text-white text-sm font-medium rounded-lg hover:bg-[#A8843F] transition-colors"><ShoppingBag className="size-4" />Shop Plants</Link>
        <Link href="/services" className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-[#16382B] text-[#16382B] text-sm font-medium rounded-lg hover:bg-[#F3F8F1] transition-colors"><Calendar className="size-4" />Book a Service</Link>
        <Link href="/account/wishlist" className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"><Heart className="size-4" />View Wishlist</Link>
        <Link href="/account/addresses" className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"><MapPin className="size-4" />Addresses ({addressCount})</Link>
      </div>
    </Container>
  );
}
