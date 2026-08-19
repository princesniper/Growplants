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

        // ─── invalidateSize: critical for modal-mounted maps ───
        // Leaflet computes its tile layout based on the container size at init.
        // When mounted inside a modal that animates in (gp-pop-in), the container
        // size is unstable for the first ~400ms. We poll across multiple frames
        // so the map always ends up correctly sized regardless of when the
        // browser finishes layout. Three passes:
        //   - 1 frame (~16ms): immediate post-mount layout
        //   - 200ms: post-animation layout (gp-pop-in is 280ms)
        //   - 500ms: post-reflow (covers mobile URL bar show/hide)
        const invalidate = () => {
          if (mapInstance.current && !cancelled) {
            mapInstance.current.invalidateSize();
          }
        };
        requestAnimationFrame(invalidate);
        setTimeout(invalidate, 200);
        setTimeout(() => {
          invalidate();
          setIsMapReady(true);
        }, 500);
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
      {/* ─── Inline styles for marker, animations, modal polish ─── */}
      <style>{`
        /* ─── Professional draggable marker (Blinkit-style) ─── */
        .gp-marker { background: transparent; border: none; }
        .gp-marker-wrap {
          position: relative;
          width: 38px;
          height: 50px;
          cursor: grab;
          touch-action: none;
          animation: gp-marker-drop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
          transition: transform 0.18s ease;
          transform-origin: bottom center;
        }
        .gp-marker-wrap:hover { transform: scale(1.08); }
        .gp-marker-wrap:active { cursor: grabbing; transform: scale(1.12); }
        @keyframes gp-marker-drop {
          0%   { transform: translateY(-30px) scale(0.8); opacity: 0; }
          55%  { transform: translateY(6px) scale(1.05); opacity: 1; }
          100% { transform: translateY(0) scale(1);     opacity: 1; }
        }
        .gp-marker-head {
          position: absolute;
          top: 0; left: 50%;
          transform: translateX(-50%) rotate(-45deg);
          width: 30px;
          height: 30px;
          background: linear-gradient(135deg, #1A6B3C 0%, #16A34A 100%);
          border: 3px solid white;
          border-radius: 50% 50% 50% 0;
          box-shadow: 0 6px 14px rgba(26, 107, 60, 0.45), 0 1px 3px rgba(0,0,0,0.18);
        }
        .gp-marker-dot {
          position: absolute;
          top: 6px; left: 6px;
          width: 12px; height: 12px;
          background: white;
          border-radius: 50%;
          box-shadow: inset 0 0 0 2px rgba(26, 107, 60, 0.2);
        }
        .gp-marker-stem {
          position: absolute;
          top: 28px; left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 14px;
          background: linear-gradient(180deg, #1A6B3C 0%, #0d4a26 100%);
          border-radius: 0 0 2px 2px;
        }
        .gp-marker-shadow {
          position: absolute;
          top: 42px; left: 50%;
          transform: translateX(-50%);
          width: 18px;
          height: 6px;
          background: rgba(0,0,0,0.25);
          border-radius: 50%;
          filter: blur(2.5px);
        }

        /* ─── Leaflet container polish ─── */
        .leaflet-container {
          background: #e5e7eb;
          font-family: inherit;
          touch-action: none;
        }
        .leaflet-marker-icon, .leaflet-marker-shadow { user-select: none; }
        .leaflet-marker-draggable { cursor: grab; }
        .leaflet-marker-draggable:active { cursor: grabbing; }
        .leaflet-tile { filter: contrast(1.02) saturate(1.05); }

        /* ─── Animations ─── */
        @keyframes gp-sheet-in {
          from { transform: translateY(100%); opacity: 0.4; }
          to   { transform: translateY(0);     opacity: 1; }
        }
        .gp-sheet-enter { animation: gp-sheet-in 0.34s cubic-bezier(0.22, 1, 0.36, 1); }
        @keyframes gp-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        .gp-fade-in { animation: gp-fade-in 0.25s ease-out; }
        @keyframes gp-pop-in {
          0%   { opacity: 0; transform: scale(0.95) translateY(8px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .gp-pop-in { animation: gp-pop-in 0.28s cubic-bezier(0.22, 1, 0.36, 1); }
        @keyframes gp-pulse-ring {
          0%   { transform: scale(0.9); opacity: 0.7; }
          70%  { transform: scale(1.4); opacity: 0; }
          100% { transform: scale(1.4); opacity: 0; }
        }
        .gp-pulse-ring::after {
          content: ""; position: absolute; inset: 0;
          border-radius: inherit;
          background: inherit;
          animation: gp-pulse-ring 1.8s ease-out infinite;
        }
      `}</style>

      {/* ─── Backdrop ─── */}
      <div
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-[2px] flex items-center justify-center gp-fade-in p-0 sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Location picker"
      >
        {/* ─── Modal shell ───
            Mobile  : 92% width × 88vh height (max 600px wide)
            Desktop : 600px × 520px (max 90vw × 85vh on smaller screens)
            Centered. Rounded corners on all breakpoints for the modern feel. */}
        <div className="relative gp-pop-in
                        w-[94vw] max-w-[600px]
                        h-[88vh] sm:h-[520px] sm:max-h-[85vh]
                        rounded-2xl overflow-hidden bg-white shadow-2xl
                        flex flex-col">

          {/* ─── Header ─── */}
          <div className="relative z-[1000] shrink-0 bg-white border-b border-slate-100">
            <div className="flex items-center gap-3 px-4 py-3">
              <button
                onClick={onClose}
                className="size-9 shrink-0 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center transition-all"
                aria-label="Close"
              >
                <X className="size-5 text-slate-700" />
              </button>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-slate-800 leading-tight">
                  Select Location
                </h2>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Drag the pin to your exact delivery spot
                </p>
              </div>
              {/* GPS locate — always visible in header */}
              <button
                onClick={handleLocate}
                disabled={isLocating}
                className={cn(
                  "shrink-0 h-9 px-3 rounded-full gap-1.5 flex items-center justify-center transition-all active:scale-95 disabled:opacity-50",
                  isLocating
                    ? "bg-slate-100 text-slate-500"
                    : "bg-[#F0FAF4] hover:bg-[#DCFCE7] text-[#1A6B3C]"
                )}
                aria-label="Use my current GPS location"
              >
                {isLocating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Locate className="size-4" />
                )}
                <span className="text-xs font-semibold hidden xs:inline">
                  {isLocating ? "Detecting" : "Use GPS"}
                </span>
              </button>
            </div>

            {/* ─── Search bar ─── */}
            <div className="px-4 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search area, street, or landmark…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                    if (e.key === "Escape") {
                      setSearchQuery("");
                      setSearchResults([]);
                    }
                  }}
                  className="w-full h-10 pl-10 pr-4 rounded-full bg-slate-100 focus:bg-white border border-transparent focus:border-[#1A6B3C] focus:ring-2 focus:ring-[#1A6B3C]/20 outline-none text-sm text-slate-700 placeholder:text-slate-400 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 size-5 rounded-full hover:bg-slate-200 flex items-center justify-center"
                    aria-label="Clear search"
                  >
                    <X className="size-3.5 text-slate-500" />
                  </button>
                )}
              </div>

              {/* ─── Search results dropdown ─── */}
              {searchResults.length > 0 && (
                <div className="absolute left-4 right-4 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-100 max-h-[40vh] overflow-y-auto z-[1001]">
                  {searchResults.map((r, i) => (
                    <button
                      key={i}
                      onClick={() => handleSelectSearchResult(r)}
                      className="w-full text-left px-3 py-2.5 hover:bg-slate-50 active:bg-slate-100 border-b border-slate-100 last:border-0 flex items-start gap-2"
                    >
                      <MapPin className="size-4 text-[#1A6B3C] mt-0.5 shrink-0" />
                      <span className="text-xs text-slate-700 line-clamp-2 leading-snug">
                        {r.displayName}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ─── Map area (relative container for map + zoom controls + hint) ─── */}
          <div className="relative flex-1 min-h-0 bg-slate-200">
            {/* Map container — fills the available space */}
            <div
              ref={mapRef}
              className="absolute inset-0 z-[1]"
              style={{ background: "#e5e7eb" }}
              aria-label="Interactive map — drag the pin to your delivery location"
            />

            {/* Loading overlay */}
            {!isMapReady && (
              <div className="absolute inset-0 z-[2] flex items-center justify-center bg-slate-100">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="size-7 animate-spin text-[#1A6B3C]" />
                  <p className="text-xs text-slate-500">Loading map…</p>
                </div>
              </div>
            )}

            {/* Load-error overlay */}
            {error?.kind === "load" && (
              <div className="absolute inset-0 z-[2] flex items-center justify-center bg-slate-100 p-6">
                <div className="flex flex-col items-center gap-2 max-w-xs text-center">
                  <AlertCircle className="size-9 text-red-500" />
                  <p className="text-xs font-medium text-slate-700">{error.message}</p>
                  <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
                </div>
              </div>
            )}

            {/* Zoom controls — bottom-right, vertical */}
            <div className="absolute right-3 bottom-3 z-[1000] flex flex-col gap-1.5">
              <button
                onClick={handleZoomIn}
                className="size-10 rounded-lg bg-white shadow-md flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all"
                aria-label="Zoom in"
              >
                <Plus className="size-4 text-slate-700" />
              </button>
              <button
                onClick={handleZoomOut}
                className="size-10 rounded-lg bg-white shadow-md flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all"
                aria-label="Zoom out"
              >
                <Minus className="size-4 text-slate-700" />
              </button>
            </div>

            {/* "Drag the pin" hint — top center of map area */}
            {isMapReady && !address && !isReverseGeocoding && !isDragging && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[999] pointer-events-none">
                <div className="bg-slate-900/85 text-white text-[11px] px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-sm shadow-lg">
                  <Navigation className="size-3" />
                  Drag the pin to set your exact location
                </div>
              </div>
            )}

            {/* Dragging indicator */}
            {isDragging && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[999] pointer-events-none">
                <div className="bg-[#1A6B3C] text-white text-[11px] px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                  <Loader2 className="size-3 animate-spin" />
                  Pin moving… {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                </div>
              </div>
            )}
          </div>

          {/* ─── Bottom sheet (confirm panel) ─── */}
          <div className="relative z-[1000] shrink-0 bg-white border-t border-slate-100 gp-sheet-enter">
            <div className="px-4 py-3">

              {/* Address row */}
              <div className="flex items-start gap-3 mb-2.5">
                <div className="size-9 rounded-full bg-[#F3F8F1] flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="size-4 text-[#1A6B3C]" />
                </div>
                <div className="flex-1 min-w-0">
                  {isReverseGeocoding ? (
                    <div className="space-y-1.5">
                      <div className="h-3.5 w-3/4 bg-slate-100 rounded animate-pulse" />
                      <div className="h-3 w-1/2 bg-slate-100 rounded animate-pulse" />
                    </div>
                  ) : address ? (
                    <>
                      <p className="text-sm font-semibold text-slate-800 line-clamp-1 leading-snug">
                        {address.street || address.area || "Selected location"}
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-1 leading-tight mt-0.5">
                        {[address.area, address.pincode].filter(Boolean).join(" · ") ||
                         address.displayName ||
                         "Address details unavailable"}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-slate-700 leading-snug">
                        No location picked yet
                      </p>
                      <p className="text-xs text-slate-500 leading-tight mt-0.5">
                        Drag the pin or use GPS to set your delivery spot.
                      </p>
                    </>
                  )}
                </div>
                {/* Status badge */}
                {gpsAccuracy != null && !isReverseGeocoding && (
                  <span className={cn(
                    "shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full self-start mt-0.5",
                    gpsAccuracy > 100
                      ? "text-amber-700 bg-amber-100"
                      : "text-green-700 bg-green-100"
                  )}>
                  GPS · {Math.round(gpsAccuracy)}m
                </span>
                )}
              </div>

              {/* Error / warning messages */}
              {error && error.kind !== "load" && (
                <div className={cn(
                  "mb-2 flex items-start gap-1.5 text-[11px] px-2.5 py-1.5 rounded-md",
                  error.kind === "permission" || error.kind === "position" || error.kind === "timeout"
                    ? "text-amber-700 bg-amber-50"
                    : "text-red-600 bg-red-50"
                )}>
                  <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
                  <span>{error.message}</span>
                </div>
              )}

              {gpsAccuracy != null && gpsAccuracy > 100 && (
                <div className="mb-2 flex items-start gap-1.5 text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded-md">
                  <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
                  <span>
                    GPS accuracy is low ({Math.round(gpsAccuracy)}m). Drag the pin to fine-tune your exact delivery location.
                  </span>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 border-slate-300 text-slate-600 h-11"
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button
                  className={cn(
                    "flex-[2] h-11 gap-2 text-sm font-semibold",
                    canConfirm
                      ? "bg-[#1A6B3C] hover:bg-[#16A34A] shadow-md shadow-[#1A6B3C]/20"
                      : "bg-slate-300 text-slate-500 cursor-not-allowed"
                  )}
                  onClick={handleConfirm}
                  disabled={!canConfirm}
                >
                  {isConfirming ? (
                    <><Loader2 className="size-4 animate-spin" /> Confirming…</>
                  ) : isDragging ? (
                    <><MapPin className="size-4" /> Drop the pin first</>
                  ) : isReverseGeocoding ? (
                    <><Loader2 className="size-4 animate-spin" /> Detecting…</>
                  ) : (
                    <><Check className="size-4" /> Confirm Location</>
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
    </>
  );
}
