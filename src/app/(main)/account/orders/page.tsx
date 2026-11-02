"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Package, ChevronRight, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/common/Container";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import {
  useOrders, ORDER_STATUS_LABELS, ORDER_STATUS_COLORS,
  PAYMENT_STATUS_LABELS, PAYMENT_STATUS_COLORS,
  type OrderStatus,
} from "@/contexts/OrdersContext";
import { formatINR, formatDate } from "@/lib/utils";

const FILTERS: { label: string; value: OrderStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Placed", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Preparing", value: "processing" },
  { label: "Quality Check", value: "quality_inspection" },
  { label: "Packed", value: "packed" },
  { label: "Shipped", value: "shipped" },
  { label: "Out For Delivery", value: "out_for_delivery" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

export default function OrdersPage() {
  const { orders } = useOrders();
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const filtered = filter === "all" ? orders : orders.filter((o) => o.orderStatus === filter);

  if (orders.length === 0) {
    return (
      <Container className="py-16">
        <EmptyState icon={ShoppingBag} title="No orders yet" description="When you place your first order, it will appear here with full tracking details." action={{ label: "Shop Plants", href: "/shop" }} size="lg" />
      </Container>
    );
  }

  return (
    <Container className="py-8 md:py-10">
      <h1 className="text-2xl font-bold text-[#16382B] mb-6">My Orders</h1>

      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
        {FILTERS.map((f) => (
          <button key={f.value} onClick={() => setFilter(f.value)} className={cn("px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors", filter === f.value ? "bg-[#16382B] text-white" : "bg-white text-slate-700 border border-slate-200 hover:border-[#16382B]/30")}>{f.label}</button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">No {filter} orders found.</p>
        ) : (
          filtered.map((order) => (
            <Link key={order.id} href={`/account/orders/${order.id}`} className="block bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-[#16382B]/20 transition-all">
              <div className="flex items-center justify-between gap-3 mb-2">
                <div>
                  <p className="text-sm font-bold text-slate-800">#{order.orderNumber}</p>
                  <p className="text-xs text-slate-500">Placed on {formatDate(order.createdAt)}</p>
                </div>
                <span className={cn("text-xs font-semibold px-2.5 py-1 rounded-full", ORDER_STATUS_COLORS[order.orderStatus])}>
                  {ORDER_STATUS_LABELS[order.orderStatus]}
                </span>
              </div>

              <div className="flex items-center gap-2 mb-3">
                {order.items.slice(0, 3).map((item, i) => (
                  <div key={i} className="relative size-10 rounded-lg overflow-hidden bg-slate-50 shrink-0">
                    {item.image && <Image src={item.image} alt={item.name} fill sizes="40px" className="object-cover" />}
                  </div>
                ))}
                {order.items.length > 3 && <span className="text-xs text-slate-500">+{order.items.length - 3} more</span>}
                <div className="flex-1" />
                <p className="text-sm font-bold text-[#16382B] tabular-nums">{formatINR(order.total)}</p>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  {order.items.length} {order.items.length === 1 ? "item" : "items"} · {order.paymentMethod === "cod" ? "COD" : "Paid Online"}
                  <span className={cn("font-semibold px-1.5 py-0.5 rounded-full", PAYMENT_STATUS_COLORS[order.paymentStatus])}>
                    {PAYMENT_STATUS_LABELS[order.paymentStatus]}
                  </span>
                </span>
                <span className="flex items-center gap-0.5 text-[#16382B] font-medium">View Details <ChevronRight className="size-3" /></span>
              </div>
            </Link>
          ))
        )}
      </div>
    </Container>
  );
}
