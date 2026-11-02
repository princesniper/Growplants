import Image from "next/image";
import Link from "next/link";
import { BadgeCheck, Star, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Provider } from "@/data/homepageData";

export interface ProviderCardProps { provider: Provider; className?: string; }

export function ProviderCard({ provider, className }: ProviderCardProps) {
  return (
    <Card className={cn("flex flex-col h-full overflow-hidden hover:shadow-md hover:border-[#16382B]/30 transition-all", className)}>
      <CardContent className="p-4 flex flex-col gap-3 flex-1">
        <div className="flex items-start gap-3">
          <div className="relative size-16 rounded-full overflow-hidden bg-slate-100 ring-2 ring-[#16382B]/10 shrink-0">
            <Image src={provider.avatarImage} alt={provider.name} fill sizes="64px" className="object-cover" loading="lazy" />
          </div>
          <div className="flex flex-col gap-1.5 mt-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-600 text-xs font-semibold w-fit">
              <BadgeCheck className="size-3" aria-hidden="true" />Verified
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#F3F8F1] text-[#16382B] text-xs font-semibold w-fit">
              {provider.experienceYears} yrs exp.
            </span>
          </div>
        </div>
        <div>
          <h3 className="text-base font-semibold text-slate-800">{provider.name}</h3>
          <div className="flex items-center gap-1 mt-0.5">
            <Star className="size-4 fill-[#C6A15B] text-[#C6A15B]" aria-hidden="true" />
            <span className="text-sm font-semibold text-slate-800 tabular-nums">{provider.rating.toFixed(1)}</span>
            <span className="text-sm text-slate-500">{provider.city} · {provider.reviewCount} reviews</span>
          </div>
        </div>
        <p className="text-sm text-slate-600 line-clamp-2">{provider.bio}</p>
        <div className="text-xs text-slate-500 space-y-0.5">
          <p><span className="font-medium text-slate-700">Services:</span> {provider.services}</p>
          <p><span className="font-medium text-slate-700">Bookings:</span> {provider.bookingCount} bookings</p>
        </div>
        <Button asChild size="sm" className="w-full mt-auto gap-1.5 bg-[#16382B] hover:bg-[#A8843F]">
          <Link href={`/providers/${provider.id}`}>Book Now <ArrowRight className="size-3.5" aria-hidden="true" /></Link>
        </Button>
      </CardContent>
    </Card>
  );
}
