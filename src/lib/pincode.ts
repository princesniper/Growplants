/**
 * GrowPlants — Pincode Lookup
 * ============================================================================
 * Fetch city/district + state for a given 6-digit Indian pincode.
 * Uses the official India Post API: https://api.postalpincode.in/pincode/{pincode}
 *
 * Response shape (from India Post):
 *   [{ "Message": "...", "Status": "Success", "PostOffice": [
 *       { "Name": "...", "Pincode": "...", "District": "...",
 *         "State": "...", "Country": "India", "Block": "...", ... }
 *   ]}]
 *
 * We pick the first PostOffice entry and normalize to { city, state, district }.
 * ============================================================================
 */

export interface PincodeInfo {
  pincode: string;
  city: string;       // Primary city/town
  district: string;   // District name (fallback for city)
  state: string;
  region?: string;
  block?: string;
}

const API_BASE = "https://api.postalpincode.in/pincode";

/**
 * Lookup city + state for a 6-digit Indian pincode.
 * Returns null if pincode is invalid or not found.
 */
export async function lookupPincode(pincode: string): Promise<PincodeInfo | null> {
  // Validate format first
  if (!/^[1-9][0-9]{5}$/.test(pincode)) {
    return null;
  }

  try {
    const res = await fetch(`${API_BASE}/${pincode}`, {
      headers: { "Accept": "application/json" },
      // Use cache so repeat lookups for same pincode are instant
      next: { revalidate: 86400 }, // cache for 24h
    });

    if (!res.ok) return null;

    const data = await res.json();
    // API returns array — first entry has the status + PostOffice list
    const entry = Array.isArray(data) ? data[0] : data;
    if (!entry || entry.Status !== "Success" || !Array.isArray(entry.PostOffice) || entry.PostOffice.length === 0) {
      return null;
    }

    const po = entry.PostOffice[0];
    return {
      pincode,
      city: po.District || po.Block || po.Name || "",
      district: po.District || po.Block || "",
      state: po.State || "",
      region: po.Region,
      block: po.Block,
    };
  } catch (err) {
    console.error("[pincode] lookup failed:", err);
    return null;
  }
}
