"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, BellRing, ShoppingCart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useBilingual } from "@/store/useBilingual";

/**
 * MobileBottomNav — fixed bottom navigation for mobile (<768px).
 * Source: PRD §8.3 (Mobile Bottom Tab: Home | Shop | Services | Cart | Profile)
 *
 * 5 tabs with active state highlighting + cart badge count.
 * Account tab shows real avatar image if available, otherwise User icon.
 * Fixed to bottom of viewport with safe-area inset support.
 */
interface NavItem {
  href: string;
  label: string;
  labelHi: string;
  icon: typeof Home;
  matchPaths: string[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Home", labelHi: "होम", icon: Home, matchPaths: ["/"] },
  { href: "/shop", label: "Shop", labelHi: "शॉप", icon: ShoppingBag, matchPaths: ["/shop", "/product"] },
  { href: "/services", label: "Services", labelHi: "सेवाएं", icon: BellRing, matchPaths: ["/services", "/providers"] },
  { href: "/cart", label: "Cart", labelHi: "कार्ट", icon: ShoppingCart, matchPaths: ["/cart", "/checkout"] },
  { href: "/account", label: "Account", labelHi: "खाता", icon: User, matchPaths: ["/account"] },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const { itemCount, openDrawer } = useCart();
  const { user, isAuthenticated } = useAuth();
  const { language } = useBilingual();
  const isHi = language === "hi";

  return (
    <nav
      className={cn(
        "md:hidden fixed bottom-0 left-0 right-0 z-40",
        "bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        "border-t border-border",
        "pb-[env(safe-area-inset-bottom)]"
      )}
      aria-label="Mobile navigation"
    >
      <ul className="flex items-stretch justify-around h-16">
        {NAV_ITEMS.map((item) => {
          const isActive = item.matchPaths.some(
            (p) => p === "/" ? pathname === "/" : pathname.startsWith(p)
          );

          // Cart tab is special — opens drawer instead of navigating
          if (item.href === "/cart") {
            return (
              <li key={item.href} className="flex-1">
                <button
                  type="button"
                  onClick={openDrawer}
                  className={cn(
                    "w-full h-full flex flex-col items-center justify-center gap-0.5",
                    "text-body-sm transition-colors relative",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-label={`${isHi ? item.labelHi : item.label}${itemCount > 0 ? `, ${itemCount} items` : ""}`}
                >
                  <span className="relative">
                    <item.icon className="size-5" aria-hidden="true" />
                    {itemCount > 0 && (
                      <span
                        className={cn(
                          "absolute -top-1.5 -right-2 min-w-[16px] h-[16px] px-1",
                          "flex items-center justify-center",
                          "rounded-full bg-warning text-on-warning text-[10px] font-bold tabular-nums",
                          "ring-2 ring-background"
                        )}
                        aria-hidden="true"
                      >
                        {itemCount > 9 ? "9+" : itemCount}
                      </span>
                    )}
                  </span>
                  <span className="text-caption font-medium">
                    {isHi ? item.labelHi : item.label}
                  </span>
                </button>
              </li>
            );
          }

          // Account tab — show real avatar if logged in, else User icon
          if (item.href === "/account" && isAuthenticated && user) {
            return (
              <li key={item.href} className="flex-1">
                <Link
                  href={item.href}
                  className={cn(
                    "w-full h-full flex flex-col items-center justify-center gap-0.5",
                    "text-body-sm transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={isHi ? item.labelHi : item.label}
                >
                  {user.profileImageUrl ? (
                    <div className={cn(
                      "size-6 rounded-full overflow-hidden border-2 transition-all",
                      isActive ? "border-primary ring-2 ring-primary/20" : "border-transparent"
                    )}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={user.profileImageUrl}
                        alt={user.fullName}
                        className="size-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  ) : (
                    <div className={cn(
                      "size-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground ring-2 ring-primary/20"
                        : "bg-primary/10 text-primary"
                    )}>
                      {user.fullName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-caption font-medium">
                    {isHi ? item.labelHi : item.label}
                  </span>
                </Link>
              </li>
            );
          }

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "w-full h-full flex flex-col items-center justify-center gap-0.5",
                  "text-body-sm transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
                aria-label={isHi ? item.labelHi : item.label}
              >
                <item.icon className="size-5" aria-hidden="true" />
                <span className="text-caption font-medium">
                  {isHi ? item.labelHi : item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
