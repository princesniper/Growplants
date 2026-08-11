"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, X, Trash2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { QuantitySelector } from "@/components/products/QuantitySelector";
import { FreeShippingProgressBar } from "@/components/common/FreeShippingProgressBar";
import { EmptyState } from "@/components/common/EmptyState";
import { useCart } from "@/contexts/CartContext";
import { useBilingual } from "@/store/useBilingual";
import { formatINR } from "@/lib/utils";

/**
 * CartDrawer — slide-out cart sidebar.
 * Source: 05_recreation_prompts.md Prompt 5, PRD §10.1 (Cart Behavior)
 *
 * Features:
 *   - Slides in from the right (Sheet component)
 *   - Free-shipping progress bar at top
 *   - Scrollable item list with image, name, price, quantity selector, remove
 *   - Subtotal + "View Cart" + "Checkout" CTAs at bottom
 *   - Empty state when cart is empty
 *
 * Opens via the CartContext.isDrawerOpen state (controlled by Header cart icon).
 */
export function CartDrawer() {
  const {
    items,
    subtotal,
    itemCount,
    isDrawerOpen,
    closeDrawer,
    updateQuantity,
    removeItem,
    addItem,
  } = useCart();
  const { t } = useBilingual();

  return (
    <Sheet open={isDrawerOpen} onOpenChange={(open) => !open && closeDrawer()}>
      <SheetContent
        side="right"
        className={cn(
          "w-full sm:max-w-md p-0 flex flex-col",
          "[&>button]:hidden" // hide default close button; we use our own
        )}
      >
        {/* ---------- Header ---------- */}
        <SheetHeader className="p-4 border-b border-border space-y-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="size-5 text-primary" aria-hidden="true" />
              <SheetTitle className="text-h4">
                {t("cart.title")}{" "}
                {itemCount > 0 && (
                  <span className="text-body-sm text-muted-foreground font-normal">
                    ({itemCount} {itemCount === 1 ? "item" : "items"})
                  </span>
                )}
              </SheetTitle>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={closeDrawer}
              aria-label="Close cart"
              className="rounded-full"
            >
              <X className="size-5" aria-hidden="true" />
            </Button>
          </div>
          <SheetDescription className="sr-only">
            Your shopping cart with {itemCount} items
          </SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          /* ---------- Empty state ---------- */
          <div className="flex-1 flex items-center justify-center p-6">
            <EmptyState
              icon={ShoppingBag}
              title={t("cart.empty")}
              description={t("cart.empty.desc")}
              action={{ label: t("cart.empty.cta"), href: "/shop" }}
            />
          </div>
        ) : (
          <>
            {/* ---------- Free shipping progress ---------- */}
            <div className="p-4 border-b border-border">
              <FreeShippingProgressBar subtotal={subtotal} variant="compact" />
            </div>

            {/* ---------- Item list ---------- */}
            <ScrollArea className="flex-1">
              <ul className="divide-y divide-border">
                {items.map((item) => (
                  <li key={item.id} className="p-4 flex gap-3">
                    {/* Image */}
                    <Link
                      href={`/product/${item.slug}`}
                      onClick={closeDrawer}
                      className="shrink-0"
                    >
                      <div className="relative size-20 rounded-md overflow-hidden bg-muted">
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          sizes="80px"
                          className="object-cover"
                        />
                      </div>
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/product/${item.slug}`}
                          onClick={closeDrawer}
                          className="text-body-sm font-medium text-foreground hover:text-primary line-clamp-2"
                        >
                          {item.name}
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            // B4 FIX: Undo on cart item removal
                            const removedItem = { ...item };
                            removeItem(item.id);
                            import("sonner").then(({ toast }) => {
                              toast("Item removed from cart", {
                                description: removedItem.name,
                                action: {
                                  label: "Undo",
                                  onClick: () => addItem({
                                    productId: removedItem.productId,
                                    variantId: removedItem.variantId,
                                    name: removedItem.name,
                                    slug: removedItem.slug,
                                    price: removedItem.price,
                                    image: removedItem.image,
                                    quantity: removedItem.quantity,
                                    inStock: removedItem.inStock,
                                  }),
                                },
                                duration: 5000,
                              });
                            });
                          }}
                          className="text-muted-foreground hover:text-destructive shrink-0 p-1 -m-1 rounded"
                          aria-label={t("cart.removeItem")}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      </div>

                      <p className="text-body-sm text-muted-foreground">
                        {formatINR(item.price)}
                      </p>

                      <div className="flex items-center justify-between mt-1">
                        <QuantitySelector
                          value={item.quantity}
                          onChange={(qty) => updateQuantity(item.id, qty)}
                          size="sm"
                        />
                        <p className="text-body font-semibold text-foreground tabular-nums">
                          {formatINR(item.price * item.quantity)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </ScrollArea>

            {/* ---------- Footer: subtotal + CTAs ---------- */}
            <div className="p-4 border-t border-border space-y-3 bg-card">
              <div className="flex items-center justify-between">
                <span className="text-body text-muted-foreground">{t("cart.subtotal")}</span>
                <span className="text-h4 font-bold text-foreground tabular-nums">
                  {formatINR(subtotal)}
                </span>
              </div>
              <Separator />
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" asChild>
                  <Link href="/cart" onClick={closeDrawer}>
                    {t("nav.cart")}
                  </Link>
                </Button>
                <Button asChild className="gap-2">
                  <Link href="/checkout" onClick={closeDrawer}>
                    {t("cart.checkout")}
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
