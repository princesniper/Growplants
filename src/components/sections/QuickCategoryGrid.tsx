"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Sun, CloudSun, Zap } from "lucide-react";
import { Container } from "@/components/common/Container";
import { SectionHeader } from "@/components/common/SectionHeader";

/**
 * QuickCategoryGrid — "Find your plant by light" (blueprint D1.5).
 * Need-based discovery: 3 large light cards + need chips, all deep-linking
 * into /shop's URL-synced filters. No filter logic changes.
 */

const LIGHT_CARDS = [
  {
    name: "Low Light",
    hindi: "Kam roshni wale kone",
    desc: "North-facing rooms & shaded corners",
    href: "/shop?sunlight=Shade",
    icon: CloudSun,
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80",
  },
  {
    name: "Bright Indirect",
    hindi: "Halki tez roshni",
    desc: "Near windows, no harsh afternoon sun",
    href: "/shop?sunlight=Indirect",
    icon: Sun,
    image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&q=80",
  },
  {
    name: "Direct Sun",
    hindi: "Seedhi dhoop",
    desc: "Balconies & sun-drenched terraces",
    href: "/shop?sunlight=Full%20Sun",
    icon: Zap,
    image: "https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=600&q=80",
  },
];

const NEED_CHIPS = [
  { label: "Beginner-friendly", href: "/shop?difficulty=Easy" },
  { label: "Pet-safe", href: "/shop?pet_safe=true" },
  { label: "Balcony", href: "/shop?suitable_for=Balcony" },
  { label: "Office", href: "/shop?suitable_for=Office" },
  { label: "Air-purifying", href: "/shop?category=air-purifying" },
  { label: "Top rated 4★+", href: "/shop?rating=4" },
];

export function QuickCategoryGrid() {
  return (
    <section className="section-padding bg-ivory" aria-label="Shop by need">
      <Container>
        <SectionHeader
          title="Find your plant by light"
          subtitle="Apne ghar ki roshni ke hisaab se chunein — har plant ka light requirement card par likha hai."
          align="center"
          className="mb-10"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          {LIGHT_CARDS.map((card) => (
            <Link
              key={card.name}
              href={card.href}
              className="group relative overflow-hidden rounded-[20px] shadow-[0_8px_24px_rgba(22,56,43,0.08)] transition-all hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(22,56,43,0.14)]"
            >
              <div className="relative aspect-[4/3] sm:aspect-[4/4.5]">
                <Image
                  src={card.image}
                  alt={`${card.name} plants`}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-pine-ink/80 via-pine-ink/25 to-transparent" aria-hidden="true" />
              </div>
              <div className="absolute inset-x-0 bottom-0 p-5">
                <span className="inline-flex size-10 items-center justify-center rounded-full bg-ivory/15 backdrop-blur border border-ivory/25 text-brass mb-3">
                  <card.icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="font-display text-2xl text-ivory">{card.name}</h3>
                <p className="text-sm text-ivory/70 mt-0.5">{card.hindi}</p>
                <p className="text-sm text-ivory/85 mt-1.5">{card.desc}</p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brass">
                  Shop {card.name.toLowerCase()}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Need chips */}
        <nav aria-label="Shop by need" className="mt-8">
          <ul className="flex flex-wrap items-center justify-center gap-2.5">
            {NEED_CHIPS.map((chip) => (
              <li key={chip.label}>
                <Link
                  href={chip.href}
                  className="inline-flex items-center rounded-full border border-pine/20 bg-paper px-4 py-2 text-sm font-medium text-pine transition-all hover:border-pine hover:bg-pine hover:text-ivory min-h-[40px]"
                >
                  {chip.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </section>
  );
}
