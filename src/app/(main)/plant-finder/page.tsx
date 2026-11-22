"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  SunDim, CloudSun, Sun, Sunrise, Sprout, Leaf, Flower2, PawPrint,
  ShieldCheck, Lamp, Armchair, Building2, Wallet, RotateCcw,
  ArrowLeft, ArrowRight, SearchX, Info, Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/common/Container";
import { PageHero } from "@/components/common/PageHero";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/products/ProductCard";
import {
  getAllProducts, sortProducts,
  SUNLIGHT_OPTIONS, DIFFICULTY_OPTIONS, SUITABLE_FOR_OPTIONS,
  type ShopProduct,
} from "@/lib/shop-products";
import type { Product } from "@/data/homepageData";

/**
 * Plant Finder quiz (/plant-finder) — blueprint Part F2.
 * 5 steps: Light → Experience → Pets/kids → Space → Budget → curated results.
 * Results deep-link to /shop with pre-applied params + ?quiz=1.
 *
 * DATA CAVEATS (honoured, not "fixed" — the data files are read-only):
 * - sunInfo is heavily skewed: 42/48 plants are "Full Sun", 5 "Partial Shade",
 *   1 "Shade", 0 "Indirect". So "Bright indirect" also matches Partial Shade /
 *   Shade, otherwise it would return zero results.
 * - difficulty is hardcoded "Easy" for EVERY product, so Q2 (experience) is
 *   never a hard filter — it only shapes the per-card rationale.
 * - isPetSafe is hardcoded false for every plant (true only for pots), so Q3
 *   (pets/kids) is never a hard filter — results carry an honest note instead.
 * - suitableFor holds category SLUGS ("indoor", "outdoor", ...), not the
 *   display names in SUITABLE_FOR_OPTIONS ("Indoor", "Outdoor", ...).
 * - Results are plants only (productType === "plant"); pots are excluded
 *   because the quiz matches a plant to a home, not a container.
 * Hard filters (light, space, budget, in-stock) relax in tiers so the quiz
 * never dead-ends on an empty grid; any relaxation is stated on screen.
 */

/* ------------------------------------------------------------------ */
/* Quiz option definitions                                             */
/* ------------------------------------------------------------------ */

type LightId = "low" | "bright" | "direct" | "balcony";
type ExpId = "first" | "some" | "expert";
type SpaceId = "desk" | "floor" | "balcony" | "hanging";
type BudgetId = "under99" | "mid" | "premium";

const LIGHT_OPTIONS: { id: LightId; label: string; hint: string; icon: typeof Sun; sun: string[] }[] = [
  { id: "low", label: "Low light", hint: "Kam roshni — khidki se door ya north-facing room", icon: SunDim, sun: SUNLIGHT_OPTIONS.filter((s) => s === "Shade" || s === "Partial Shade") },
  { id: "bright", label: "Bright indirect", hint: "Ujli roshni, par seedhi dhoop nahi aati", icon: CloudSun, sun: SUNLIGHT_OPTIONS.filter((s) => s === "Indirect" || s === "Partial Shade" || s === "Shade") },
  { id: "direct", label: "Direct sun", hint: "Din mein kai ghante seedhi dhoop aati hai", icon: Sun, sun: SUNLIGHT_OPTIONS.filter((s) => s === "Full Sun") },
  { id: "balcony", label: "Balcony — full sun", hint: "Khuli balcony, poori dhoop milti hai", icon: Sunrise, sun: SUNLIGHT_OPTIONS.filter((s) => s === "Full Sun" || s === "Partial Shade") },
];

const EXP_OPTIONS: { id: ExpId; label: string; hint: string; icon: typeof Sprout }[] = [
  { id: "first", label: "First-timer", hint: "Pehla plant le raha/rahi hoon" , icon: Sprout },
  { id: "some", label: "Kuch rakhe hain", hint: "2–3 plants pehle se hain", icon: Leaf },
  { id: "expert", label: "Experienced", hint: "Plants ki dekhbhaal achhe se aati hai", icon: Flower2 },
];

const PET_OPTIONS: { id: boolean; label: string; hint: string; icon: typeof PawPrint }[] = [
  { id: true, label: "Haan, pets ya chhote bachche hain", hint: "Pet-safe plants ko priority deni hai", icon: PawPrint },
  { id: false, label: "Nahi, koi nahi", hint: "Pets ya chhote bachche nahi hain", icon: ShieldCheck },
];

