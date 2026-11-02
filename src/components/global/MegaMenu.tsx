"use client";

import Link from "next/link";
import { ChevronDown, Sun, Sprout, Home, Leaf } from "lucide-react";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { useBilingual } from "@/store/useBilingual";
import type { LucideIcon } from "lucide-react";

/**
 * MegaMenu — need-based desktop dropdown ("Shop by Need").
 * Blueprint B3/C3: shoppers self-select by home conditions (light, care level,
 * pet-safe, room) instead of botanical taxonomy. Every link deep-links into
 * /shop's existing URL-synced filters — no filter logic changes.
 */

interface NeedLink {
  name: string;
  nameHi?: string;
  href: string;
}

interface NeedGroup {
  label: string;
  labelHi: string;
  icon: LucideIcon;
  subtitle: string;
  links: NeedLink[];
}

const NEED_GROUPS: NeedGroup[] = [
  {
    label: "Shop by Light",
    labelHi: "रोशनी के हिसाब से",
    icon: Sun,
    subtitle: "Match your window, not your wishlist",
    links: [
      { name: "Low Light", nameHi: "कम रोशनी", href: "/shop?sunlight=Shade" },
      { name: "Bright Indirect", nameHi: "तेज़ अप्रत्यक्ष", href: "/shop?sunlight=Indirect" },
      { name: "Partial Shade", nameHi: "आंशिक छाया", href: "/shop?sunlight=Partial%20Shade" },
      { name: "Direct Sun", nameHi: "सीधी धूप", href: "/shop?sunlight=Full%20Sun" },
    ],
  },
  {
    label: "Shop by Care",
    labelHi: "देखभाल के हिसाब से",
    icon: Sprout,
    subtitle: "Honest about how much attention they need",
    links: [
      { name: "Beginner Friendly", nameHi: "शुरुआती", href: "/shop?difficulty=Easy" },
      { name: "Moderate Care", nameHi: "मध्यम देखभाल", href: "/shop?difficulty=Moderate" },
      { name: "Expert Only", nameHi: "एक्सपर्ट", href: "/shop?difficulty=Expert" },
      { name: "Pet-Safe", nameHi: "पेट-सेफ", href: "/shop?pet_safe=true" },
    ],
  },
  {
    label: "Shop by Space",
    labelHi: "जगह के हिसाब से",
    icon: Home,
    subtitle: "Right plant for the right corner",
    links: [
      { name: "Indoor", nameHi: "इंडोर", href: "/shop?suitable_for=Indoor" },
      { name: "Balcony", nameHi: "बालकनी", href: "/shop?suitable_for=Balcony" },
      { name: "Outdoor", nameHi: "आउटडोर", href: "/shop?suitable_for=Outdoor" },
      { name: "Office", nameHi: "ऑफिस", href: "/shop?suitable_for=Office" },
    ],
  },
  {
    label: "Collections",
    labelHi: "कलेक्शन",
    icon: Leaf,
    subtitle: "Curated for Sonipat homes",
    links: [
      { name: "Air-Purifying", nameHi: "एयर-प्यूरिफाइंग", href: "/shop?category=air-purifying" },
      { name: "Succulents", nameHi: "सक्यूलेंट", href: "/shop?category=succulent" },
      { name: "Top Rated (4★+)", nameHi: "टॉप रेटेड", href: "/shop?rating=4" },
      { name: "In Stock Only", nameHi: "स्टॉक में", href: "/shop?in_stock=true" },
    ],
  },
];

export function MegaMenu() {
  const { language } = useBilingual();
  const isHi = language === "hi";

  return (
    <NavigationMenu className="hidden lg:flex">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="text-[11px] font-bold uppercase tracking-wide bg-transparent data-[state=open]:bg-transparent hover:text-pine">
            {isHi ? "ज़रूरत के हिसाब से" : "Shop by Need"}
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="w-[720px] p-5 bg-ivory">
              <div className="grid grid-cols-4 gap-5">
                {NEED_GROUPS.map((group) => (
                  <div key={group.label}>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="size-8 rounded-lg bg-pine/10 text-pine flex items-center justify-center shrink-0">
                        <group.icon className="size-4" aria-hidden="true" />
                      </span>
                      <div>
                        <p className="text-body-sm font-semibold text-pine leading-tight">
                          {isHi ? group.labelHi : group.label}
                        </p>
                        <p className="text-caption text-ink-soft leading-tight">{group.subtitle}</p>
                      </div>
                    </div>
                    <ul className="space-y-0.5">
                      {group.links.map((link) => (
                        <li key={link.href}>
                          <NavigationMenuLink asChild>
                            <Link
                              href={link.href}
                              className={cn(
                                "block px-2 py-1.5 rounded-md hover:bg-sage-wash transition-colors",
                                "text-body-sm text-charcoal hover:text-pine"
                              )}
                            >
                              {isHi ? link.nameHi ?? link.name : link.name}
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-3 border-t border-line flex items-center justify-between">
                <p className="text-caption text-ink-soft">
                  {isHi
                    ? "Confused hain? 1-minute quiz se apne ghar ke liye plants chunein."
                    : "Confused which plant to pick? Take the 1-minute quiz."}
                </p>
                <NavigationMenuLink asChild>
                  <Link
                    href="/plant-finder"
                    className="inline-flex items-center gap-1 text-body-sm font-semibold text-brass-deep hover:text-pine transition-colors"
                  >
                    Take the quiz <ChevronDown className="size-3.5 -rotate-90" aria-hidden="true" />
                  </Link>
                </NavigationMenuLink>
              </div>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
