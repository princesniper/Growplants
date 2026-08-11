/**
 * GrowPlants — Homepage Data
 * Source: User's uploaded homepage.html (exact content match)
 */

/* ---------- Hero (5 slides) ---------- */
export interface HeroSlide {
  id: string;
  badge: string;
  headline: string;
  subtitle: string;
  trustBadge: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  image: string;
  imageAlt: string;
}

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: "slide-1",
    badge: "Premium Collection",
    headline: "Bring Nature Into Your Home",
    subtitle: "Premium indoor plants delivered fresh to your door in Sonipat.",
    trustBadge: "4.8/5 Customer Rating",
    primaryCta: { label: "Shop Indoor Plants", href: "/shop?category=indoor-plants" },
    secondaryCta: { label: "Explore Collection", href: "/shop" },
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBBsZc39PTv7nBgZzHrCxzLOlLBq1C0tnYDkHSytQ0g-ko4wI-xydAAd33yQiIw40vAzWZKqSQshPetOqOp-4DVHEMT33qy427oWHXUAqje9T0ia1770zLwVsH5aMJumReTVVzHZHgaDk70CejheTVg6gKfTP2hdcuGrM2SeSfpNPj5HnYBdtyHHzRcH1kSd2fgnC4g8_RXY6DeFCl5B2jQBnOSf0JTxPijZZJ9Koc8b748kxr6e3k6mBjSeq8BpULGSUhzQ2FYXs7d",
    imageAlt: "Premium indoor plants in a bright home",
  },
  {
    id: "slide-2",
    badge: "Verified Gardening Experts",
    headline: "Expert Gardening Services At Your Doorstep",
    subtitle: "Hire verified gardening helpers for maintenance and setup in Sonipat.",
    trustBadge: "Background Verified Pros",
    primaryCta: { label: "Book A Gardener", href: "/services" },
    secondaryCta: { label: "View Services", href: "/services" },
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAn4SZmoYC-TWOHlrDkProVO06IKAPpW8vTIf7U2d85ePzno9HUqPZGimAq54AL8bZ56YN_RG1PAqXUoAMOFJIVC2YLouJDsP_J_127xAyUNC-fN8RnerhQOQ3Zb4gyei1vXR2agsRHxuAHPS2-Cr-vHFwgi3ZX9eePSOMxUegwnVVv6v-IQZ0tIEqe_YEAxWskhebzvf4y91uF8N5LJHrWLhJ6YLDf2_lyqMFPpMszR6LSUJ5lQMnTOc0tdJFhsUd9HHvjOCeupgPF",
    imageAlt: "Gardener tending to plants",
  },
  {
    id: "slide-3",
    badge: "Seasonal Collection",
    headline: "Monsoon Plant Festival",
    subtitle: "Bring home lush green plants at up to 40% off this rainy season.",
    trustBadge: "Free Delivery Above ₹499",
    primaryCta: { label: "Shop Seasonal Plants", href: "/shop?category=seasonal-plants" },
    secondaryCta: { label: "View Offers", href: "/offers" },
    image: "https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=1600&q=80",
    imageAlt: "Lush green monsoon plants",
  },
  {
    id: "slide-4",
    badge: "Balcony Makeovers",
    headline: "Transform Your Balcony Into A Green Paradise",
    subtitle: "Get expert design, space-saving planters, and premium plant selection.",
    trustBadge: "100% Satisfaction Guarantee",
    primaryCta: { label: "Get Free Consultation", href: "/services/balcony-garden-setup" },
    secondaryCta: { label: "View Projects", href: "/services" },
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCVpptpcEz4r7LnHtzvTelMWxMjjDfiYA9z4yjhCwbIOQuZXxaer-oZGPY6CcMzI5-Z8k0dKQIjJMiwl8_NZfyj3nlK08qw9QDw8x_KQ0--cbf8PqkQ6TTztknN0J9tmKiultJ-gZ14Y-LUMvOAipRTizzoX_emoH69nWo5e-97oPaHxQSDnXqhwzJjLQKp70Xy2edY9LWrveDcD268jN1nFB3PbEyTuc80vay449tV7qgHihHciK-TloKypRR09t3VJIvsOArVf2Yp",
    imageAlt: "Beautiful balcony garden setup",
  },
];

/* ---------- Quick Categories ---------- */
export interface QuickCategory {
  id: string;
  name: string;
  itemCount: number;
  image: string;
  href: string;
}

