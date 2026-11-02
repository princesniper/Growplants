import type { Metadata } from "next";
import { LegalLayout } from "@/components/common/LegalLayout";
import { PageHero } from "@/components/common/PageHero";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Read GrowPlants' privacy policy — how we collect, use, store, and protect your personal information when you use our platform.",
  alternates: { canonical: "/privacy-policy" },
};

const TOC = [
  { id: "introduction", label: "1. Introduction" },
  { id: "data-collection", label: "2. Data We Collect" },
  { id: "data-use", label: "3. How We Use Your Data" },
  { id: "cookies", label: "4. Cookies & Tracking" },
  { id: "data-sharing", label: "5. Data Sharing" },
  { id: "data-security", label: "6. Data Security" },
  { id: "user-rights", label: "7. Your Rights" },
  { id: "data-retention", label: "8. Data Retention" },
  { id: "children", label: "9. Children's Privacy" },
  { id: "contact", label: "10. Contact" },
];

export default function PrivacyPolicyPage() {
  return (
    <>
      <PageHero
        overline="Legal"
        title="Privacy Policy"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Privacy Policy" }]}
      />
      <LegalLayout title="Privacy Policy" lastUpdated="1 January 2026" tocItems={TOC}>
        <section id="introduction" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-[#16382B] mb-3">1. Introduction</h2>
          <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>GrowPlants (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and share your personal information when you use our website, mobile app, and services.</p>
            <p>By using our services, you consent to the collection, use, and sharing of your information as described in this policy. If you do not agree with our privacy practices, please do not use our services.</p>
            <p>This policy complies with applicable Indian data protection laws, including the Information Technology Act, 2000, and the Digital Personal Data Protection Act, 2023.</p>
          </div>
        </section>

        <section id="data-collection" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-[#16382B] mb-3">2. Data We Collect</h2>
          <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p><strong className="text-slate-800">Account Information:</strong> Full name, email address, phone number, password (hashed), date of birth, gender, and preferred language.</p>
            <p><strong className="text-slate-800">Address Information:</strong> Delivery addresses including house number, street, city, state, pincode, and location coordinates (if you opt to share).</p>
            <p><strong className="text-slate-800">Order Information:</strong> Order history, payment method (we do not store full card numbers), delivery preferences, and order feedback.</p>
            <p><strong className="text-slate-800">Booking Information:</strong> Service bookings, selected provider, scheduling details, and service feedback.</p>
            <p><strong className="text-slate-800">Usage Data:</strong> IP address, browser type, device information, pages visited, and interaction data collected via cookies and analytics tools.</p>
            <p><strong className="text-slate-800">Communications:</strong> Records of your communications with us, including WhatsApp chats, emails, and customer support interactions.</p>
          </div>
        </section>

        <section id="data-use" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-[#16382B] mb-3">3. How We Use Your Data</h2>
          <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>We use your personal information for the following purposes:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong className="text-slate-800">Order Processing:</strong> To process and deliver your plant and product orders.</li>
              <li><strong className="text-slate-800">Service Bookings:</strong> To facilitate gardening service bookings and connect you with service providers.</li>
              <li><strong className="text-slate-800">Communication:</strong> To send order updates, booking confirmations, delivery notifications, and customer support responses.</li>
              <li><strong className="text-slate-800">Personalisation:</strong> To recommend products and services based on your preferences and purchase history.</li>
              <li><strong className="text-slate-800">Marketing:</strong> To send promotional emails and SMS about offers and new arrivals (you can opt out at any time).</li>
              <li><strong className="text-slate-800">Analytics:</strong> To analyze usage patterns and improve our platform, products, and services.</li>
              <li><strong className="text-slate-800">Legal Compliance:</strong> To comply with applicable laws, regulations, and legal processes.</li>
            </ul>
          </div>
        </section>

        <section id="cookies" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-[#16382B] mb-3">4. Cookies &amp; Tracking</h2>
          <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>We use cookies and similar tracking technologies to enhance your browsing experience, remember your preferences, and analyze website traffic. Cookies are small text files stored on your device.</p>
            <p><strong className="text-slate-800">Essential Cookies:</strong> Required for the website to function (e.g., cart, login session). These cannot be disabled.</p>
            <p><strong className="text-slate-800">Analytics Cookies:</strong> Help us understand how visitors use our website so we can improve it.</p>
            <p><strong className="text-slate-800">Marketing Cookies:</strong> Used to display relevant advertisements and track campaign performance.</p>
            <p>You can control cookies through your browser settings. Disabling cookies may affect some features of our website.</p>
          </div>
        </section>

        <section id="data-sharing" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-[#16382B] mb-3">5. Data Sharing</h2>
          <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>We do not sell your personal information. We share data with the following parties only as necessary:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong className="text-slate-800">Service Providers:</strong> Payment processors (Razorpay), delivery partners, SMS/email service providers (MSG91, SendGrid), and analytics providers (Google Analytics).</li>
              <li><strong className="text-slate-800">Gardening Service Providers:</strong> Your name, address, phone number, and booking details are shared with the assigned gardener to facilitate the service.</li>
              <li><strong className="text-slate-800">Legal Authorities:</strong> If required by law, court order, or government request.</li>
              <li><strong className="text-slate-800">Business Transfers:</strong> In the event of a merger, acquisition, or asset sale, your data may be transferred to the acquiring entity.</li>
            </ul>
          </div>
        </section>

        <section id="data-security" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-[#16382B] mb-3">6. Data Security</h2>
          <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>We implement industry-standard security measures to protect your personal information, including SSL/TLS encryption for data transmission, bcrypt hashing for passwords (12 salt rounds), and JWT-based authentication with HTTP-only cookies.</p>
            <p>Sensitive data such as bank account numbers and ID proof numbers are encrypted at rest. Payment data (card numbers, CVV, UPI PINs) is never stored on our servers — all payment processing is handled by Razorpay.</p>
            <p>Despite our efforts, no system is 100% secure. In the event of a data breach, we will notify affected users and the relevant authorities within 72 hours, as required by Indian data protection laws.</p>
          </div>
        </section>

        <section id="user-rights" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-[#16382B] mb-3">7. Your Rights</h2>
          <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>You have the following rights regarding your personal data:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong className="text-slate-800">Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong className="text-slate-800">Correction:</strong> Request correction of inaccurate or incomplete data.</li>
              <li><strong className="text-slate-800">Deletion:</strong> Request deletion of your account and associated data (subject to legal retention requirements).</li>
              <li><strong className="text-slate-800">Opt-out:</strong> Unsubscribe from marketing communications at any time.</li>
              <li><strong className="text-slate-800">Data Portability:</strong> Request your data in a machine-readable format.</li>
            </ul>
            <p>To exercise these rights, contact us at <a href="mailto:hello@growplants.in" className="text-[#16382B] hover:underline">hello@growplants.in</a>.</p>
          </div>
        </section>

        <section id="data-retention" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-[#16382B] mb-3">8. Data Retention</h2>
          <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>We retain your personal data for as long as your account is active or as necessary to provide our services. After account deletion, we retain certain data for legal, accounting, and reporting purposes for up to 3 years, after which it is permanently deleted.</p>
            <p>Order and transaction records are retained for 7 years as required by Indian tax laws. Usage data and analytics are retained for 24 months.</p>
          </div>
        </section>

        <section id="children" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-[#16382B] mb-3">9. Children&apos;s Privacy</h2>
          <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>Our services are not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. If you believe we have collected data from a child, please contact us immediately and we will delete it.</p>
          </div>
        </section>

        <section id="contact" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-[#16382B] mb-3">10. Contact</h2>
          <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>If you have any questions about this Privacy Policy or your data, please contact us:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Email: <a href="mailto:hello@growplants.in" className="text-[#16382B] hover:underline">hello@growplants.in</a></li>
              <li>Phone: <a href="tel:+919812345678" className="text-[#16382B] hover:underline">+91 98123 45678</a></li>
              <li>Address: Sonipat, Haryana 131001, India</li>
            </ul>
          </div>
        </section>
      </LegalLayout>
    </>
  );
}
