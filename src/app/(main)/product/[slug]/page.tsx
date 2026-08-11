import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Star, Truck, RotateCcw, Shield } from "lucide-react";
import { fetchProduct, getAllProductSlugs, type ProductData } from "@/lib/product-data";
import { ImageGallery } from "@/components/product/ImageGallery";
import { ProductPricingPanel } from "@/components/product/ProductPricingPanel";
import { ReviewsSection } from "@/components/product/ReviewsSection";
import { StickyMobileBuyBar } from "@/components/product/StickyMobileBuyBar";
import { RecentlyViewed } from "@/components/product/RecentlyViewed";
import {
  Sun, Droplets, Thermometer, Wind, Leaf, Ruler, Tag as TagIcon,
  Wrench, Sprout, Scissors, // D17: Lucide icons for services (replacing emoji)
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

/* ---------- Markdown renderer for `about` field ---------- */
function renderAboutSection(about: string) {
  const lines = about.split("\n").filter(Boolean);
  return lines.map((line, i) => {
    const hMatch = line.match(/^##\s+(.+)/);
    if (hMatch) return <h3 key={i} className="text-lg font-bold text-gray-900 mt-6 mb-2">{hMatch[1]}</h3>;

    const bulletMatch = line.match(/^[-•]\s+(.+)/);
    if (bulletMatch) {
      // Render bold inside bullets
      const parts = bulletMatch[1].split(/\*\*(.+?)\*\*/g);
      return (
        <li key={i} className="ml-5 list-disc text-gray-700">
          {parts.map((p, j) => j % 2 === 1 ? <strong key={j} className="font-semibold text-gray-900">{p}</strong> : p)}
        </li>
      );
    }

    // Regular paragraph — render **bold** as <strong>
    const parts = line.split(/\*\*(.+?)\*\*/g);
    if (parts.some((p, j) => j % 2 === 1)) {
      return (
        <p key={i} className="mb-3 text-gray-700">
          {parts.map((p, j) => j % 2 === 1 ? <strong key={j} className="font-semibold text-gray-900">{p}</strong> : p)}
        </p>
      );
    }
    return <p key={i} className="mb-3 text-gray-700">{line}</p>;
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

  // For pots, show pot features as specs if available
  if (data.productType === "pot" && data.potFeatures.length > 0) {
    data.potFeatures.slice(0, 4).forEach((f) => specs.push({ icon: TagIcon, label: f, value: "" }));
  }

  if (specs.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {specs.map((spec, i) => (
        <div key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F3F8F1] border border-slate-100 text-xs">
          <spec.icon className="size-3.5 text-[#E8930A] shrink-0" aria-hidden="true" />
          {spec.value ? (
            <span className="text-slate-700"><strong className="text-slate-900">{spec.label}:</strong> {spec.value}</span>
          ) : (
            <span className="text-slate-700 font-medium">{spec.label}</span>
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
    <div className="mt-12 border-t border-gray-200 pt-8">
      <h2 className="text-xl font-bold text-gray-900 mb-5">Specifications</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {specs.map((spec, i) => (
          <div key={i} className="bg-white rounded-lg border border-slate-100 p-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{spec.label}</p>
            <p className="text-sm font-medium text-gray-900 mt-1">{spec.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const data = fetchProduct(slug);
  if (!data) notFound();

  return (
    <>
      {/* Recently viewed tracker (inline script — localStorage) */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var k='growplants-recently-viewed';var r=localStorage.getItem(k);var a=r?JSON.parse(r):[];var n={slug:'${data.slug}',name:${JSON.stringify(data.name)},image:${JSON.stringify(data.images[0]?.url ?? "")},price:${data.price},rating:${data.rating ?? 4.5}};a=[n].concat(a.filter(function(i){return i.slug!=='${data.slug}';})).slice(0,10);localStorage.setItem(k,JSON.stringify(a));}catch(e){}})();`,
        }}
      />

      <StickyMobileBuyBar
        price={data.price} salePrice={data.oldPrice && data.oldPrice > data.price ? data.price : null}
        inStock={data.inStock} productId={data.id} productName={data.name} productSlug={data.slug}
        image={data.images[0]?.url || ""} categoryName={data.category?.name ?? ""} categorySlug={data.category?.slug ?? ""}
      />

      <div className="min-h-screen bg-[#FAFAF6] pb-40 lg:pb-16">
        {/* 1. Breadcrumb */}
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-1.5 text-xs font-medium text-gray-500" aria-label="Breadcrumb">
              <Link href="/" className="hover:text-[#1A6B3C]">Home</Link>
              <ChevronRight className="w-3 h-3 text-gray-300" />
              <Link href="/shop" className="hover:text-[#1A6B3C]">Shop</Link>
              {data.category && (
                <>
                  <ChevronRight className="w-3 h-3 text-gray-300" />
                  <Link href={`/shop?category=${data.category.slug}`} className="hover:text-[#1A6B3C]">{data.category.name}</Link>
                </>
              )}
              <ChevronRight className="w-3 h-3 text-gray-300" />
              <span className="text-gray-900 font-semibold truncate max-w-[200px]">{data.name}</span>
            </nav>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* 2+3+4+5+6+7+8+9: Top section — Gallery + Product Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14 py-6 lg:py-10">
            {/* Gallery (sticky on desktop) */}
            <div className="lg:sticky lg:top-24 lg:self-start">
              <ImageGallery images={data.images} productName={data.name} discountPercent={data.discountPercent} />
            </div>

            {/* Product Info */}
            <div className="space-y-5">
              {/* 3. Header — category tag + badges + name + short description */}
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {data.category && (
                    <Link href={`/shop?category=${data.category.slug}`} className="text-[11px] font-bold text-[#1A6B3C] uppercase tracking-wider bg-[#F0FAF4] px-2.5 py-1 rounded-full border border-[#BBF7D0] hover:bg-[#E0F5E8] transition-colors">
                      {data.category.name}
                    </Link>
                  )}
                  {data.badge && (
                    <span className="text-[11px] font-bold text-[#E8930A] bg-[#FFF8E8] px-2.5 py-1 rounded-full border border-[#FFE0A8]">
                      {data.badge}
                    </span>
                  )}
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 leading-tight tracking-tight">{data.name}</h1>
                {data.description && <p className="text-gray-500 mt-2 text-sm sm:text-base">{data.description}</p>}
              </div>

              {/* 4. Trust signals — rating + reviews + sold in one line */}
              {(data.rating !== null || data.totalSold !== null) && (
                <div className="flex items-center gap-3 flex-wrap">
                  {data.rating !== null && (
                    <>
                      <div className="flex items-center gap-1">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} className={`w-4 h-4 ${s <= Math.round(data.rating!) ? "fill-[#E8930A] text-[#E8930A]" : "text-gray-200"}`} />
                          ))}
                        </div>
                        <span className="text-sm font-semibold text-gray-900">{data.rating.toFixed(1)}</span>
                      </div>
                      {data.reviewCount !== null && (
                        <span className="text-sm text-gray-500">({data.reviewCount} reviews)</span>
                      )}
                    </>
                  )}
                  {data.totalSold !== null && data.totalSold > 0 && (
                    <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{data.totalSold}+ sold</span>
                  )}
                  {!data.inStock && (
                    <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Out of Stock</span>
                  )}
                  {data.inStock && data.stock !== null && data.stock <= 5 && data.stock > 0 && (
                    <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Only {data.stock} left</span>
                  )}
                </div>
              )}

              {/* 5+6+7. Price + Stock + CTA + Secondary actions (all in ProductPricingPanel) */}
              <ProductPricingPanel
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
              />

              {/* 8. Quick specs row (shown ONCE) */}
              <div className="pt-2">
                <QuickSpecs data={data} />
              </div>

              {/* 9. Delivery/trust badges compact row */}
              <div className="flex flex-wrap gap-4 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Truck className="w-4 h-4 text-[#1A6B3C]" /> Free delivery above ₹499
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <RotateCcw className="w-4 h-4 text-[#1A6B3C]" /> 24h damage replacement
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Shield className="w-4 h-4 text-[#1A6B3C]" /> Secure packaging
                </div>
              </div>
            </div>
          </div>

          {/* 10. Detailed description (scannable subsections from `about`) */}
          {data.about && (
            <div className="mt-8 border-t border-gray-200 pt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">About This Product</h2>
              <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed space-y-2">
                {renderAboutSection(data.about)}
              </div>
            </div>
          )}

          {/* Special features (only if data exists) */}
          {data.specialFeatures.length > 0 && (
            <div className="mt-8 border-t border-gray-200 pt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Special Features</h2>
              <ul className="space-y-2">
                {data.specialFeatures.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-slate-100">
                    <span className="w-6 h-6 rounded-full bg-[#1A6B3C] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                    <span className="text-sm text-gray-700 leading-relaxed">{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Care instructions (only for plants — pots have no care data) */}
          {data.care && (
            <div className="mt-8 border-t border-gray-200 pt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Care Instructions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { icon: Sun, label: "Sunlight", value: data.care.light },
                  { icon: Droplets, label: "Watering", value: data.care.water },
                  { icon: Thermometer, label: "Temperature", value: data.care.temperature },
                  { icon: Wind, label: "Humidity", value: data.care.humidity },
                  { icon: Leaf, label: "Fertilizer", value: data.care.fertilizer },
                ].filter((item) => item.value).map((item, i) => (
                  <div key={i} className="bg-white rounded-lg border border-slate-100 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="size-8 rounded-lg flex items-center justify-center" style={{ background: "#E8930A15" }}>
                        <item.icon className="size-4" style={{ color: "#E8930A" }} aria-hidden="true" />
                      </div>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{item.label}</p>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 11. Full specifications grid (only real attributes) */}
          <SpecificationsGrid data={data} />

          {/* 12. Shipping & returns compact cards */}
          <div className="mt-8 border-t border-gray-200 pt-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Shipping &amp; Returns</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-start gap-2 bg-white rounded-lg border border-slate-100 p-4">
                <Truck className="w-5 h-5 text-[#1A6B3C] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Free Delivery</p>
                  <p className="text-xs text-gray-500 mt-0.5">On orders over ₹499 in Sonipat{data.deliveryTime ? `. ${data.deliveryTime}` : ""}</p>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-white rounded-lg border border-slate-100 p-4">
                <RotateCcw className="w-5 h-5 text-[#1A6B3C] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">24h Damage Guarantee</p>
                  <p className="text-xs text-gray-500 mt-0.5">Damaged plants replaced within 24 hours with photo proof.</p>
                </div>
              </div>
              <div className="flex items-start gap-2 bg-white rounded-lg border border-slate-100 p-4">
                <Shield className="w-5 h-5 text-[#1A6B3C] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-gray-900 text-sm">Secure Packaging</p>
                  <p className="text-xs text-gray-500 mt-0.5">Eco-friendly packaging ensures your plant arrives healthy.</p>
                </div>
              </div>
            </div>
          </div>

          {/* 13. Customer reviews (honest "no reviews yet" state) */}
          <div className="mt-8 border-t border-gray-200 pt-8">
            <ReviewsSection
              rating={data.rating}
              reviewCount={data.reviewCount}
              productName={data.name}
              reviews={data.reviews}
            />
          </div>

          {/* 14. FAQ (only for plants with care data — auto-generated from real care info) */}
          {data.care && (
            <div className="mt-8 border-t border-gray-200 pt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
              <div className="space-y-2">
                {[
                  { q: `How much sunlight does the ${data.name} need?`, a: data.care.light },
                  { q: `How often should I water the ${data.name}?`, a: data.care.water },
                  { q: `What temperature is ideal for the ${data.name}?`, a: data.care.temperature },
                  { q: `Does the ${data.name} need special humidity?`, a: data.care.humidity },
                ].filter((faq) => faq.a).map((faq, i) => (
                  <details key={i} className="group bg-white rounded-lg border border-slate-100 overflow-hidden">
                    <summary className="flex items-center justify-between gap-3 p-4 cursor-pointer text-sm font-medium text-gray-800 hover:bg-slate-50 list-none">
                      {faq.q}
                      <ChevronRight className="size-4 text-slate-400 group-open:rotate-90 transition-transform shrink-0" />
                    </summary>
                    <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed">{faq.a}</div>
                  </details>
                ))}
              </div>
            </div>
          )}

          {/* 15. Related products (only real data from same category) */}
          {data.relatedProducts.length > 0 && (
            <div className="mt-8 border-t border-gray-200 pt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-5">You May Also Like</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {data.relatedProducts.map((prod) => (
                  <Link key={prod.id} href={`/product/${prod.slug}`} className="group bg-white border border-slate-100 rounded-lg overflow-hidden hover:shadow-md transition-all">
                    <div className="aspect-square overflow-hidden bg-gray-50 relative">
                      <img src={prod.image || ""} alt={prod.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                      {prod.badge && <span className="absolute top-2 left-2 bg-[#1A6B3C] text-white text-[9px] font-bold px-2 py-0.5 rounded">{prod.badge}</span>}
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-semibold text-gray-900 line-clamp-1">{prod.name}</p>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-sm font-bold text-[#1A6B3C]">₹{prod.price}</span>
                        {prod.oldPrice && <span className="text-[11px] text-gray-400 line-through">₹{prod.oldPrice}</span>}
                      </div>
                      {prod.rating !== null && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-3 h-3 fill-[#E8930A] text-[#E8930A]" />
                          <span className="text-[11px] text-gray-500">{prod.rating.toFixed(1)}{prod.reviewCount !== null ? ` (${prod.reviewCount})` : ""}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Bundles */}
          {data.bundles.length > 0 && (
            <div className="mt-8 border-t border-gray-200 pt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-5">Frequently Bought Together</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {data.bundles.map((bundle, i) => (
                  <div key={i} className="bg-white border border-slate-100 rounded-lg overflow-hidden hover:shadow-md transition-all group">
                    <div className="aspect-[4/3] bg-gray-50 relative overflow-hidden">
                      <img src={bundle.image} alt={bundle.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="p-4">
                      <p className="font-semibold text-gray-900 text-sm">{bundle.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{bundle.desc}</p>
                      <p className="text-sm font-bold text-[#1A6B3C] mt-2">₹{bundle.price}</p>
                      <button className="mt-3 w-full text-xs font-bold text-[#1A6B3C] border border-[#1A6B3C] rounded-lg py-2.5 hover:bg-[#F0FAF4] transition-colors">Add Bundle to Cart</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Professional Services */}
          {data.services.length > 0 && (
            <div className="mt-8 border-t border-gray-200 pt-8">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Professional Services</h2>
              <p className="text-gray-500 text-sm mb-5">Let our verified experts help you care for your plants</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {data.services.map((service, i) => (
                  <Link key={i} href="/services" className="bg-white border border-slate-100 rounded-lg p-5 hover:shadow-md transition-all hover:-translate-y-0.5">
                    {/* D17: Lucide icon instead of emoji */}
                    <div className="size-10 rounded-lg bg-[#F3F8F1] flex items-center justify-center">
                      {i === 0 ? <Wrench className="size-5 text-[#1A6B3C]" /> : i === 1 ? <Sprout className="size-5 text-[#1A6B3C]" /> : <Scissors className="size-5 text-[#1A6B3C]" />}
                    </div>
                    <p className="font-semibold text-gray-900 text-sm mt-3">{service.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{service.desc}</p>
                    <p className="text-sm font-bold text-[#1A6B3C] mt-2">{service.price}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Recently viewed */}
          <div className="mt-8 border-t border-gray-200 pt-8">
            <RecentlyViewed currentSlug={slug} />
          </div>
        </div>
      </div>
    </>
  );
}
