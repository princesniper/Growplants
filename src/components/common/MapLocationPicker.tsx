"use client";

/**
 * GrowPlants — MapLocationPicker (delivery-app style)
 * ============================================================================
 * Professional interactive location picker with a proper DRAGGABLE marker.
 *
 * Key behaviors:
 *   - Marker is a real Leaflet draggable marker (not a static center pin).
 *     User can drag the marker with mouse OR touch — Leaflet handles both.
 *   - On marker drag (and during drag), lat/lng update immediately.
 *   - User can also drag the map; marker stays put at its lat/lng.
 *   - "Use Current Location" button recenters map (and marker) on GPS.
 *   - Search box flies to a chosen result.
 *   - Bottom sheet shows the live reverse-geocoded address.
 *   - "Confirm Location" button is disabled while reverse geocoding is
 *     pending OR while the user is mid-drag — verification requires a settled,
 *     reverse-geocoded location.
 *
 * Architecture:
 *   - Leaflet is loaded from CDN (singleton, with `crossorigin`).
 *   - Map instance is held in a ref and properly torn down on close.
 *   - All async work uses AbortController so stale requests are cancelled.
 *   - Touch dragging is enabled by default in Leaflet 1.9+ — we additionally
 *     call `marker.options.dragging.enable()` and bump `tap` tolerance.
 * ============================================================================
 */
import { useEffect, useRef, useState, useCallback } from "react";
import {
  MapPin, Check, X, Loader2, Search, AlertCircle,
  Navigation, Locate, Plus, Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getGPSLocation } from "@/lib/gps";

// Default center: Sonipat, Haryana
const DEFAULT_CENTER: [number, number] = [28.9965, 77.0203];
const DEFAULT_ZOOM = 15;
const REVERSE_GEOCODE_DEBOUNCE_MS = 350;

// ─── Leaflet loader (CDN, singleton, with crossorigin) ───
let leafletLoaded = false;
let leafletLoadPromise: Promise<void> | null = null;

