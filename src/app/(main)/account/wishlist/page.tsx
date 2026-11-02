"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { Container } from "@/components/common/Container";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";
import { useWishlist } from "@/contexts/WishlistContext";
import { useCart } from "@/contexts/CartContext";
import { appToast } from "@/lib/toast";
import { formatINR } from "@/lib/utils";
import { getAllProducts, type ShopProduct } from "@/lib/shop-products";

export default function WishlistPage() {
  const { wishlistIds, removeFromWishlist } = useWishlist();
  const { addItem } = useCart();

  // Use ALL products (101 real products) instead of just 12 homepage products
  const allProducts = getAllProducts();
  const items = allProducts.filter((p) => wishlistIds.includes(p.id));

  if (items.length === 0) {
    return <Container className="py-16"><EmptyState icon={Heart} title="Your wishlist is empty" description="Tap the heart icon on any product to save it here for later." action={{ label: "Shop Plants", href: "/shop" }} size="lg" /></Container>;
  }

  const handleMoveToCart = (product: ShopProduct) => {
    addItem({ productId: product.id, variantId: null, name: product.name, slug: product.slug, price: product.price, image: product.image, quantity: 1, inStock: product.inStock });
    removeFromWishlist(product.id);
    appToast.success("Moved to cart", `${product.name} added to cart`);
  };

  return (
    <Container className="py-6 md:py-8">
      <h1 className="text-2xl font-bold text-[#16382B] mb-6">My Wishlist ({items.length})</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {items.map((p) => (
          <div key={p.id} className="group flex flex-col rounded-lg border border-slate-200 bg-white overflow-hidden hover:shadow-md transition-all">
            <Link href={`/product/${p.slug}`} className="relative block aspect-square bg-slate-50 overflow-hidden">
              <Image src={p.image} alt={p.name} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" />
              <button onClick={() => { removeFromWishlist(p.id); appToast.info("Removed", `${p.name} removed from wishlist`); }} className="absolute top-2 right-2 size-8 rounded-full bg-white/90 shadow-sm flex items-center justify-center text-red-500 hover:bg-white" aria-label="Remove from wishlist"><Trash2 className="size-4" /></button>
            </Link>
            <div className="flex flex-col gap-1.5 p-3 flex-1">
              <p className="text-xs font-bold text-[#16382B]">{p.category.toUpperCase()}</p>
              <Link href={`/product/${p.slug}`} className="text-sm font-medium text-slate-800 line-clamp-2 hover:text-[#16382B]">{p.name}</Link>
              <p className="text-lg font-bold text-[#16382B] tabular-nums">{formatINR(p.price)}</p>
              <Button onClick={() => handleMoveToCart(p)} size="sm" disabled={!p.inStock} className="bg-[#16382B] hover:bg-[#A8843F] gap-1.5 mt-auto"><ShoppingCart className="size-3.5" />{p.inStock ? "Move to Cart" : "Out of Stock"}</Button>
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}
