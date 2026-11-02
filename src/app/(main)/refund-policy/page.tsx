import type { Metadata } from "next";
import { LegalLayout } from "@/components/common/LegalLayout";
import { PageHero } from "@/components/common/PageHero";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Read GrowPlants' refund and return policy — covering plant damage claims, planter returns, service cancellations, and refund timelines.",
  alternates: { canonical: "/refund-policy" },
};

const TOC = [
  { id: "overview", label: "1. Overview" },
  { id: "plants", label: "2. Plant Returns (24h Damage)" },
  { id: "planters", label: "3. Planters & Accessories (7-Day)" },
  { id: "services", label: "4. Service Cancellations" },
  { id: "timelines", label: "5. Refund Timelines" },
  { id: "process", label: "6. How to Request a Refund" },
  { id: "non-refundable", label: "7. Non-Refundable Items" },
  { id: "contact", label: "8. Contact" },
];

export default function RefundPolicyPage() {
  return (
    <>
      <PageHero
        overline="Legal"
        title="Refund & Return Policy"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Refund Policy" }]}
      />
      <LegalLayout title="Refund & Return Policy" lastUpdated="1 January 2026" tocItems={TOC}>
        <section id="overview" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-[#16382B] mb-3">1. Overview</h2>
          <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>At GrowPlants, we want you to be completely satisfied with your purchase. This Refund Policy explains the conditions under which we accept returns and issue refunds for plants, planters, gardening products, and gardening services.</p>
            <p>Since plants are living products, our return policy for plants differs from non-living products. Please read the sections below carefully to understand your eligibility for returns and refunds.</p>
            <p>All refund requests must be made through our platform, WhatsApp, or email. We aim to process all legitimate refund requests within 5 business days of approval.</p>
          </div>
        </section>

        <section id="plants" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-[#16382B] mb-3">2. Plant Returns (24-Hour Damage Guarantee)</h2>
          <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p><strong className="text-slate-800">24-Hour Damage Claim Window:</strong> If your plant arrives damaged, wilted, or in poor health, you must report it within 24 hours of delivery. Contact us via WhatsApp or email with your order number and clear photos of the damaged plant.</p>
            <p><strong className="text-slate-800">Resolution Options:</strong></p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong className="text-slate-800">Replacement (preferred):</strong> We will send a replacement plant at no additional cost.</li>
              <li><strong className="text-slate-800">Full Refund:</strong> If a replacement is not available, we will issue a full refund including delivery charges.</li>
            </ul>
            <p><strong className="text-slate-800">What is NOT covered:</strong> Plants that die after the 24-hour window due to improper care, overwatering, underwatering, insufficient sunlight, or other care-related issues are not eligible for refunds. We provide free plant care guidance via WhatsApp to help your plants thrive.</p>
            <p><strong className="text-slate-800">Evidence Required:</strong> Clear photos showing the damaged condition of the plant and the packaging. Photos must be taken within 24 hours of delivery.</p>
          </div>
        </section>

        <section id="planters" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-[#16382B] mb-3">3. Planters &amp; Accessories (7-Day Return)</h2>
          <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p><strong className="text-slate-800">7-Day Return Window:</strong> Planters, pots, tools, seeds, fertilizers, and other gardening accessories can be returned within 7 days of delivery if they have manufacturing defects or arrived damaged during shipping.</p>
            <p><strong className="text-slate-800">Conditions for Return:</strong></p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>The item must be unused and in its original packaging.</li>
              <li>All accessories, manuals, and freebies must be included.</li>
              <li>The item must not be damaged by the customer.</li>
              <li>Proof of purchase (order number) is required.</li>
            </ul>
            <p><strong className="text-slate-800">Resolution:</strong> Upon inspection of the returned item, we will issue a full refund or send a replacement, based on your preference and product availability.</p>
            <p><strong className="text-slate-800">Return Shipping:</strong> Return shipping costs are borne by GrowPlants if the item is defective or damaged on arrival. If returning for other reasons, the customer bears return shipping costs.</p>
          </div>
        </section>

        <section id="services" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-[#16382B] mb-3">4. Gardening Service Cancellations &amp; Refunds</h2>
          <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p><strong className="text-slate-800">Cancellation by Customer:</strong></p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li><strong className="text-slate-800">24+ hours before:</strong> Full refund (100%).</li>
              <li><strong className="text-slate-800">Within 24 hours:</strong> Partial refund (50%).</li>
              <li><strong className="text-slate-800">After service starts or provider arrives:</strong> No refund.</li>
            </ul>
            <p><strong className="text-slate-800">Cancellation by Provider (No-Show):</strong> If a gardener fails to show up at the scheduled time, you will receive a full refund plus a 10% credit toward your next booking. We will also offer to reschedule with a different provider at no extra charge.</p>
            <p><strong className="text-slate-800">Service Quality Issues:</strong> If you are unsatisfied with the service quality, contact us within 48 hours. We will investigate and, if the complaint is valid, offer a partial refund or free re-service.</p>
            <p><strong className="text-slate-800">Rescheduling:</strong> Bookings can be rescheduled for free up to 24 hours before the scheduled time. Within 24 hours, rescheduling counts as a cancellation and the above refund tiers apply.</p>
          </div>
        </section>

        <section id="timelines" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-[#16382B] mb-3">5. Refund Timelines</h2>
          <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>Refunds are initiated after approval and processed as follows:</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-[#F3F8F1]">
                  <tr>
                    <th className="text-left p-3 font-semibold text-slate-700">Payment Method</th>
                    <th className="text-left p-3 font-semibold text-slate-700">Refund Timeline</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr><td className="p-3 text-slate-600">Razorpay (UPI/Card/Wallet)</td><td className="p-3 text-slate-600">3–5 business days</td></tr>
                  <tr><td className="p-3 text-slate-600">Net Banking</td><td className="p-3 text-slate-600">5–7 business days</td></tr>
                  <tr><td className="p-3 text-slate-600">Cash on Delivery (COD)</td><td className="p-3 text-slate-600">7 business days (NEFT/UPI transfer)</td></tr>
                  <tr><td className="p-3 text-slate-600">Store Credit</td><td className="p-3 text-slate-600">Instant (applied to account)</td></tr>
                </tbody>
              </table>
            </div>
            <p>Refunds are credited to the original payment method. For COD orders, we require your bank account or UPI details for the refund transfer. You will receive an email notification once the refund is initiated.</p>
          </div>
        </section>

        <section id="process" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-[#16382B] mb-3">6. How to Request a Refund</h2>
          <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>To request a refund, follow these steps:</p>
            <ol className="list-decimal pl-5 space-y-1.5">
              <li>Contact us via WhatsApp (<a href="https://wa.me/919812345678" className="text-[#16382B] hover:underline">+91 98123 45678</a>) or email (<a href="mailto:hello@growplants.in" className="text-[#16382B] hover:underline">hello@growplants.in</a>).</li>
              <li>Provide your order number or booking ID.</li>
              <li>For damaged plants: Attach clear photos taken within 24 hours of delivery.</li>
              <li>For defective accessories: Attach photos of the defect.</li>
              <li>Our team will review your request within 24 hours and respond with approval or follow-up questions.</li>
              <li>Once approved, the refund will be processed according to the timelines above.</li>
            </ol>
          </div>
        </section>

        <section id="non-refundable" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-[#16382B] mb-3">7. Non-Refundable Items</h2>
          <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>The following are not eligible for refunds:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Plants that die after the 24-hour damage window due to improper care.</li>
              <li>Used planters, tools, or accessories (unless defective).</li>
              <li>Opened seed packets or fertilizer bags.</li>
              <li>Services that have been completed (unless quality issues are reported within 48 hours).</li>
              <li>Bookings cancelled after the provider has arrived or the service has started.</li>
              <li>Delivery charges for orders that were successfully delivered (unless the order was damaged).</li>
            </ul>
          </div>
        </section>

        <section id="contact" className="scroll-mt-24">
          <h2 className="text-xl font-bold text-[#16382B] mb-3">8. Contact</h2>
          <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
            <p>If you have any questions about our Refund Policy, please contact us:</p>
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
