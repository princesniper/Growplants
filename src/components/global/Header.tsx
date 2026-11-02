"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingCart, Heart, Search, Menu, X, ChevronDown, User, LogOut, Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MegaMenu } from "@/components/global/MegaMenu";
import { NotificationBell } from "@/components/global/NotificationBell";
import { MobileDrawerNav } from "@/components/global/MobileDrawerNav";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useBilingual } from "@/store/useBilingual";
import { appToast } from "@/lib/toast";

/* Need-based primary nav — every link deep-links into /shop's URL-synced filters */
const NAV_LINKS = [
  { label: "Plants", href: "/shop?categories=indoor,outdoor,air-purifying,succulent,summer,winter,decorative" },
  { label: "Pots & Planters", href: "/shop?categories=ceramic-planters,decorative-planters,terracotta-planters,plastic-planters,ceramic,plastic" },
  { label: "Plant Finder", href: "/plant-finder", accent: true },
  { label: "Services", href: "/services" },
];

export function Header() {
  const { t } = useBilingual();
  const { itemCount: cartCount, openDrawer } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const { count: wishlistCount } = useWishlist();
  const pathname = usePathname();

  const [scrolled, setScrolled] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll, { passive: true });

    const handleClickOutside = (event: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const executeSearch = (queryStr: string = searchQuery) => {
    const term = queryStr.trim();
    if (term) {
      window.location.href = `/shop?q=${encodeURIComponent(term)}`;
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch();
  };

  const handleLogout = () => {
    logout();
    setAccountMenuOpen(false);
    appToast.success("Logged out", "You've been signed out of GrowPlants.");
  };

  const isActive = (href: string) => {
    if (href.startsWith("/shop")) return pathname === "/shop" || pathname.startsWith("/product");
    if (href === "/services") return pathname === "/services" || pathname.startsWith("/services");
    return pathname === href;
  };

  return (
    <>
      {/* Sticky container */}
      <div
        className={cn(
          "sticky top-0 z-40 w-full bg-ivory/95 backdrop-blur transition-all duration-300",
          scrolled ? "shadow-[0_8px_24px_rgba(22,56,43,0.08)] border-b border-line" : "border-b border-line/60"
        )}
      >
        {/* ---------- TIER 2: Main header ---------- */}
        <div className="h-[60px] lg:h-[68px] flex items-center px-4 md:px-6">
          <div className="max-w-7xl mx-auto w-full flex items-center gap-4 lg:gap-6">
            {/* Hamburger (mobile) */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-pine hover:text-brass-deep transition-colors"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0" aria-label="GrowPlants home">
              <div className="relative h-9 w-9 overflow-hidden rounded-xl shadow-sm">
                <img src="/logo-mark.png" alt="GrowPlants Logo" className="object-cover w-full h-full" />
              </div>
              <div className="flex flex-col">
                <span className="font-display text-xl lg:text-2xl text-pine tracking-tight leading-none">
                  GROWPLANTS
                </span>
                <span className="text-[9px] text-ink-soft font-medium tracking-[0.18em] uppercase hidden sm:inline-block mt-0.5">
                  Sonipat · Nursery Fresh
                </span>
              </div>
            </Link>

            {/* Center search bar */}
            <div className="hidden lg:flex flex-1 justify-center px-2">
              <form onSubmit={handleSearchSubmit} className="flex max-w-2xl items-center relative w-full">
                <div className="w-full flex h-[40px] border border-line rounded-full overflow-hidden bg-paper focus-within:ring-2 focus-within:ring-brass/30 focus-within:border-brass transition-all shadow-sm">
                  <div className="flex-1 relative flex items-center">
                    <Search className="h-4 w-4 text-ink-soft ml-4 shrink-0" aria-hidden="true" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search plants, planters… try “pet safe”"
                      className="w-full h-full bg-transparent px-3 text-sm text-charcoal outline-none placeholder:text-ink-soft/70"
                      aria-label="Search products"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 p-1 rounded-full text-ink-soft hover:text-pine"
                        aria-label="Clear search"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="bg-pine hover:bg-brass-deep text-ivory px-5 transition-colors flex items-center justify-center cursor-pointer"
                    aria-label="Search"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>

            {/* Right icons */}
            <div className="flex items-center gap-1 md:gap-2 shrink-0 ml-auto lg:ml-0">
              {/* Mobile search toggle */}
              <button
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                className="lg:hidden p-2 text-pine hover:text-brass-deep"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Wishlist */}
              <Link
                href={isAuthenticated ? "/account/wishlist" : "/login"}
                className="relative hidden sm:flex flex-col items-center justify-center p-1.5 rounded-lg text-pine hover:text-brass-deep hover:bg-sage-wash/60 transition-colors"
                aria-label={`Wishlist, ${wishlistCount} items`}
              >
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <span className="absolute top-0 right-0 bg-terracotta text-ivory text-[7px] font-extrabold h-3.5 min-w-3.5 px-0.5 flex items-center justify-center rounded-full">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <button
                onClick={openDrawer}
                className="relative flex flex-col items-center justify-center p-1.5 rounded-lg text-pine hover:text-brass-deep hover:bg-sage-wash/60 transition-colors cursor-pointer"
                aria-label={`Cart, ${cartCount} items`}
              >
                <ShoppingCart className="h-5 w-5" />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 bg-brass text-pine-ink text-[7px] font-extrabold h-3.5 min-w-3.5 px-0.5 flex items-center justify-center rounded-full">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Notifications (authenticated only) */}
              {isAuthenticated && <NotificationBell className="hidden sm:block" />}

              {/* Account (desktop) */}
              {isAuthenticated && user ? (
                <div ref={accountRef} className="relative hidden lg:block">
                  <button
                    onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                    className="size-9 rounded-full bg-pine text-ivory flex items-center justify-center text-xs font-bold hover:bg-brass-deep transition-colors overflow-hidden border-2 border-brass/30 shadow-sm"
                    aria-label={`Account — ${user.fullName}`}
                    aria-expanded={accountMenuOpen}
                  >
                    {user.profileImageUrl ? (
                      <img
                        src={user.profileImageUrl}
                        alt={user.fullName}
                        className="size-full object-cover rounded-full"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      user.fullName.charAt(0).toUpperCase()
                    )}
                  </button>
                  {accountMenuOpen && (
                    <div className="absolute top-full right-0 mt-2 w-56 bg-paper border border-line shadow-xl rounded-xl overflow-hidden z-50">
                      <div className="p-3 border-b border-line bg-sage-wash/50 flex items-center gap-2.5">
                        <div className="size-9 rounded-full bg-pine text-ivory flex items-center justify-center text-sm font-bold overflow-hidden shrink-0">
                          {user.profileImageUrl ? (
                            <img
                              src={user.profileImageUrl}
                              alt={user.fullName}
                              className="size-full object-cover rounded-full"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            user.fullName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-charcoal truncate">{user.fullName}</p>
                          <p className="text-xs text-ink-soft truncate">{user.email}</p>
                        </div>
                      </div>
                      <div className="p-1.5">
                        <Link href="/account" onClick={() => setAccountMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-sage-wash/60 text-sm text-charcoal">
                          <User className="h-4 w-4 text-pine" /> My Account
                        </Link>
                        <Link href="/account/settings" onClick={() => setAccountMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-sage-wash/60 text-sm text-charcoal">
                          <Settings className="h-4 w-4 text-pine" /> Settings
                        </Link>
                        <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-terracotta/10 text-sm text-terracotta">
                          <LogOut className="h-4 w-4" /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="hidden lg:inline-flex items-center px-5 py-2 bg-pine hover:bg-brass-deep text-ivory font-semibold text-sm rounded-full shadow-sm hover:shadow-md transition-all active:scale-95 ml-1"
                >
                  Sign In
                </Link>
              )}

              {/* Mobile account icon */}
              {isAuthenticated && user ? (
                <Link href="/account" className="lg:hidden">
                  <div className="w-7 h-7 rounded-full bg-pine text-ivory flex items-center justify-center text-xs font-bold overflow-hidden">
                    {user.profileImageUrl ? (
                      <img
                        src={user.profileImageUrl}
                        alt={user.fullName}
                        className="size-full object-cover rounded-full"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      user.fullName.charAt(0).toUpperCase()
                    )}
                  </div>
                </Link>
              ) : (
                <Link href="/login" className="lg:hidden p-2 text-pine hover:text-brass-deep">
                  <User className="h-5 w-5" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile expanded search */}
        {mobileSearchOpen && (
          <div className="lg:hidden px-4 pb-3 border-b border-line bg-ivory">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="flex-1 flex items-center border border-line rounded-full bg-paper px-3.5 py-2">
                <Search className="h-4 w-4 text-ink-soft mr-2" />
                <input
                  type="text"
                  placeholder="Search plants, planters…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-sm text-charcoal bg-transparent outline-none placeholder:text-ink-soft/70"
                  aria-label="Search products"
                />
              </div>
              <button type="submit" className="px-5 bg-pine hover:bg-brass-deep text-ivory text-sm font-semibold rounded-full">
                Go
              </button>
            </form>
          </div>
        )}

        {/* ---------- TIER 3: Need-based navigation ---------- */}
        <div className="hidden lg:block h-12 border-t border-line/60">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 h-full flex items-center gap-6">
            <MegaMenu />

            <nav className="flex items-center gap-6 h-full" aria-label="Primary">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-[12px] font-bold uppercase tracking-[0.08em] py-3 whitespace-nowrap transition-colors",
                    link.accent
                      ? "text-brass-deep hover:text-pine"
                      : isActive(link.href)
                      ? "text-pine underline decoration-brass decoration-2 underline-offset-8"
                      : "text-charcoal/80 hover:text-pine"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right: quick need links */}
            <div className="flex items-center gap-4 ml-auto">
              <Link
                href="/shop?pet_safe=true"
                className="text-[11px] font-semibold text-ink-soft hover:text-pine uppercase tracking-wide whitespace-nowrap transition-colors"
              >
                Pet-Safe
              </Link>
              <span className="h-3 w-px bg-line" aria-hidden="true" />
              <Link
                href="/shop?difficulty=Easy"
                className="text-[11px] font-semibold text-ink-soft hover:text-pine uppercase tracking-wide whitespace-nowrap transition-colors"
              >
                Beginner
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile drawer nav */}
      <MobileDrawerNav open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} />
    </>
  );
}
