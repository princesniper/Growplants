"use client";

/**
 * GrowPlants — ProfessionalOrderDetail
 * ============================================================================
 * A single, cohesive, production-grade Order Detail component with 6 sections:
 *
 *   1. Order Header       — ID, date, color-coded status badge
 *   2. Status Tracker     — 8-step visual timeline (Order Journey)
 *   3. Customer & Shipping— name, phone, email, shipping + billing address
 *   4. Ordered Items      — image, name, variant, qty, price, subtotal
 *   5. Price Summary      — subtotal, discount, delivery, GST, grand total
 *   6. Action Buttons     — Track, Cancel/Return, Reorder, Support
 *
 * Removed per user request:
 *   - Delivery Information section (courier, tracking#, ETA)
 *   - Payment Details section (method, status, transaction ID)
 *   - Invoice button
 *   - Tracking Number
 *
 * Order Journey status is fetched from Firebase in real-time
 * (via onUserOrderSnapshot in OrderTrackingClientWrapper).
 * ============================================================================
 */
import { cn, formatINR, formatDate } from "@/lib/utils";
import Link from "next/link";
import Image from "next/image";
import {
  Hash, Calendar, Clock, Package, CheckCircle2, XCircle, Truck, AlertCircle,
  User, Phone, Mail, MapPin, Home, CreditCard, IndianRupee, RotateCcw,
  MessageCircle, Headphones, Sparkles, Leaf,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  type Order,
} from "@/contexts/OrdersContext";
import { OrderTimeline } from "@/components/orders/timeline";

interface ProfessionalOrderDetailProps {
  order: Order;
  onCancel?: () => void;
  onReturn?: () => void;
  onReorder?: () => void;
  className?: string;
}

/* ============================================================================
 * Status icon resolver
 * ============================================================================ */
function getStatusIcon(status: Order["orderStatus"]) {
  switch (status) {
    case "delivered": return CheckCircle2;
    case "cancelled": return XCircle;
    case "shipped":
    case "out_for_delivery": return Truck;
    case "pending":
    case "payment_confirmed":
    case "confirmed": return Clock;
    case "returned":
    case "refunded":
    case "failed": return AlertCircle;
    default: return Package;
  }
}

/* ============================================================================
 * Reusable Section wrapper — consistent header + content
 * ============================================================================ */
function Section({
  icon: Icon,
  title,
  action,
  children,
  className,
}: {
  icon: typeof Hash;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "bg-paper rounded-2xl border border-line shadow-sm overflow-hidden transition-shadow hover:shadow-md",
        className,
      )}
    >
      <header className="flex items-center justify-between gap-3 px-5 sm:px-6 py-4 bg-gradient-to-r from-sage-wash to-transparent">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="size-9 rounded-[18px] bg-pine flex items-center justify-center shadow-sm shrink-0">
            <Icon className="size-4 text-white" strokeWidth={2.2} />
          </div>
          <h2 className="font-display text-base text-ink truncate">{title}</h2>
        </div>
        {action}
      </header>
      <div className="px-5 sm:px-6 py-4">{children}</div>
    </section>
  );
}

/* ============================================================================
 * MAIN COMPONENT
 * ============================================================================ */
