"use client";

import Link from "next/link";
import Image from "next/image";
import { Leaf, MapPin, Phone, Mail, MessageCircle } from "lucide-react";

/**
 * Footer — dark green footer matching user's uploaded Footer.tsx exactly.
 * Background: #0F2419, accent color: #E8930A (orange), text: rgba(255,255,255,0.6/0.65)
 */
export function Footer() {
  return (
    <footer className="w-full" style={{ backgroundColor: "#0F2419", color: "#fff" }}>
      {/* Main footer */}
      <div className="max-w-[1280px] mx-auto px-4 lg:px-6 py-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
        {/* Brand column */}
        <div className="lg:col-span-2">
          <Link href="/" className="flex items-center gap-2 mb-5">
            <Image
              src="/logo.png"
              alt="GrowPlants Logo"
              width={120}
              height={40}
              className="h-10 w-auto object-contain"
              priority
            />
          </Link>
          <p className="text-sm leading-relaxed mb-5" style={{ color: "rgba(255,255,255,0.6)" }}>
            Sonipat&apos;s first premium plant store and gardening service marketplace. We bring nature to your home with healthy plants and expert gardeners.
          </p>

          {/* Contact details */}
          <div className="flex flex-col gap-2.5 text-sm mb-6" style={{ color: "rgba(255,255,255,0.65)" }}>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#E8930A" }} />
              <span>Sonipat, Haryana 131001, India</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0" style={{ color: "#E8930A" }} />
              <a href="tel:+919812345678" className="hover:text-white transition-colors">+91 98123 45678</a>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0" style={{ color: "#E8930A" }} />
              <a href="mailto:hello@growplants.in" className="hover:text-white transition-colors">hello@growplants.in</a>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 shrink-0" style={{ color: "#25D366" }} />
              <a href="https://wa.me/919812345678" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">WhatsApp Support</a>
            </div>
          </div>

          {/* Social links */}
          <div className="flex items-center gap-3">
            {[
              { href: "https://instagram.com/growplants", label: "Instagram", svg: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg> },
              { href: "https://facebook.com/growplants", label: "Facebook", svg: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg> },
              { href: "https://youtube.com/@growplants", label: "YouTube", svg: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg> },
              { href: "https://wa.me/919812345678", label: "WhatsApp", svg: <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg> },
            ].map(({ href, label, svg }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel="noopener noreferrer"
                className="footer-social-btn"
              >
                {svg}
              </a>
            ))}
          </div>
        </div>

        {/* Shop column */}
        <div>
          <h4 className="font-semibold text-sm uppercase tracking-widest mb-4" style={{ color: "#E8930A" }}>Shop</h4>
          <ul className="flex flex-col gap-2.5 text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
            {[
              ["Indoor Plants", "/shop?category=indoor-plants"],
              ["Outdoor Plants", "/shop?category=outdoor-plants"],
              ["Flowering Plants", "/shop?category=flowering-plants"],
              ["Succulents", "/shop?category=succulents"],
              ["Planters", "/shop?category=ceramic-planters"],
              ["Seeds & Tools", "/shop?category=seeds-bulbs"],
              ["New Arrivals", "/shop?filter=new"],
              ["Best Sellers", "/shop?filter=bestseller"],
            ].map(([label, href]) => (
              <li key={href}>
                <Link href={href} className="hover:text-white transition-colors">{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Services column */}
        <div>
          <h4 className="font-semibold text-sm uppercase tracking-widest mb-4" style={{ color: "#E8930A" }}>Services</h4>
          <ul className="flex flex-col gap-2.5 text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
            {[
              ["Gardener Hiring", "/services/gardener-hiring"],
              ["Balcony Garden Setup", "/services/balcony-garden-setup"],
              ["Terrace Garden", "/services/terrace-garden-setup"],
              ["Garden Maintenance", "/services/garden-maintenance"],
              ["Landscape Design", "/services/landscape-design"],
              ["Plant Inspection", "/services/plant-health-inspection"],
            ].map(([label, href]) => (
              <li key={href}>
                <Link href={href} className="hover:text-white transition-colors">{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company + Legal column */}
        <div>
          <h4 className="font-semibold text-sm uppercase tracking-widest mb-4" style={{ color: "#E8930A" }}>Company</h4>
          <ul className="flex flex-col gap-2.5 text-sm mb-6" style={{ color: "rgba(255,255,255,0.65)" }}>
            {[
              ["About Us", "/about"],
              ["Blog", "/blog"],
              ["Contact Us", "/contact"],
              ["Track Order", "/account/orders"],
              ["FAQs", "/faq"],
            ].map(([label, href]) => (
              <li key={href}><Link href={href} className="hover:text-white transition-colors">{label}</Link></li>
            ))}
          </ul>
          <h4 className="font-semibold text-sm uppercase tracking-widest mb-3" style={{ color: "#E8930A" }}>Legal</h4>
          <ul className="flex flex-col gap-2.5 text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
            {[
              ["Privacy Policy", "/privacy-policy"],
              ["Terms & Conditions", "/terms"],
              ["Refund Policy", "/refund-policy"],
            ].map(([label, href]) => (
              <li key={href}><Link href={href} className="hover:text-white transition-colors">{label}</Link></li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 py-5">
        <div className="max-w-[1280px] mx-auto px-4 lg:px-6 flex flex-col md:flex-row items-center justify-between gap-3 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
          <p className="flex items-center gap-1">
            © 2024 GrowPlants. All rights reserved. Made with
            <Leaf className="h-3.5 w-3.5" style={{ color: "#1A6B3C" }} aria-hidden="true" />
            in Sonipat, Haryana.
          </p>
          <div className="flex items-center gap-4 text-xs">
            <span>Secure Payments:</span>
            <span className="font-bold text-white/60">UPI · Cards · COD · NetBanking</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
