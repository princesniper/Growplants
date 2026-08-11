"use client";

import { useState } from "react";
import { Sprout, Truck, ShieldCheck, Headphones, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/common/Logo";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { useBilingual } from "@/store/useBilingual";
import Link from "next/link";

type View = "login" | "register" | "forgot";

const TRUST_POINTS = [
  {
    icon: Sprout,
    title: { en: "Healthy Plants", hi: "स्वस्थ पौधे" },
    desc: { en: "Hand-picked and quality-checked", hi: "हाथ से चुने और जांचे हुए" },
  },
  {
    icon: Truck,
    title: { en: "Fast Sonipat Delivery", hi: "तेज़ सोनीपत डिलीवरी" },
    desc: { en: "Free shipping above ₹499", hi: "₹499 से मुफ़्त शिपिंग" },
  },
  {
    icon: ShieldCheck,
    title: { en: "Verified Gardeners", hi: "सत्यापित माली" },
    desc: { en: "Background-checked experts", hi: "जांचे हुए विशेषज्ञ" },
  },
  {
    icon: Headphones,
    title: { en: "Expert Support", hi: "विशेषज्ञ सहायता" },
    desc: { en: "Mon–Sun, 9AM–7PM IST", hi: "सोम–रवि, 9AM–7PM" },
  },
];

export function AuthCard({ initialView = "login" }: { initialView?: View }) {
  const { t, language } = useBilingual();
  const isHi = language === "hi";
  const [view, setView] = useState<View>(initialView);

  const titles: Record<View, { title: string; subtitle: string }> = {
    login: {
      title: t("auth.login.title"),
      subtitle: t("auth.login.subtitle"),
    },
    register: {
      title: t("auth.register.title"),
      subtitle: t("auth.register.subtitle"),
    },
    forgot: {
      title: t("auth.forgot.title"),
      subtitle: t("auth.forgot.subtitle"),
    },
  };

  return (
    <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 rounded-2xl overflow-hidden shadow-lg border border-border bg-card">
      {/* ---------- Left: Brand panel (desktop only) ---------- */}
      <aside className="hidden lg:flex flex-col justify-between p-10 bg-primary text-primary-foreground relative overflow-hidden">
        {/* Decorative leaf pattern */}
        <div className="absolute -right-12 -bottom-12 opacity-10 pointer-events-none" aria-hidden="true">
          <svg width="300" height="300" viewBox="0 0 200 200" fill="none">
            <path d="M100 20 C 60 60, 60 140, 100 180 C 140 140, 140 60, 100 20 Z" fill="currentColor" />
            <path d="M100 40 L 100 160" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>
        <div className="absolute -left-8 -top-8 opacity-10 pointer-events-none" aria-hidden="true">
          <svg width="180" height="180" viewBox="0 0 200 200" fill="none">
            <path d="M100 20 C 60 60, 60 140, 100 180 C 140 140, 140 60, 100 20 Z" fill="currentColor" />
          </svg>
        </div>

        {/* Top: logo */}
        <div className="relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-primary-foreground hover:opacity-90"
          >
            <img
              src="/logo.png"
              alt="GrowPlants"
              className="h-9 w-auto"
              style={{ filter: "brightness(0) invert(1)" }}
            />
          </Link>
        </div>

        {/* Middle: headline + trust points */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-3">
            <h2 className="text-h2 font-bold leading-tight">
              {isHi ? "हरियाली का सफर शुरू करें" : "Start Your Green Journey"}
            </h2>
            <p className="text-body text-primary-foreground/80 max-w-sm">
              {isHi
                ? "सोनीपत का भरोसेमंद वनस्पति बाज़ार। पौधे, प्लांटर, और बागवानी सेवाएं — सब एक जगह।"
                : "Sonipat's trusted botanical marketplace. Plants, planters, and gardening services — all in one place."}
            </p>
          </div>

          <ul className="space-y-4">
            {TRUST_POINTS.map((point) => (
              <li key={point.title.en} className="flex items-start gap-3">
                <div className="size-10 rounded-full bg-primary-foreground/15 flex items-center justify-center shrink-0">
                  <point.icon className="size-5" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-body font-semibold">
                    {isHi ? point.title.hi : point.title.en}
                  </p>
                  <p className="text-body-sm text-primary-foreground/70">
                    {isHi ? point.desc.hi : point.desc.en}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom: stats */}
        <div className="relative z-10 flex items-center gap-6 text-primary-foreground/90">
          <div>
            <p className="text-h4 font-bold tabular-nums">1,200+</p>
            <p className="text-caption text-primary-foreground/70">
              {isHi ? "ग्राहक" : "Customers"}
            </p>
          </div>
          <div className="h-8 w-px bg-primary-foreground/20" />
          <div>
            <p className="text-h4 font-bold tabular-nums">4.8★</p>
            <p className="text-caption text-primary-foreground/70">
              {isHi ? "रेटिंग" : "Rating"}
            </p>
          </div>
          <div className="h-8 w-px bg-primary-foreground/20" />
          <div>
            <p className="text-h4 font-bold tabular-nums">500+</p>
            <p className="text-caption text-primary-foreground/70">
              {isHi ? "उत्पाद" : "Products"}
            </p>
          </div>
        </div>
      </aside>

      {/* ---------- Right: Form panel ---------- */}
      <section className="flex flex-col p-6 sm:p-10">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <Logo size="md" />
        </div>

        {/* Header */}
        <div className="mb-6 space-y-1">
          <h1 className="text-h3 font-bold text-foreground">{titles[view].title}</h1>
          <p className="text-body-sm text-muted-foreground">{titles[view].subtitle}</p>
        </div>

        {/* Forms */}
        <div className="flex-1">
          {view === "login" && (
            <LoginForm
              onForgotPassword={() => setView("forgot")}
              onSwitchToRegister={() => setView("register")}
            />
          )}
          {view === "register" && (
            <RegisterForm onSwitchToLogin={() => setView("login")} />
          )}
          {view === "forgot" && (
            <ForgotPasswordForm onBackToLogin={() => setView("login")} />
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-border text-center">
          <p className="text-caption text-muted-foreground">
            {isHi
              ? "जारी रखकर आप हमारी गोपनीयता नीति और नियम से सहमत हैं"
              : "By continuing, you agree to our Privacy Policy and Terms"}
          </p>
        </div>
      </section>
    </div>
  );
}
