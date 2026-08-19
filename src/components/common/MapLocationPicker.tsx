"use client";

/**
 * GrowPlants — MapLocationPicker (Blinkit-style)
 * ============================================================================
 * Full-screen interactive location picker with:
 *   - Center-pin (Blinkit-style, pin stays in middle of screen while map moves)
 *   - "Use Current Location" / recenter button (top-right floating)
 *   - Search bar (top, dismissable)
 *   - Bottom sheet showing live reverse-geocoded address
 *   - "Confirm Location" button at bottom (always visible)
 *
 * UX:
 *   1. Picker opens full-screen
 *   2. Pin is centered; user drags the MAP (not the pin) to position the pin
 *   3. As the map stops moving, we reverse-geocode the center coordinates
 *   4. Bottom sheet shows the resolved address (street, city, state, pincode)
 *   5. User clicks "Confirm Location"
 *   6. Parent's onLocationSelect fires with {lat, lng, accuracy, city, state, pincode}
 *
 * Notes:
 *   - Leaflet loaded from CDN (no npm install needed)
 *   - Uses Nominatim (OpenStreetMap) for both forward search and reverse geocode
 * ============================================================================
 */
import { useEffect, useRef, useState, useCallback } from "react";
import {
  MapPin, Check, X, Loader2, Search, Crosshair, AlertCircle,
  ChevronDown, Navigation, Locate,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getGPSLocation } from "@/lib/gps";

// Default center: Sonipat, Haryana
const DEFAULT_CENTER: [number, number] = [28.9965, 77.0203];
const DEFAULT_ZOOM = 16;
const REVERSE_GEOCODE_DEBOUNCE_MS = 500;

// ─── Leaflet loader (CDN, singleton) ───
let leafletLoaded = false;
let leafletLoadPromise: Promise<void> | null = null;

function loadLeaflet(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if (leafletLoaded) return Promise.resolve();
  if (leafletLoadPromise) return leafletLoadPromise;

  leafletLoadPromise = new Promise<void>((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.onload = () => {
      leafletLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error("Failed to load map library"));
    document.head.appendChild(script);
  });

  return leafletLoadPromise;
}

interface ReverseGeocodeResult {
  city: string;
  state: string;
  pincode: string;
  street?: string;
  area?: string;
  displayName?: string;
}

interface MapLocationPickerProps {
  open: boolean;
  onClose: () => void;
  onLocationSelect: (location: {
    lat: number;
    lng: number;
    accuracy: number;
    city?: string;
    state?: string;
    pincode?: string;
  }) => void;
  initialLocation?: { lat: number; lng: number } | null;
}

