"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, Calendar, Heart, MapPin, User, Settings, Shield, Star, LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useOrders } from "@/contexts/OrdersContext";
import { useBookings } from "@/contexts/BookingsContext";
import { appToast } from "@/lib/toast";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/account/dashboard", icon: LayoutDashboard },
  { label: "Orders", href: "/account/orders", icon: Package },
  { label: "Bookings", href: "/account/bookings", icon: Calendar },
  { label: "Wishlist", href: "/account/wishlist", icon: Heart },
  { label: "Addresses", href: "/account/addresses", icon: MapPin },
  { label: "Profile", href: "/account/profile", icon: User },
  { label: "My Reviews", href: "/account/reviews", icon: Star },
  { label: "Settings", href: "/account/settings", icon: Settings },
  { label: "Security", href: "/account/security", icon: Shield },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const { count: wishlistCount } = useWishlist();
  const { orders } = useOrders();
  const { bookings } = useBookings();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    appToast.success("Logged out", "You've been signed out of GrowPlants.");
  };

  const isActive = (href: string) => pathname === href || (href !== "/account/dashboard" && pathname.startsWith(href));

  const sidebar = (
    <div className="space-y-1">
      {/* User card */}
      <div className="p-3 mb-3 rounded-lg bg-[#F3F8F1]">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-[#1A6B3C] text-white flex items-center justify-center text-sm font-bold shrink-0 overflow-hidden border-2 border-white shadow-sm">
            {user?.profileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.profileImageUrl}
                alt={user.fullName}
                className="size-full object-cover rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              user?.fullName?.charAt(0).toUpperCase() ?? "U"
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{user?.fullName ?? "Guest"}</p>
            <p className="text-xs text-slate-500 truncate">{user?.email ?? "Not logged in"}</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      {NAV_ITEMS.map((item) => {
        const showBadge = item.href === "/account/orders" ? orders.length : item.href === "/account/bookings" ? bookings.length : item.href === "/account/wishlist" ? wishlistCount : 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive(item.href)
                ? "bg-[#1A6B3C] text-white"
                : "text-slate-600 hover:bg-[#F3F8F1] hover:text-[#1A6B3C]"
            )}
          >
            <item.icon className="size-4 shrink-0" />
            <span className="flex-1">{item.label}</span>
            {showBadge > 0 && (
              <span className={cn("text-xs font-bold px-1.5 py-0.5 rounded-full", isActive(item.href) ? "bg-white/20 text-white" : "bg-[#E8930A] text-white")}>
                {showBadge}
              </span>
            )}
          </Link>
        );
      })}

      <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
        <LogOut className="size-4 shrink-0" />
        Logout
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAFAF6]">
      {/* Mobile header */}
      <div className="lg:hidden sticky top-16 z-30 bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(true)} className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
          <Menu className="size-5" /> Menu
        </button>
        <span className="text-sm font-bold text-[#1A6B3C]">My Account</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24 bg-white border border-slate-200 rounded-xl p-3">
              {sidebar}
            </div>
          </aside>

          {/* Mobile sidebar drawer */}
          {sidebarOpen && (
            <div className="lg:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setSidebarOpen(false)}>
              <div className="absolute top-0 left-0 h-full w-72 max-w-[80vw] bg-white shadow-xl p-4 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-[#1A6B3C]">Account Menu</span>
                  <button onClick={() => setSidebarOpen(false)} className="p-1 hover:bg-slate-100 rounded"><X className="size-5 text-slate-500" /></button>
                </div>
                {sidebar}
              </div>
            </div>
          )}

          {/* Main content */}
          <div className="lg:col-span-3">{children}</div>
        </div>
      </div>
    </div>
  );
}
