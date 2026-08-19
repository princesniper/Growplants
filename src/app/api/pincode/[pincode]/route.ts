/**
 * GET /api/pincode/[pincode]
 * ============================================================================
 * Returns { pincode, city, district, state } for a 6-digit Indian pincode.
 * Uses India Post's public API via the cached `lookupPincode` helper.
 *
 * Response:
 *   200 → { ok: true, data: { pincode, city, district, state, region, block } }
 *   400 → { ok: false, error: "Invalid pincode format" }
 *   404 → { ok: false, error: "Pincode not found" }
 * ============================================================================
 */
import { NextRequest, NextResponse } from "next/server";
import { lookupPincode } from "@/lib/pincode";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ pincode: string }> }
) {
  const { pincode } = await params;

  if (!/^[1-9][0-9]{5}$/.test(pincode)) {
    return NextResponse.json(
      { ok: false, error: "Invalid pincode. Must be 6 digits, starting with 1-9." },
      { status: 400 }
    );
  }

  const info = await lookupPincode(pincode);

  if (!info) {
    return NextResponse.json(
      { ok: false, error: "Pincode not found. Please check and re-enter." },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, data: info });
}
