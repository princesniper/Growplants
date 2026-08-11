/**
 * GrowPlants — JWT & Session Helpers
 * Source: PRD §07 (Authentication), §25 (Security), 04_environment_and_configs.md
 *
 * Server-only module. Signs/verifies JWTs and serializes HTTP-only cookies.
 * Never import this from a client component — it uses Node-only APIs.
 */
import jwt, { type JwtPayload } from "jsonwebtoken";
import { cookies } from "next/headers";
import {
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
} from "@/lib/constants";

// A5 FIX: Never use default JWT secrets in production.
// In production, the app MUST fail if JWT_SECRET is not set.
// In development, a default is acceptable for convenience.
const _rawJwtSecret = process.env.JWT_SECRET;
const _rawJwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

if (process.env.NODE_ENV === "production") {
  if (!_rawJwtSecret) {
    throw new Error(
      "FATAL: JWT_SECRET environment variable is required in production. " +
      "Set it to a strong random string (≥32 chars). Refusing to start with insecure default."
    );
  }
  if (!_rawJwtRefreshSecret) {
    throw new Error(
      "FATAL: JWT_REFRESH_SECRET environment variable is required in production. " +
      "Set it to a different strong random string (≥32 chars)."
    );
  }
}

const JWT_SECRET = _rawJwtSecret ?? "dev-only-secret-change-me";
const JWT_REFRESH_SECRET = _rawJwtRefreshSecret ?? "dev-only-refresh-secret-change-me";

export interface GrowPlantsJwtPayload extends JwtPayload {
  uid: string;
  email: string;
  role: "customer" | "admin" | "provider";
  status: "active" | "suspended" | "deleted";
}

/* ---------- Sign ---------- */

export function signAccessToken(payload: Omit<GrowPlantsJwtPayload, "iat" | "exp">): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
}

export function signRefreshToken(payload: Omit<GrowPlantsJwtPayload, "iat" | "exp">): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });
}

/* ---------- Verify ---------- */

export function verifyAccessToken(token: string): GrowPlantsJwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as GrowPlantsJwtPayload;
    return decoded;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): GrowPlantsJwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as GrowPlantsJwtPayload;
    return decoded;
  } catch {
    return null;
  }
}

/* ---------- Cookie Serialization ---------- */

const ACCESS_COOKIE_NAME = "gp_access";
const REFRESH_COOKIE_NAME = "gp_refresh";

const baseCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/",
};

export async function setSessionCookies(params: {
  access: string;
  refresh: string;
}) {
  const store = await cookies();
  store.set(ACCESS_COOKIE_NAME, params.access, {
    ...baseCookieOptions,
    maxAge: 15 * 60, // 15 min
  });
  store.set(REFRESH_COOKIE_NAME, params.refresh, {
    ...baseCookieOptions,
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });
}

export async function clearSessionCookies() {
  const store = await cookies();
  store.delete(ACCESS_COOKIE_NAME);
  store.delete(REFRESH_COOKIE_NAME);
}

export async function getAccessToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(ACCESS_COOKIE_NAME)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(REFRESH_COOKIE_NAME)?.value;
}

/* ---------- Auth Header Helpers (for API routes) ---------- */

export function extractBearerToken(
  authHeader: string | null | undefined
): string | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.slice(7);
}

/**
 * Get the current authenticated user from the access-token cookie.
 * Returns null if unauthenticated or token invalid.
 */
export async function getCurrentUser(): Promise<GrowPlantsJwtPayload | null> {
  const token = await getAccessToken();
  if (!token) return null;
  return verifyAccessToken(token);
}

/**
 * Require authentication — throws 401-shaped error if no valid session.
 * Use in protected API routes.
 */
export async function requireAuth(): Promise<GrowPlantsJwtPayload> {
  const user = await getCurrentUser();
  if (!user) {
    const error = new Error("Unauthorized") as Error & { status: number };
    error.status = 401;
    throw error;
  }
  if (user.status !== "active") {
    const error = new Error("Account suspended") as Error & { status: number };
    error.status = 403;
    throw error;
  }
  return user;
}

/**
 * Require a specific role. Use in admin/provider-only routes.
 */
export async function requireRole(
  role: "admin" | "provider" | "customer"
): Promise<GrowPlantsJwtPayload> {
  const user = await requireAuth();
  if (user.role !== role) {
    const error = new Error("Forbidden") as Error & { status: number };
    error.status = 403;
    throw error;
  }
  return user;
}

