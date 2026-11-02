import type { Metadata } from "next";
import { LegalLayout } from "@/components/common/LegalLayout";
import { PageHero } from "@/components/common/PageHero";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Read the terms and conditions for using GrowPlants — covering accounts, orders, payments, shipping, returns, services, and more.",
  alternates: { canonical: "/terms" },
};

const TOC = [
  { id: "introduction", label: "1. Introduction" },
  { id: "accounts", label: "2. Accounts & Registration" },
  { id: "orders", label: "3. Orders & Pricing" },
  { id: "payments", label: "4. Payments" },
  { id: "shipping", label: "5. Shipping & Delivery" },
  { id: "returns", label: "6. Returns & Refunds" },
  { id: "services", label: "7. Gardening Services" },
  { id: "bookings", label: "8. Bookings & Cancellations" },
  { id: "privacy", label: "9. Privacy" },
  { id: "liability", label: "10. Limitation of Liability" },
  { id: "changes", label: "11. Changes to Terms" },
  { id: "contact", label: "12. Contact" },
];

export default function TermsPage() {
  return (
    <>
      <PageHero
        overline="Legal"
        title="Terms & Conditions"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Terms & Conditions" }]}
      />
      <LegalLayout title="Terms & Conditions" lastUpdated="1 January 2026" tocItems={TOC}>
        <section id="introduction" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-[#16382B] mb-3">1. Introduction</h2>
          <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>Welcome to GrowPlants (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;). GrowPlants is a location-based botanical e-commerce and gardening service marketplace operated in Sonipat, Haryana, India. By accessing our website, mobile app, or using our services, you agree to be bound by these Terms and Conditions (&ldquo;Terms&rdquo;).</p>
            <p>These Terms govern your use of our platform to purchase plants, planters, gardening products, and to book gardening services. If you do not agree with any part of these Terms, please do not use our services.</p>
            <p>We may update these Terms from time to time. Continued use of our services after changes constitutes acceptance of the updated Terms. We will notify registered users of significant changes via email or SMS.</p>
          </div>
        </section>

        <section id="accounts" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-[#16382B] mb-3">2. Accounts &amp; Registration</h2>
          <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>To place orders or book services, you must create a GrowPlants account. You agree to provide accurate, current, and complete information during registration and to update such information to keep it accurate.</p>
            <p>You are responsible for maintaining the confidentiality of your password and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account or any other security breach.</p>
            <p>You must be at least 18 years old to create an account and make purchases. We reserve the right to suspend or terminate accounts that violate these Terms, engage in fraudulent activity, or abuse our platform.</p>
          </div>
        </section>

        <section id="orders" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-[#16382B] mb-3">3. Orders &amp; Pricing</h2>
          <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>All orders are subject to availability and confirmation of the order price. We reserve the right to refuse or cancel any order at our discretion, including due to product unavailability, pricing errors, or suspected fraudulent activity.</p>
            <p>Prices displayed on our platform are in Indian Rupees (INR) and include applicable GST (18%) unless stated otherwise. Prices may change without notice. The price confirmed at the time of order placement is binding.</p>
            <p>We strive to display product images and descriptions accurately. However, actual plant size, colour, and appearance may vary slightly due to natural variations and monitor settings.</p>
          </div>
        </section>

        <section id="payments" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-[#16382B] mb-3">4. Payments</h2>
          <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>We accept payments via Razorpay (UPI, Credit/Debit Cards, Net Banking, Wallets) and Cash on Delivery (COD) for orders up to ₹5,000 in eligible pincodes. All online payments are processed securely through Razorpay&apos;s PCI-DSS compliant gateway.</p>
            <p>For COD orders, payment must be made in cash to the delivery person. Exact change is appreciated. COD orders may incur an additional handling fee of ₹20 in some pincodes.</p>
            <p>If a payment fails during checkout, no order is created. You may retry the payment or use an alternative payment method. We do not store card numbers, CVV, or UPI PINs on our servers.</p>
          </div>
        </section>

        <section id="shipping" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-[#16382B] mb-3">5. Shipping &amp; Delivery</h2>
          <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>We currently deliver to serviceable pincodes in Sonipat, Haryana. Delivery is free on orders above ₹499; otherwise a flat ₹49 delivery charge applies. Same-day delivery is available for orders placed before 12 PM in Sonipat.</p>
            <p>Standard delivery takes 1–2 business days. Delivery timelines are estimates and may vary due to weather, traffic, or other factors beyond our control. We are not liable for delays caused by courier partners or force majeure events.</p>
            <p>If delivery is attempted and you are unavailable, we will retry delivery once. After two failed attempts, the order will be returned to our warehouse and a refund will be initiated (minus delivery charges).</p>
          </div>
        </section>

        <section id="returns" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-[#16382B] mb-3">6. Returns &amp; Refunds</h2>
          <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>For plants: If your plant arrives damaged, contact us within 24 hours with photos for a free replacement or full refund. Plants are living products and cannot be returned except under the 24-hour damage guarantee.</p>
            <p>For planters and accessories: Returns are accepted within 7 days of delivery for manufacturing defects or shipping damage. Items must be unused and in original packaging.</p>
            <p>For services: Bookings can be cancelled for free up to 24 hours before the scheduled time. Within 24 hours, a partial refund may apply. See our Refund Policy for detailed timelines.</p>
          </div>
        </section>

        <section id="services" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-[#16382B] mb-3">7. Gardening Services</h2>
          <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>GrowPlants connects customers with verified, background-checked gardening service providers. Service providers are independent contractors, not employees of GrowPlants. We facilitate bookings but are not directly responsible for the service execution.</p>
            <p>Service providers are rated by customers after every booking. We reserve the right to remove providers who consistently receive ratings below 4 stars or violate our service quality guidelines.</p>
            <p>Service pricing varies by service type (fixed, hourly, or quote-based). The price confirmed at booking is binding. Additional charges may apply if the scope of work expands beyond what was booked — these will be discussed and agreed upon before execution.</p>
          </div>
        </section>

        <section id="bookings" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-[#16382B] mb-3">8. Bookings &amp; Cancellations</h2>
          <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>Service bookings must be made at least 1 day in advance. Available time slots are: 9–11 AM, 11 AM–1 PM, 2–4 PM, and 4–6 PM. The service provider will confirm the booking within 2 hours.</p>
            <p>Cancellation policy: Full refund if cancelled 24+ hours before the scheduled time. Partial refund (50%) if cancelled within 24 hours. No refund if cancelled after the provider has arrived or the service has started.</p>
            <p>If a provider fails to show up (no-show), you will receive a full refund plus a 10% credit toward your next booking. If you are not available at the scheduled time (customer no-show), no refund will be issued.</p>
          </div>
        </section>

        <section id="privacy" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-[#16382B] mb-3">9. Privacy</h2>
          <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>Your use of our services is also governed by our Privacy Policy, which describes how we collect, use, and protect your personal information. By using our services, you consent to the data practices described in our Privacy Policy.</p>
          </div>
        </section>

        <section id="liability" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-[#16382B] mb-3">10. Limitation of Liability</h2>
          <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>GrowPlants shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our services. Our total liability for any claim shall not exceed the amount you paid for the specific product or service giving rise to the claim.</p>
            <p>We are not liable for damage to your property caused by gardening service providers, though we will mediate disputes and help reach a resolution. Service providers are responsible for their own workmanship.</p>
            <p>We are not liable for delays or failures caused by force majeure events, including natural disasters, strikes, government actions, or other circumstances beyond our reasonable control.</p>
          </div>
        </section>

        <section id="changes" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-[#16382B] mb-3">11. Changes to Terms</h2>
          <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>We reserve the right to update or modify these Terms at any time. Changes will be effective immediately upon posting on this page. We will notify registered users of significant changes via email or SMS at least 7 days before they take effect.</p>
            <p>Your continued use of our services after any changes constitutes acceptance of the updated Terms. If you do not agree with the changes, you may stop using our services.</p>
          </div>
        </section>

        <section id="contact" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-[#16382B] mb-3">12. Contact</h2>
          <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>If you have any questions about these Terms, please contact us:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Email: <a href="mailto:hello@growplants.in" className="text-[#16382B] hover:underline">hello@growplants.in</a></li>
              <li>Phone: <a href="tel:+919812345678" className="text-[#16382B] hover:underline">+91 98123 45678</a></li>
              <li>WhatsApp: <a href="https://wa.me/919812345678" className="text-[#16382B] hover:underline">Chat with us</a></li>
              <li>Address: Sonipat, Haryana 131001, India</li>
            </ul>
          </div>
        </section>
      </LegalLayout>
    </>
  );
}
