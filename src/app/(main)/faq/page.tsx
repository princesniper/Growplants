"use client";

import { useState, useMemo } from "react";
import { Search, Plus, Minus, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/common/Container";
import { PageHero } from "@/components/common/PageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface FAQItem { id: string; category: string; question: string; answer: string; }

const FAQ_DATA: FAQItem[] = [
  // Orders & Delivery
  { id: "f1", category: "Orders & Delivery", question: "Do you deliver plants in Sonipat?", answer: "Yes! We currently deliver across all major areas in Sonipat, including urban sectors, residential areas, and commercial zones. Enter your pincode at checkout or in the header pincode checker to confirm coverage. We're expanding to more Haryana cities soon." },
  { id: "f2", category: "Orders & Delivery", question: "How fast is delivery?", answer: "Orders placed before 12 PM qualify for same-day delivery within Sonipat. Standard delivery takes 1–2 business days. Free shipping on orders above ₹499; otherwise a flat ₹49 delivery charge applies." },
  { id: "f3", category: "Orders & Delivery", question: "What are the delivery charges?", answer: "Delivery is free on all orders above ₹499. For orders below ₹499, a flat delivery charge of ₹49 applies. COD orders may have an additional ₹20 handling fee in some pincodes." },
  { id: "f4", category: "Orders & Delivery", question: "Can I track my order?", answer: "Yes! Once your order is dispatched, you'll receive an SMS and email with tracking updates. You can also track your order from My Account → Orders. Status updates include: Pending → Confirmed → Processing → Out for Delivery → Delivered." },

  // Returns & Refunds
  { id: "f5", category: "Returns & Refunds", question: "What if my plant arrives damaged?", answer: "We have a 24-hour damage claim policy. If your plant arrives damaged, share photos within 24 hours of delivery and we will replace it or issue a full refund — no questions asked. Contact us via WhatsApp or email with your order number and photos." },
  { id: "f6", category: "Returns & Refunds", question: "What is your return policy for planters and accessories?", answer: "Planters and gardening accessories can be returned within 7 days of delivery for manufacturing defects or shipping damage. The item must be unused and in its original packaging. Plants are not returnable except for the 24-hour damage guarantee." },
  { id: "f7", category: "Returns & Refunds", question: "How long does a refund take?", answer: "Refunds are processed as follows: Razorpay (UPI/Card) — 3-5 business days, Net Banking — 5-7 business days, COD — manual NEFT/UPI transfer within 7 business days. You'll receive an email notification once the refund is initiated." },

  // Payments
  { id: "f8", category: "Payments", question: "Is Cash on Delivery (COD) available?", answer: "Yes! COD is available for orders up to ₹5,000 in most serviceable pincodes. For orders above ₹5,000, online payment (UPI, cards, net banking) is required. We also offer free delivery on all orders above ₹499." },
  { id: "f9", category: "Payments", question: "What payment methods do you accept?", answer: "We accept UPI (PhonePe, Google Pay, Paytm), Credit/Debit Cards (Visa, Mastercard, RuPay), Net Banking, Wallets, and Cash on Delivery (COD). All online payments are processed securely through Razorpay." },
  { id: "f10", category: "Payments", question: "Is online payment safe?", answer: "Absolutely. All online payments are processed through Razorpay, which is PCI-DSS compliant and uses bank-grade encryption. We never store your card details, CVV, or UPI PIN on our servers." },

  // Gardening Services
  { id: "f11", category: "Gardening Services", question: "How are gardening service providers verified?", answer: "Every service provider on GrowPlants is personally interviewed and background-checked by our admin team. We verify government ID (Aadhar + PAN), experience references, and conduct trial assessments before approval. Providers are rated by customers after every booking — only 4-star-and-above providers stay on the platform." },
  { id: "f12", category: "Gardening Services", question: "Can I book a service for a specific date and time?", answer: "Absolutely! When booking a service, you select from available time slots: 9–11 AM, 11 AM–1 PM, 2–4 PM, or 4–6 PM. Bookings must be made at least 1 day in advance. The provider will confirm within 2 hours." },
  { id: "f13", category: "Gardening Services", question: "Can I cancel or reschedule a booking?", answer: "Yes — you can cancel or reschedule any booking for free up to 24 hours before the scheduled time. Within 24 hours, a partial charge may apply. Visit My Bookings in your account to manage bookings." },
  { id: "f14", category: "Gardening Services", question: "Do I need to provide tools for the gardener?", answer: "No, our gardeners come fully equipped with their own tools. For specialised services like balcony setup or landscape design, we also bring plants, soil, and materials as part of the service package." },

  // Account
  { id: "f15", category: "Account", question: "Do I need an account to order?", answer: "Yes, an account is required to place orders and book services. This helps us track your orders, manage deliveries, and provide personalised plant care support. Registration is free and takes less than a minute." },
  { id: "f16", category: "Account", question: "How do I reset my password?", answer: "Click on 'Login' then 'Forgot Password'. Enter your registered email or phone number, and we'll send you a secure reset link. The link is valid for 30 minutes." },
  { id: "f17", category: "Account", question: "Can I change my delivery address after placing an order?", answer: "You can change your delivery address only before the order is confirmed (status: Pending). Once confirmed, please contact us immediately via WhatsApp or phone — we'll do our best to update the address if the order hasn't been dispatched." },
];

const CATEGORIES = ["All", "Orders & Delivery", "Returns & Refunds", "Payments", "Gardening Services", "Account"];

export default function FAQPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return FAQ_DATA.filter((item) => {
      const matchesCategory = activeCategory === "All" || item.category === activeCategory;
      const matchesSearch = !search ||
        item.question.toLowerCase().includes(search.toLowerCase()) ||
        item.answer.toLowerCase().includes(search.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [search, activeCategory]);

  return (
    <>
      <PageHero
        overline="Help & Support"
        title="Frequently Asked Questions"
        subtitle="Find quick answers to common questions about orders, delivery, returns, payments, and gardening services. Can't find what you're looking for? Contact us."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "FAQ" }]}
      />

      <section className="py-12 md:py-16 bg-white">
        <Container>
          {/* Search */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-slate-400" aria-hidden="true" />
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search questions..."
                className="pl-10 h-12 rounded-md"
                aria-label="Search FAQs"
              />
            </div>
          </div>

          {/* Category tabs */}
          <div className="flex items-center justify-center gap-2 mb-8 overflow-x-auto pb-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                  activeCategory === cat
                    ? "bg-[#16382B] text-white"
                    : "bg-white text-slate-700 border border-slate-200 hover:border-[#16382B]/30"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* FAQ list */}
          <div className="max-w-3xl mx-auto space-y-3">
            {filtered.length > 0 ? (
              filtered.map((item) => {
                const isOpen = openId === item.id;
                return (
                  <div key={item.id} className="rounded-lg bg-white border border-slate-200 overflow-hidden">
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`faq-panel-${item.id}`}
                      onClick={() => setOpenId(isOpen ? null : item.id)}
                      className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-[#F3F8F1] transition-colors"
                    >
                      <div>
                        <p className="text-xs font-semibold text-[#C6A15B] uppercase tracking-wide mb-1">{item.category}</p>
                        <p className="text-sm font-medium text-slate-800">{item.question}</p>
                      </div>
                      <span className="shrink-0 size-7 rounded-full bg-[#F3F8F1] text-[#16382B] flex items-center justify-center">
                        {isOpen ? <Minus className="size-4" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
                      </span>
                    </button>
                    <div
                      id={`faq-panel-${item.id}`}
                      role="region"
                      className={cn("overflow-hidden transition-all duration-300", isOpen ? "max-h-96" : "max-h-0")}
                    >
                      <p className="p-4 pt-0 text-sm text-slate-600 leading-relaxed">{item.answer}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-500">No questions match your search. Try a different keyword or contact us.</p>
              </div>
            )}
          </div>

          {/* WhatsApp CTA */}
          <div className="max-w-3xl mx-auto mt-12 rounded-xl bg-[#F3F8F1] border border-slate-100 p-6 text-center space-y-3">
            <h3 className="text-lg font-bold text-[#16382B]">Still have questions?</h3>
            <p className="text-sm text-slate-600">Chat with us on WhatsApp — quick replies guaranteed.</p>
            <Button asChild className="bg-[#25D366] hover:bg-[#25D366]/90 text-white gap-2">
              <a href="https://wa.me/919812345678" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-4 fill-white" aria-hidden="true" />
                WhatsApp Us
              </a>
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
