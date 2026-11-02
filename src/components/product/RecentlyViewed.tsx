"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";

interface RecentlyViewedItem {
  slug: string; name: string; image: string; price: number; rating: number;
}

export function RecentlyViewed({ currentSlug }: { currentSlug: string }) {
  const [items, setItems] = useState<RecentlyViewedItem[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("growplants-recently-viewed");
      const parsed: RecentlyViewedItem[] = raw ? JSON.parse(raw) : [];
      const filtered = parsed.filter((i) => i.slug !== currentSlug).slice(0, 4);
      setItems(filtered);
    } catch { /* ignore */ }
  }, [currentSlug]);

  if (items.length === 0) return null;

  return (
    <div className="border-t border-gray-200 pt-8 lg:pt-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Recently Viewed</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {items.map((item) => (
          <Link key={item.slug} href={`/product/${item.slug}`} className="group bg-white border border-slate-100 rounded-xl overflow-hidden hover:shadow-lg transition-all">
            <div className="relative aspect-square bg-slate-50 overflow-hidden">
              <Image src={item.image} alt={item.name} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="p-3">
              <p className="text-xs font-semibold text-slate-800 line-clamp-1">{item.name}</p>
              <p className="text-sm font-bold text-[#16382B] mt-1">₹{item.price}</p>
              <div className="flex items-center gap-1 mt-1">
                <Star className="size-3 fill-[#C6A15B] text-[#C6A15B]" aria-hidden="true" />
                <span className="text-xs text-slate-500">{item.rating.toFixed(1)}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