export function ProfessionalOrderDetail({
  order,
  onCancel,
  onReturn,
  onReorder,
  className,
}: ProfessionalOrderDetailProps) {
  const placedDate = new Date(order.createdAt);
  const dateStr = formatDate(order.createdAt);
  const timeStr = placedDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

  const StatusIcon = getStatusIcon(order.orderStatus);
  const isDelivered = order.orderStatus === "delivered";
  const isCancelled = order.orderStatus === "cancelled";
  const isShipped = ["shipped", "out_for_delivery"].includes(order.orderStatus);

  const canCancel = ["pending", "confirmed", "payment_confirmed"].includes(order.orderStatus);
  const canReturn = isDelivered && order.statusHistory.find((s) => s.status === "delivered")
    ? Date.now() - new Date(order.statusHistory.find((s) => s.status === "delivered")!.date).getTime() < 7 * 24 * 60 * 60 * 1000
    : false;
  const canReorder = isDelivered || isCancelled;

  // Compute GST split
  const gstTotal = order.tax ?? 0;
  const cgst = Math.round(gstTotal / 2);
  const sgst = gstTotal - cgst;

  return (
    <div className={cn("space-y-5", className)}>
      {/* ═══════════════════════════════════════════════════════════════
          SECTION 1: ORDER HEADER (status hero)
          ═══════════════════════════════════════════════════════════════ */}
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border shadow-sm",
          isDelivered && "bg-gradient-to-br from-sage-wash via-paper to-sage-wash border-moss/25",
          isCancelled && "bg-gradient-to-br from-clay/60 via-paper to-clay/40 border-terracotta/30",
          isShipped && "bg-gradient-to-br from-gold-tint/70 via-paper to-gold-tint/40 border-brass/30",
          !isDelivered && !isCancelled && !isShipped && "bg-gradient-to-br from-gold-tint/70 via-paper to-gold-tint/40 border-brass/30",
        )}
      >
        <Leaf className="absolute -top-6 -right-6 size-40 text-pine/5 rotate-12" aria-hidden="true" />

        <div className="relative p-5 sm:p-7">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            {/* Left: Order ID + date */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <div className="size-10 rounded-[18px] bg-pine flex items-center justify-center shadow-sm">
                  <Hash className="size-5 text-white" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[10px] text-ink-soft/60 uppercase tracking-wider font-semibold">Order Number</p>
                  <h1 className="font-display text-xl sm:text-2xl text-pine tracking-tight leading-none">
                    {order.orderNumber}
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-ink-soft ml-12">
                <Calendar className="size-3.5" />
                <span>{dateStr}</span>
                <span className="text-line">·</span>
                <Clock className="size-3.5" />
                <span>{timeStr}</span>
              </div>
            </div>

            {/* Right: Status badge + Live */}
            <div className="flex flex-col items-end gap-2">
              {!isDelivered && !isCancelled && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-paper/80 backdrop-blur border border-line">
                  <span className="relative flex size-2">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-moss opacity-75 animate-ping" />
                    <span className="relative inline-flex size-2 rounded-full bg-sage-wash0" />
                  </span>
                  <span className="text-[10px] font-bold text-ink-soft uppercase tracking-wide">Live</span>
                </div>
              )}
              <span className={cn("inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-full shadow-sm", ORDER_STATUS_COLORS[order.orderStatus])}>
                <StatusIcon className="size-4" />
                {ORDER_STATUS_LABELS[order.orderStatus]}
              </span>
            </div>
          </div>

          {/* Quick stats */}
          <div className="mt-5 pt-5 border-t border-line/60 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-[10px] text-ink-soft/60 uppercase tracking-wider font-semibold flex items-center gap-1"><Package className="size-3" /> Items</p>
              <p className="text-sm font-bold text-ink">{order.items.length} {order.items.length === 1 ? "item" : "items"}</p>
            </div>
            <div>
              <p className="text-[10px] text-ink-soft/60 uppercase tracking-wider font-semibold flex items-center gap-1"><CreditCard className="size-3" /> Payment</p>
              <p className="text-sm font-bold text-ink">{order.paymentMethod === "cod" ? "COD" : "Online"}</p>
            </div>
            <div>
              <p className="text-[10px] text-ink-soft/60 uppercase tracking-wider font-semibold flex items-center gap-1"><Sparkles className="size-3" /> Pay Status</p>
              <span className={cn("inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full", PAYMENT_STATUS_COLORS[order.paymentStatus])}>
                {PAYMENT_STATUS_LABELS[order.paymentStatus]}
              </span>
            </div>
            <div>
              <p className="text-[10px] text-ink-soft/60 uppercase tracking-wider font-semibold flex items-center gap-1"><IndianRupee className="size-3" /> Total</p>
              <p className="text-base font-bold text-pine tabular-nums">{formatINR(order.total)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 2: ORDER JOURNEY (visual timeline)
          Status fetched from Firebase in real-time via onUserOrderSnapshot.
          Admin panel (separate website) updates the `status` field in
          Firestore → onSnapshot fires → timeline re-renders automatically.
          ═══════════════════════════════════════════════════════════════ */}
      <OrderTimeline
        order={order}
        estimatedDelivery={new Date(new Date(order.createdAt).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString()}
        estimatedDeliveryTime="10:00 AM – 6:00 PM"
      />

      {/* ═══════════════════════════════════════════════════════════════
          MAIN GRID: 2 columns on desktop
          Left: Ordered Items
          Right: Customer & Shipping + Price Summary
          ═══════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ═════ LEFT COLUMN (2/3) ═════ */}
        <div className="lg:col-span-2 space-y-5">

          {/* ───── SECTION 4: ORDERED ITEMS ───── */}
          <Section icon={Package} title="Ordered Items" action={
            <div className="text-right">
              <p className="text-[10px] text-ink-soft/60 uppercase tracking-wider font-semibold">Subtotal</p>
              <p className="text-sm font-bold text-ink tabular-nums">{formatINR(order.subtotal)}</p>
            </div>
          }>
            <div className="space-y-4">
              {order.items.map((item, i) => {
                const lineTotal = item.itemSubtotal ?? item.price * item.quantity;
                return (
                  <div key={i} className="flex gap-3 sm:gap-4 items-start group">
                    <span className="text-[10px] font-bold text-line tabular-nums shrink-0 mt-2 w-4">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <Link href={`/product/${item.slug}`} className="relative size-16 sm:size-20 rounded-[18px] overflow-hidden bg-stone shrink-0 border border-line transition-transform group-hover:scale-105 shadow-sm">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
                      ) : (
                        <div className="flex items-center justify-center h-full"><Package className="size-8 text-line" /></div>
                      )}
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link href={`/product/${item.slug}`} className="text-sm sm:text-base font-semibold text-ink hover:text-pine line-clamp-1 transition-colors">
                            {item.name}
                          </Link>
                          {item.sku && (
                            <div className="flex items-center gap-1 mt-0.5">
                              <Hash className="size-3 text-ink-soft/60" />
                              <span className="text-[10px] text-ink-soft font-mono">{item.sku}</span>
                            </div>
                          )}
                          {item.variant && (
                            <div className="flex flex-wrap items-center gap-1 mt-1.5">
                              {item.variant.size && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-ink-soft bg-paper border border-line px-2 py-0.5 rounded-md shadow-sm">
                                  <span className="font-semibold text-ink-soft">Size:</span>
                                  <span className="text-ink font-medium">{item.variant.size}</span>
                                </span>
                              )}
                              {item.variant.color && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-ink-soft bg-paper border border-line px-2 py-0.5 rounded-md shadow-sm">
                                  <span className="font-semibold text-ink-soft">Color:</span>
                                  <span className="text-ink font-medium">{item.variant.color}</span>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm sm:text-lg font-bold text-pine tabular-nums">{formatINR(lineTotal)}</p>
                          {item.quantity > 1 && (
                            <p className="text-[10px] sm:text-xs text-ink-soft/60 tabular-nums">{formatINR(item.price)} × {item.quantity}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="inline-flex items-center gap-1 text-xs text-ink-soft">
                          <span className="font-semibold text-ink">Qty:</span>
                          <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-md bg-stone text-ink font-bold text-xs tabular-nums">{item.quantity}</span>
                        </span>
                        <span className="text-line">·</span>
                        <span className="inline-flex items-center gap-1 text-xs text-ink-soft">
                          <span className="font-semibold text-ink">Unit Price:</span> {formatINR(item.price)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Section>
        </div>

        {/* ═════ RIGHT COLUMN (1/3) ═════ */}
        <div className="lg:col-span-1 space-y-5">

          {/* ───── SECTION 3: CUSTOMER & SHIPPING ───── */}
          <Section icon={User} title="Customer & Shipping">
            <div className="space-y-4">
              {/* Customer identity */}
              <div className="flex items-start gap-2.5">
                <div className="size-9 rounded-full bg-pine text-white flex items-center justify-center shrink-0 text-xs font-bold">
                  {order.address.fullName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-ink">{order.address.fullName}</p>
                  <div className="flex flex-col gap-0.5 mt-0.5">
                    <a href={`tel:${order.address.phone}`} className="inline-flex items-center gap-1 text-xs text-ink-soft hover:text-pine transition-colors">
                      <Phone className="size-3" /> {order.address.phone}
                    </a>
                    {order.address.email && (
                      <a href={`mailto:${order.address.email}`} className="inline-flex items-center gap-1 text-xs text-ink-soft hover:text-pine transition-colors">
                        <Mail className="size-3" /> <span className="truncate">{order.address.email}</span>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="h-px bg-stone" />

              {/* Shipping address */}
              <div>
                <p className="text-[10px] text-ink-soft/60 uppercase tracking-wider font-semibold mb-1.5 flex items-center gap-1">
                  <Home className="size-3" /> Shipping Address
                </p>
                <div className="flex items-start gap-2">
                  <MapPin className="size-3.5 text-ink-soft/60 shrink-0 mt-0.5" />
                  <p className="text-xs text-ink-soft leading-relaxed">
                    {order.address.addressLine1}
                    {order.address.addressLine2 ? `, ${order.address.addressLine2}` : ""}
                    {order.address.landmark ? `, Near ${order.address.landmark}` : ""}
                    <br />
                    <span className="font-medium text-ink">{order.address.city}, {order.address.state} - {order.address.pincode}</span>
                  </p>
                </div>
              </div>

              {/* Billing address */}
              {order.billingAddress ? (
                <div>
                  <p className="text-[10px] text-ink-soft/60 uppercase tracking-wider font-semibold mb-1.5 flex items-center gap-1">
                    <CreditCard className="size-3" /> Billing Address
                  </p>
                  <div className="flex items-start gap-2">
                    <MapPin className="size-3.5 text-ink-soft/60 shrink-0 mt-0.5" />
                    <p className="text-xs text-ink-soft leading-relaxed">
                      {order.billingAddress.addressLine1}, {order.billingAddress.city}, {order.billingAddress.state} - {order.billingAddress.pincode}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-ink-soft italic flex items-center gap-1">
                  <CheckCircle2 className="size-3 text-moss" /> Billing address same as shipping
                </p>
              )}
            </div>
          </Section>

          {/* ───── SECTION 5: PRICE SUMMARY ───── */}
          <Section icon={IndianRupee} title="Price Summary">
            <div className="space-y-2.5">
              <div className="flex justify-between text-sm">
                <span className="text-ink-soft">Items Subtotal</span>
                <span className="font-medium text-ink tabular-nums">{formatINR(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-moss">Discount</span>
                  <span className="font-medium text-moss tabular-nums">−{formatINR(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-ink-soft">Delivery Fee</span>
                <span className="font-medium text-ink tabular-nums">
                  {order.shipping === 0 ? <span className="text-moss font-bold">FREE</span> : formatINR(order.shipping)}
                </span>
              </div>
              {order.tax > 0 && (
                <>
                  <div className="flex justify-between text-xs text-ink-soft pl-2"><span>CGST (9%)</span><span className="tabular-nums">{formatINR(cgst)}</span></div>
                  <div className="flex justify-between text-xs text-ink-soft pl-2"><span>SGST (9%)</span><span className="tabular-nums">{formatINR(sgst)}</span></div>
                </>
              )}
            </div>
            <Separator className="my-3" />
            <div className="flex items-center justify-between p-3 bg-sage-wash rounded-[18px] border border-pine/10">
              <span className="text-sm font-bold text-ink">Grand Total</span>
              <span className="font-display text-xl text-pine tabular-nums">{formatINR(order.total)}</span>
            </div>
          </Section>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 6: ACTION BUTTONS (no Invoice, no Track)
          ═══════════════════════════════════════════════════════════════ */}
      <Section icon={Headphones} title="Order Actions">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {/* Cancel / Return */}
          {canCancel && onCancel && (
            <Button variant="outline" onClick={onCancel} className="border-terracotta/40 text-terracotta hover:bg-terracotta/10 gap-2 text-sm h-11">
              <XCircle className="size-4" /> Cancel
            </Button>
          )}
          {canReturn && onReturn && (
            <Button variant="outline" onClick={onReturn} className="border-terracotta/40 text-terracotta hover:bg-terracotta/10 gap-2 text-sm h-11">
              <RotateCcw className="size-4" /> Return
            </Button>
          )}

          {/* Reorder */}
          {canReorder && onReorder && (
            <Button variant="outline" onClick={onReorder} className="border-pine/30 text-pine hover:bg-sage-wash gap-2 text-sm h-11">
              <RotateCcw className="size-4" /> Reorder
            </Button>
          )}

          {/* WhatsApp */}
          <a href="https://wa.me/919999999999" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-[#25D366] text-[#25D366] hover:bg-[#25D366]/10 text-sm font-semibold transition-colors h-11">
            <MessageCircle className="size-4" /> WhatsApp
          </a>

          {/* Call */}
          <a href="tel:+919999999999" className="inline-flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border border-line text-ink-soft hover:border-pine hover:text-pine text-sm font-semibold transition-colors h-11">
            <Phone className="size-4" /> Call
          </a>
        </div>

        <div className="mt-4 p-3 bg-sage-wash rounded-[18px] border border-pine/10">
          <p className="text-xs text-ink-soft leading-relaxed">
            <span className="font-bold text-ink">Need help?</span> Our support team is available <span className="font-bold text-pine">9 AM – 9 PM</span>, all days. Average response time: <span className="font-bold text-pine">under 10 minutes</span> on WhatsApp.
          </p>
        </div>
      </Section>
    </div>
  );
}
