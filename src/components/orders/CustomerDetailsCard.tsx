"use client";

/**
 * GrowPlants — CustomerDetailsCard (Premium Edition)
 * ============================================================================
 * Premium customer details with:
 *   - Customer hero card (avatar, name, phone, email)
 *   - Shipping address card (with GPS verified badge)
 *   - Billing address card (if different from shipping)
 *   - "Same as shipping" indicator
 *   - Clickable phone + email links
 * ============================================================================
 */
import { cn } from "@/lib/utils";
import {
  User, Phone, Mail, MapPin, Home, Navigation, CheckCircle2, CreditCard,
} from "lucide-react";
import type { Order, OrderAddress } from "@/contexts/OrdersContext";

interface CustomerDetailsCardProps {
  order: Order;
  className?: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function AddressCard({
  address,
  title,
  icon: Icon,
  showGpsBadge = false,
}: {
  address: OrderAddress;
  title: string;
  icon: typeof MapPin;
  showGpsBadge?: boolean;
}) {
  const hasGps = address.latitude != null && address.longitude != null;

  return (
    <div className={cn(
      "rounded-xl border p-4 space-y-3 transition-all",
      showGpsBadge && hasGps
        ? "bg-[#F3F8F1] border-[#16382B]/20"
        : "bg-slate-50 border-slate-200",
    )}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className="size-4 text-[#16382B]" />
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">{title}</h4>
        </div>
        {showGpsBadge && hasGps && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
            <Navigation className="size-2.5" />
            GPS Verified
          </span>
        )}
      </div>

      {/* Recipient */}
      <div className="flex items-start gap-2.5">
        <div className="size-8 rounded-full bg-[#16382B] text-white flex items-center justify-center shrink-0 text-xs font-bold">
          {getInitials(address.fullName || "U")}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-slate-800">{address.fullName}</p>
          <div className="flex flex-col gap-0.5 mt-0.5">
            <a
              href={`tel:${address.phone}`}
              className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-[#16382B] transition-colors"
            >
              <Phone className="size-3" />
              {address.phone}
            </a>
            {address.email && (
              <a
                href={`mailto:${address.email}`}
                className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-[#16382B] transition-colors"
              >
                <Mail className="size-3" />
                <span className="truncate">{address.email}</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="flex items-start gap-2.5 pt-2 border-t border-slate-200/60">
        <MapPin className="size-4 text-slate-400 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600 leading-relaxed">
          {address.addressLine1}
          {address.addressLine2 ? `, ${address.addressLine2}` : ""}
          {address.landmark ? `, Near ${address.landmark}` : ""}
          <br />
          <span className="font-medium text-slate-700">
            {address.city}, {address.state} - {address.pincode}
          </span>
        </p>
      </div>
    </div>
  );
}

export function CustomerDetailsCard({ order, className }: CustomerDetailsCardProps) {
  const hasBillingAddress = Boolean(order.billingAddress);
  const billingSameAsShipping = hasBillingAddress
    ? JSON.stringify(order.billingAddress) === JSON.stringify(order.address)
    : true;

  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-md overflow-hidden",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-5 sm:p-6 pb-3">
        <div className="size-9 rounded-xl bg-[#16382B] flex items-center justify-center shadow-sm">
          <User className="size-4 text-white" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-slate-800">Customer Details</h3>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      <div className="p-5 sm:p-6 pt-4 space-y-4">
        {/* Shipping + Billing addresses */}
        {hasBillingAddress && !billingSameAsShipping ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AddressCard
              address={order.address}
              title="Shipping Address"
              icon={Home}
              showGpsBadge
            />
            <AddressCard
              address={order.billingAddress!}
              title="Billing Address"
              icon={CreditCard}
            />
          </div>
        ) : (
          <div className="space-y-3">
            <AddressCard
              address={order.address}
              title="Shipping Address"
              icon={Home}
              showGpsBadge
            />
            <div className="flex items-center gap-1.5 text-xs text-slate-500 italic pt-1">
              <CheckCircle2 className="size-3.5 text-green-500" />
              <span>Billing address same as shipping</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
