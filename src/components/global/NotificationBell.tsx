"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useBilingual } from "@/store/useBilingual";
import { formatRelativeTime } from "@/lib/utils";

/**
 * NotificationBell — header bell icon with unread badge + dropdown panel.
 * Source: PRD §16.1 (Notification Channels — In-App Bell icon), §16.2 (Triggers)
 *
 * Phase 3 scope:
 *   - Bell icon button with unread count bubble
 *   - Dropdown panel showing recent notifications
 *   - "Mark all as read" + "View all" actions
 *   - Closes on outside click + Escape
 *
 * Phase 5+ will wire this to a real NotificationsContext backed by the
 * notifications table.
 */

interface Notification {
  id: string;
  type: "order_update" | "booking_update" | "payment" | "promotional" | "system" | "review_request";
  title: string;
  body: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

// Phase 3 mock data
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "order_update",
    title: "Order GP-001234 dispatched",
    body: "Your order is on the way. Expected delivery tomorrow.",
    link: "/account/orders",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    id: "2",
    type: "booking_update",
    title: "Gardener confirmed your booking",
    body: "Ramesh will arrive on 15 Jan, 9–11 AM for balcony setup.",
    link: "/account/bookings",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: "3",
    type: "promotional",
    title: "10% off on all succulents",
    body: "Limited time offer. Use code SUCC10 at checkout.",
    link: "/shop?category=succulents",
    isRead: false,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: "4",
    type: "review_request",
    title: "How's your Snake Plant?",
    body: "Share your experience and help other plant lovers.",
    link: "/account/orders",
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: "5",
    type: "system",
    title: "Welcome to GrowPlants!",
    body: "Thanks for joining Sonipat's botanical marketplace.",
    isRead: true,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

const TYPE_ICON: Record<Notification["type"], string> = {
  order_update: "📦",
  booking_update: "🌱",
  payment: "💳",
  promotional: "🎉",
  system: "ℹ️",
  review_request: "⭐",
};

export function NotificationBell({ className }: { className?: string }) {
  const { t } = useBilingual();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(MOCK_NOTIFICATIONS);
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen((v) => !v)}
        className="relative rounded-full"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Bell className="size-5" aria-hidden="true" />
        {unreadCount > 0 && (
          <span
            className={cn(
              "absolute top-1 right-1 min-w-[16px] h-[16px] px-1",
              "flex items-center justify-center",
              "rounded-full bg-warning text-on-warning text-[10px] font-bold tabular-nums",
              "ring-2 ring-background"
            )}
            aria-hidden="true"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {isOpen && (
        <div
          role="dialog"
          aria-label="Notifications"
          className={cn(
            "absolute top-full right-0 mt-2 w-[360px] max-w-[calc(100vw-2rem)] z-50",
            "rounded-[18px] border border-border bg-popover shadow-lg overflow-hidden"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-border">
            <p className="text-body font-semibold text-foreground">Notifications</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-caption text-primary hover:text-brass-deep font-medium flex items-center gap-1"
              >
                <Check className="size-3" aria-hidden="true" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto scrollbar-pretty">
            {notifications.length === 0 ? (
              <p className="p-6 text-center text-body-sm text-muted-foreground">
                No notifications yet
              </p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => markRead(n.id)}
                  className={cn(
                    "w-full flex items-start gap-3 p-3 text-left hover:bg-sage-wash/60 transition-colors border-b border-border last:border-0",
                    !n.isRead && "bg-sage-wash/70"
                  )}
                >
                  <span className="text-lg shrink-0 mt-0.5" aria-hidden="true">
                    {TYPE_ICON[n.type]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-body-sm", !n.isRead ? "font-semibold text-foreground" : "font-medium text-foreground")}>
                      {n.title}
                    </p>
                    <p className="text-caption text-muted-foreground line-clamp-2 mt-0.5">
                      {n.body}
                    </p>
                    <p className="text-caption text-muted-foreground mt-1">
                      {formatRelativeTime(n.createdAt)}
                    </p>
                  </div>
                  {!n.isRead && (
                    <span className="size-2 rounded-full bg-primary shrink-0 mt-1.5" aria-label="Unread" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-border">
            <Button variant="ghost" size="sm" className="w-full" asChild>
              <a href="/account/notifications">View all notifications</a>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