// Space maps to category SLUGS (suitableFor holds slugs, not display names).
// "Balcony" label is taken from SUITABLE_FOR_OPTIONS; hanging has no slug in
// the catalogue, so it applies no hard filter (rationale + note only).
const SPACE_OPTIONS: { id: SpaceId; label: string; hint: string; icon: typeof Lamp; slugs: string[] }[] = [
  { id: "desk", label: "Desk / table", hint: "Chhota plant, table ya shelf ke liye", icon: Lamp, slugs: ["indoor"] },
  { id: "floor", label: "Floor corner", hint: "Bada plant, floor par rakhne ke liye", icon: Armchair, slugs: ["indoor", "outdoor"] },
  { id: "balcony", label: SUITABLE_FOR_OPTIONS.find((s) => s === "Balcony") ?? "Balcony", hint: "Balcony ya terrace ke liye", icon: Building2, slugs: ["outdoor"] },
  { id: "hanging", label: "Hanging", hint: "Latkaane wala planter / hanging plant", icon: Leaf, slugs: [] },
];

const BUDGET_OPTIONS: { id: BudgetId; label: string; hint: string; min: number; max: number }[] = [
  { id: "under99", label: "₹99 se kam", hint: "Chhota budget, pehli baar try karna hai", min: 0, max: 98 },
  { id: "mid", label: "₹99 – ₹299", hint: "Achha plant, reasonable price", min: 99, max: 299 },
  { id: "premium", label: "₹300 se upar", hint: "Premium / bada plant chahiye", min: 300, max: Number.POSITIVE_INFINITY },
];

const STEP_TITLES = [
  "Aapke ghar mein dhoop kaisi aati hai?",
  "Pehle plants rakhe hain?",
  "Ghar mein pets ya chhote bachche hain?",
  "Plant kahan rakhenge?",
  "Budget kya hai?",
];

/* ------------------------------------------------------------------ */
/* Shop-page ProductCard adapter (same shape as /shop)                  */
/* ------------------------------------------------------------------ */

