"use client";

/**
 * GrowPlants — AdminStatusUpdater
 * ============================================================================
 * A small dropdown UI that lets you update an order's status via the
 * PATCH /api/orders/[id]/status API route.
 *
 * This bypasses Firestore security rules (which block client writes) by
 * using the Firebase Admin SDK on the server side.
 *
 * When status changes:
 *   1. PATCH /api/orders/[id]/status → server updates Firestore
 *   2. onUserOrderSnapshot() listener fires (real-time)
 *   3. OrderTimeline re-renders with new status
 *
 * Place this component on the order detail page (visible to logged-in users
 * for testing; in production, restrict to admin role).
 * ============================================================================
 */
import { useState } from "react";
import { ChevronDown, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ORDER_STATUS_LABELS, type OrderStatus } from "@/contexts/OrdersContext";

interface AdminStatusUpdaterProps {
  orderId: string;
  currentStatus: OrderStatus;
  onStatusChanged?: () => void;
  className?: string;
}

// All 8 timeline statuses + cancelled
const STATUS_OPTIONS: OrderStatus[] = [
  "pending",
  "confirmed",
  "processing",
  "quality_inspection",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

export function AdminStatusUpdater({
  orderId,
  currentStatus,
  onStatusChanged,
  className,
}: AdminStatusUpdaterProps) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [lastMessage, setLastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleStatusChange = async (newStatus: OrderStatus) => {
    if (!user || newStatus === currentStatus) {
      setIsOpen(false);
      return;
    }

    setUpdating(true);
    setLastMessage(null);

    try {
      // Get Firebase ID token
      const { firebaseAuth } = await import("@/lib/firebase/client");
      const idToken = firebaseAuth?.currentUser
        ? await firebaseAuth.currentUser.getIdToken()
        : null;

      if (!idToken) {
        setLastMessage({ type: "error", text: "Not authenticated" });
        return;
      }

      // Call admin API
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          status: newStatus,
          note: `Status changed from ${ORDER_STATUS_LABELS[currentStatus]} to ${ORDER_STATUS_LABELS[newStatus]}`,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setLastMessage({
          type: "success",
          text: `✅ Status updated to ${ORDER_STATUS_LABELS[newStatus]}`,
        });
        onStatusChanged?.();
        // The real-time listener (onUserOrderSnapshot) will pick up the change
        // and re-render the timeline automatically.
      } else {
        setLastMessage({
          type: "error",
          text: `❌ ${data.error ?? "Failed to update status"}`,
        });
      }
    } catch (err) {
      console.error("[AdminStatusUpdater] Error:", err);
      setLastMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Network error",
      });
    } finally {
      setUpdating(false);
      setIsOpen(false);
      // Clear message after 4 seconds
      setTimeout(() => setLastMessage(null), 4000);
    }
  };

  return (
    <div className={cn("relative", className)}>
      {/* Trigger button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        variant="outline"
        className="border-[#1A6B3C] text-[#1A6B3C] hover:bg-[#F3F8F1] gap-2 text-sm"
        size="sm"
        disabled={updating}
      >
        {updating ? (
          <RefreshCw className="size-4 animate-spin" />
        ) : (
          <ChevronDown className="size-4" />
        )}
        Update Status
        <span className="text-[10px] text-slate-400 ml-1">(Admin)</span>
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-slate-200 shadow-lg z-50 overflow-hidden">
            <div className="px-3 py-2 bg-[#F3F8F1] border-b border-slate-100">
              <p className="text-xs font-bold text-slate-700">Change Order Status</p>
              <p className="text-[10px] text-slate-500">Updates Firestore in real-time</p>
            </div>

            <div className="max-h-72 overflow-y-auto py-1">
              {STATUS_OPTIONS.map((status) => {
                const isCurrent = status === currentStatus;
                return (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    disabled={updating || isCurrent}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm flex items-center justify-between gap-2 transition-colors",
                      isCurrent
                        ? "bg-[#1A6B3C]/10 text-[#1A6B3C] font-bold cursor-default"
                        : "text-slate-700 hover:bg-[#F3F8F1]",
                      !isCurrent && !updating && "cursor-pointer",
                    )}
                  >
                    <span>{ORDER_STATUS_LABELS[status]}</span>
                    {isCurrent && <CheckCircle2 className="size-4 text-[#1A6B3C]" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Status message toast */}
      {lastMessage && (
        <div
          className={cn(
            "absolute right-0 top-full mt-2 px-3 py-2 rounded-lg text-xs font-medium shadow-md z-50 animate-fade-in",
            lastMessage.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200",
          )}
        >
          <div className="flex items-center gap-1.5">
            {lastMessage.type === "success" ? (
              <CheckCircle2 className="size-3.5 shrink-0" />
            ) : (
              <AlertCircle className="size-3.5 shrink-0" />
            )}
            <span>{lastMessage.text}</span>
          </div>
        </div>
      )}
    </div>
  );
}
