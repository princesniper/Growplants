"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ShoppingCart, Heart, Search, Menu, X, ChevronDown, User, LogOut, Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/common/Logo";
import { NotificationBell } from "@/components/global/NotificationBell";
import { MobileDrawerNav } from "@/components/global/MobileDrawerNav";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useWishlist } from "@/contexts/WishlistContext";
import { useBilingual } from "@/store/useBilingual";
import { appToast } from "@/lib/toast";

const SEARCH_CATEGORIES = ["All Categories", "Indoor Plants", "Outdoor Plants", "Planters", "Services"];

const NAV_LINKS = [
  { label: "Shop", href: "/shop" },
  { label: "Services", href: "/services" },
  { label: "New", href: "/shop?filter=new", hideOnLg: true },
  { label: "Best Sellers", href: "/shop?filter=bestseller", hideOnXl: true },
  { label: "Trending", href: "/shop?filter=trending", hideOnXl: true },
  { label: "Offers", href: "/offers", accent: true },
  { label: "Blog", href: "/blog" },
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
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const [showSearchCategoryDropdown, setShowSearchCategoryDropdown] = useState(false);

  const categorySelectRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 0);
    window.addEventListener("scroll", handleScroll, { passive: true });

    const handleClickOutside = (event: MouseEvent) => {
      if (categorySelectRef.current && !categorySelectRef.current.contains(event.target as Node)) {
        setShowSearchCategoryDropdown(false);
      }
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
      const catParam = selectedCategory !== "All Categories" ? `&category=${encodeURIComponent(selectedCategory)}` : "";
      window.location.href = `/shop?q=${encodeURIComponent(term)}${catParam}`;
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
    if (href === "/shop") return pathname === "/shop" || pathname.startsWith("/product");
    if (href === "/services") return pathname === "/services" || pathname.startsWith("/services");
    if (href === "/blog") return pathname.startsWith("/blog");
    return pathname === href;
  };

  return (
    <>
      {/* Sticky container */}
      <div
        className={cn(
          "sticky top-0 z-40 w-full bg-white transition-all duration-300",
          scrolled ? "shadow-md border-b border-slate-100" : "border-b border-slate-200"
        )}
      >
        {/* ---------- TIER 2: Main marketplace header ---------- */}
        <div className="h-[52px] lg:h-[56px] flex items-center px-4 md:px-6">
          <div className="max-w-[1400px] mx-auto w-full flex items-center gap-4 lg:gap-6">
            {/* Hamburger (mobile) */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-slate-700 hover:text-[#1A6B3C]"
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="relative h-8 w-8 overflow-hidden rounded-lg">
                <img src="/logo-mark.png" alt="GrowPlants Logo" className="object-cover w-full h-full" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-extrabold text-base lg:text-lg text-[#1A6B3C] tracking-tight leading-none">
                  GROWPLANTS
                </span>
                <span className="text-[9px] text-slate-400 font-semibold tracking-wide mt-0 uppercase hidden sm:inline-block">
                  Plants &amp; Services
                </span>
              </div>
            </Link>

            {/* Center search bar */}
            <div className="hidden lg:flex flex-1 justify-center px-2">
              <form onSubmit={handleSearchSubmit} className="flex max-w-2xl items-center relative w-full">
                <div className="w-full flex h-[36px] border border-slate-300 rounded-md overflow-hidden bg-slate-50 focus-within:ring-2 focus-within:ring-[#1A6B3C]/10 focus-within:border-[#1A6B3C] transition-all">
                  {/* Category dropdown */}
                  <div className="relative border-r border-slate-200 flex items-center" ref={categorySelectRef}>
                    <button
                      type="button"
                      onClick={() => setShowSearchCategoryDropdown(!showSearchCategoryDropdown)}
                      className="h-full px-3 text-xs font-semibold text-slate-600 hover:bg-slate-100 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span className="hidden sm:inline">{selectedCategory}</span>
                      <ChevronDown className="h-3 w-3 text-slate-400" />
                    </button>
                    {showSearchCategoryDropdown && (
                      <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 shadow-xl rounded-md py-1.5 min-w-[160px] z-50">
                        {SEARCH_CATEGORIES.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => { setSelectedCategory(cat); setShowSearchCategoryDropdown(false); }}
                            className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-[#1A6B3C] transition-colors"
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Search input */}
                  <div className="flex-1 relative flex items-center">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search plants, planters, fertilizers, services..."
                      className="w-full h-full bg-transparent px-3 text-xs font-semibold text-slate-800 outline-none"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 p-1 rounded-full text-slate-400 hover:text-slate-600"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Submit button */}
                  <button
                    type="submit"
                    className="bg-[#1A6B3C] hover:bg-[#16A34A] text-white px-4 transition-colors flex items-center justify-center cursor-pointer"
                  >
                    <Search className="h-3.5 w-3.5" />
                  </button>
                </div>
              </form>
            </div>

            {/* Right icons */}
            <div className="flex items-center gap-1.5 md:gap-2 lg:gap-3 shrink-0">
              {/* Mobile search toggle */}
              <button
                onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
                className="lg:hidden p-2 text-slate-700 hover:text-[#1A6B3C]"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </button>

              {/* Wishlist */}
              <Link
                href={isAuthenticated ? "/account/wishlist" : "/login"}
                className="relative flex flex-col items-center justify-center p-1.5 rounded-lg text-slate-600 hover:text-[#1A6B3C] hover:bg-slate-50 transition-colors"
                aria-label={`Wishlist, ${wishlistCount} items`}
              >
                <Heart className="h-5 w-5" />
                <span className="text-[9px] font-bold mt-0 hidden md:inline-block">Wishlist</span>
                {wishlistCount > 0 && (
                  <span className="absolute top-0 right-0 bg-red-500 text-white text-[7px] font-extrabold h-3 w-3 flex items-center justify-center rounded-full">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <button
                onClick={openDrawer}
                className="relative flex flex-col items-center justify-center p-1.5 rounded-lg text-slate-600 hover:text-[#1A6B3C] hover:bg-slate-50 transition-colors cursor-pointer"
                aria-label={`Cart, ${cartCount} items`}
              >
                <ShoppingCart className="h-5 w-5" />
                <span className="text-[9px] font-bold mt-0 hidden md:inline-block">Cart</span>
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 bg-amber-500 text-white text-[7px] font-extrabold h-3 w-3 flex items-center justify-center rounded-full">
                    {cartCount}
                  </span>
                )}
              </button>

              {/* Notifications (authenticated only) */}
              {isAuthenticated && <NotificationBell className="hidden sm:block" />}

              {/* Account (desktop — hidden on mobile) */}
              {isAuthenticated && user ? (
                <div ref={accountRef} className="relative hidden lg:block">
                  <button
                    onClick={() => setAccountMenuOpen(!accountMenuOpen)}
                    className="size-8 rounded-full bg-[#1A6B3C] text-white flex items-center justify-center text-xs font-bold hover:opacity-90 transition-opacity overflow-hidden border-2 border-white shadow-sm"
                    aria-label={`Account — ${user.fullName}`}
                    aria-expanded={accountMenuOpen}
                  >
                    {user.profileImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
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
                    <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-slate-200 shadow-xl rounded-md overflow-hidden z-50">
                      <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2.5">
                        <div className="size-9 rounded-full bg-[#1A6B3C] text-white flex items-center justify-center text-sm font-bold overflow-hidden shrink-0">
                          {user.profileImageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
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
                          <p className="text-sm font-semibold text-slate-800 truncate">{user.fullName}</p>
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                      </div>
                      <div className="p-1.5">
                        <Link href="/account" onClick={() => setAccountMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-50 text-sm text-slate-700">
                          <User className="h-4 w-4 text-[#1A6B3C]" /> My Account
                        </Link>
                        <Link href="/account/settings" onClick={() => setAccountMenuOpen(false)} className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-slate-50 text-sm text-slate-700">
                          <Settings className="h-4 w-4 text-[#1A6B3C]" /> Settings
                        </Link>
                        <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-red-50 text-sm text-red-600">
                          <LogOut className="h-4 w-4" /> Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="hidden lg:flex items-center px-4 py-1.5 bg-[#1A6B3C] hover:bg-[#16A34A] text-white font-semibold text-xs rounded-md shadow-sm hover:shadow-md transition-all active:scale-95 ml-1"
                >
                  Sign In
                </Link>
              )}

              {/* Mobile account icon (hidden on desktop — uses MobileBottomNav instead) */}
              {isAuthenticated && user ? (
                <Link href="/account" className="lg:hidden">
                  <div className="w-7 h-7 rounded-full bg-[#1A6B3C] text-white flex items-center justify-center text-xs font-bold overflow-hidden">
                    {user.profileImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
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
                <Link href="/login" className="lg:hidden p-2 text-slate-700 hover:text-[#1A6B3C]">
                  <User className="h-5 w-5" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Mobile expanded search */}
        {mobileSearchOpen && (
          <div className="lg:hidden px-4 pb-3 border-b border-slate-100 bg-white">
            <form onSubmit={handleSearchSubmit} className="flex gap-2">
              <div className="flex-1 flex items-center border border-slate-300 rounded-md bg-slate-50 px-2.5 py-1.5">
                <Search className="h-4 w-4 text-slate-400 mr-2" />
                <input
                  type="text"
                  placeholder="Search plants, services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-xs font-semibold text-slate-700 bg-transparent outline-none"
                />
              </div>
              <button type="submit" className="px-4 bg-[#1A6B3C] hover:bg-[#16A34A] text-white text-xs font-bold rounded-md">
                Go
              </button>
            </form>
          </div>
        )}

        {/* ---------- TIER 3: Category navigation ---------- */}
        <div className="hidden lg:block h-11 border-t border-slate-100">
          <div className="max-w-[1400px] mx-auto px-4 lg:px-6 h-full flex justify-between items-center gap-4">
            {/* Categories button */}
            <div className="relative h-full flex items-center">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="h-full flex items-center gap-1.5 font-bold text-xs text-slate-800 hover:text-[#1A6B3C] transition-colors cursor-pointer whitespace-nowrap"
              >
                <Menu className="h-4 w-4" />
                <span className="hidden sm:inline">Categories</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>
            </div>

            {/* Center nav links */}
            <nav className="flex items-center gap-5 lg:gap-6 h-full">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "text-[11px] font-bold uppercase tracking-wide py-3 whitespace-nowrap transition-colors",
                    link.hideOnLg && "hidden lg:block",
                    link.hideOnXl && "hidden xl:block",
                    link.accent
                      ? "text-[#1A6B3C] hover:text-[#16A34A]"
                      : isActive(link.href)
                      ? "text-[#1A6B3C]"
                      : "text-slate-700 hover:text-[#1A6B3C]"
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Right CTAs */}
            <div className="flex items-center gap-3 ml-auto">
              <Link
                href="/shop?filter=deals"
                className="text-[11px] font-bold text-red-600 hover:text-red-700 uppercase tracking-wide flex items-center gap-0.5 whitespace-nowrap"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse" />
                <span className="hidden lg:inline">Deals</span>
              </Link>
              <div className="h-3 w-px bg-slate-300" />
              <Link
                href="/shop?filter=seasonal"
                className="text-[11px] font-bold text-amber-600 hover:text-amber-700 uppercase tracking-wide whitespace-nowrap"
              >
                Seasonal
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
