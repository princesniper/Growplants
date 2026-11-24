"use client";

/**
 * GrowPlants — PaymentSummaryCard (Premium Edition)
 * ============================================================================
 * Premium payment summary with:
 *   - Payment method hero card (colored background + icon)
 *   - Payment status badge with icon
 *   - Transaction ID (monospace, copyable)
 *   - Coupon code badge (if applied)
 *   - Detailed price breakdown with GST split (CGST + SGST)
 *   - Grand total hero (large, brand color)
 *   - Conditional notices (COD, refund, failed)
 * ============================================================================
 */
import { cn, formatINR } from "@/lib/utils";
import {
  CreditCard, Wallet, Banknote, Smartphone, Building2, Landmark,
  CheckCircle2, Clock, XCircle, RefreshCw, IndianRupee, Tag, Hash, Copy,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import {
  PAYMENT_STATUS_LABELS,
  PAYMENT_STATUS_COLORS,
  type Order,
  type PaymentStatus,
  type PaymentMethod,
} from "@/contexts/OrdersContext";

interface PaymentSummaryCardProps {
  order: Order;
  className?: string;
}

const PAYMENT_METHOD_CONFIG: Record<PaymentMethod, {
  icon: typeof CreditCard;
  label: string;
  description: string;
  color: string;
  bg: string;
  borderColor: string;
}> = {
  cod: {
    icon: Banknote,
    label: "Cash on Delivery",
    description: "Pay with cash when your order arrives",
    color: "text-amber-600",
    bg: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  card: {
    icon: CreditCard,
    label: "Credit / Debit Card",
    description: "Visa, Mastercard, RuPay, Amex",
    color: "text-blue-600",
    bg: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  upi: {
    icon: Smartphone,
    label: "UPI Payment",
    description: "GPay, PhonePe, Paytm, BHIM",
    color: "text-purple-600",
    bg: "bg-purple-50",
    borderColor: "border-purple-200",
  },
  netbanking: {
    icon: Building2,
    label: "Net Banking",
    description: "All major banks supported",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
    borderColor: "border-indigo-200",
  },
  wallet: {
    icon: Wallet,
    label: "Wallet Payment",
    description: "Paytm, Mobikwik, Amazon Pay",
    color: "text-teal-600",
    bg: "bg-teal-50",
    borderColor: "border-teal-200",
  },
  razorpay: {
    icon: Landmark,
    label: "Online Payment (Razorpay)",
    description: "UPI / Card / Net Banking via Razorpay",
    color: "text-blue-600",
    bg: "bg-blue-50",
    borderColor: "border-blue-200",
  },
};

const PAYMENT_STATUS_ICON: Record<PaymentStatus, typeof CheckCircle2> = {
  pending: Clock,
  paid: CheckCircle2,
  failed: XCircle,
  refunded: RefreshCw,
  partial_refund: RefreshCw,
};

export function PaymentSummaryCard({ order, className }: PaymentSummaryCardProps) {
  const methodConfig = PAYMENT_METHOD_CONFIG[order.paymentMethod] ?? PAYMENT_METHOD_CONFIG.cod;
  const StatusIcon = PAYMENT_STATUS_ICON[order.paymentStatus] ?? Clock;

  // Compute GST split (half CGST + half SGST for intra-state)
  const gstTotal = order.tax ?? 0;
  const cgst = Math.round(gstTotal / 2);
  const sgst = gstTotal - cgst;

  const handleCopyTxnId = () => {
    if (order.transactionId) {
      navigator.clipboard?.writeText(order.transactionId);
    }
  };

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
          <CreditCard className="size-4 text-white" />
        </div>
        <h3 className="text-base sm:text-lg font-bold text-slate-800">Payment Details</h3>
      </div>

      <Separator />

      <div className="p-5 sm:p-6 pt-4 space-y-4">
        {/* Payment method hero */}
        <div className={cn("rounded-xl border p-3.5", methodConfig.bg, methodConfig.borderColor)}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                <methodConfig.icon className={cn("size-5", methodConfig.color)} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-800 truncate">
                  {methodConfig.label}
                </p>
                <p className="text-xs text-slate-600 truncate">
                  {methodConfig.description}
                </p>
              </div>
            </div>

            {/* Status badge */}
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm shrink-0",
                PAYMENT_STATUS_COLORS[order.paymentStatus],
              )}
            >
              <StatusIcon className="size-3" />
              {PAYMENT_STATUS_LABELS[order.paymentStatus]}
            </span>
          </div>
        </div>

        {/* Transaction ID */}
        {order.transactionId && (
          <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
            <div className="flex items-center gap-1.5 min-w-0">
              <Hash className="size-3.5 text-slate-400 shrink-0" />
              <span className="text-xs text-slate-500 font-medium shrink-0">Transaction ID</span>
            </div>
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-mono text-slate-700 truncate max-w-[140px]">
                {order.transactionId}
              </span>
              <button
                onClick={handleCopyTxnId}
                className="p-1 rounded hover:bg-slate-200 transition-colors shrink-0"
                aria-label="Copy transaction ID"
              >
                <Copy className="size-3 text-slate-400" />
              </button>
            </div>
          </div>
        )}

        {/* Coupon code */}
        {order.couponCode && (
          <div className="flex items-center justify-between p-2.5 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-1.5">
              <Tag className="size-3.5 text-green-600" />
              <span className="text-xs text-green-700 font-medium">Coupon Applied</span>
            </div>
            <span className="text-xs font-bold text-green-700 uppercase tracking-wide">
              {order.couponCode}
            </span>
          </div>
        )}

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

        {/* Price breakdown */}
        <div className="space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Items Subtotal</span>
            <span className="font-medium text-slate-800 tabular-nums">{formatINR(order.subtotal)}</span>
          </div>

          {order.discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-green-600">
                Discount {order.couponCode ? `(${order.couponCode})` : ""}
              </span>
              <span className="font-medium text-green-600 tabular-nums">−{formatINR(order.discount)}</span>
            </div>
          )}

          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Delivery Fee</span>
            <span className="font-medium text-slate-800 tabular-nums">
              {order.shipping === 0 ? (
                <span className="text-green-600 font-bold">FREE</span>
              ) : (
                formatINR(order.shipping)
              )}
            </span>
          </div>

          {order.tax > 0 && (
            <>
              <div className="flex justify-between text-xs text-slate-500 pl-2">
                <span>CGST (9%)</span>
                <span className="tabular-nums">{formatINR(cgst)}</span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 pl-2">
                <span>SGST (9%)</span>
                <span className="tabular-nums">{formatINR(sgst)}</span>
              </div>
            </>
          )}
        </div>

        <Separator />

        {/* Grand Total hero */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-[#F3F8F1] to-green-50 rounded-xl border border-[#16382B]/10">
          <div className="flex items-center gap-1.5">
            <IndianRupee className="size-5 text-[#16382B]" />
            <span className="text-sm sm:text-base font-bold text-slate-800">Grand Total</span>
          </div>
          <span className="text-xl sm:text-2xl font-bold text-[#16382B] tabular-nums">
            {formatINR(order.total)}
          </span>
        </div>

        {/* Conditional notices */}
        {order.paymentMethod === "cod" && order.paymentStatus === "pending" && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <Banknote className="size-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Please keep <span className="font-bold">{formatINR(order.total)}</span> ready for cash payment on delivery.
            </p>
          </div>
        )}

        {order.paymentStatus === "refunded" && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <RefreshCw className="size-4 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-xs text-blue-700">
              Refund of <span className="font-bold">{formatINR(order.total)}</span> processed. Will reflect in your account within 5-7 business days.
            </p>
          </div>
        )}

        {order.paymentStatus === "failed" && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <XCircle className="size-4 text-red-600 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700">
              Payment failed. Please retry payment or choose a different payment method.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