export function MapLocationPicker({
  open,
  onClose,
  onLocationSelect,
  initialLocation,
}: MapLocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const centerMarkerRef = useRef<any>(null); // static center marker (visual only)
  const reverseAbortRef = useRef<AbortController | null>(null);
  const reverseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── State ───
  const [coords, setCoords] = useState<{ lat: number; lng: number }>(
    initialLocation ?? { lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] }
  );
  const [address, setAddress] = useState<ReverseGeocodeResult | null>(null);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<
    Array<{ lat: number; lng: number; displayName: string }>
  >([]);

  // GPS locate state
  const [isLocating, setIsLocating] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [isMapReady, setIsMapReady] = useState(false);

  // ─── Initialize map on open ───
  useEffect(() => {
    if (!open || !mapRef.current) return;

    let cancelled = false;
    setIsMapReady(false);

    loadLeaflet()
      .then(() => {
        if (cancelled || !mapRef.current) return;
        const L = (window as any).L;

        const center: [number, number] = initialLocation
          ? [initialLocation.lat, initialLocation.lng]
          : DEFAULT_CENTER;

        mapInstance.current = L.map(mapRef.current, {
          center,
          zoom: DEFAULT_ZOOM,
          zoomControl: false,
          scrollWheelZoom: true,
          dragging: true,
          doubleClickZoom: false,
          attributionControl: false,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
        }).addTo(mapInstance.current);

        // Center pin: visual element only — does NOT move when user drags the map.
        // It stays anchored to the center of the viewport, so as the map moves
        // underneath, the "selected" coords are always the map's current center.
        const CenterPinIcon = L.divIcon({
          className: "",
          html: `
            <div class="gp-center-pin">
              <div class="gp-center-pin-shadow"></div>
              <div class="gp-center-pin-stem"></div>
              <div class="gp-center-pin-head"></div>
            </div>
          `,
          iconSize: [40, 50],
          iconAnchor: [20, 46],
        });
        centerMarkerRef.current = L.marker(center, {
          icon: CenterPinIcon,
          interactive: false,    // can't drag the pin itself — drag the map instead
          keyboard: false,
          zIndexOffset: 1000,
        }).addTo(mapInstance.current);

        // ─── On map move: update coords + debounced reverse geocode ───
        const handleMove = () => {
          const c = mapInstance.current.getCenter();
          setCoords({ lat: c.lat, lng: c.lng });
          setGpsAccuracy(null); // no longer purely GPS once user drags
          scheduleReverseGeocode(c.lat, c.lng);
        };
        mapInstance.current.on("move", handleMove);
        mapInstance.current.on("moveend", handleMove);

        // Initial reverse geocode
        scheduleReverseGeocode(center[0], center[1]);

        // Fix size after render
        setTimeout(() => {
          if (mapInstance.current && !cancelled) {
            mapInstance.current.invalidateSize();
            setIsMapReady(true);
          }
        }, 250);
      })
      .catch((err) => {
        setError("Failed to load map. Please check your internet connection.");
        console.error("[MapPicker] Leaflet load error:", err);
      });

    return () => {
      cancelled = true;
      if (reverseTimerRef.current) clearTimeout(reverseTimerRef.current);
      if (reverseAbortRef.current) reverseAbortRef.current.abort();
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        centerMarkerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ─── Debounced reverse geocode ───
  const scheduleReverseGeocode = useCallback((lat: number, lng: number) => {
    if (reverseTimerRef.current) clearTimeout(reverseTimerRef.current);
    if (reverseAbortRef.current) reverseAbortRef.current.abort();

    reverseTimerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      reverseAbortRef.current = controller;
      setIsReverseGeocoding(true);
      setError("");
      try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
        const res = await fetch(url, {
          signal: controller.signal,
          headers: {
            "Accept-Language": "en",
            "User-Agent": "GrowPlants/1.0 (hello@growplants.in)",
          },
        });
        if (!res.ok) throw new Error("Reverse geocoding failed");
        const data = await res.json();
        const addr = data.address || {};
        const streetParts = [
          addr.house_number,
          addr.road,
          addr.neighbourhood,
          addr.suburb,
        ].filter(Boolean);
        const areaParts = [
          addr.city || addr.town || addr.village || addr.county,
          addr.state,
        ].filter(Boolean);

        setAddress({
          city: addr.city || addr.town || addr.village || addr.county || "",
          state: addr.state || "",
          pincode: addr.postcode || "",
          street: streetParts.join(", "),
          area: areaParts.join(", "),
          displayName: data.display_name,
        });
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        // Soft fail — we still have coords, just no address text
        setAddress(null);
      } finally {
        setIsReverseGeocoding(false);
      }
    }, REVERSE_GEOCODE_DEBOUNCE_MS);
  }, []);

  // ─── GPS Locate (recenter on user's current GPS) ───
  const handleLocate = useCallback(async () => {
    setIsLocating(true);
    setError("");
    try {
      const loc = await getGPSLocation();
      setGpsAccuracy(loc.accuracy);
      const L = (window as any).L;
      if (mapInstance.current) {
        mapInstance.current.setView([loc.lat, loc.lng], 17, { animate: true });
      }
      setCoords({ lat: loc.lat, lng: loc.lng });
      scheduleReverseGeocode(loc.lat, loc.lng);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not detect your GPS location. Please try manually."
      );
    } finally {
      setIsLocating(false);
    }
  }, [scheduleReverseGeocode]);

  // ─── Search (Nominatim forward search) ───
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setError("");
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5&countrycodes=in&addressdetails=1`;
      const res = await fetch(url, {
        headers: {
          "Accept-Language": "en",
          "User-Agent": "GrowPlants/1.0 (hello@growplants.in)",
        },
      });
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      if (data && data.length > 0) {
        setSearchResults(
          data.map((d: any) => ({
            lat: parseFloat(d.lat),
            lng: parseFloat(d.lon),
            displayName: d.display_name,
          }))
        );
      } else {
        setSearchResults([]);
        setError("No results. Try a different search term.");
      }
    } catch (err) {
      setError("Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleSelectSearchResult = (r: { lat: number; lng: number }) => {
    if (mapInstance.current) {
      mapInstance.current.setView([r.lat, r.lng], 17, { animate: true });
    }
    setCoords({ lat: r.lat, lng: r.lng });
    scheduleReverseGeocode(r.lat, r.lng);
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    setError("");
  };

  // ─── Confirm ───
  const handleConfirm = async () => {
    setIsConfirming(true);
    setError("");
    try {
      // If we already have a reverse-geocoded address, use it. Otherwise, do one final fetch.
      let finalAddr: ReverseGeocodeResult | null = address;
      if (!finalAddr) {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&addressdetails=1`;
        const res = await fetch(url, {
          headers: {
            "Accept-Language": "en",
            "User-Agent": "GrowPlants/1.0 (hello@growplants.in)",
          },
        });
        if (res.ok) {
          const data = await res.json();
          const a = data.address || {};
          finalAddr = {
            city: a.city || a.town || a.village || a.county || "",
            state: a.state || "",
            pincode: a.postcode || "",
            street: [a.house_number, a.road, a.neighbourhood].filter(Boolean).join(", "),
            area: [a.city || a.town || a.village, a.state].filter(Boolean).join(", "),
            displayName: data.display_name,
          };
        }
      }

      onLocationSelect({
        lat: coords.lat,
        lng: coords.lng,
        accuracy: gpsAccuracy ?? 0,
        city: finalAddr?.city,
        state: finalAddr?.state,
        pincode: finalAddr?.pincode,
      });
      onClose();
    } catch (err) {
      setError("Could not confirm location. Please try again.");
    } finally {
      setIsConfirming(false);
    }
  };

  // ─── Prevent body scroll when open ───
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* ─── Inline styles for the center pin (Blinkit-style) ─── */}
      <style>{`
        .gp-center-pin {
          position: relative;
          width: 40px;
          height: 50px;
          animation: gp-pin-drop 0.35s ease-out;
        }
        @keyframes gp-pin-drop {
          0% { transform: translateY(-30px); opacity: 0; }
          60% { transform: translateY(4px); opacity: 1; }
          100% { transform: translateY(0); opacity: 1; }
        }
        .gp-center-pin-head {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 28px;
          height: 28px;
          border-radius: 50% 50% 50% 0;
          background: #1A6B3C;
          transform-origin: bottom center;
          rotate: -45deg;
          box-shadow: 0 4px 10px rgba(26, 107, 60, 0.4), 0 0 0 4px rgba(255,255,255,0.95) inset;
          border: 3px solid white;
        }
        .gp-center-pin-head::after {
          content: "";
          position: absolute;
          top: 6px;
          left: 6px;
          width: 13px;
          height: 13px;
          border-radius: 50%;
          background: white;
          rotate: 45deg;
        }
        .gp-center-pin-stem {
          position: absolute;
          top: 28px;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 14px;
          background: #1A6B3C;
        }
        .gp-center-pin-shadow {
          position: absolute;
          top: 40px;
          left: 50%;
          transform: translateX(-50%);
          width: 18px;
          height: 6px;
          background: rgba(0,0,0,0.2);
          border-radius: 50%;
          filter: blur(2px);
        }
        .gp-map-fade-in { animation: gp-fade-in 0.25s ease-out; }
        @keyframes gp-fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .gp-sheet-enter { animation: gp-sheet-in 0.3s cubic-bezier(0.22, 1, 0.36, 1); }
        @keyframes gp-sheet-in {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .leaflet-container { background: #e5e7eb; font-family: inherit; }
        .leaflet-bar a { border-radius: 8px !important; }
      `}</style>

      {/* ─── Full-screen overlay ─── */}
      <div className="fixed inset-0 z-[100] bg-black/40 flex items-end sm:items-center justify-center">
        <div className="relative w-full h-full sm:h-[90vh] sm:max-w-3xl sm:rounded-2xl overflow-hidden bg-white shadow-2xl gp-sheet-enter">

          {/* ─── Top bar: close + search toggle + GPS locate ─── */}
          <div className="absolute top-0 inset-x-0 z-[1000] p-3 pointer-events-none">
            <div className="flex items-start gap-2 pointer-events-auto">
              <button
                onClick={onClose}
                className="size-11 shrink-0 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all"
                aria-label="Close map"
              >
                <X className="size-5 text-slate-700" />
              </button>

              {/* Search bar — toggleable */}
              <div className="flex-1 min-w-0">
                {!searchOpen ? (
                  <button
                    onClick={() => setSearchOpen(true)}
                    className="w-full h-11 rounded-full bg-white shadow-lg px-4 flex items-center gap-2 hover:bg-slate-50 active:scale-[0.98] transition-all"
                  >
                    <Search className="size-4 text-slate-400" />
                    <span className="text-sm text-slate-500 truncate">
                      Search for your area, street, or landmark…
                    </span>
                  </button>
                ) : (
                  <div className="bg-white shadow-lg rounded-full flex items-center gap-1 pl-4 pr-1 h-11">
                    <Search className="size-4 text-slate-400 shrink-0" />
                    <input
                      autoFocus
                      type="text"
                      placeholder="Search location…"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleSearch();
                        if (e.key === "Escape") {
                          setSearchOpen(false);
                          setSearchQuery("");
                          setSearchResults([]);
                        }
                      }}
                      className="flex-1 bg-transparent outline-none text-sm text-slate-700 min-w-0"
                    />
                    <button
                      onClick={() => {
                        setSearchOpen(false);
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                      className="size-8 rounded-full hover:bg-slate-100 flex items-center justify-center shrink-0"
                      aria-label="Close search"
                    >
                      <X className="size-4 text-slate-500" />
                    </button>
                  </div>
                )}
              </div>

              {/* GPS locate */}
              <button
                onClick={handleLocate}
                disabled={isLocating}
                className="size-11 shrink-0 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-50"
                aria-label="Use current location"
                title="Use my current GPS location"
              >
                {isLocating ? (
                  <Loader2 className="size-5 text-[#1A6B3C] animate-spin" />
                ) : (
                  <Locate className="size-5 text-[#1A6B3C]" />
                )}
              </button>
            </div>

            {/* ─── Search results dropdown ─── */}
            {searchOpen && searchResults.length > 0 && (
              <div className="pointer-events-auto mt-2 bg-white rounded-xl shadow-xl max-h-[40vh] overflow-y-auto">
                {searchResults.map((r, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectSearchResult(r)}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 active:bg-slate-100 border-b border-slate-100 last:border-0 flex items-start gap-2"
                  >
                    <MapPin className="size-4 text-slate-400 mt-0.5 shrink-0" />
                    <span className="text-sm text-slate-700 line-clamp-2">
                      {r.displayName}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ─── Zoom controls (right side) ─── */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 z-[1000] flex flex-col gap-2">
            <button
              onClick={() => mapInstance.current?.zoomIn()}
              className="size-11 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all text-xl text-slate-700 font-light"
              aria-label="Zoom in"
            >
              +
            </button>
            <button
              onClick={() => mapInstance.current?.zoomOut()}
              className="size-11 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all text-xl text-slate-700 font-light"
              aria-label="Zoom out"
            >
              −
            </button>
          </div>

          {/* ─── Map container ─── */}
          <div
            ref={mapRef}
            className="absolute inset-0"
            style={{ background: "#e5e7eb" }}
          />

          {/* ─── Loading overlay (map not ready yet) ─── */}
          {!isMapReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-100">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="size-8 animate-spin text-[#1A6B3C]" />
                <p className="text-sm text-slate-500">Loading map…</p>
              </div>
            </div>
          )}

          {/* ─── "Drag the map to adjust" hint (top center, fade out after first move) ─── */}
          {isMapReady && !address && !isReverseGeocoding && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[999] pointer-events-none">
              <div className="bg-slate-900/80 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
                <Navigation className="size-3" />
                Drag the map to set your location
              </div>
            </div>
          )}

          {/* ─── Bottom sheet (Blinkit-style) ─── */}
          <div className="absolute bottom-0 inset-x-0 z-[1000] gp-sheet-enter">
            <div className="bg-white rounded-t-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.08)] pb-[env(safe-area-inset-bottom)]">
              {/* Drag handle */}
              <div className="flex justify-center pt-2 pb-1">
                <div className="w-10 h-1 rounded-full bg-slate-300" />
              </div>

              <div className="px-4 pb-4 pt-2">
                {/* Header row */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="size-10 rounded-full bg-[#F3F8F1] flex items-center justify-center shrink-0">
                    <MapPin className="size-5 text-[#1A6B3C]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-slate-800">
                        {isReverseGeocoding ? "Detecting address…" :
                         address ? "Confirm your location" :
                         "Move the map to set location"}
                      </p>
                      {gpsAccuracy != null && !isReverseGeocoding && (
                        <span className="text-[10px] font-medium text-green-700 bg-green-100 px-1.5 py-0.5 rounded-full">
                          GPS · {Math.round(gpsAccuracy)}m
                        </span>
                      )}
                    </div>
                    {isReverseGeocoding ? (
                      <div className="space-y-1">
                        <div className="h-3 w-3/4 bg-slate-100 rounded animate-pulse" />
                        <div className="h-3 w-1/2 bg-slate-100 rounded animate-pulse" />
                      </div>
                    ) : address ? (
                      <>
                        <p className="text-sm text-slate-700 line-clamp-1 font-medium">
                          {address.street || address.area || "Selected location"}
                        </p>
                        <p className="text-xs text-slate-500 line-clamp-1">
                          {[address.area, address.pincode].filter(Boolean).join(" · ") || address.displayName || "Address details unavailable"}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-slate-500">
                        Drag the map or use GPS to pin your exact delivery spot.
                      </p>
                    )}
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="mb-2 flex items-start gap-1.5 text-xs text-red-600 bg-red-50 px-2.5 py-1.5 rounded-md">
                    <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* GPS inaccurate hint */}
                {gpsAccuracy != null && gpsAccuracy > 100 && (
                  <div className="mb-2 flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-md">
                    <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
                    <span>
                      GPS accuracy is low ({Math.round(gpsAccuracy)}m). Drag the map to fine-tune your exact delivery location.
                    </span>
                  </div>
                )}

                {/* Coordinates (small, monospace) */}
                <div className="mb-3 text-[10px] text-slate-400 tabular-nums font-mono">
                  {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-slate-300 text-slate-600 h-12"
                    onClick={onClose}
                  >
                    Cancel
                  </Button>
                  <Button
                    className={cn(
                      "flex-[2] h-12 gap-2 text-base",
                      "bg-[#1A6B3C] hover:bg-[#16A34A]"
                    )}
                    onClick={handleConfirm}
                    disabled={isConfirming || isReverseGeocoding}
                  >
                    {isConfirming ? (
                      <><Loader2 className="size-5 animate-spin" /> Confirming…</>
                    ) : (
                      <><Check className="size-5" /> Confirm Location</>
                    )}
                  </Button>
                </div>

                {/* Helper text */}
                <p className="mt-2 text-[10px] text-slate-400 text-center">
                  Location must be confirmed to save the address.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
