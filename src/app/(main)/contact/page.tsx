import type { Metadata } from "next";
import { MapPin, Phone, Mail, MessageCircle, Clock, Facebook, Instagram, Youtube } from "lucide-react";
import { Container } from "@/components/common/Container";
import { PageHero } from "@/components/common/PageHero";
import { ContactForm } from "@/components/common/ContactForm";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with GrowPlants. Call, email, or WhatsApp us for plant orders, gardening service bookings, or plant care advice. Mon–Sun, 9AM–7PM IST.",
  alternates: { canonical: "/contact" },
};

const CONTACT_INFO = [
  { icon: MapPin, label: "Address", value: "Sonipat, Haryana 131001, India", href: "https://maps.google.com/?q=Sonipat+Haryana" },
  { icon: Phone, label: "Phone", value: "+91 98123 45678", href: "tel:+919812345678" },
  { icon: Mail, label: "Email", value: "hello@growplants.in", href: "mailto:hello@growplants.in" },
  { icon: MessageCircle, label: "WhatsApp", value: "Chat with us", href: "https://wa.me/919812345678" },
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        overline="Get In Touch"
        title="Contact Us"
        subtitle="Have a question about plants, orders, or gardening services? We're here to help — reach out via call, email, WhatsApp, or the form below."
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Contact Us" }]}
      />

      <section className="py-12 md:py-16 bg-white">
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
            {/* Left: Contact info */}
            <div className="lg:col-span-1 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-[#16382B] mb-4">Contact Information</h2>
                <ul className="space-y-4">
                  {CONTACT_INFO.map((item) => (
                    <li key={item.label}>
                      <a
                        href={item.href}
                        target={item.href.startsWith("http") ? "_blank" : undefined}
                        rel="noopener noreferrer"
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#F3F8F1] transition-colors"
                      >
                        <div className="size-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "#C6A15B15" }}>
                          <item.icon className="size-5" style={{ color: "#C6A15B" }} aria-hidden="true" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{item.label}</p>
                          <p className="text-sm font-medium text-slate-800">{item.value}</p>
                        </div>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Business hours */}
              <div className="rounded-lg bg-[#F3F8F1] border border-slate-100 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="size-5 text-[#16382B]" aria-hidden="true" />
                  <h3 className="text-sm font-bold text-slate-800">Business Hours</h3>
                </div>
                <ul className="space-y-1.5 text-sm text-slate-600">
                  <li className="flex justify-between"><span>Monday – Friday</span><span className="font-medium">9:00 AM – 7:00 PM</span></li>
                  <li className="flex justify-between"><span>Saturday</span><span className="font-medium">9:00 AM – 7:00 PM</span></li>
                  <li className="flex justify-between"><span>Sunday</span><span className="font-medium">10:00 AM – 5:00 PM</span></li>
                </ul>
              </div>

              {/* Social */}
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-3">Follow Us</h3>
                <div className="flex items-center gap-3">
                  {[
                    { icon: Instagram, href: "#", label: "Instagram" },
                    { icon: Facebook, href: "#", label: "Facebook" },
                    { icon: Youtube, href: "#", label: "YouTube" },
                  ].map((s) => (
                    <a key={s.label} href={s.href} aria-label={s.label} className="size-10 rounded-full bg-[#F3F8F1] flex items-center justify-center text-[#16382B] hover:bg-[#16382B] hover:text-white transition-colors">
                      <s.icon className="size-5" aria-hidden="true" />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Contact form */}
            <div className="lg:col-span-2">
              <div className="rounded-xl border border-slate-200 bg-white p-6 md:p-8">
                <h2 className="text-xl font-bold text-[#16382B] mb-1">Send Us a Message</h2>
                <p className="text-sm text-slate-600 mb-6">Fill out the form below and we&apos;ll get back to you within 24 hours.</p>
                <ContactForm />
              </div>
            </div>
          </div>

          {/* Map placeholder */}
          <div className="mt-12 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-[16/6] flex items-center justify-center">
            <div className="text-center space-y-2">
              <MapPin className="size-10 text-[#16382B] mx-auto" aria-hidden="true" />
              <p className="text-sm font-semibold text-slate-700">GrowPlants — Sonipat, Haryana</p>
              <p className="text-xs text-slate-500">Map integration coming soon</p>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
