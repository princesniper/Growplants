import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Gift } from "lucide-react";
import { Container } from "@/components/common/Container";

/**
 * CombosBannerSection — "The combo is the gift." (blueprint D1.7).
 * Pot-pairing as the default purchase unit: plant + pot, paired visually.
 * Prices shown are placeholders from product data; no invented bundle math.
 */
export function CombosBannerSection() {
  return (
    <section className="section-padding bg-sage-wash" aria-label="Plant and pot combos">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center rounded-[28px] bg-pine-deep text-ivory overflow-hidden">
          {/* Image */}
          <div className="relative min-h-[280px] lg:min-h-[420px]">
            <Image
              src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1000&q=80"
              alt="Plant styled in a ceramic planter"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-pine-deep/40 lg:bg-gradient-to-r lg:from-transparent lg:to-pine-deep" aria-hidden="true" />
          </div>

          {/* Copy */}
          <div className="p-8 md:p-12 lg:pl-0 lg:pr-12">
            <p className="inline-flex items-center gap-1.5 rounded-full border border-brass/40 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-brass">
              <Gift className="size-3.5" aria-hidden="true" />
              Plant + Pot Combos
            </p>
            <h2 className="font-display text-ivory mt-4 text-3xl md:text-5xl leading-tight">
              The combo is <em className="text-brass">the gift.</em>
            </h2>
            <p className="mt-4 text-ivory/75 leading-relaxed max-w-md">
              Har plant ke saath perfectly-fitting pot — PDP par tap karke preview dekhein,
              phir ek saath add karein. Gifting ke liye ready, koi guesswork nahi.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-ivory/80">
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-brass" aria-hidden="true" />
                Pot preview — kharidne se pehle dekhein kaisa lagega
              </li>
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-brass" aria-hidden="true" />
                Size-matched — galat pot ka tension khatam
              </li>
              <li className="flex items-center gap-2">
                <span className="size-1.5 rounded-full bg-brass" aria-hidden="true" />
                Gift-ready packing on request
              </li>
            </ul>
            <Link
              href="/shop"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-brass px-7 py-3.5 text-base font-semibold text-pine-ink transition-all hover:bg-ivory hover:-translate-y-0.5 min-h-[48px]"
            >
              Shop combos
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
