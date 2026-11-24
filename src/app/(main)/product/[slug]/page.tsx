import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Star, Truck, RotateCcw, ShieldCheck, MapPin } from "lucide-react";
import { fetchProduct, getAllProductSlugs, type ProductData } from "@/lib/product-data";
import { ImageGallery } from "@/components/product/ImageGallery";
import { BuyPanelBridge } from "@/components/product/BuyPanelBridge";
import { BundleCard } from "@/components/product/BundleCard";
import { ReviewsSection } from "@/components/product/ReviewsSection";
import { RecentlyViewed } from "@/components/product/RecentlyViewed";
import { CareBadgeRow } from "@/components/products/CareBadgeRow";
import { GuaranteeCallout } from "@/components/common/GuaranteeCallout";
import type { PotOption } from "@/components/product/PotPairingSelector";
import potsData from "@/data/pots-data.json";
import {
  Sun, Droplets, Thermometer, Wind, Leaf, Ruler, Tag as TagIcon,
  Wrench, Sprout, Scissors,
} from "lucide-react";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllProductSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = fetchProduct(slug);
  if (!data) return { title: "Product Not Found" };
  return {
    title: data.seo.title,
    description: data.seo.description,
    openGraph: {
      title: data.name,
      description: data.description || data.name,
      images: data.images[0]?.url ? [{ url: data.images[0].url }] : [],
      type: "website",
    },
  };
}

/* ---------- Pot-pairing options (cheapest 6 pots; prices displayed as-is) ---------- */
function getPotPairingOptions(): PotOption[] {
  const options: PotOption[] = [];
  for (const [slug, raw] of Object.entries(potsData) as [string, any][]) {
    const entries = Object.entries((raw.prices ?? {}) as Record<string, number>);
    if (entries.length === 0) continue;
    const [sizeLabel, price] = entries.reduce((a, b) => (a[1] <= b[1] ? a : b));
    const images: string[] = raw.image ?? [];
    options.push({ slug, name: raw.name ?? slug, image: images[0] ?? "", sizeLabel, price });
  }
  return options.sort((a, b) => a.price - b.price).slice(0, 6);
}