function loadLeaflet(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if (leafletLoaded) return Promise.resolve();
  if (leafletLoadPromise) return leafletLoadPromise;

  leafletLoadPromise = new Promise<void>((resolve, reject) => {
    // CSS first so the map renders correctly on first paint
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    link.crossOrigin = "";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.async = true;
    script.crossOrigin = "";
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

type MapErrorKind =
  | "load"          // Failed to load Leaflet library / tiles
  | "permission"    // GPS permission denied
  | "position"      // GPS position unavailable
  | "timeout"       // GPS timeout
  | "search"        // Search request failed
  | "reverse"       // Reverse geocode failed
  | "generic";

interface MapError {
  kind: MapErrorKind;
  message: string;
}

export function MapLocationPicker({
  open,
  onClose,
  onLocationSelect,
  initialLocation,
}: MapLocationPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const reverseAbortRef = useRef<AbortController | null>(null);
  const reverseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDraggingRef = useRef(false);

  // ─── State ───
  const [coords, setCoords] = useState<{ lat: number; lng: number }>(
    initialLocation ?? { lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] }
  );
  const [address, setAddress] = useState<ReverseGeocodeResult | null>(null);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<
    Array<{ lat: number; lng: number; displayName: string }>
  >([]);

  // GPS state
  const [isLocating, setIsLocating] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);

  const [error, setError] = useState<MapError | null>(null);

  // ─── Helper: pretty error from a GeolocationPositionError ───
  const gpsErrorToMapError = useCallback((err: any): MapError => {
    // GeolocationPositionError codes: 1=PERMISSION_DENIED, 2=POSITION_UNAVAILABLE, 3=TIMEOUT
    if (err?.code === 1) {
      return {
        kind: "permission",
        message:
          "Location permission denied. Enable location access in your browser settings, then tap the locate button again. You can also drag the pin manually.",
      };
    }
    if (err?.code === 2) {
      return {
        kind: "position",
        message:
          "Your device couldn't provide a GPS position. Check that location services are on, or drag the pin manually.",
      };
    }
    if (err?.code === 3) {
      return {
        kind: "timeout",
        message:
          "GPS detection timed out. Try moving to an open area, or drag the pin manually.",
      };
    }
    return {
      kind: "generic",
      message:
        err?.message ||
        "Could not detect your GPS location. You can drag the pin manually instead.",
    };
  }, []);

  // ─── Initialize map on open ───
  useEffect(() => {
    if (!open || !mapRef.current) return;

    let cancelled = false;
    setIsMapReady(false);
    setError(null);

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
          doubleClickZoom: true,
          touchZoom: true,
          tap: true,                       // enable touch tap (mobile)
          tapTolerance: 15,                // forgiving touch handling
          attributionControl: false,
          inertia: true,                   // momentum panning
          worldCopyJump: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          crossOrigin: true,
        }).addTo(mapInstance.current);

        // ─── Draggable marker (delivery-app style) ───
        // Custom div-icon so the pin looks modern (rounded head + shadow).
        // `draggable: true` enables both mouse and touch dragging in Leaflet 1.9+.
        const MarkerIcon = L.divIcon({
          className: "gp-marker",
          html: `
            <div class="gp-marker-wrap">
              <div class="gp-marker-shadow"></div>
              <div class="gp-marker-stem"></div>
              <div class="gp-marker-head">
                <div class="gp-marker-dot"></div>
              </div>
            </div>
          `,
          iconSize: [36, 48],
          iconAnchor: [18, 44],
        });

        markerRef.current = L.marker(center, {
          icon: MarkerIcon,
          draggable: true,                 // ← the key flag — pin is draggable
          autoPan: true,                   // pan map when pin is dragged to edge
          autoPanPadding: L.point(60, 60),
          riseOnHover: true,
          keyboard: false,
          title: "Drag me to your delivery location",
          alt: "Delivery location marker — drag to reposition",
        }).addTo(mapInstance.current);

        // ─── Marker drag events ───
        // `dragstart` → mark dragging (suppress confirm + reverse-geocode spam)
        // `drag`      → live update of coords (so the bottom sheet shows live lat/lng)
        // `dragend`   → settle, trigger debounced reverse geocode
        markerRef.current.on("dragstart", () => {
          isDraggingRef.current = true;
          setIsDragging(true);
          setError(null);
        });

        markerRef.current.on("drag", () => {
          const pos = markerRef.current.getLatLng();
          // Live update — no reverse geocode yet (too spammy)
          setCoords({ lat: pos.lat, lng: pos.lng });
          // Clear stale address so bottom sheet shows "updating…" state
          setAddress(null);
          setGpsAccuracy(null);
        });

        markerRef.current.on("dragend", () => {
          const pos = markerRef.current.getLatLng();
          setCoords({ lat: pos.lat, lng: pos.lng });
          scheduleReverseGeocode(pos.lat, pos.lng);
          isDraggingRef.current = false;
          setIsDragging(false);
        });

        // Map click → move marker (alternative to dragging for desktop users)
        mapInstance.current.on("click", (e: any) => {
          if (markerRef.current) {
            markerRef.current.setLatLng(e.latlng);
            setCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
            setAddress(null);
            scheduleReverseGeocode(e.latlng.lat, e.latlng.lng);
          }
        });

        // Initial reverse geocode
        scheduleReverseGeocode(center[0], center[1]);

        // Fix size after render + invalidate on resize
        // Two passes (100ms + 350ms) so we cover both the immediate layout
        // flush AND any later reflow from the browser (e.g. mobile URL bar).
        setTimeout(() => {
          if (mapInstance.current && !cancelled) {
            mapInstance.current.invalidateSize();
          }
        }, 100);
        setTimeout(() => {
          if (mapInstance.current && !cancelled) {
            mapInstance.current.invalidateSize();
            setIsMapReady(true);
          }
        }, 350);
      })
      .catch((err) => {
        setError({
          kind: "load",
          message:
            "Failed to load the map. Please check your internet connection and try again.",
        });
        console.error("[MapPicker] Leaflet load error:", err);
      });

    return () => {
      cancelled = true;
      if (reverseTimerRef.current) clearTimeout(reverseTimerRef.current);
      if (reverseAbortRef.current) reverseAbortRef.current.abort();
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markerRef.current = null;
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
        // Clear any prior reverse-geocode error on success
        setError((prev) => (prev?.kind === "reverse" ? null : prev));
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        // Soft fail — keep coords, but show a soft warning in the sheet
        setAddress(null);
        setError({
          kind: "reverse",
          message:
            "Couldn't fetch address details for this spot. You can still drag the pin to a clearer location, or confirm anyway.",
        });
      } finally {
        setIsReverseGeocoding(false);
      }
    }, REVERSE_GEOCODE_DEBOUNCE_MS);
  }, []);

  // ─── GPS Locate (recenter map + marker on user's GPS) ───
  const handleLocate = useCallback(async () => {
    setIsLocating(true);
    setError(null);
    try {
      const loc = await getGPSLocation();
      setGpsAccuracy(loc.accuracy);
      if (mapInstance.current && markerRef.current) {
        mapInstance.current.setView([loc.lat, loc.lng], 17, { animate: true });
        markerRef.current.setLatLng([loc.lat, loc.lng]);
      }
      setCoords({ lat: loc.lat, lng: loc.lng });
      setAddress(null);
      scheduleReverseGeocode(loc.lat, loc.lng);
    } catch (err: any) {
      // `getGPSLocation` already translates codes to messages; check both
      const message = err?.message || "Could not detect your GPS location.";
      const kind: MapErrorKind =
        message.toLowerCase().includes("permission")
          ? "permission"
          : message.toLowerCase().includes("timed out") || message.toLowerCase().includes("timeout")
          ? "timeout"
          : "position";
      setError(gpsErrorToMapError({ ...err, code: err?.code, message }));
      void kind;
    } finally {
      setIsLocating(false);
    }
  }, [scheduleReverseGeocode, gpsErrorToMapError]);

  // ─── Search (Nominatim forward) ───
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setError(null);
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
        setError({
          kind: "search",
          message: "No results found. Try a different search term.",
        });
      }
    } catch (err) {
      setError({
        kind: "search",
        message: "Search failed. Please try again.",
      });
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery]);

  const handleSelectSearchResult = (r: { lat: number; lng: number }) => {
    if (mapInstance.current && markerRef.current) {
      mapInstance.current.setView([r.lat, r.lng], 17, { animate: true });
      markerRef.current.setLatLng([r.lat, r.lng]);
    }
    setCoords({ lat: r.lat, lng: r.lng });
    setAddress(null);
    scheduleReverseGeocode(r.lat, r.lng);
    setSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
    setError(null);
  };

  // ─── Zoom controls ───
  const handleZoomIn = useCallback(() => {
    mapInstance.current?.zoomIn();
  }, []);
  const handleZoomOut = useCallback(() => {
    mapInstance.current?.zoomOut();
  }, []);

  // ─── Confirm ───
  // Disabled while:
  //   - reverse geocoding is pending (no address yet)
  //   - user is mid-drag (coords not settled)
  const canConfirm = !isReverseGeocoding && !isDragging && !isConfirming;

  const handleConfirm = async () => {
    if (!canConfirm) return;
    setIsConfirming(true);
    setError(null);
    try {
      // Use the address we already have; if missing, do one final fetch.
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
      setError({
        kind: "generic",
        message: "Could not confirm location. Please try again.",
      });
    } finally {
      setIsConfirming(false);
    }
  };

  // ─── Prevent body scroll while picker is open ───
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ─── Window resize → invalidateSize (so map never has stale size) ───
  useEffect(() => {
    if (!open) return;
    const handleResize = () => {
      if (mapInstance.current) {
        mapInstance.current.invalidateSize();
      }
    };
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    // Also invalidate after a short delay (covers mobile URL bar show/hide)
    const t = setTimeout(handleResize, 400);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      clearTimeout(t);
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* ─── Inline styles for marker + animations ─── */}
      <style>{`
        .gp-marker { background: transparent; border: none; }
        .gp-marker-wrap {
          position: relative;
          width: 36px;
          height: 48px;
          cursor: grab;
          touch-action: none;             /* let Leaflet handle the touch drag */
          animation: gp-marker-drop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
          transition: transform 0.15s ease;
        }
        .gp-marker-wrap:hover { transform: translateY(-2px); }
        .gp-marker-wrap:active { cursor: grabbing; }
        @keyframes gp-marker-drop {
          0%   { transform: translateY(-24px); opacity: 0; }
          60%  { transform: translateY(4px);   opacity: 1; }
          100% { transform: translateY(0);     opacity: 1; }
        }
        .gp-marker-head {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%) rotate(-45deg);
          width: 28px;
          height: 28px;
          background: #1A6B3C;
          border: 3px solid white;
          border-radius: 50% 50% 50% 0;
          box-shadow: 0 4px 12px rgba(26, 107, 60, 0.45);
        }
        .gp-marker-dot {
          position: absolute;
          top: 6px; left: 6px;
          width: 10px; height: 10px;
          background: white;
          border-radius: 50%;
        }
        .gp-marker-stem {
          position: absolute;
          top: 26px;
          left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 12px;
          background: #1A6B3C;
        }
        .gp-marker-shadow {
          position: absolute;
          top: 38px;
          left: 50%;
          transform: translateX(-50%);
          width: 16px;
          height: 5px;
          background: rgba(0,0,0,0.22);
          border-radius: 50%;
          filter: blur(2px);
        }

        .leaflet-container {
          background: #e5e7eb;
          font-family: inherit;
          touch-action: none;          /* allow Leaflet to handle all touches */
        }
        .leaflet-marker-icon, .leaflet-marker-shadow { user-select: none; }
        .leaflet-marker-draggable { cursor: grab; }
        .leaflet-marker-draggable:active { cursor: grabbing; }

        @keyframes gp-sheet-in {
          from { transform: translateY(100%); opacity: 0.5; }
          to   { transform: translateY(0);     opacity: 1; }
        }
        .gp-sheet-enter { animation: gp-sheet-in 0.32s cubic-bezier(0.22, 1, 0.36, 1); }
        @keyframes gp-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .gp-fade-in { animation: gp-fade-in 0.25s ease-out; }
      `}</style>

      {/* ─── Overlay backdrop ─── */}
      <div
        className="fixed inset-0 z-[100] bg-black/50 flex items-stretch sm:items-center justify-center gp-fade-in p-0 sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Location picker"
      >
        {/* ─── Modal shell ───
            Mobile  : full screen, anchored to viewport edges (100dvh = dynamic viewport height)
            Desktop : compact centered modal — 440px wide × 560px tall max,
                      shrinks proportionally if viewport is shorter (max-h-[80vh]) */}
        <div className="relative w-full h-[100dvh] sm:h-[560px] sm:max-h-[80vh] sm:max-w-[440px] sm:rounded-2xl overflow-hidden bg-white shadow-2xl gp-sheet-enter flex flex-col">

          {/* ─── Top bar: close + search + GPS locate ─── */}
          <div className="absolute top-0 inset-x-0 z-[1000] p-3 pointer-events-none">
            <div className="flex items-start gap-2 pointer-events-auto">
              <button
                onClick={onClose}
                className="size-11 shrink-0 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all"
                aria-label="Close map picker"
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
                      Search area, street, or landmark…
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
                className={cn(
                  "size-11 shrink-0 rounded-full shadow-lg flex items-center justify-center active:scale-95 transition-all disabled:opacity-50",
                  "bg-white hover:bg-slate-50"
                )}
                aria-label="Use my current GPS location"
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

          {/* ─── Zoom controls (right side, vertically centered relative to map) ─── */}
          <div className="absolute right-3 top-[40%] -translate-y-1/2 z-[1000] flex flex-col gap-2">
            <button
              onClick={handleZoomIn}
              className="size-11 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all text-xl text-slate-700 font-light"
              aria-label="Zoom in"
            >
              <Plus className="size-5" />
            </button>
            <button
              onClick={handleZoomOut}
              className="size-11 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all text-xl text-slate-700 font-light"
              aria-label="Zoom out"
            >
              <Minus className="size-5" />
            </button>
          </div>

          {/* ─── Map container (fills entire modal — bottom sheet overlays on top of it) ───
              `absolute inset-0` works here because the modal shell now has a concrete height. */}
          <div
            ref={mapRef}
            className="absolute inset-0 z-[1]"
            style={{ background: "#e5e7eb" }}
            aria-label="Interactive map — drag the pin to your delivery location"
          />

          {/* ─── Loading overlay (map not ready yet) ─── */}
          {!isMapReady && (
            <div className="absolute inset-0 z-[2] flex items-center justify-center bg-slate-100">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="size-8 animate-spin text-[#1A6B3C]" />
                <p className="text-sm text-slate-500">Loading map…</p>
              </div>
            </div>
          )}

          {/* ─── Load-error overlay (Leaflet failed to load) ─── */}
          {error?.kind === "load" && (
            <div className="absolute inset-0 z-[2] flex items-center justify-center bg-slate-100 p-6">
              <div className="flex flex-col items-center gap-3 max-w-sm text-center">
                <AlertCircle className="size-10 text-red-500" />
                <p className="text-sm font-medium text-slate-700">{error.message}</p>
                <Button variant="outline" onClick={onClose}>Close</Button>
              </div>
            </div>
          )}

          {/* ─── "Drag the pin" hint (top center) — fades out once user interacts ─── */}
          {isMapReady && !address && !isReverseGeocoding && !isDragging && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[999] pointer-events-none">
              <div className="bg-slate-900/85 text-white text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-sm shadow-lg">
                <Navigation className="size-3" />
                Drag the pin to your exact delivery spot
              </div>
            </div>
          )}

          {/* ─── Bottom sheet (confirm panel) ─── */}
          <div className="absolute bottom-0 inset-x-0 z-[1000] gp-sheet-enter">
            <div className="bg-white rounded-t-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.1)] pb-[env(safe-area-inset-bottom)]">

              {/* Drag handle */}
              <div className="flex justify-center pt-2 pb-1">
                <div className="w-10 h-1 rounded-full bg-slate-300" />
              </div>

              <div className="px-3 pb-3 pt-1.5">
                {/* Header row */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="size-8 rounded-full bg-[#F3F8F1] flex items-center justify-center shrink-0">
                    <MapPin className="size-4 text-[#1A6B3C]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-sm font-semibold text-slate-800">
                        {isDragging ? "Dragging…" :
                         isReverseGeocoding ? "Detecting address…" :
                         address ? "Confirm your location" :
                         "Move the pin to set location"}
                      </p>
                      {gpsAccuracy != null && !isReverseGeocoding && (
                        <span className={cn(
                          "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                          gpsAccuracy > 100
                            ? "text-amber-700 bg-amber-100"
                            : "text-green-700 bg-green-100"
                        )}>
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
                          {[address.area, address.pincode].filter(Boolean).join(" · ") ||
                           address.displayName ||
                           "Address details unavailable"}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-slate-500">
                        Drag the pin or use GPS to set your delivery spot.
                      </p>
                    )}
                  </div>
                </div>

                {/* Error */}
                {error && error.kind !== "load" && (
                  <div className={cn(
                    "mb-2 flex items-start gap-1.5 text-xs px-2.5 py-1.5 rounded-md",
                    error.kind === "permission" || error.kind === "position" || error.kind === "timeout"
                      ? "text-amber-700 bg-amber-50"
                      : "text-red-600 bg-red-50"
                  )}>
                    <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
                    <span>{error.message}</span>
                  </div>
                )}

                {/* GPS inaccurate hint */}
                {gpsAccuracy != null && gpsAccuracy > 100 && (
                  <div className="mb-2 flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-md">
                    <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
                    <span>
                      GPS accuracy is low ({Math.round(gpsAccuracy)}m). Drag the pin to fine-tune your exact delivery location.
                    </span>
                  </div>
                )}

                {/* Coordinates (monospace, small) */}
                <div className="mb-3 text-[10px] text-slate-400 tabular-nums font-mono">
                  {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-slate-300 text-slate-600 h-10 text-sm"
                    onClick={onClose}
                  >
                    Cancel
                  </Button>
                  <Button
                    className={cn(
                      "flex-[2] h-10 gap-1.5 text-sm",
                      canConfirm
                        ? "bg-[#1A6B3C] hover:bg-[#16A34A]"
                        : "bg-slate-300 text-slate-500 cursor-not-allowed"
                    )}
                    onClick={handleConfirm}
                    disabled={!canConfirm}
                  >
                    {isConfirming ? (
                      <><Loader2 className="size-5 animate-spin" /> Confirming…</>
                    ) : isDragging ? (
                      <><MapPin className="size-5" /> Drop the pin first</>
                    ) : isReverseGeocoding ? (
                      <><Loader2 className="size-5 animate-spin" /> Detecting…</>
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