export const QUICK_CATEGORIES: QuickCategory[] = [
  { id: "cat-1", name: "Indoor Plants", itemCount: 48, image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=200&q=80", href: "/shop?category=indoor-plants" },
  { id: "cat-2", name: "Outdoor Plants", itemCount: 34, image: "https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=200&q=80", href: "/shop?category=outdoor-plants" },
  { id: "cat-3", name: "Flowering Plants", itemCount: 27, image: "https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=200&q=80", href: "/shop?category=flowering-plants" },
  { id: "cat-4", name: "Air Purifying", itemCount: 19, image: "https://images.unsplash.com/photo-1604762524889-3e2fcc145683?w=200&q=80", href: "/shop?category=air-purifying-plants" },
  { id: "cat-5", name: "Succulents", itemCount: 22, image: "https://images.unsplash.com/photo-1487070183336-b863922373d4?w=200&q=80", href: "/shop?category=succulents" },
  { id: "cat-6", name: "Bonsai", itemCount: 12, image: "https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=200&q=80", href: "/shop?category=bonsai" },
  { id: "cat-7", name: "Planters", itemCount: 56, image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=200&q=80", href: "/shop?category=ceramic-planters" },
  { id: "cat-8", name: "Seeds & Tools", itemCount: 43, image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=200&q=80", href: "/shop?category=seeds-bulbs" },
];

/* ---------- Products (REAL DATA from plants-data.json) ---------- */
export interface Product {
  id: string;
  categoryBadge: string;
  name: string;
  image: string;
  rating: number;
  reviewCount: number;
  sunInfo: string;
  waterInfo: string;
  price: number;
  originalPrice?: number;
  discountPercent?: number;
  isBestseller?: boolean;
  slug: string;
  availableStock: number;
  isBestseller_bool: boolean;
  isNewArrival: boolean;
  isAirPurifying: boolean;
  tags: string[];
}

import plantsData from "@/data/plants-data.json";

/** Convert real plant JSON entries to the Product format used by ProductCard */
function mapRealProducts(): Product[] {
  return Object.entries(plantsData).slice(0, 12).map(([slug, raw]: [string, any]) => {
    const price = raw.price ?? 0;
    const oldPrice = raw.oldPrice ?? price;
    const discount = oldPrice > price ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
    const categories: string[] = raw.category ?? [];
    const categoryName = categories[0]?.toUpperCase() ?? "PLANTS";
    const care = raw.care ?? {};
    const lightReq = care.lightRequirements ?? "";
    const sunInfo = lightReq.includes("direct") ? "Full Sun" : lightReq.includes("bright") ? "Indirect" : lightReq.includes("shade") ? "Shade" : "Partial Shade";
    const waterInfo = care.wateringInstructions?.includes("week") ? "Weekly" : care.wateringInstructions?.includes("daily") ? "Daily" : "Alternate Day";

    return {
      id: slug,
      categoryBadge: categoryName,
      name: raw.name ?? slug,
      image: (raw.images ?? [])[0] ?? "",
      rating: raw.rating ?? 4.5,
      reviewCount: raw.reviewsCount ?? 0,
      sunInfo,
      waterInfo,
      price,
      originalPrice: oldPrice,
      discountPercent: discount,
      isBestseller: raw.badge === "Best Seller",
      slug,
      availableStock: raw.stock ?? 10,
      isBestseller_bool: raw.badge === "Best Seller",
      isNewArrival: raw.badge === "New Arrival",
      isAirPurifying: categories.includes("air-purifying"),
      tags: [
        ...(raw.badge === "Best Seller" ? ["bestseller"] : []),
        ...(raw.badge === "New Arrival" ? ["new"] : []),
        ...(categories.includes("air-purifying") ? ["air-purifying"] : []),
        ...(raw.rating >= 4.5 ? ["trending"] : []),
      ],
    };
  });
}

export const PRODUCTS: Product[] = mapRealProducts();

export interface FilterTab {
  id: string;
  label: string;
  filter: (p: Product) => boolean;
}

export const FILTER_TABS: FilterTab[] = [
  { id: "all", label: "All Plants", filter: () => true },
  { id: "bestseller", label: "Best Sellers", filter: (p) => p.isBestseller_bool },
  { id: "new", label: "New Arrivals", filter: (p) => p.isNewArrival },
  { id: "air-purifying", label: "Air Purifying", filter: (p) => p.isAirPurifying },
];

/* ---------- Services ---------- */
export interface Service {
  id: string;
  categoryBadge: string;
  serviceType: string;
  name: string;
  description: string;
  rating: number;
  reviewCount: number;
  bookingCount: number;
  priceFrom: number;
  priceUnit: string;
  pricingType: "fixed" | "quote_based";
  image: string;
  href: string;
}

export const SERVICES: Service[] = [
  {
    id: "svc-1", categoryBadge: "Balcony Setup", serviceType: "One Time",
    name: "Balcony Garden Setup",
    description: "Complete transformation of your balcony into a lush green garden. Includes plant selection, arrangement, soil preparation, and planting.",
    rating: 4.8, reviewCount: 64, bookingCount: 125,
    priceFrom: 1499, priceUnit: "per session", pricingType: "fixed",
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80",
    href: "/services/balcony-garden-setup",
  },
  {
    id: "svc-2", categoryBadge: "Garden Maintenance", serviceType: "Recurring",
    name: "Garden Maintenance (Monthly)",
    description: "Monthly garden maintenance — watering, pruning, fertilizing, and pest control handled by a dedicated gardener.",
    rating: 4.9, reviewCount: 112, bookingCount: 289,
    priceFrom: 799, priceUnit: "per month", pricingType: "fixed",
    image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600&q=80",
    href: "/services/garden-maintenance",
  },
  {
    id: "svc-3", categoryBadge: "Terrace Setup", serviceType: "One Time",
    name: "Terrace Garden Design & Setup",
    description: "Transform your terrace into a stunning rooftop garden with raised beds, vertical gardens, and proper drainage.",
    rating: 4.7, reviewCount: 38, bookingCount: 56,
    priceFrom: 0, priceUnit: "", pricingType: "quote_based",
    image: "https://images.unsplash.com/photo-1463936575829-25148e1db1b8?w=600&q=80",
    href: "/services/terrace-garden-setup",
  },
];

export interface BookingStep { step: string; title: string; description: string; }

export const BOOKING_STEPS: BookingStep[] = [
  { step: "01", title: "Choose a Service", description: "Browse our range of professional gardening services." },
  { step: "02", title: "Pick a Time Slot", description: "Select your preferred date and available time slot." },
  { step: "03", title: "We Match a Gardener", description: "Our system assigns the nearest verified professional." },
  { step: "04", title: "Garden Transformed!", description: "Sit back and enjoy your beautiful green space." },
];

export const SERVICE_TRUST_BADGES = ["Background Verified", "4.8★ Average Rating", "2-Hour Confirmation", "500+ Bookings Done"];

export const SERVICE_CATEGORIES_STRIP = ["Gardener Hiring", "Plant Installation", "Balcony Garden", "Terrace Garden", "Landscape Design", "Maintenance", "Lawn Care", "Plant Inspection"];

/* ---------- Why GrowPlants (8 cards) ---------- */
export interface WhyChooseCard {
  id: string;
  icon: "leaf" | "truck" | "shield" | "sprout" | "heart" | "clock" | "calendar" | "recycle";
  title: string;
  body: string;
}

export const WHY_CHOOSE_CARDS: WhyChooseCard[] = [
  { id: "wc-1", icon: "leaf", title: "Handpicked Healthy Plants", body: "Every plant is carefully selected and inspected before delivery — never a wilting plant." },
  { id: "wc-2", icon: "truck", title: "Same-Day Sonipat Delivery", body: "Order before 12 PM and receive your plants by evening. Free delivery on ₹499+." },
  { id: "wc-3", icon: "shield", title: "24-Hour Damage Guarantee", body: "Plant arrived damaged? Share a photo within 24 hours for a full replacement or refund." },
  { id: "wc-4", icon: "sprout", title: "Verified Expert Gardeners", body: "Every service provider is personally vetted, background-checked, and approved by our team." },
  { id: "wc-5", icon: "heart", title: "Lifetime Plant Care Support", body: "Our plant experts are available on WhatsApp for free post-purchase care guidance." },
  { id: "wc-6", icon: "clock", title: "Sonipat-First, Then Haryana", body: "We are rooted in Sonipat. Neighbourhood-first approach means faster service and local trust." },
  { id: "wc-7", icon: "calendar", title: "Flexible Time Slot Booking", body: "Book services for morning, afternoon, or evening slots — 7 days a week." },
  { id: "wc-8", icon: "recycle", title: "Eco-Friendly Packaging", body: "Plants are shipped in biodegradable packaging. We care about your garden and the planet." },
];

/* ---------- Providers ---------- */
export interface Provider {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  experienceYears: number;
  city: string;
  bio: string;
  services: string;
  bookingCount: number;
  avatarImage: string;
}

export const PROVIDERS: Provider[] = [
  { id: "prov-1", name: "Ramesh Kumar", rating: 4.9, reviewCount: 87, experienceYears: 8, city: "Sonipat", bio: "Experienced landscape gardener with 8+ years specializing in balcony and indoor gardens in Sonipat.", services: "Balcony Garden, Indoor Plants", bookingCount: 214, avatarImage: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80" },
  { id: "prov-2", name: "Sunita Devi", rating: 4.8, reviewCount: 53, experienceYears: 5, city: "Sonipat", bio: "Passionate plant expert and home garden designer. Specializes in medicinal and flowering plant gardens.", services: "Medicinal Plants, Flowering Garden", bookingCount: 142, avatarImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80" },
  { id: "prov-3", name: "Vikram Sharma", rating: 4.7, reviewCount: 124, experienceYears: 12, city: "Sonipat", bio: "Terrace garden specialist and vertical garden designer with expertise in urban farming solutions.", services: "Vertical Garden, Terrace Garden", bookingCount: 310, avatarImage: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80" },
  { id: "prov-4", name: "Priya Gupta", rating: 4.9, reviewCount: 69, experienceYears: 7, city: "Sonipat", bio: "Expert in indoor plant styling and office green spaces. Certified in plant health and care.", services: "Office Spaces, Indoor Plants", bookingCount: 188, avatarImage: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80" },
];

/* ---------- Testimonials ---------- */
export interface Testimonial {
  id: string;
  customerName: string;
  text: string;
  attribution: string;
  avatarImage: string;
}

export const TESTIMONIALS: Testimonial[] = [
  { id: "t1", customerName: "Anjali Mehta", text: "Absolutely love the Peace Lily I ordered! It arrived in perfect condition, well-packaged. The plant is healthy and already started to bloom. Delivery was on time. Highly recommended for anyone looking for an elegant indoor plant!", attribution: "— Verified Product Buyer", avatarImage: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80" },
];

export const TESTIMONIAL_STATS = [
  { value: "1,200+", label: "Happy Customers" },
  { value: "4.8★", label: "Average Rating" },
  { value: "500+", label: "Services Completed" },
  { value: "3,400+", label: "Plants Delivered" },
];

/* ---------- Blog ---------- */
export interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  image: string;
  category: string;
  author: string;
  date: string;
  readTime: number;
  href: string;
  featured?: boolean;
}

export const BLOG_POSTS: BlogPost[] = [
  { id: "b1", title: "10 Best Indoor Plants for Indian Homes in 2024", excerpt: "Discover the perfect low-maintenance plants that thrive in India's climate while beautifying your home.", image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=600&q=80", category: "indoor-plants", author: "GrowPlants Team", date: "1 April 2024", readTime: 5, href: "/blog/best-indoor-plants", featured: true },
  { id: "b2", title: "How to Set Up a Balcony Garden in a Small Space", excerpt: "Transform even the smallest balcony into a thriving green haven with smart plant selection and space-saving tips.", image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&q=80", category: "balcony-garden", author: "GrowPlants Team", date: "25 March 2024", readTime: 7, href: "/blog/balcony-garden-small-space" },
  { id: "b3", title: "Summer Plant Care Guide — Protecting Plants in Indian Heat", excerpt: "Keep your plants healthy through the scorching Indian summer with these expert-proven care strategies.", image: "https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400&q=80", category: "plant-care", author: "GrowPlants Team", date: "18 March 2024", readTime: 6, href: "/blog/summer-plant-care" },
];

/* ---------- FAQ ---------- */
export interface FAQItem { id: string; question: string; answer: string; }

export const FAQ_ITEMS: FAQItem[] = [
  { id: "f1", question: "Do you deliver plants in Sonipat?", answer: "Yes! We currently deliver across all major areas in Sonipat, including urban sectors, residential areas, and commercial zones. Enter your pincode to confirm coverage." },
  { id: "f2", question: "What if my plant arrives damaged?", answer: "We have a 24-hour damage claim policy. If your plant arrives damaged, share photos within 24 hours of delivery and we will replace it or issue a full refund — no questions asked." },
  { id: "f3", question: "How are gardening service providers verified?", answer: "Every service provider on GrowPlants is personally interviewed and background-checked by our admin team. We verify government ID, experience references, and conduct trial assessments before approval." },
  { id: "f4", question: "Is Cash on Delivery (COD) available?", answer: "Yes! COD is available for orders up to ₹5,000. For orders above ₹5,000, online payment (UPI, cards, net banking) is required. We also offer free delivery on all orders above ₹499." },
  { id: "f5", question: "Can I book a service for a specific date and time?", answer: "Absolutely! When booking a service, you select from available time slots: 9–11 AM, 11 AM–1 PM, 2–4 PM, or 4–6 PM. Bookings must be made at least 1 day in advance. The provider will confirm within 2 hours." },
];
