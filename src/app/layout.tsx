import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Noto_Sans_Devanagari, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { AppProviders } from "@/components/providers/AppProviders";

/* ---------- Fonts (Growth and Vitality Design System §3: Inter for all) ---------- */
const fontInter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const fontJetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const fontNotoDevanagari = Noto_Sans_Devanagari({
  variable: "--font-noto-devanagari",
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/* ---------- Display serif: Cormorant Garamond (premium botanical direction) ---------- */
const fontCormorant = Cormorant_Garamond({
  variable: "--font-cormorant-garamond",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

/* ---------- SEO Metadata (Phase 1 placeholder — refined in Phase 4 Homepage) ---------- */
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"
  ),
  title: {
    default: "GrowPlants — Plants, Planters & Gardening Services in Sonipat",
    template: "%s | GrowPlants",
  },
  description:
    "GrowPlants is Sonipat's trusted botanical marketplace — shop healthy plants, premium planters, and gardening supplies, or book verified local gardeners for balcony setup, landscaping, and plant care.",
  keywords: [
    "GrowPlants",
    "plants Sonipat",
    "planters Haryana",
    "gardening services India",
    "indoor plants",
    "outdoor plants",
    "gardener booking",
    "nursery online",
    "gardening supplies",
  ],
  authors: [{ name: "GrowPlants Team" }],
  creator: "GrowPlants",
  publisher: "GrowPlants",
  applicationName: "GrowPlants",
  category: "eCommerce & Services",
  alternates: {
    canonical: "/",
    languages: {
      "en-IN": "/",
      "hi-IN": "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "en_IN",
    alternateLocale: ["hi_IN"],
    url: "https://growplants.in",
    siteName: "GrowPlants",
    title: "GrowPlants — Plants, Planters & Gardening Services in Sonipat",
    description:
      "Sonipat's trusted botanical marketplace. Shop plants, planters, and gardening supplies, or book verified local gardeners.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "GrowPlants — Plants, Planters & Gardening Services",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GrowPlants — Plants, Planters & Gardening Services",
    description:
      "Sonipat's trusted botanical marketplace. Shop plants, planters, and gardening supplies, or book verified local gardeners.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7fbf0" },
    { media: "(prefers-color-scheme: dark)", color: "#0f140d" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontInter.variable} ${fontJetbrainsMono.variable} ${fontNotoDevanagari.variable} ${fontCormorant.variable} antialiased bg-background text-foreground min-h-screen flex flex-col`}
      >
        <a href="#main-content" className="skip-to-content">
          Skip to content
        </a>
        <AppProviders>
          {children}
        </AppProviders>
        <Toaster />
        <SonnerToaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