/* ---------- Markdown renderer for `about` field ---------- */
function renderAboutSection(about: string) {
  const lines = about.split("\n").filter(Boolean);
  return lines.map((line, i) => {
    const hMatch = line.match(/^##\s+(.+)/);
    if (hMatch) return <h3 key={i} className="font-display text-xl text-pine mt-6 mb-2">{hMatch[1]}</h3>;

    const bulletMatch = line.match(/^[-•]\s+(.+)/);
    if (bulletMatch) {
      const parts = bulletMatch[1].split(/\*\*(.+?)\*\*/g);
      return (
        <li key={i} className="ml-5 list-disc text-charcoal/80">
          {parts.map((p, j) => j % 2 === 1 ? <strong key={j} className="font-semibold text-pine">{p}</strong> : p)}
        </li>
      );
    }

    const parts = line.split(/\*\*(.+?)\*\*/g);
    if (parts.some((p, j) => j % 2 === 1)) {
      return (
        <p key={i} className="mb-3 text-charcoal/80">
          {parts.map((p, j) => j % 2 === 1 ? <strong key={j} className="font-semibold text-pine">{p}</strong> : p)}
        </p>
      );
    }
    return <p key={i} className="mb-3 text-charcoal/80">{line}</p>;
  });
}

/* ---------- Quick specs chips (shown ONCE, derived from real data only) ---------- */
function QuickSpecs({ data }: { data: ProductData }) {
  const specs: { icon: typeof Sun; label: string; value: string }[] = [];

  if (data.care?.light) specs.push({ icon: Sun, label: "Light", value: data.care.light.split(".")[0].split(",")[0].substring(0, 40) });
  if (data.care?.water) specs.push({ icon: Droplets, label: "Water", value: data.care.water.split(".")[0].split(",")[0].substring(0, 40) });
  if (data.care?.temperature) specs.push({ icon: Thermometer, label: "Temp", value: data.care.temperature.split(".")[0].split(",")[0].substring(0, 40) });
  if (data.size) specs.push({ icon: Ruler, label: "Size", value: data.size });
  if (data.height) specs.push({ icon: Ruler, label: "Height", value: data.height });

  if (data.productType === "pot" && data.potFeatures.length > 0) {
    data.potFeatures.slice(0, 4).forEach((f) => specs.push({ icon: TagIcon, label: f, value: "" }));
  }

  if (specs.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {specs.map((spec, i) => (
        <div key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sage-wash border border-line text-xs">
          <spec.icon className="size-3.5 text-brass-deep shrink-0" aria-hidden="true" />
          {spec.value ? (
            <span className="text-charcoal/80"><strong className="text-pine">{spec.label}:</strong> {spec.value}</span>
          ) : (
            <span className="text-charcoal/80 font-medium">{spec.label}</span>
          )}
        </div>
      ))}
    </div>
  );
}

/* ---------- Full specifications grid (only real attributes) ---------- */
function SpecificationsGrid({ data }: { data: ProductData }) {
  const specs: { label: string; value: string }[] = [];

  if (data.category) specs.push({ label: "Category", value: data.category.name });
  if (data.size) specs.push({ label: "Size", value: data.size });
  if (data.height) specs.push({ label: "Height", value: data.height });
  if (data.productType === "plant" && data.care?.fertilizer) specs.push({ label: "Fertilizer", value: data.care.fertilizer.split(".")[0] });
  if (data.productType === "plant" && data.care?.humidity) specs.push({ label: "Humidity", value: data.care.humidity.split(".")[0] });
  if (data.prices) specs.push({ label: "Available Sizes", value: Object.keys(data.prices).join(", ") });
  if (data.potFeatures.length > 0) specs.push({ label: "Features", value: data.potFeatures.join(", ") });
  if (data.deliveryTime) specs.push({ label: "Delivery", value: data.deliveryTime });
  if (data.sku) specs.push({ label: "SKU", value: data.sku });

  if (specs.length === 0) return null;

  return (
    <div className="mt-10 border-t border-line pt-8">
      <h2 className="font-display text-2xl text-pine mb-5">Specifications</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {specs.map((spec, i) => (
          <div key={i} className="bg-paper rounded-2xl border border-line p-4">
            <p className="text-[10px] font-bold text-ink-soft uppercase tracking-[0.12em]">{spec.label}</p>
            <p className="text-sm font-medium text-pine mt-1">{spec.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <span className="block h-1 w-10 rounded-full bg-brass mb-3" aria-hidden="true" />
      <h2 className="font-display text-2xl md:text-3xl text-pine">{children}</h2>
    </div>
  );
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const data = fetchProduct(slug);
  if (!data) notFound();

  const potOptions = data.productType === "plant" ? getPotPairingOptions() : [];

  return (
    <>
      {/* Recently viewed tracker (inline script — localStorage; values are JSON-encoded, XSS-safe) */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var k='growplants-recently-viewed';var r=localStorage.getItem(k);var a=r?JSON.parse(r):[];var n={slug:'${data.slug}',name:${JSON.stringify(data.name)},image:${JSON.stringify(data.images[0]?.url ?? "")},price:${data.price},rating:${data.rating ?? 4.5}};a=[n].concat(a.filter(function(i){return i.slug!=='${data.slug}';})).slice(0,10);localStorage.setItem(k,JSON.stringify(a));}catch(e){}})();`,
        }}
      />

      <div className="min-h-screen bg-ivory pb-40 lg:pb-16">
        {/* 1. Breadcrumb */}
        <div className="bg-paper border-b border-line">
          <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-1.5 text-xs font-medium text-ink-soft" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-pine">Home</Link>
              <ChevronRight className="w-3 h-3 text-line" />
              <Link href="/shop" className="hover:text-pine">Shop</Link>
              {data.category && (
                <>
                  <ChevronRight className="w-3 h-3 text-line" />
                  <Link href={`/shop?category=${data.category.slug}`} className="hover:text-pine">{data.category.name}</Link>
                </>
              )}
              <ChevronRight className="w-3 h-3 text-line" />
              <span className="text-pine font-semibold truncate max-w-[200px]">{data.name}</span>
            </nav>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 2+3. Gallery + buy panel (sticky buy bar + panel share variant state) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 py-6 lg:py-10">
            <div className="lg:sticky lg:top-32 lg:self-start">
              <ImageGallery images={data.images} productName={data.name} discountPercent={data.discountPercent} />
              <p className="mt-2 text-xs text-ink-soft text-center">Actual plant may vary slightly — har plant thoda unique hota hai.</p>
            </div>

            <div className="space-y-5">
              {/* Header */}
              <div>
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  {data.category && (
                    <Link href={`/shop?category=${data.category.slug}`} className="text-[11px] font-bold text-pine uppercase tracking-[0.12em] bg-sage-wash px-3 py-1.5 rounded-full border border-line hover:border-pine transition-colors">
                      {data.category.name}
                    </Link>
                  )}
                  {data.badge && (
                    <span className="text-[11px] font-bold text-pine-ink bg-brass px-3 py-1.5 rounded-full uppercase tracking-[0.12em]">
                      {data.badge}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-moss">
                    <MapPin className="size-3" aria-hidden="true" /> COD available
                  </span>
                </div>
                <h1 className="font-display text-3xl sm:text-4xl lg:text-[2.75rem] text-pine leading-tight">{data.name}</h1>
                {data.description && <p className="text-ink-soft mt-2 text-sm sm:text-base leading-relaxed">{data.description}</p>}

                {/* Care badges at a glance */}
                {data.care && (
                  <CareBadgeRow
                    sunInfo={data.care.light?.split(".")[0].split(",")[0].substring(0, 28) ?? null}
                    waterInfo={data.care.water?.split(".")[0].split(",")[0].substring(0, 28) ?? null}
                    className="mt-3"
                  />
                )}
              </div>

              {/* Rating row */}
              {(data.rating !== null || data.totalSold !== null) && (
                <div className="flex items-center gap-3 flex-wrap">
                  {data.rating !== null && (
                    <>
                      <div className="flex items-center gap-1">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`w-4 h-4 ${s <= Math.round(data.rating!) ? "fill-brass text-brass" : "text-line"}`} />
                          ))}
                        </div>
                        <span className="text-sm font-semibold text-pine tabular-nums">{data.rating.toFixed(1)}</span>
                      </div>
                      {data.reviewCount !== null && (
                        <a href="#reviews" className="text-sm text-ink-soft hover:text-pine underline decoration-brass/50 underline-offset-4">({data.reviewCount} reviews)</a>
                      )}
                    </>
                  )}
                  {data.totalSold !== null && data.totalSold > 0 && (
                    <span className="text-xs font-semibold text-moss bg-moss/10 px-2.5 py-1 rounded-full">{data.totalSold}+ sold</span>
                  )}
                  {!data.inStock && (
                    <span className="text-xs font-semibold text-ivory bg-terracotta px-2.5 py-1 rounded-full">Out of Stock</span>
                  )}
                  {data.inStock && data.stock !== null && data.stock <= 5 && data.stock > 0 && (
                    <span className="text-xs font-semibold text-brass-deep bg-gold-tint px-2.5 py-1 rounded-full">Only {data.stock} left</span>
                  )}
                </div>
              )}

              {/* Buy panel + synced sticky mobile bar */}
              <BuyPanelBridge
                price={data.oldPrice ?? data.price}
                salePrice={data.oldPrice && data.oldPrice > data.price ? data.price : null}
                discount={data.discountPercent}
                savings={data.savings}
                inStock={data.inStock}
                isBestSeller={data.badge === "Best Seller"}
                productId={data.id}
                productName={data.name}
                productSlug={data.slug}
                image={data.images[0]?.url || ""}
                categoryName={data.category?.name ?? ""}
                categorySlug={data.category?.slug ?? ""}
                stockQuantity={data.stock ?? 0}
                prices={data.prices}
                productType={data.productType}
                pots={potOptions}
              />

              {/* Quick specs */}
              <div className="pt-1">
                <QuickSpecs data={data} />
              </div>

              {/* Delivery/trust badges */}
              <div className="flex flex-wrap gap-x-5 gap-y-2 pt-3 border-t border-line">
                <div className="flex items-center gap-1.5 text-xs text-charcoal/70">
                  <Truck className="w-4 h-4 text-pine" /> Free delivery above ₹499
                </div>
                <div className="flex items-center gap-1.5 text-xs text-charcoal/70">
                  <RotateCcw className="w-4 h-4 text-pine" /> 30-day replacement promise
                </div>
                <div className="flex items-center gap-1.5 text-xs text-charcoal/70">
                  <ShieldCheck className="w-4 h-4 text-pine" /> Secure packaging
                </div>
              </div>
            </div>
          </div>

          {/* About */}
          {data.about && (
            <div className="mt-8 border-t border-line pt-8">
              <SectionTitle>About This Product</SectionTitle>
              <div className="max-w-none leading-relaxed space-y-2 text-[15px]">
                {renderAboutSection(data.about)}
              </div>
            </div>
          )}

          {/* Special features */}
          {data.specialFeatures.length > 0 && (
            <div className="mt-10 border-t border-line pt-8">
              <SectionTitle>Special Features</SectionTitle>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {data.specialFeatures.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 p-4 bg-paper rounded-2xl border border-line">
                    <span className="size-6 rounded-full bg-pine text-ivory text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 tabular-nums">{i + 1}</span>
                    <span className="text-sm text-charcoal/80 leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Care instructions (plants only — pots have no care data) */}
          {data.care && (
            <div className="mt-10 border-t border-line pt-8">
              <SectionTitle>How easy is it to care?</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { icon: Sun, label: "Sunlight", value: data.care.light },
                  { icon: Droplets, label: "Watering", value: data.care.water },
                  { icon: Thermometer, label: "Temperature", value: data.care.temperature },
                  { icon: Wind, label: "Humidity", value: data.care.humidity },
                  { icon: Leaf, label: "Fertilizer", value: data.care.fertilizer },
                ].filter((item) => item.value).map((item, i) => (
                  <div key={i} className="bg-paper rounded-2xl border border-line p-5">
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <div className="size-9 rounded-full bg-gold-tint flex items-center justify-center">
                        <item.icon className="size-4 text-brass-deep" aria-hidden="true" />
                      </div>
                      <p className="text-[11px] font-bold text-ink-soft uppercase tracking-[0.12em]">{item.label}</p>
                    </div>
                    <p className="text-sm text-charcoal/80 leading-relaxed">{item.value}</p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-ink-soft italic">Indian summers mein afternoon shade se leaf scorch bachta hai.</p>
            </div>
          )}

          {/* Specifications */}
          <SpecificationsGrid data={data} />

          {/* Packaging story mini-module */}
          <div className="mt-10 border-t border-line pt-8">
            <SectionTitle>How it travels</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { icon: Leaf, title: "Nursery-fresh pick", desc: "Order ke baad hand-picked, health check ke saath." },
                { icon: ShieldCheck, title: "Moisture-locked wrap", desc: "Breathable packaging — mitti gili, patte surakshit." },
                { icon: Truck, title: "1–2 days in Sonipat", desc: "Same-week dispatch, damage claim 48h photo par." },
              ].map((s) => (
                <div key={s.title} className="flex items-start gap-3 p-4 bg-sage-wash/60 rounded-2xl border border-line">
                  <span className="size-10 rounded-full bg-pine text-brass flex items-center justify-center shrink-0">
                    <s.icon className="size-4.5" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-pine">{s.title}</p>
                    <p className="text-xs text-ink-soft mt-1 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <GuaranteeCallout variant="compact" className="mt-4" />
          </div>

          {/* Reviews */}
          <div className="mt-10 border-t border-line pt-8" id="reviews">
            <ReviewsSection
              rating={data.rating}
              reviewCount={data.reviewCount}
              productName={data.name}
              reviews={data.reviews}
            />
          </div>

          {/* FAQ (plants with care data) */}
          {data.care && (
            <div className="mt-10 border-t border-line pt-8">
              <SectionTitle>Frequently Asked Questions</SectionTitle>
              <div className="space-y-2.5">
                {[
                  { q: `How much sunlight does the ${data.name} need?`, a: data.care.light },
                  { q: `How often should I water the ${data.name}?`, a: data.care.water },
                  { q: `What temperature is ideal for the ${data.name}?`, a: data.care.temperature },
                  { q: `Does the ${data.name} need special humidity?`, a: data.care.humidity },
                ].filter((faq) => faq.a).map((faq, i) => (
                  <details key={i} className="group bg-paper rounded-2xl border border-line overflow-hidden">
                    <summary className="flex items-center justify-between gap-3 p-4 cursor-pointer text-sm font-medium text-pine hover:bg-sage-wash/40 list-none">
                      {faq.q}
                      <ChevronRight className="size-4 text-brass-deep group-open:rotate-90 transition-transform shrink-0" />
                    </summary>
                    <div className="px-4 pb-4 text-sm text-charcoal/75 leading-relaxed">{faq.a}</div>
                  </details>
                ))}
              </div>
            </div>
          )}

          {/* Related products */}
          {data.relatedProducts.length > 0 && (
            <div className="mt-10 border-t border-line pt-8">
              <SectionTitle>You May Also Like</SectionTitle>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
                {data.relatedProducts.map((prod) => (
                  <Link key={prod.id} href={`/product/${prod.slug}`} className="group bg-paper border border-line rounded-[18px] overflow-hidden hover:shadow-[0_16px_40px_rgba(22,56,43,0.14)] transition-all">
                    <div className="aspect-square overflow-hidden bg-sand relative">
                      <img src={prod.image || ""} alt={prod.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      {prod.badge && <span className="absolute top-2 left-2 bg-brass text-pine-ink text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">{prod.badge}</span>}
                    </div>
                    <div className="p-3">
                      <p className="font-display text-[15px] text-pine line-clamp-1">{prod.name}</p>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-sm font-bold text-pine tabular-nums">₹{prod.price}</span>
                        {prod.oldPrice && <span className="text-[11px] text-ink-soft line-through tabular-nums">₹{prod.oldPrice}</span>}
                      </div>
                      {prod.rating !== null && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-3 h-3 fill-brass text-brass" />
                          <span className="text-[11px] text-ink-soft tabular-nums">{prod.rating.toFixed(1)}{prod.reviewCount !== null ? ` (${prod.reviewCount})` : ""}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Bundles — button now wired to the real cart */}
          {data.bundles.length > 0 && (
            <div className="mt-10 border-t border-line pt-8">
              <SectionTitle>Frequently Bought Together</SectionTitle>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {data.bundles.map((bundle, i) => (
                  <BundleCard
                    key={i}
                    index={i}
                    name={bundle.name}
                    desc={bundle.desc}
                    price={bundle.price}
                    image={bundle.image}
                    productSlug={data.slug}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Professional Services */}
          {data.services.length > 0 && (
            <div className="mt-10 border-t border-line pt-8">
              <SectionTitle>Professional Services</SectionTitle>
              <p className="text-ink-soft text-sm mb-5 -mt-2">Let our verified experts help you care for your plants</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {data.services.map((service, i) => (
                  <Link key={i} href="/services" className="bg-paper border border-line rounded-[18px] p-5 hover:shadow-[0_16px_40px_rgba(22,56,43,0.14)] transition-all hover:-translate-y-0.5">
                    <div className="size-11 rounded-2xl bg-sage-wash flex items-center justify-center">
                      {i === 0 ? <Wrench className="size-5 text-pine" /> : i === 1 ? <Sprout className="size-5 text-pine" /> : <Scissors className="size-5 text-pine" />}
                    </div>
                    <p className="font-display text-lg text-pine mt-3">{service.name}</p>
                    <p className="text-xs text-ink-soft mt-1">{service.desc}</p>
                    <p className="text-sm font-bold text-pine mt-2 tabular-nums">{service.price}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Recently viewed */}
          <div className="mt-10 border-t border-line pt-8">
            <RecentlyViewed currentSlug={slug} />
          </div>
        </div>
      </div>
    </>
  );
}
