"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Calendar, User, Wallet, LogOut, Sprout } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { appToast } from "@/lib/toast";
import { useAuth } from "@/contexts/AuthContext";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/provider", icon: LayoutDashboard },
  { label: "Bookings", href: "/provider/bookings", icon: Calendar },
  { label: "Calendar", href: "/provider/calendar", icon: Calendar },
  { label: "Profile", href: "/provider/profile", icon: User },
  { label: "Earnings", href: "/provider/earnings", icon: Wallet },
];

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const isActive = (href: string) => pathname === href || (href !== "/provider" && pathname.startsWith(href));

  return (
    <div className="min-h-screen bg-ivory">
      {/* Provider banner */}
      <div className="bg-pine text-ivory py-2 px-4 text-center text-sm font-medium">
        🌱 Provider Portal — You are signed in as a service provider
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 bg-paper border border-line rounded-[18px] p-3 space-y-1">
              <div className="p-3 mb-3 rounded-lg bg-sage-wash">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-pine text-ivory flex items-center justify-center text-sm font-bold shrink-0">
                    {user?.fullName?.charAt(0).toUpperCase() ?? "P"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-charcoal truncate">{user?.fullName ?? "Provider"}</p>
                    <p className="text-xs text-ink-soft">Verified Gardener</p>
                  </div>
                </div>
              </div>
              {NAV_ITEMS.map((item) => (
                <Link key={item.href} href={item.href} className={cn("flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors", isActive(item.href) ? "bg-pine text-ivory" : "text-ink-soft hover:bg-sage-wash hover:text-pine")}>
                  <item.icon className="size-4 shrink-0" />
                  {item.label}
                </Link>
              ))}
              <button onClick={() => { logout(); appToast.success("Logged out", "You've been signed out"); }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-terracotta hover:bg-terracotta/10 transition-colors">
                <LogOut className="size-4 shrink-0" />Logout
              </button>
            </div>
          </aside>

          {/* Main content */}
          <div className="lg:col-span-3">{children}</div>
        </div>
      </div>
    </div>
  );
}
