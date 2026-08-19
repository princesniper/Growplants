/**
 * GrowPlants — Shared GPS Helpers
 * ============================================================================
 * Single source of truth for GPS location + reverse geocoding.
 * Used by BOTH Account addresses and Checkout.
 * ============================================================================
 */

export interface GPSLocation {
  lat: number;
  lng: number;
  accuracy: number;
}

export interface ReverseGeocodeResult {
  city: string;
  state: string;
  pincode: string;
}

/**
 * Get user's current GPS location via browser geolocation API.
 * Requires accuracy <= 100m.
 */
export async function getGPSLocation(): Promise<GPSLocation> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("GPS not supported on this device"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      }),
      (err) => {
        if (err.code === 1) reject(new Error("Location permission denied. Please allow location access."));
        else if (err.code === 2) reject(new Error("Location unavailable. Check your GPS settings."));
        else if (err.code === 3) reject(new Error("Location request timed out. Try again."));
        else reject(new Error("Failed to get location."));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

/**
 * Reverse geocode coordinates → city/state/pincode using OpenStreetMap Nominatim.
 */
export async function reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
  const res = await fetch(url, {
    headers: { "Accept-Language": "en", "User-Agent": "GrowPlants/1.0 (hello@growplants.in)" },
  });
  if (!res.ok) throw new Error("Failed to fetch address from location");
  const data = await res.json();
  const addr = data.address || {};
  return {
    city: addr.city || addr.town || addr.village || addr.county || "",
    state: addr.state || "",
    pincode: addr.postcode || "",
  };
}

/**
 * Search for a location by text query using OpenStreetMap Nominatim.
 */
export async function searchLocation(query: string): Promise<{ lat: number; lng: number; displayName: string } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=in`;
  const res = await fetch(url, {
    headers: { "Accept-Language": "en", "User-Agent": "GrowPlants/1.0 (hello@growplants.in)" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (data && data.length > 0) {
    return {
      lat: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
      displayName: data[0].display_name,
    };
  }
  return null;
}

/** GPS accuracy threshold in meters */
export const GPS_ACCURACY_THRESHOLD = 100;
