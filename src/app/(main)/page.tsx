import type { Metadata } from "next";
import { HeroSection } from "@/components/sections/HeroSection";
import { TrustBadges } from "@/components/common/TrustBadges";
import { Container } from "@/components/common/Container";
import { QuickCategoryGrid } from "@/components/sections/QuickCategoryGrid";
import { BestSellersSection } from "@/components/sections/BestSellersSection";
import { CombosBannerSection } from "@/components/sections/CombosBannerSection";
import { TravelStorySection } from "@/components/sections/TravelStorySection";
import { ServicesSection } from "@/components/sections/ServicesSection";
import { WhyChooseUsSection } from "@/components/sections/WhyChooseUsSection";
import { ProvidersSection } from "@/components/sections/ProvidersSection";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { BlogPreviewSection } from "@/components/sections/BlogPreviewSection";
import { QuizBandSection } from "@/components/sections/QuizBandSection";
import { FAQSection } from "@/components/sections/FAQSection";
import { NewsletterSection } from "@/components/sections/NewsletterSection";
import { WhatsAppButton } from "@/components/common/WhatsAppButton";
import { ScrollReveal } from "@/components/common/ScrollReveal";
import { FAQ_ITEMS, PRODUCTS } from "@/data/homepageData";
import { APP_URL, CONTACT_PHONE, CONTACT_EMAIL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "GrowPlants — Plants, Planters & Gardening Services in Sonipat",
  description:
    "Shop healthy indoor & outdoor plants, premium planters, and gardening supplies. Book verified local gardeners for balcony setup, maintenance, and landscaping in Sonipat, Haryana. Free delivery above ₹499.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "GrowPlants — Plants, Planters & Gardening Services in Sonipat",
    description:
      "Sonipat's trusted botanical marketplace. Shop plants, planters, and gardening supplies, or book verified local gardeners. Free delivery above ₹499.",
    url: "/",
    type: "website",
  },
};

/* ---------- JSON-LD Structured Data ---------- */
const localBusinessSchema = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "GrowPlants",
  description: "Location-based botanical e-commerce and gardening service marketplace in Sonipat, Haryana.",
  url: APP_URL,
  telephone: CONTACT_PHONE,
  email: CONTACT_EMAIL,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Sonipat",
    addressRegion: "Haryana",
    addressCountry: "IN",
  },
  geo: { "@type": "GeoCoordinates", latitude: 28.9949, longitude: 77.0246 },
  openingHours: "Mo-Su 09:00-19:00",
  priceRange: "₹₹",
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: 4.8,
    reviewCount: 1200,
  },
};

const itemListSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Featured Plants",
  itemListElement: PRODUCTS.slice(0, 8).map((product, idx) => ({
    "@type": "ListItem",
    position: idx + 1,
    item: {
      "@type": "Product",
      name: product.name,
      image: product.image,
      sku: product.id,
      offers: {
        "@type": "Offer",
        price: product.price,
        priceCurrency: "INR",
        availability: product.availableStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: product.rating,
        reviewCount: product.reviewCount,
      },
    },
  })),
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: { "@type": "Answer", text: item.answer },
  })),
};

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* 1. Editorial hero */}
      <HeroSection />

      {/* 2. Trust strip — immediately under hero, never buried */}
      <div className="bg-ivory border-b border-line/60">
        <Container className="py-6 md:py-8">
          <TrustBadges />
        </Container>
      </div>

      {/* 3. Shop by need (light cards + need chips) */}
      <ScrollReveal variant="up">
        <QuickCategoryGrid />
      </ScrollReveal>

      {/* 4. The Collection — bestsellers rail with intent tabs */}
      <ScrollReveal variant="up" delay={100}>
        <BestSellersSection />
      </ScrollReveal>

      {/* 5. Plant + Pot combos banner */}
      <ScrollReveal variant="up">
        <CombosBannerSection />
      </ScrollReveal>

      {/* 6. How your plant travels — de-risk transit anxiety */}
      <TravelStorySection />

      {/* 7. Services + How Booking Works */}
      <ScrollReveal variant="up">
        <ServicesSection />
      </ScrollReveal>

      {/* 8. Why Choose Us */}
      <ScrollReveal variant="left">
        <WhyChooseUsSection />
      </ScrollReveal>

      {/* 9. Providers (marketplace stays live; parked out of nav) */}
      <ScrollReveal variant="up">
        <ProvidersSection />
      </ScrollReveal>

      {/* 10. Testimonials + stats */}
      <ScrollReveal variant="scale">
        <TestimonialsSection />
      </ScrollReveal>

      {/* 11. Care Journal teaser */}
      <ScrollReveal variant="up">
        <BlogPreviewSection />
      </ScrollReveal>

      {/* 12. Quiz CTA band — "Confused hain kaunsa plant lein?" */}
      <QuizBandSection />

      {/* 13. FAQ */}
      <ScrollReveal variant="up">
        <FAQSection />
      </ScrollReveal>

      {/* 14. Newsletter */}
      <NewsletterSection />

      {/* Floating WhatsApp */}
      <WhatsAppButton />
    </>
  );
}
