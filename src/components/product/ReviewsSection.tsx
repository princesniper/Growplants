"use client";

import { useState } from "react";
import { Star, BadgeCheck, ThumbsUp, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ProductReview } from "@/lib/product-data";

export function ReviewsSection({
  rating,
  reviewCount,
  productName,
  reviews,
}: {
  rating: number | null;
  reviewCount: number | null;
  productName: string;
  reviews: ProductReview[];
}) {
  const [filter, setFilter] = useState<number | null>(null);
  const filtered = filter ? reviews.filter((r) => Math.round(r.rating) === filter) : reviews;

  // No rating data at all → honest empty state
  if (rating === null || reviewCount === null || reviewCount === 0) {
    return (
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-4">Customer Reviews</h2>
        <div className="flex flex-col items-center justify-center py-10 text-center bg-[#F3F8F1] rounded-xl">
          <div className="size-14 rounded-full bg-white flex items-center justify-center mb-3">
            <MessageSquare className="size-6 text-[#16382B]" aria-hidden="true" />
          </div>
          <h3 className="text-base font-semibold text-gray-800">No reviews yet — be the first</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-md">{productName} hasn&apos;t been reviewed yet. Share your experience to help other plant lovers.</p>
          <Button className="mt-4 bg-[#16382B] hover:bg-[#A8843F] gap-2"><Star className="size-4" aria-hidden="true" />Write a Review</Button>
        </div>
      </div>
    );
  }

  const breakdown = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: reviews.filter((r) => Math.round(r.rating) === stars).length,
    percentage: reviews.length > 0 ? Math.round((reviews.filter((r) => Math.round(r.rating) === stars).length / reviews.length) * 100) : 0,
  }));

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Customer Reviews</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rating summary + histogram */}
        <div className="space-y-4">
          <div className="text-center p-5 bg-[#F3F8F1] rounded-xl">
            <p className="text-4xl font-bold text-[#16382B] tabular-nums">{rating.toFixed(1)}</p>
            <div className="flex items-center justify-center gap-0.5 mt-2">
              {[1, 2, 3, 4, 5].map((s) => (<Star key={s} className={cn("size-4", s <= Math.round(rating) ? "fill-[#C6A15B] text-[#C6A15B]" : "text-gray-200")} />))}
            </div>
            <p className="text-sm text-slate-500 mt-1">{reviewCount} reviews</p>
          </div>
          <div className="space-y-1.5">
            {breakdown.map((b) => (
              <button key={b.stars} onClick={() => setFilter(filter === b.stars ? null : b.stars)} className={cn("flex items-center gap-2 w-full p-1.5 rounded-md hover:bg-slate-50 transition-colors", filter === b.stars && "bg-slate-100")}>
                <span className="text-xs text-slate-600 w-12 text-right">{b.stars} star</span>
                <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full rounded-full bg-[#C6A15B]" style={{ width: `${b.percentage}%` }} /></div>
                <span className="text-xs text-slate-500 w-8 tabular-nums">{b.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Review list */}
        <div className="lg:col-span-2 space-y-3">
          {filter && (<div className="flex items-center gap-2 text-sm text-slate-600"><span>Filtered by: {filter} stars</span><button onClick={() => setFilter(null)} className="text-[#16382B] font-medium hover:underline">Clear</button></div>)}
          {filtered.length > 0 ? (
            filtered.map((review) => (
              <div key={review.id} className="p-4 bg-white border border-slate-100 rounded-lg">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="size-9 rounded-full bg-[#16382B] text-white flex items-center justify-center text-sm font-bold">{review.author.charAt(0)}</div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 flex items-center gap-1">{review.author}{review.verified && <BadgeCheck className="size-4 text-[#16382B]" />}</p>
                      <p className="text-xs text-slate-400">{review.date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">{[1, 2, 3, 4, 5].map((s) => (<Star key={s} className={cn("size-3.5", s <= review.rating ? "fill-[#C6A15B] text-[#C6A15B]" : "text-gray-200")} />))}</div>
                </div>
                {review.title && <p className="text-sm font-semibold text-slate-800 mb-1">{review.title}</p>}
                <p className="text-sm text-slate-600 leading-relaxed">{review.text}</p>
                <div className="flex items-center gap-3 mt-3">
                  <button className="flex items-center gap-1 text-xs text-slate-500 hover:text-[#16382B]"><ThumbsUp className="size-3.5" />Helpful ({review.helpful})</button>
                </div>
              </div>
            ))
          ) : (<p className="text-sm text-slate-500 text-center py-8">No reviews for this filter.</p>)}
        </div>
      </div>
    </div>
  );
}