function toProductCard(p: ShopProduct): Product {
  return {
    id: p.id, categoryBadge: p.category.toUpperCase(), name: p.name, image: p.image,
    rating: p.rating, reviewCount: p.reviewCount, sunInfo: p.sunInfo, waterInfo: p.waterInfo,
    price: p.price, originalPrice: p.originalPrice, discountPercent: p.discountPercent,
    isBestseller: p.isBestseller, slug: p.slug, availableStock: p.inStock ? 10 : 0,
    isBestseller_bool: p.isBestseller, isNewArrival: p.isNewArrival, isAirPurifying: p.isAirPurifying,
    isPetSafe: p.isPetSafe, difficulty: p.difficulty,
    tags: [...(p.isBestseller ? ["bestseller"] : []), ...(p.isNewArrival ? ["new"] : []), ...(p.isAirPurifying ? ["air-purifying"] : [])],
  };
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function PlantFinderPage() {
  const [step, setStep] = useState(0); // 0–4 questions, 5 = results
  const [light, setLight] = useState<LightId | null>(null);
  const [exp, setExp] = useState<ExpId | null>(null);
  const [pets, setPets] = useState<boolean | null>(null);
  const [space, setSpace] = useState<SpaceId | null>(null);
  const [budget, setBudget] = useState<BudgetId | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lightOpt = LIGHT_OPTIONS.find((o) => o.id === light) ?? null;
  const expOpt = EXP_OPTIONS.find((o) => o.id === exp) ?? null;
  const spaceOpt = SPACE_OPTIONS.find((o) => o.id === space) ?? null;
  const budgetOpt = BUDGET_OPTIONS.find((o) => o.id === budget) ?? null;

  const allPlants = useMemo(() => getAllProducts().filter((p) => p.productType === "plant"), []);

  // Answer, then auto-advance after a beat so the selection is visible.
  const answerAndAdvance = (fn: () => void) => {
    fn();
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => setStep((s) => Math.min(s + 1, 5)), 240);
  };

  const startOver = () => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    setLight(null); setExp(null); setPets(null); setSpace(null); setBudget(null);
    setStep(0);
  };

  // Tiered hard filtering — relaxes (budget → space → light) until ≥1 result.
  const { results, relaxed } = useMemo(() => {
    if (step !== 5 || !lightOpt || !expOpt || pets === null || !spaceOpt || !budgetOpt) {
      return { results: [] as ShopProduct[], relaxed: [] as string[] };
    }
    const inStock = (p: ShopProduct) => p.inStock;
    const byLight = (p: ShopProduct) => lightOpt.sun.includes(p.sunInfo);
    const bySpace = (p: ShopProduct) =>
      spaceOpt.slugs.length === 0 || p.suitableFor.some((s) => spaceOpt.slugs.includes(s));
    const byBudget = (p: ShopProduct) => p.price >= budgetOpt.min && p.price <= budgetOpt.max;

    const tiers: { list: ShopProduct[]; relaxed: string[] }[] = [
      { list: allPlants.filter((p) => inStock(p) && byLight(p) && bySpace(p) && byBudget(p)), relaxed: [] },
      { list: allPlants.filter((p) => inStock(p) && byLight(p) && bySpace(p)), relaxed: ["budget"] },
      { list: allPlants.filter((p) => inStock(p) && byLight(p)), relaxed: ["budget", "jagah"] },
      { list: allPlants.filter((p) => inStock(p)), relaxed: ["budget", "jagah", "roshni"] },
    ];
    const tier = tiers.find((t) => t.list.length > 0) ?? tiers[tiers.length - 1];
    return { results: sortProducts(tier.list, "featured").slice(0, 12), relaxed: tier.relaxed };
  }, [step, lightOpt, expOpt, pets, spaceOpt, budgetOpt, allPlants]);

  // Deep-link to /shop with pre-applied params + ?quiz=1. Param names are the
  // ones /shop itself writes (updateURL) AND reads on load: sunlight,
  // suitable_for, min_price, max_price. difficulty / petSafeOnly are
  // deliberately NOT emitted: every product's difficulty is "Easy" (filter
  // matches nothing meaningful) and petSafeOnly would return pots only,
  // since no plant is marked pet-safe.
  const shopLink = useMemo(() => {
    if (!lightOpt || !spaceOpt || !budgetOpt) return "/shop?quiz=1";
    const params = new URLSearchParams();
    params.set("sunlight", lightOpt.sun.join(","));
    if (spaceOpt.slugs.length > 0) params.set("suitable_for", spaceOpt.slugs.join(","));
    if (budgetOpt.min > 0) params.set("min_price", String(budgetOpt.min));
    if (Number.isFinite(budgetOpt.max)) params.set("max_price", String(budgetOpt.max));
    params.set("quiz", "1");
    return `/shop?${params.toString()}`;
  }, [lightOpt, spaceOpt, budgetOpt]);

  // Per-card "why this suits you" — only data-backed reasons, never invented.
  const rationaleFor = (p: ShopProduct): string => {
    const parts: string[] = [p.sunInfo];
    // DIFFICULTY_OPTIONS[0] is "Easy" — and every product carries it, so the
    // beginner-friendly tag is data-backed for all results.
    if (p.difficulty === DIFFICULTY_OPTIONS[0]) parts.push("Beginner-friendly");
    if (p.isAirPurifying) parts.push("Air-purifying");
    if (p.isBestseller) parts.push("Bestseller");
    return parts.join(" · ");
  };

  const answeredCount = [light, exp, pets, space, budget].filter((a) => a !== null).length;

  return (
    <>
      <PageHero
        overline="Plant Finder"
        title="Confused hain kaunsa plant lein?"
        subtitle="5 sawaal, 1 minute — aapke ghar ki roshni, experience aur pets ke hisaab se plants."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Plant Finder" }]}
      />

      <section className="py-8 md:py-12 bg-ivory">
        <Container>
          {step < 5 ? (
            <div className="max-w-2xl mx-auto">
              {/* Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-xs font-medium text-ink-soft mb-2">
                  <span>Sawaal {step + 1} / 5</span>
                  <span>{answeredCount} jawab diye</span>
                </div>
                <div className="h-1.5 rounded-full bg-stone overflow-hidden">
                  <div className="h-full rounded-full bg-brass transition-all duration-300" style={{ width: `${((step + 1) / 5) * 100}%` }} />
                </div>
              </div>

              <h2 className="font-display text-2xl md:text-3xl text-pine mb-6 animate-step-enter" key={step}>
                {STEP_TITLES[step]}
              </h2>

              {/* Q1 — Light */}
              {step === 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-step-enter">
                  {LIGHT_OPTIONS.map((o) => (
                    <OptionCard key={o.id} selected={light === o.id} icon={<o.icon className="size-5" />} label={o.label} hint={o.hint} onClick={() => answerAndAdvance(() => setLight(o.id))} />
                  ))}
                </div>
              )}

              {/* Q2 — Experience */}
              {step === 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-step-enter">
                  {EXP_OPTIONS.map((o) => (
                    <OptionCard key={o.id} selected={exp === o.id} icon={<o.icon className="size-5" />} label={o.label} hint={o.hint} onClick={() => answerAndAdvance(() => setExp(o.id))} />
                  ))}
                </div>
              )}

              {/* Q3 — Pets / kids */}
              {step === 2 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-step-enter">
                  {PET_OPTIONS.map((o) => (
                    <OptionCard key={String(o.id)} selected={pets === o.id} icon={<o.icon className="size-5" />} label={o.label} hint={o.hint} onClick={() => answerAndAdvance(() => setPets(o.id))} />
                  ))}
                </div>
              )}

              {/* Q4 — Space */}
              {step === 3 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-step-enter">
                  {SPACE_OPTIONS.map((o) => (
                    <OptionCard key={o.id} selected={space === o.id} icon={<o.icon className="size-5" />} label={o.label} hint={o.hint} onClick={() => answerAndAdvance(() => setSpace(o.id))} />
                  ))}
                </div>
              )}

              {/* Q5 — Budget */}
              {step === 4 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-step-enter">
                  {BUDGET_OPTIONS.map((o) => (
                    <OptionCard key={o.id} selected={budget === o.id} icon={<Wallet className="size-5" />} label={o.label} hint={o.hint} onClick={() => answerAndAdvance(() => setBudget(o.id))} />
                  ))}
                </div>
              )}

              {/* Back / restart */}
              <div className="flex items-center justify-between mt-8">
                {step > 0 ? (
                  <button onClick={() => setStep((s) => s - 1)} className="inline-flex items-center gap-1.5 text-sm font-medium text-pine hover:text-brass-deep transition-colors">
                    <ArrowLeft className="size-4" /> Pehle wala sawaal
                  </button>
                ) : <span />}
                <button onClick={startOver} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-pine transition-colors">
                  <RotateCcw className="size-4" /> Start over
                </button>
              </div>
            </div>
          ) : (
            /* ------------------------- Results ------------------------- */
            <div>
              <div className="max-w-3xl mx-auto text-center mb-8">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sage-wash text-moss text-xs font-semibold mb-3">
                  <Sprout className="size-3.5" /> Aapke matches taiyaar hain
                </span>
                <h2 className="font-display text-3xl md:text-4xl text-pine">
                  Aapke liye {results.length} plants
                </h2>
                <p className="text-sm text-ink-soft mt-2">
                  Ye picks aapki roshni, jagah aur budget ke hisaab se chune gaye hain — har card ke neeche likha hai ki wo aapko kyun suit karta hai.
                </p>

                {/* Answer summary — tap a chip to change that answer */}
                <div className="flex flex-wrap justify-center gap-2 mt-5">
                  {lightOpt && <AnswerChip label={`Roshni: ${lightOpt.label}`} onClick={() => setStep(0)} />}
                  {expOpt && <AnswerChip label={`Experience: ${expOpt.label}`} onClick={() => setStep(1)} />}
                  {pets !== null && <AnswerChip label={pets ? "Pets/bachche: Haan" : "Pets/bachche: Nahi"} onClick={() => setStep(2)} />}
                  {spaceOpt && <AnswerChip label={`Jagah: ${spaceOpt.label}`} onClick={() => setStep(3)} />}
                  {budgetOpt && <AnswerChip label={`Budget: ${budgetOpt.label}`} onClick={() => setStep(4)} />}
                </div>
              </div>

              {/* Honest data notes */}
              {pets === true && (
                <div className="max-w-3xl mx-auto mb-4 flex items-start gap-2.5 rounded-[18px] border border-line bg-paper px-4 py-3 text-sm text-ink">
                  <PawPrint className="size-4 text-brass-deep shrink-0 mt-0.5" />
                  <p>
                    <strong>Pet-safe matching abhi limited hai</strong> — catalogue mein plants pet-safe ke roop mein marked nahi hain (sirf pots pet-safe hain), isliye ye picks aapki roshni, jagah aur budget ke hisaab se hain. Har plant ka pet-safety detail uske product page par check karein.
                  </p>
                </div>
              )}
              {space === "hanging" && (
                <div className="max-w-3xl mx-auto mb-4 flex items-start gap-2.5 rounded-[18px] border border-line bg-paper px-4 py-3 text-sm text-ink">
                  <Info className="size-4 text-brass-deep shrink-0 mt-0.5" />
                  <p>Catalogue mein hanging ke liye alag category nahi hai — ye picks aapki roshni aur budget ke hisaab se hain.</p>
                </div>
              )}
              {relaxed.length > 0 && (
                <div className="max-w-3xl mx-auto mb-4 flex items-start gap-2.5 rounded-[18px] bg-gold-tint px-4 py-3 text-sm text-charcoal">
                  <Info className="size-4 text-brass-deep shrink-0 mt-0.5" />
                  <p>
                    Exact match kam mile, isliye humne <strong>{relaxed.join(", ")}</strong> ko thoda flexible rakha hai — taaki aap khaali haath na jayein.
                  </p>
                </div>
              )}

              {results.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5">
                  {results.map((p) => (
                    <div key={p.id} className="flex flex-col">
                      <ProductCard product={toProductCard(p)} className="flex-1" />
                      {/* "Why this suits you" — data-backed rationale only. Badges
                          (Bestseller / discount % / New Arrival) render inside
                          ProductCard only where the product data carries them. */}
                      <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-sage-wash px-3 py-2 text-xs leading-relaxed text-pine">
                        <Sprout className="size-3.5 shrink-0 mt-0.5 text-moss" />
                        <span><strong>Aapke liye kyun:</strong> {rationaleFor(p)}</span>
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center">
                  <div className="size-16 rounded-full bg-sage-wash flex items-center justify-center mx-auto mb-4">
                    <SearchX className="size-8 text-pine" />
                  </div>
                  <h3 className="font-display text-2xl text-pine">Is combination mein kuch nahi mila</h3>
                  <p className="text-sm text-ink-soft max-w-md mx-auto mt-2">Quiz dobara try karein — roshni ya budget thoda flexible rakhne se zyada options milenge.</p>
                  <Button onClick={startOver} className="bg-pine hover:bg-brass-deep text-ivory rounded-full gap-2 mt-4">
                    <RotateCcw className="size-4" /> Start over
                  </Button>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-center gap-3 mt-10">
                <Button asChild className="bg-pine hover:bg-brass-deep text-ivory rounded-full gap-2">
                  <Link href={shopLink}>Shop mein yehi filters dekhein <ArrowRight className="size-4" /></Link>
                </Button>
                <Button variant="outline" onClick={startOver} className="rounded-full border-pine/30 text-pine gap-2">
                  <RotateCcw className="size-4" /> Start over
                </Button>
              </div>

              <p className="text-center text-xs text-ink-soft mt-6 max-w-xl mx-auto">
                Note: catalogue mein har plant ki difficulty &ldquo;Easy&rdquo; marked hai, isliye experience ko filter nahi — rationale mein use kiya gaya hai. Prices placeholder hain.
              </p>
            </div>
          )}
        </Container>
      </section>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Small pieces                                                        */
/* ------------------------------------------------------------------ */

function OptionCard({ selected, icon, label, hint, onClick }: {
  selected: boolean; icon: React.ReactNode; label: string; hint: string; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex items-start gap-3 rounded-[18px] border-2 p-4 text-left transition-all",
        selected
          ? "border-pine bg-sage-wash shadow-[0_8px_24px_rgba(22,56,43,0.08)]"
          : "border-line bg-paper hover:border-pine/40 hover:shadow-[0_8px_24px_rgba(22,56,43,0.06)]",
      )}
    >
      <span className={cn(
        "size-11 shrink-0 rounded-full flex items-center justify-center transition-colors",
        selected ? "bg-pine text-ivory" : "bg-gold-tint text-brass-deep",
      )}>
        {icon}
      </span>
      <span>
        <span className="block text-base font-semibold text-charcoal">{label}</span>
        <span className="block text-sm text-ink-soft mt-0.5 leading-snug">{hint}</span>
      </span>
    </button>
  );
}

function AnswerChip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title="Ye jawab badlein"
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-paper border border-line text-xs font-medium text-pine hover:border-brass transition-colors"
    >
      {label}
      <Pencil className="size-3 text-brass-deep" />
    </button>
  );
}