/* ============================================================================
 * Firebase ID Token Verification (Dev Fallback)
 * ============================================================================
 * In production we'd use firebase-admin's verifyIdToken(). In dev, we decode
 * the JWT payload via base64 — without signature verification — so the API
 * routes can accept Firebase-issued ID tokens even when Admin SDK credentials
 * are missing.
 *
 * ⚠️  NEVER use this in production. Signature is NOT verified.
 * ============================================================================ */

export interface DecodedFirebaseToken {
  uid: string;
  email?: string;
  email_verified?: boolean;
  name?: string;
  picture?: string;
  iss?: string;
  aud?: string;
  auth_time?: number;
  iat?: number;
  exp?: number;
  sub?: string;
  firebase?: {
    identities?: Record<string, unknown>;
    sign_in_provider?: string;
  };
}

/**
 * Decode a Firebase ID token's payload WITHOUT verifying the signature.
 *
 * Firebase ID tokens are standard JWTs (header.payload.signature). All three
 * segments are base64url-encoded. We only need the payload (segment 2) to
 * extract the uid.
 *
 * Returns null if:
 *   - the token is malformed (fewer than 3 segments)
 *   - the payload cannot be base64-decoded or JSON-parsed
 *   - the token is expired (exp < now)
 */
export function verifyIdTokenDev(
  idToken: string
): DecodedFirebaseToken | null {
  try {
    const parts = idToken.split(".");
    if (parts.length !== 3) return null;

    // base64url → base64 → JSON
    const payloadB64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    // Pad to multiple of 4
    const padded = payloadB64 + "=".repeat((4 - (payloadB64.length % 4)) % 4);
    const payloadJson = Buffer.from(padded, "base64").toString("utf-8");
    const payload = JSON.parse(payloadJson) as DecodedFirebaseToken;

    // Validate expiry (exp is in seconds)
    if (typeof payload.exp === "number") {
      const nowSec = Math.floor(Date.now() / 1000);
      if (payload.exp < nowSec) return null;
    }

    // Extract uid: Firebase uses `user_id` or `sub`
    const uid = (payload as unknown as Record<string, unknown>).user_id as string | undefined;
    if (!uid && !payload.sub) return null;
    payload.uid = (uid || payload.sub)!;

    return payload;
  } catch {
    return null;
  }
}

/**
 * Try Admin SDK first (if configured); fall back to verifyIdTokenDev.
 * Used by API routes that accept Firebase ID tokens in the Authorization header.
 *
 * A4 FIX: The dev fallback (verifyIdTokenDev) does NOT verify JWT signatures.
 * It must NEVER run in production. In production, if Admin SDK is unavailable,
 * authentication FAILS — no fallback, no bypass.
 */
export async function verifyFirebaseIdToken(
  idToken: string
): Promise<DecodedFirebaseToken | null> {
  // Try Admin SDK first (production path)
  try {
    const { adminAuth, isAdminConfigured } = await import("@/lib/firebase/admin");
    if (isAdminConfigured && adminAuth) {
      const decoded = await adminAuth.verifyIdToken(idToken);
      return {
        uid: decoded.uid,
        email: decoded.email,
        email_verified: decoded.email_verified,
        name: decoded.name,
        picture: decoded.picture,
        iss: decoded.iss,
        aud: decoded.aud,
        auth_time: decoded.auth_time,
        iat: decoded.iat,
        exp: decoded.exp,
        sub: decoded.sub,
        firebase: decoded.firebase as DecodedFirebaseToken["firebase"],
      };
    }
  } catch (err) {
    // Admin SDK was configured but verification failed (expired token, invalid signature, etc.)
    // This is a genuine auth failure — do NOT fall back to dev mode.
    console.warn("[auth] Admin SDK token verification failed:", err);
    return null;
  }

  // A4 FIX: Dev fallback ONLY in development.
  // In production, if Admin SDK is not configured, authentication FAILS.
  if (process.env.NODE_ENV === "production") {
    console.error("[auth] Firebase Admin SDK not configured in production — refusing to verify tokens insecurely");
    return null;
  }

  // Development only — allows testing without Admin SDK credentials
  console.warn("[auth] Using INSECURE dev token fallback — NOT for production");
  return verifyIdTokenDev(idToken);
}
