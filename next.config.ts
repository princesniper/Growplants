import type { NextConfig } from "next";
import path from "node:path";

/**
 * GrowPlants — Next.js Configuration
 * Source: 04_environment_and_configs.md §2
 *
 * - Standalone output for production deployment
 * - Remote image patterns allowlisted from verified Indian gardening image CDNs
 *   so next/image can optimize product/planter photography without re-hosting.
 */
const REMOTE_IMAGE_DOMAINS = [
  "5.imimg.com",
  "amd.deodap.com",
  "cdn.mos.cms.futurecdn.net",
  "dukaan.b-cdn.net",
  "encrypted-tbn0.gstatic.com",
  "encrypted-tbn2.gstatic.com",
  "encrypted-tbn3.gstatic.com",
  "gardengram.in",
  "ilovenursery.com",
  "images.meesho.com",
  "images.unsplash.com",
  "lh3.googleusercontent.com",
  "littleveggiepatchco.com.au",
  "m.media-amazon.com",
  "nativejungleplants.com",
  "naturealive.in",
  "nurserylive.com",
  "nurserynisarga.in",
  "nurturinggreen.in",
  "plantsguru.com",
  "res.cloudinary.com",
  "rukminim1.flixcart.com",
  "rukminim2.flixcart.com",
  "storage.googleapis.com",
  "www.ugaoo.com",
];

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true, // D19: enabled for better dev experience
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: REMOTE_IMAGE_DOMAINS.map((domain) => ({
      protocol: "https" as const,
      hostname: domain,
    })),
  },
  // Allow the preview gateway origin to load _next/* assets during dev.
  // The preview subdomain includes the chat ID, so we allow all space-z.ai subdomains.
  allowedDevOrigins: [
    "https://preview-chat-9491ca16-c30d-4a2b-8976-79a75d0955cc.space-z.ai",
    "http://preview-chat-9491ca16-c30d-4a2b-8976-79a75d0955cc.space-z.ai",
    "preview-chat-9491ca16-c30d-4a2b-8976-79a75d0955cc.space-z.ai",
    "*.space-z.ai",
  ],
  typescript: {
    // Foundation types are strict; allow build to surface issues during dev.
    ignoreBuildErrors: false,
  },
};

export default nextConfig;
