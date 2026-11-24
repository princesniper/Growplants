"use client";

import { useSyncExternalStore } from "react";
import { WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * OfflineBanner — sticky top banner shown when the browser loses network
 * connectivity. Auto-detects via the `online`/`offline` window events.
 *
 * Uses `useSyncExternalStore` (React 18+) for SSR-safe external state
 * subscription without the setState-in-effect anti-pattern.
 *
 * Mount once in the root layout (Phase 3). Self-mounts/unmounts based on
 * navigator.onLine.
 */
function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot(): boolean {
  if (typeof navigator === "undefined") return false;
  return !navigator.onLine;
}

function getServerSnapshot(): boolean {
  // Server always renders as if online (banner hidden during SSR).
  return false;
}

export function OfflineBanner({ className }: { className?: string }) {
  const isOffline = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  if (!isOffline) return null;

  return (
    <div
      role="alert"
      className={cn(
        "sticky top-0 z-50 w-full bg-warning text-warning-foreground border-b border-brass-deep/30",
        "px-4 py-2 text-body-sm font-medium text-center",
        "flex items-center justify-center gap-2",
        className
      )}
    >
      <WifiOff className="size-4" aria-hidden="true" />
      <span>You&apos;re offline. Some features may be unavailable.</span>
    </div>
  );
}
