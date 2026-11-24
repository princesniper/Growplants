"use client";

/**
 * GrowPlants — DeliveryAddressCard
 * ============================================================================
 * Premium delivery address card showing:
 *   - Recipient name (prominent)
 *   - Phone number (with call link)
 *   - Full address (house, street, city, state, pincode)
 *   - GPS verified badge (if coordinates available)
 *   - Delivery instructions (if any)
 *
 * Features:
 *   - Map pin icon with brand color
 *   - Clickable phone number
 *   - GPS verification badge
 *   - Botanical-themed subtle accent
 * ============================================================================
 */
import { cn } from "@/lib/utils";
import { MapPin, Phone, Navigation, User, MessageSquare } from "lucide-react";
import type { Order } from "@/contexts/OrdersContext";

interface DeliveryAddressCardProps {
  order: Order;
  /** Optional GPS coordinates for verification badge */
  gpsVerified?: boolean;
  className?: string;
}

export function DeliveryAddressCard({
  order,
  gpsVerified = false,
  className,
}: DeliveryAddressCardProps) {
  const { address } = order;
  const fullAddress = [
    address.addressLine1,
    address.addressLine2,
    address.landmark ? `Near ${address.landmark}` : null,
    `${address.city}, ${address.state}`,
    address.pincode,
  ].filter(Boolean);

  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-md",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-5 sm:p-6 pb-3">
        <div className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-[#F3F8F1] flex items-center justify-center">
            <MapPin className="size-4 text-[#16382B]" />
          </div>
          <h3 className="text-sm sm:text-base font-bold text-slate-800">
            Delivery Address
          </h3>
        </div>
        {gpsVerified && (
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
            <Navigation className="size-3" />
            GPS Verified
          </span>
        )}
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      {/* Address content */}
      <div className="p-5 sm:p-6 pt-4 space-y-3">
        {/* Recipient name */}
        <div className="flex items-start gap-2.5">
          <div className="size-8 rounded-full bg-[#16382B]/10 flex items-center justify-center shrink-0 mt-0.5">
            <User className="size-4 text-[#16382B]" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-800">{address.fullName}</p>
            <a
              href={`tel:${address.phone}`}
              className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-[#16382B] transition-colors mt-0.5"
            >
              <Phone className="size-3" />
              {address.phone}
            </a>
          </div>
        </div>

        {/* Address lines */}
        <div className="flex items-start gap-2.5">
          <div className="size-8 rounded-full bg-[#16382B]/10 flex items-center justify-center shrink-0 mt-0.5">
            <MapPin className="size-4 text-[#16382B]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">
              Address
            </p>
            <p className="text-sm text-slate-700 leading-relaxed">
              {fullAddress.map((line, i) => (
                <span key={i}>
                  {line}
                  {i < fullAddress.length - 1 && <br />}
                </span>
              ))}
            </p>
          </div>
        </div>

        {/* Pincode highlight */}
        <div className="flex items-center justify-between p-3 bg-[#F3F8F1] rounded-lg">
          <div>
            <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">
              PIN Code
            </p>
            <p className="text-sm font-bold text-slate-800 tabular-nums">{address.pincode}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold">
              City / State
            </p>
            <p className="text-sm font-bold text-slate-800">
              {address.city}, {address.state}
            </p>
          </div>
        </div>

        {/* Delivery instructions (from order notes) */}
        {order.notes && (
          <div className="flex items-start gap-2.5">
            <div className="size-8 rounded-full bg-[#16382B]/10 flex items-center justify-center shrink-0 mt-0.5">
              <MessageSquare className="size-4 text-[#16382B]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-slate-400 uppercase tracking-wide font-semibold mb-1">
                Delivery Instructions
              </p>
              <p className="text-sm text-slate-600 italic leading-relaxed">
                &ldquo;{order.notes}&rdquo;
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
