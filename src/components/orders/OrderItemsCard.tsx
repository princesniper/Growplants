"use client";

/**
 * GrowPlants — OrderItemsCard (Premium Edition)
 * ============================================================================
 * Premium items section with:
 *   - Large product images (80px) with hover zoom
 *   - Product name + SKU (monospace)
 *   - Variant chips with color swatch
 *   - Quantity × unit price × item subtotal
 *   - Item status badge (for split shipments)
 *   - Subtotal footer with item count
 * ============================================================================
 */
import Link from "next/link";
import Image from "next/image";
import { cn, formatINR } from "@/lib/utils";
import { Package, ShoppingBag, Hash, Palette, Ruler, Box, CheckCircle2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  type Order,
  type OrderItem,
} from "@/contexts/OrdersContext";

interface OrderItemsCardProps {
  order: Order;
  className?: string;
}

function VariantChip({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: typeof Hash;
  color?: string;
}) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md shadow-sm">
      {color ? (
        <span
          className="size-2.5 rounded-full border border-slate-300 shrink-0"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
      ) : (
        <Icon className="size-2.5 text-slate-400 shrink-0" />
      )}
      <span className="font-semibold text-slate-500">{label}:</span>
      <span className="text-slate-800 font-medium">{value}</span>
    </span>
  );
}

function ItemRow({ item, index }: { item: OrderItem; index: number }) {
  const lineTotal = item.itemSubtotal ?? item.price * item.quantity;

  return (
    <div className="flex gap-3 sm:gap-4 items-start group">
      {/* Index number */}
      <span className="text-[10px] font-bold text-slate-300 tabular-nums shrink-0 mt-2 w-4">
        {String(index + 1).padStart(2, "0")}
      </span>

      {/* Product image */}
      <Link
        href={`/product/${item.slug}`}
        className="relative size-16 sm:size-20 rounded-xl overflow-hidden bg-slate-50 shrink-0 border border-slate-200 transition-transform group-hover:scale-105 shadow-sm"
      >
        {item.image ? (
          <Image
            src={item.image}
            alt={item.name}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Package className="size-8 text-slate-300" />
          </div>
        )}
      </Link>

      {/* Product info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/product/${item.slug}`}
              className="text-sm sm:text-base font-semibold text-slate-800 hover:text-[#16382B] line-clamp-1 transition-colors"
            >
              {item.name}
            </Link>

            {/* SKU */}
            {item.sku && (
              <div className="flex items-center gap-1 mt-0.5">
                <Hash className="size-3 text-slate-400" />
                <span className="text-[10px] text-slate-500 font-mono">{item.sku}</span>
              </div>
            )}

            {/* Variant chips */}
            {item.variant && (
              <div className="flex flex-wrap items-center gap-1 mt-1.5">
                {item.variant.size && (
                  <VariantChip label="Size" value={item.variant.size} icon={Ruler} />
                )}
                {item.variant.color && (
                  <VariantChip
                    label="Color"
                    value={item.variant.color}
                    icon={Palette}
                    color={getColorValue(item.variant.color)}
                  />
                )}
                {item.variant.model && (
                  <VariantChip label="Model" value={item.variant.model} icon={Box} />
                )}
                {item.variant.label && !item.variant.size && !item.variant.color && !item.variant.model && (
                  <VariantChip label="Variant" value={item.variant.label} icon={Package} />
                )}
              </div>
            )}
          </div>

          {/* Line total */}
          <div className="text-right shrink-0">
            <p className="text-sm sm:text-lg font-bold text-[#16382B] tabular-nums">
              {formatINR(lineTotal)}
            </p>
            {item.quantity > 1 && (
              <p className="text-[10px] sm:text-xs text-slate-400 tabular-nums">
                {formatINR(item.price)} × {item.quantity}
              </p>
            )}
          </div>
        </div>

        {/* Footer row: qty + price + item status */}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Qty:</span>
            <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-md bg-slate-100 text-slate-700 font-bold text-xs tabular-nums">
              {item.quantity}
            </span>
          </span>
          <span className="text-slate-300">·</span>
          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
            <span className="font-semibold text-slate-700">Unit Price:</span> {formatINR(item.price)}
          </span>
          {item.itemStatus && item.itemStatus !== "delivered" && (
            <>
              <span className="text-slate-300">·</span>
              <span
                className={cn(
                  "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                  ORDER_STATUS_COLORS[item.itemStatus],
                )}
              >
                {ORDER_STATUS_LABELS[item.itemStatus]}
              </span>
            </>
          )}
          {(!item.itemStatus || item.itemStatus === "delivered") && (
            <span className="inline-flex items-center gap-1 text-[10px] text-green-600 font-medium">
              <CheckCircle2 className="size-3" />
              {item.itemStatus === "delivered" ? "Delivered" : "Confirmed"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/** Map color name to CSS color value for swatch */
function getColorValue(colorName: string): string | undefined {
  const colorMap: Record<string, string> = {
    red: "#EF4444", blue: "#3B82F6", green: "#22C55E", yellow: "#EAB308",
    orange: "#F97316", purple: "#A855F7", pink: "#EC4899", black: "#000000",
    white: "#FFFFFF", gray: "#6B7280", grey: "#6B7280", brown: "#92400E",
    beige: "#E5D3B3", cream: "#FFFDD0", navy: "#1E3A8A", teal: "#14B8A6",
  };
  return colorMap[colorName.toLowerCase()] ?? undefined;
}

export function OrderItemsCard({ order, className }: OrderItemsCardProps) {
  const itemCount = order.items.length;
  const totalQuantity = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-slate-200 shadow-sm transition-all duration-300 hover:shadow-md overflow-hidden",
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-5 sm:p-6 pb-4 bg-gradient-to-r from-[#F3F8F1] to-transparent">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-[#16382B] flex items-center justify-center shadow-sm">
            <Package className="size-4 text-white" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-800">Order Items</h2>
            <p className="text-xs text-slate-500">
              {itemCount} {itemCount === 1 ? "item" : "items"} · {totalQuantity} {totalQuantity === 1 ? "unit" : "units"} total
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Subtotal</p>
          <p className="text-sm sm:text-base font-bold text-slate-800 tabular-nums">{formatINR(order.subtotal)}</p>
        </div>
      </div>

      <Separator />

      {/* Items list */}
      <div className="p-5 sm:p-6 pt-5 space-y-5">
        {order.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="size-16 rounded-full bg-slate-50 flex items-center justify-center mb-3">
              <ShoppingBag className="size-8 text-slate-300" />
            </div>
            <p className="text-sm text-slate-500">No items in this order</p>
          </div>
        ) : (
          order.items.map((item, i) => <ItemRow key={i} item={item} index={i} />)
        )}
      </div>
    </div>
  );
}
