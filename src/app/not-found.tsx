import Link from "next/link";
import { Sprout, Search, ArrowRight, Home, ShoppingBag } from "lucide-react";
import { Container } from "@/components/common/Container";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <Container className="flex-1 flex items-center justify-center py-16 md:py-24">
      <div className="text-center max-w-md mx-auto space-y-6">
        {/* Illustration */}
        <div className="relative inline-block">
          <div className="size-24 md:size-32 rounded-full bg-[#F3F8F1] flex items-center justify-center mx-auto">
            <Sprout className="size-12 md:size-16 text-[#16382B]" aria-hidden="true" />
          </div>
          {/* 404 badge */}
          <div className="absolute -top-2 -right-2 bg-[#C6A15B] text-white text-sm font-bold px-3 py-1 rounded-full">
            404
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-[#16382B]">
            Oops! This Page Got Lost in the Garden
          </h1>
          <p className="text-base text-slate-600">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
            Don&apos;t worry — let&apos;s get you back to greener pastures.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild className="bg-[#16382B] hover:bg-[#A8843F] gap-2">
            <Link href="/">
              <Home className="size-4" aria-hidden="true" />
              Back to Home
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-[#16382B] text-[#16382B] hover:bg-[#16382B] hover:text-white gap-2">
            <Link href="/shop">
              <ShoppingBag className="size-4" aria-hidden="true" />
              Browse Shop
            </Link>
          </Button>
        </div>

        {/* Suggested links */}
        <div className="pt-6 border-t border-slate-200">
          <p className="text-xs font-bold tracking-widest uppercase text-[#C6A15B] mb-3">
            Popular Destinations
          </p>
          <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm">
            {[
              { label: "Shop", href: "/shop" },
              { label: "Services", href: "/services" },
              { label: "About Us", href: "/about" },
              { label: "Contact", href: "/contact" },
              { label: "FAQ", href: "/faq" },
            ].map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-slate-600 hover:text-[#16382B] font-medium hover:underline underline-offset-4 transition-colors"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Container>
  );
}
