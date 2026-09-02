"use client";

/**
 * ============================================================================
 * GrowPlants — Phase 1 + Phase 2 Verification Scratch Page
 * ============================================================================
 *
 * This page is TEMPORARY — it will be replaced in Phase 4 (Homepage).
 *
 * Phase 1 verification: design tokens, typography, shadcn/ui base, bilingual
 * store, lucide icons, utility formatters, constants, folder structure.
 *
 * Phase 2 verification: the GrowPlants-specific component library built on
 * top of shadcn/ui — common/ domain primitives, feedback/ states, and
 * products/ primitives.
 *
 * Once Phase 4 (Homepage) is approved, this page is replaced with the real
 * GrowPlants landing page composed from sections.
 * ============================================================================
 */
import { useState } from "react";
import {
  Sprout,
  ShoppingCart,
  Heart,
  Sun,
  Droplets,
  Leaf,
  Star,
  CheckCircle2,
  Languages,
  PackageSearch,
  Bell,
  Search,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

/* Phase 2 component library */
import { Logo } from "@/components/common/Logo";
import { LogoMark } from "@/components/common/LogoMark";
import { Rating } from "@/components/common/Rating";
import { Price } from "@/components/common/Price";
import { StatusPill } from "@/components/common/StatusPill";
import { SectionHeader } from "@/components/common/SectionHeader";
import { Container } from "@/components/common/Container";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { LanguageToggle } from "@/components/common/LanguageToggle";
import { IconBadge } from "@/components/common/IconBadge";
import { FilterChip } from "@/components/common/FilterChip";
import { FreeShippingProgressBar } from "@/components/common/FreeShippingProgressBar";
import { ProductCardSkeleton } from "@/components/feedback/ProductCardSkeleton";
import { SectionSkeleton } from "@/components/feedback/SectionSkeleton";
import { ListSkeleton } from "@/components/feedback/ListSkeleton";
import { FormSkeleton } from "@/components/feedback/FormSkeleton";
import { StockStatus } from "@/components/products/StockStatus";
import { CareSpecs } from "@/components/products/CareSpecs";
import { QuantitySelector } from "@/components/products/QuantitySelector";
import { ProductBadges } from "@/components/products/ProductBadges";
import { DiscountBadge } from "@/components/products/DiscountBadge";
import { RatingHistogram } from "@/components/products/RatingHistogram";

import { useBilingual } from "@/store/useBilingual";
import {
  formatINR,
  formatDate,
  formatDateTime,
  formatPhone,
  formatTimeSlot,
  discountPercent,
  slugify,
  formatNumberIN,
} from "@/lib/utils";
import {
  FREE_SHIPPING_THRESHOLD,
  COD_MAX_AMOUNT,
  BOOKING_SLOTS,
  DEFAULT_CITY,
  DEFAULT_PROVIDER_COMMISSION,
  APP_NAME,
  APP_TAGLINE_EN,
  APP_TAGLINE_HI,
} from "@/lib/constants";

export default function FoundationVerificationPage() {
  const { language, toggleLanguage, setLanguage, t } = useBilingual();
  const [count, setCount] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [interactiveRating, setInteractiveRating] = useState(4);
  const [chips, setChips] = useState([
    "Indoor Plants",
    "₹100–₹500",
    "4★ & above",
    "Easy care",
  ]);

  return (
    <main
      id="main-content"
      className="min-h-screen w-full"
    >
      <Container variant="default" className="section-py">
        {/* ---------- Header ---------- */}
        <header className="flex flex-col gap-6 mb-12">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <Logo size="lg" showTagline />
            <div className="flex items-center gap-2">
              <IconBadge icon={Search} count={0} label="Search" />
              <IconBadge icon={Heart} count={3} label="Wishlist" href="/wishlist" />
              <IconBadge icon={ShoppingCart} count={2} label="Cart" href="/cart" />
              <LanguageToggle variant="segmented" />
            </div>
          </div>
          <p className="text-overline text-muted-foreground">
            Phase 1 — Project Foundation · Phase 2 — Design System & Component Library
          </p>
          <p className="text-body-sm text-muted-foreground max-w-2xl">
            This is a temporary verification page. It confirms the design tokens,
            typography, base shadcn/ui, bilingual store, utility formatters, and
            the GrowPlants-specific component library are all wired correctly
            before Phase 3 (Layout System) begins. It will be replaced by the
            real homepage in Phase 4.
          </p>
        </header>

        {/* ---------- Status Banner ---------- */}
        <Card className="mb-12 border-primary/30 bg-primary/5">
          <CardContent className="flex items-start gap-3 p-4">
            <CheckCircle2 className="size-5 text-primary mt-0.5 shrink-0" aria-hidden="true" />
            <div className="text-body-sm">
              <p className="font-semibold text-foreground">
                Phase 1 + Phase 2 ready for Phase 3
              </p>
              <p className="text-muted-foreground mt-1">
                Foundation + 23 GrowPlants-specific components are in place. The
                real Header, Footer, CartDrawer, and MobileBottomNav will be
                composed in Phase 3 using these primitives.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ============================================================ */}
        {/* PHASE 1 — Color Tokens                                        */}
        {/* ============================================================ */}
        <Section
          title="Color Tokens"
          subtitle="Brand palette from the approved Design System (Part E.2)"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <ColorSwatch name="brand-bg (olive)" value="#f7fbf0" className="bg-background border" textClass="text-foreground" />
            <ColorSwatch name="brand-fg (pine)" value="#181d17" className="bg-foreground text-background" />
            <ColorSwatch name="primary (forest green)" value="#2e7d32" className="bg-primary text-primary-foreground" />
            <ColorSwatch name="accent (amber)" value="#f59e0b" className="bg-accent text-accent-foreground" />
            <ColorSwatch name="secondary (sage)" value="#6b8e4e" className="bg-secondary text-secondary-foreground" />
            <ColorSwatch name="success" value="#16a34a" className="bg-[#16a34a] text-white" />
            <ColorSwatch name="warning" value="#d97706" className="bg-[#d97706] text-white" />
            <ColorSwatch name="danger" value="#dc2626" className="bg-[#dc2626] text-white" />
            <ColorSwatch name="surface (white)" value="#ffffff" className="bg-card text-card-foreground border" />
            <ColorSwatch name="surface-alt" value="#f1f5e8" className="bg-muted text-muted-foreground" />
            <ColorSwatch name="border" value="#e3e8d8" className="bg-border text-foreground" />
            <ColorSwatch name="muted-fg" value="#6b7561" className="bg-muted-foreground text-background" />
          </div>
        </Section>

        <Separator className="my-12" />

        {/* ============================================================ */}
        {/* PHASE 1 — Typography                                          */}
        {/* ============================================================ */}
        <Section
          title="Typography"
          subtitle="Plus Jakarta Sans (headings) + Inter (body) + Noto Sans Devanagari (Hindi) + JetBrains Mono (code)"
        >
          <div className="space-y-6">
            <div>
              <p className="text-overline text-muted-foreground mb-2">Display</p>
              <p className="text-display">Bring home a little green</p>
            </div>
            <div>
              <p className="text-overline text-muted-foreground mb-2">H1 / H2 / H3 / H4</p>
              <p className="text-h1 mb-1">Healthy plants, delivered with care</p>
              <p className="text-h2 mb-1">Best sellers this week</p>
              <p className="text-h3 mb-1">Snake Plant — Sansevieria</p>
              <p className="text-h4">Featured categories</p>
            </div>
            <div>
              <p className="text-overline text-muted-foreground mb-2">Body (Inter)</p>
              <p className="text-body-lg mb-2">
                GrowPlants is Sonipat&apos;s trusted botanical marketplace — shop
                healthy plants, premium planters, and gardening supplies, or book
                verified local gardeners for balcony setup, landscaping, and
                plant care.
              </p>
              <p className="text-body mb-1">
                Body text uses Inter at 16px with 1.5 line-height for
                readability across all breakpoints.
              </p>
              <p className="text-body-sm text-muted-foreground">
                Secondary text uses the muted-foreground token at 14px.
              </p>
            </div>
            <div>
              <p className="text-overline text-muted-foreground mb-2">Devanagari (Noto Sans)</p>
              <p className="text-body" style={{ fontFamily: "var(--font-noto-devanagari)" }}>
                ग्रोप्लांट्स सोनीपत का भरोसेमंद वनस्पति बाज़ार है — स्वस्थ पौधे, प्रीमियम
                प्लांटर और बागवानी सामग्री खरीदें, या सत्यापित माली बुक करें।
              </p>
            </div>
          </div>
        </Section>

        <Separator className="my-12" />

        {/* ============================================================ */}
        {/* PHASE 1 — Bilingual Store                                     */}
        {/* ============================================================ */}
        <Section
          title="Bilingual Store (Zustand)"
          subtitle="Instant EN ↔ HI toggle, persisted to localStorage"
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-h3">Live language toggle</CardTitle>
              <div className="flex items-center gap-2">
                <LanguageToggle variant="button" />
                <LanguageToggle variant="icon" />
              </div>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <p className="text-overline text-muted-foreground">Common labels</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">{t("common.btn.addToCart")}</Badge>
                  <Badge variant="secondary">{t("common.btn.buyNow")}</Badge>
                  <Badge variant="secondary">{t("common.btn.viewAll")}</Badge>
                  <Badge variant="secondary">{t("common.btn.saveChanges")}</Badge>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-overline text-muted-foreground">Hero copy</p>
                <p className="text-h4">{t("hero.title")}</p>
                <p className="text-body-sm text-muted-foreground">{t("hero.subtitle")}</p>
                <div className="flex gap-2">
                  <Button size="sm">{t("hero.ctaPrimary")}</Button>
                  <Button size="sm" variant="outline">{t("hero.ctaSecondary")}</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </Section>

        <Separator className="my-12" />

        {/* ============================================================ */}
        {/* PHASE 1 — shadcn/ui Base                                      */}
        {/* ============================================================ */}
        <Section
          title="shadcn/ui Base Components"
          subtitle="50+ primitives pre-installed (button, input, dialog, sheet, drawer, table, calendar, etc.)"
        >
          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <p className="text-overline text-muted-foreground mb-3">Button variants & sizes</p>
                <div className="flex flex-wrap items-center gap-3">
                  <Button>Primary</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button size="sm">Small</Button>
                  <Button size="lg">Large</Button>
                  <Button size="icon" aria-label="Cart">
                    <ShoppingCart className="size-4" />
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-overline text-muted-foreground mb-3">Interactive state check</p>
                <div className="flex items-center gap-3">
                  <Button onClick={() => setCount((c) => c + 1)}>
                    Clicked {count} times
                  </Button>
                  <Button variant="outline" onClick={() => setCount(0)} disabled={count === 0}>
                    Reset
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-overline text-muted-foreground mb-3">Lucide icons</p>
                <div className="flex flex-wrap gap-4 text-foreground">
                  <Sprout className="size-5" aria-label="Plant" />
                  <ShoppingCart className="size-5" aria-label="Cart" />
                  <Heart className="size-5" aria-label="Wishlist" />
                  <Sun className="size-5" aria-label="Sunlight" />
                  <Droplets className="size-5" aria-label="Water" />
                  <Leaf className="size-5" aria-label="Leaf" />
                  <Star className="size-5" aria-label="Rating" />
                  <CheckCircle2 className="size-5" aria-label="Verified" />
                  <Languages className="size-5" aria-label="Language" />
                  <PackageSearch className="size-5" aria-label="Package" />
                  <Bell className="size-5" aria-label="Notify" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Section>

        <Separator className="my-12" />

        {/* ============================================================ */}
        {/* PHASE 1 — Utility Formatters                                  */}
        {/* ============================================================ */}
        <Section
          title="Utility Formatters"
          subtitle="INR currency, dates, phone, time slots — all PRD §29.7 compliant"
        >
          <Card>
            <CardContent className="p-6">
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-body-sm">
                <FormatRow label="formatINR(499)" value={formatINR(499)} />
                <FormatRow label="formatINR(1299.5, { decimals: 2 })" value={formatINR(1299.5, { decimals: 2 })} />
                <FormatRow label="formatINR(999, { symbol: false })" value={formatINR(999, { symbol: false })} />
                <FormatRow label="formatNumberIN(125000)" value={formatNumberIN(125000)} />
                <FormatRow label="discountPercent(999, 699)" value={`${discountPercent(999, 699)}%`} />
                <FormatRow label="formatDate('2024-07-15')" value={formatDate("2024-07-15")} />
                <FormatRow label="formatDateTime(now)" value={formatDateTime(new Date())} />
                <FormatRow label="formatPhone('919876543210')" value={formatPhone("919876543210")} />
                <FormatRow label="formatTimeSlot('09:00-11:00')" value={formatTimeSlot("09:00-11:00")} />
                <FormatRow label="slugify('Snake Plant - Sansevieria')" value={slugify("Snake Plant - Sansevieria")} />
              </dl>
            </CardContent>
          </Card>
        </Section>

        <Separator className="my-12" />

        {/* ============================================================ */}
        {/* PHASE 2 — Brand Lockup                                        */}
        {/* ============================================================ */}
        <Section
          title="Phase 2 — Brand Lockup"
          subtitle="Logo, LogoMark — used in Header, Auth layout, Footer, Email templates"
        >
          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <p className="text-overline text-muted-foreground mb-3">LogoMark — icon variants</p>
                <div className="flex items-end gap-6 flex-wrap">
                  <div className="flex flex-col items-center gap-2">
                    <LogoMark size="sm" />
                    <span className="text-caption text-muted-foreground">sm</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <LogoMark size="md" />
                    <span className="text-caption text-muted-foreground">md</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <LogoMark size="lg" />
                    <span className="text-caption text-muted-foreground">lg</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <LogoMark size="xl" />
                    <span className="text-caption text-muted-foreground">xl</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <LogoMark size="lg" variant="tile" className="text-primary" />
                    <span className="text-caption text-muted-foreground">tile</span>
                  </div>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-overline text-muted-foreground mb-3">Logo — full lockup variants</p>
                <div className="space-y-4">
                  <Logo size="sm" showTagline />
                  <Logo size="md" showTagline />
                  <Logo size="lg" showTagline />
                </div>
              </div>
            </CardContent>
          </Card>
        </Section>

        <Separator className="my-12" />

        {/* ============================================================ */}
        {/* PHASE 2 — Rating + Price                                      */}
        {/* ============================================================ */}
        <Section
          title="Rating & Price"
          subtitle="Interactive rating, display rating (half-stars), INR-formatted price with discount"
        >
          <Card>
            <CardContent className="p-6 space-y-8">
              <div>
                <p className="text-overline text-muted-foreground mb-3">Rating — display (with half-stars + count)</p>
                <div className="space-y-2">
                  <Rating value={4.5} count={128} showCount size="md" />
                  <Rating value={3.7} count={42} showCount size="md" />
                  <Rating value={5} count={9} showCount size="md" />
                  <Rating value={0} count={0} showCount size="md" countLabel="No reviews yet" />
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-overline text-muted-foreground mb-3">Rating — interactive (try clicking)</p>
                <div className="space-y-3">
                  <Rating
                    value={interactiveRating}
                    variant="interactive"
                    size="lg"
                    onChange={setInteractiveRating}
                  />
                  <p className="text-body-sm text-muted-foreground">
                    Selected: <span className="font-semibold text-foreground">{interactiveRating} star{interactiveRating > 1 ? "s" : ""}</span>
                  </p>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-overline text-muted-foreground mb-3">Price — INR formatted with discount</p>
                <div className="space-y-3">
                  <Price sellingPrice={499} basePrice={799} size="lg" />
                  <Price sellingPrice={1299} basePrice={1999} size="md" />
                  <Price sellingPrice={149} size="sm" />
                  <Price sellingPrice={2499} basePrice={2999} size="xl" />
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-overline text-muted-foreground mb-3">DiscountBadge — standalone pill</p>
                <div className="flex items-center gap-3">
                  <DiscountBadge basePrice={999} sellingPrice={699} size="sm" />
                  <DiscountBadge basePrice={1999} sellingPrice={1499} size="md" />
                  <DiscountBadge basePrice={4999} sellingPrice={3499} size="lg" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Section>

        <Separator className="my-12" />

        {/* ============================================================ */}
        {/* PHASE 2 — StatusPill                                          */}
        {/* ============================================================ */}
        <Section
          title="StatusPill"
          subtitle="Enum-aware status badges — used across orders, bookings, providers, returns"
        >
          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <p className="text-overline text-muted-foreground mb-2">Order statuses</p>
                <div className="flex flex-wrap gap-2">
                  <StatusPill status="pending" />
                  <StatusPill status="confirmed" />
                  <StatusPill status="processing" />
                  <StatusPill status="out_for_delivery" />
                  <StatusPill status="delivered" />
                  <StatusPill status="cancelled" />
                  <StatusPill status="return_requested" />
                  <StatusPill status="refunded" />
                </div>
              </div>
              <div>
                <p className="text-overline text-muted-foreground mb-2">Booking statuses</p>
                <div className="flex flex-wrap gap-2">
                  <StatusPill status="pending" />
                  <StatusPill status="provider_assigned" />
                  <StatusPill status="in_progress" />
                  <StatusPill status="completed" />
                  <StatusPill status="no_show_provider" />
                  <StatusPill status="disputed" />
                </div>
              </div>
              <div>
                <p className="text-overline text-muted-foreground mb-2">Payment & verification statuses</p>
                <div className="flex flex-wrap gap-2">
                  <StatusPill status="paid" />
                  <StatusPill status="failed" />
                  <StatusPill status="partial_refund" />
                  <StatusPill status="approved" />
                  <StatusPill status="rejected" />
                  <StatusPill status="under_review" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Section>

        <Separator className="my-12" />

        {/* ============================================================ */}
        {/* PHASE 2 — SectionHeader + Container                           */}
        {/* ============================================================ */}
        <Section
          title="SectionHeader"
          subtitle="Reusable section title + subtitle + optional action link"
        >
          <Card>
            <CardContent className="p-6 space-y-6">
              <SectionHeader
                title="Featured Plants"
                subtitle="Hand-picked healthy plants for your home"
                action={{ label: "View All", href: "/shop" }}
                icon={Sprout}
              />
              <Separator />
              <SectionHeader
                title="Best Sellers"
                subtitle="Most-loved plants by Sonipat customers"
                icon={Star}
              />
              <Separator />
              <SectionHeader
                title=" Gardening Services"
                subtitle="Book verified local gardeners"
                action={{ label: "Browse Services", href: "/services" }}
                align="center"
              />
            </CardContent>
          </Card>
        </Section>

        <Separator className="my-12" />

        {/* ============================================================ */}
        {/* PHASE 2 — Product Primitives                                  */}
        {/* ============================================================ */}
        <Section
          title="Product Primitives"
          subtitle="StockStatus, CareSpecs, QuantitySelector, ProductBadges"
        >
          <Card>
            <CardContent className="p-6 space-y-8">
              <div>
                <p className="text-overline text-muted-foreground mb-3">StockStatus — inventory states</p>
                <div className="space-y-2">
                  <StockStatus availableStock={25} />
                  <StockStatus availableStock={3} />
                  <StockStatus availableStock={0} />
                  <StockStatus availableStock={0} variant="notify-me" onNotify={() => alert("Notify me clicked!")} />
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-overline text-muted-foreground mb-3">CareSpecs — plant care at a glance</p>
                <div className="space-y-4">
                  <CareSpecs
                    sunlight="partial_shade"
                    water="weekly"
                    difficulty="easy"
                    isPetSafe={true}
                    variant="compact"
                  />
                  <CareSpecs
                    sunlight="full_sun"
                    water="daily"
                    difficulty="moderate"
                    isPetSafe={false}
                    variant="full"
                  />
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-overline text-muted-foreground mb-3">QuantitySelector — try clicking +/-</p>
                <div className="flex items-end gap-6 flex-wrap">
                  <div className="flex flex-col gap-2">
                    <QuantitySelector
                      value={quantity}
                      onChange={setQuantity}
                      max={10}
                    />
                    <span className="text-caption text-muted-foreground">sm (default) · max 10</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <QuantitySelector
                      value={1}
                      onChange={() => {}}
                      max={5}
                      size="md"
                    />
                    <span className="text-caption text-muted-foreground">md · max 5</span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <QuantitySelector
                      value={3}
                      onChange={() => {}}
                      variant="readonly"
                    />
                    <span className="text-caption text-muted-foreground">readonly (order history)</span>
                  </div>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-overline text-muted-foreground mb-3">ProductBadges — Sale / New / Best Seller / OOS</p>
                <div className="space-y-3">
                  <ProductBadges isOnSale discountPercent={30} />
                  <ProductBadges isBestseller isNewArrival />
                  <ProductBadges isOutOfStock />
                  <ProductBadges isOnSale discountPercent={45} isBestseller isNewArrival />
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-overline text-muted-foreground mb-3">RatingHistogram — review breakdown</p>
                <RatingHistogram
                  averageRating={4.3}
                  totalCount={156}
                  showHeader
                  breakdown={[
                    { stars: 5, count: 89, percentage: 57 },
                    { stars: 4, count: 42, percentage: 27 },
                    { stars: 3, count: 14, percentage: 9 },
                    { stars: 2, count: 7, percentage: 4 },
                    { stars: 1, count: 4, percentage: 3 },
                  ]}
                />
              </div>
            </CardContent>
          </Card>
        </Section>

        <Separator className="my-12" />

        {/* ============================================================ */}
        {/* PHASE 2 — Cart Indicator                                      */}
        {/* ============================================================ */}
        <Section
          title="Free Shipping Progress"
          subtitle="Cart drawer / cart page indicator — ₹499 threshold (PRD §32.2)"
        >
          <Card>
            <CardContent className="p-6 space-y-4">
              <FreeShippingProgressBar subtotal={199} />
              <FreeShippingProgressBar subtotal={399} />
              <FreeShippingProgressBar subtotal={499} />
              <Separator />
              <p className="text-overline text-muted-foreground">Compact variant (mobile)</p>
              <FreeShippingProgressBar subtotal={349} variant="compact" />
              <FreeShippingProgressBar subtotal={499} variant="compact" />
            </CardContent>
          </Card>
        </Section>

        <Separator className="my-12" />

        {/* ============================================================ */}
        {/* PHASE 2 — Filter Chips + IconBadge                            */}
        {/* ============================================================ */}
        <Section
          title="Filter Chips & Icon Badge"
          subtitle="Active-filter bar + Header icons (cart/wishlist/notifications)"
        >
          <Card>
            <CardContent className="p-6 space-y-6">
              <div>
                <p className="text-overline text-muted-foreground mb-3">FilterChip — try removing</p>
                <div className="flex flex-wrap gap-2">
                  {chips.map((chip, i) => (
                    <FilterChip
                      key={chip}
                      label={chip}
                      onRemove={() => setChips((c) => c.filter((_, idx) => idx !== i))}
                    />
                  ))}
                  {chips.length === 0 && (
                    <span className="text-body-sm text-muted-foreground">All filters cleared.</span>
                  )}
                  {chips.length === 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setChips(["Indoor Plants", "₹100–₹500", "4★ & above", "Easy care"])}
                    >
                      Reset chips
                    </Button>
                  )}
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-overline text-muted-foreground mb-3">IconBadge — header icon variants</p>
                <div className="flex items-center gap-6">
                  <IconBadge icon={Search} count={0} label="Search" />
                  <IconBadge icon={Heart} count={3} label="Wishlist" href="/wishlist" />
                  <IconBadge icon={ShoppingCart} count={2} label="Cart" href="/cart" />
                  <IconBadge icon={Bell} count={12} label="Notifications" />
                  <IconBadge icon={Bell} count={150} label="Notifications (capped)" />
                </div>
              </div>
            </CardContent>
          </Card>
        </Section>

        <Separator className="my-12" />

        {/* ============================================================ */}
        {/* PHASE 2 — Empty + Error States                                */}
        {/* ============================================================ */}
        <Section
          title="Empty & Error States"
          subtitle="Composable feedback components used across cart, wishlist, orders, bookings, search"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-2">
                <EmptyState
                  icon={ShoppingCart}
                  title="Your cart is empty"
                  description="Browse our healthy plants and premium planters to get started."
                  action={{ label: "Shop Plants", href: "/shop" }}
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-2">
                <EmptyState
                  icon={Heart}
                  title="Your wishlist is empty"
                  description="Tap the heart on any product to save it here."
                  action={{ label: "Browse Shop", href: "/shop" }}
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-2">
                <EmptyState
                  icon={PackageSearch}
                  title="No orders yet"
                  description="When you place your first order, it will appear here."
                  size="sm"
                />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-2">
                <ErrorState
                  title="Couldn't load orders"
                  description="Check your connection and try again."
                  retry={{ label: "Retry", onClick: () => alert("Retrying...") }}
                  errorCode="NETWORK_001"
                  showSupport
                />
              </CardContent>
            </Card>
          </div>
        </Section>

        <Separator className="my-12" />

        {/* ============================================================ */}
        {/* PHASE 2 — Skeletons                                           */}
        {/* ============================================================ */}
        <Section
          title="Loading Skeletons"
          subtitle="ProductCardSkeleton, SectionSkeleton, ListSkeleton, FormSkeleton"
        >
          <div className="space-y-6">
            <div>
              <p className="text-overline text-muted-foreground mb-3">ProductCardSkeleton (×4 in a grid)</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ProductCardSkeleton />
                <ProductCardSkeleton />
                <ProductCardSkeleton />
                <ProductCardSkeleton />
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-overline text-muted-foreground mb-3">ListSkeleton (orders/bookings)</p>
              <ListSkeleton count={3} />
            </div>
            <Separator />
            <div>
              <p className="text-overline text-muted-foreground mb-3">FormSkeleton (auth/profile/address)</p>
              <div className="max-w-md">
                <FormSkeleton fields={4} />
              </div>
            </div>
          </div>
        </Section>

        <Separator className="my-12" />

        {/* ============================================================ */}
        {/* PHASE 2 — Constants Sanity                                    */}
        {/* ============================================================ */}
        <Section
          title="Constants Sanity Check"
          subtitle="All PRD §32.2 defaults imported successfully"
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <ConstantCard label="FREE_SHIPPING_THRESHOLD" value={`₹${FREE_SHIPPING_THRESHOLD}`} />
            <ConstantCard label="COD_MAX_AMOUNT" value={`₹${COD_MAX_AMOUNT}`} />
            <ConstantCard label="DEFAULT_CITY" value={DEFAULT_CITY} />
            <ConstantCard label="DEFAULT_PROVIDER_COMMISSION" value={`${DEFAULT_PROVIDER_COMMISSION}%`} />
            <ConstantCard label="BOOKING_SLOTS" value={`${BOOKING_SLOTS.length} slots`} />
            <ConstantCard label="APP_NAME" value={APP_NAME} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {BOOKING_SLOTS.map((slot) => (
              <Badge key={slot} variant="outline" className="font-mono">
                {formatTimeSlot(slot)}
              </Badge>
            ))}
          </div>
        </Section>

        {/* ---------- Footer ---------- */}
        <footer className="mt-16 pt-8 border-t border-border text-body-sm text-muted-foreground">
          <p>
            Phase 1 (Foundation) + Phase 2 (Design System & Component Library) complete.
            Awaiting approval before starting Phase 3 (Layout System — Header, Footer,
            CartDrawer, MobileNav).
          </p>
        </footer>
      </Container>
    </main>
  );
}

/* ---------- Sub-components (local to scratch page only) ---------- */

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-4">
      <div className="mb-6">
        <h2 className="text-h2 md:text-h2 mb-1">{title}</h2>
        {subtitle && (
          <p className="text-body-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function ColorSwatch({
  name,
  value,
  className,
  textClass = "text-foreground",
}: {
  name: string;
  value: string;
  className: string;
  textClass?: string;
}) {
  return (
    <div
      className={`rounded-lg p-4 ${className} flex flex-col gap-2 aspect-[4/3] justify-end`}
    >
      <p className={`text-caption font-medium ${textClass}`}>{name}</p>
      <p className={`text-overline font-mono ${textClass} opacity-70`}>{value}</p>
    </div>
  );
}

function FormatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 py-2 border-b border-border last:border-0">
      <dt className="text-caption text-muted-foreground font-mono">{label}</dt>
      <dd className="text-body font-medium text-foreground">{value}</dd>
    </div>
  );
}

function ConstantCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-caption text-muted-foreground font-mono">{label}</p>
      <p className="text-body font-semibold mt-1">{value}</p>
    </div>
  );
}
