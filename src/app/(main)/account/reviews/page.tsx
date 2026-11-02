"use client";

import Link from "next/link";
import { Star, MessageSquare } from "lucide-react";
import { Container } from "@/components/common/Container";
import { EmptyState } from "@/components/common/EmptyState";

// Mock reviews (same as PDP mock reviews for consistency)
const MY_REVIEWS = [
  { id: "r1", productName: "Poinsettia Pink Plant", productSlug: "poinsettia-pink-plant", rating: 5, title: "Beautiful, healthy plant!", text: "Arrived in perfect condition. The packaging was excellent and the plant is thriving. Highly recommend GrowPlants!", date: "2024-12-15", helpful: 24 },
  { id: "r2", productName: "Money Plant Golden", productSlug: "money-plant-golden", rating: 4, title: "Good quality plant", text: "Plant is healthy and as described. Delivery was on time. The only issue is the pot was slightly smaller than expected.", date: "2024-12-10", helpful: 12 },
  { id: "r3", productName: "Snake Plant", productSlug: "snake-plant", rating: 5, text: "Exactly as shown in photos. Been a week and it's already growing new leaves.", date: "2024-12-05", helpful: 8 },
];

export default function ReviewsPage() {
  if (MY_REVIEWS.length === 0) {
    return <Container className="py-16"><EmptyState icon={MessageSquare} title="No reviews yet" description="After your order is delivered, you can write reviews to help other plant lovers." action={{ label: "Shop Plants", href: "/shop" }} size="lg" /></Container>;
  }

  return (
    <Container className="py-6 md:py-8">
      <h1 className="text-2xl font-bold text-[#16382B] mb-6">My Reviews ({MY_REVIEWS.length})</h1>
      <div className="space-y-3">
        {MY_REVIEWS.map((r) => (
          <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-4">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <Link href={`/product/${r.productSlug}`} className="text-sm font-semibold text-slate-800 hover:text-[#16382B]">{r.productName}</Link>
                <p className="text-xs text-slate-400">{r.date}</p>
              </div>
              <div className="flex items-center gap-0.5">{[1, 2, 3, 4, 5].map((s) => <Star key={s} className={`size-3.5 ${s <= r.rating ? "fill-[#C6A15B] text-[#C6A15B]" : "text-gray-200"}`} />)}</div>
            </div>
            {r.title && <p className="text-sm font-medium text-slate-800 mb-1">{r.title}</p>}
            <p className="text-sm text-slate-600 leading-relaxed">{r.text}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-slate-400">👍 Helpful ({r.helpful})</span>
              <button className="text-xs text-[#16382B] font-medium hover:underline">Edit</button>
              <button className="text-xs text-red-500 font-medium hover:underline">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}
