"use client";

/**
 * GrowPlants — MapLocationPicker (Production Architecture)
 * ============================================================================
 * Modern delivery-app style location picker with a FIXED CENTER PIN.
 *
 * Architecture (Blinkit/Swiggy-style):
 *   - The pin is anchored to the CENTER of the viewport (CSS-only, not a map marker).
 *   - The user pans the MAP (drags the underlying leaflet map), not the pin.
 *   - As the map moves, the lat/lng under the center pin updates live.
 *   - Reverse geocode fires on `moveend` (debounced) → resolves address.
 *   - "Confirm Location" returns the center lat/lng + address to the parent.
 *
 * Why fixed center pin (vs draggable marker)?
 *   - More natural for users familiar with Swiggy/Zomato/Blinkit.
 *   - Pin never gets "stuck" behind bottom sheet or out-of-view.
 *   - Single source of truth: map.getCenter() always = selected coords.
 *   - Works identically on mouse and touch (no separate drag handlers).
 *
 * Technical guarantees:
 *   - Modal layout uses flexbox (header / map / bottom sheet) — no `absolute`
 *     overlays fighting each other, no clipped content, no black canvas.
 *   - ResizeObserver + requestAnimationFrame invalidateSize so map never stale.
 *   - Body scroll locked while open (form behind can't scroll).
 *   - Z-index hierarchy: backdrop < map < overlays < controls < bottom sheet.
 *   - All async work uses AbortController (no stale reverse-geocode race).
 * ============================================================================
 */
import { useEffect, useRef, useState, useCallback } from "react";
import {
  MapPin, Check, X, Loader2, Search, AlertCircle,
  Navigation, Locate, Plus, Minus, Crosshair,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { getGPSLocation } from "@/lib/gps";

// Default center: Sonipat, Haryana (GrowPlants HQ)
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
    // CSS first so map renders correctly on first paint
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
  | "load"        // Failed to load Leaflet library / tiles
  | "permission"  // GPS permission denied
  | "position"    // GPS position unavailable
  | "timeout"     // GPS timeout
  | "search"      // Search request failed
  | "reverse"     // Reverse geocode failed
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
  // ─── Refs ───
  const mapContainerRef = useRef<HTMLDivElement>(null); // outer wrapper (for ResizeObserver)
  const mapRef = useRef<HTMLDivElement>(null);             // leaflet mounts here
  const mapInstance = useRef<any>(null);
  const reverseAbortRef = useRef<AbortController | null>(null);
  const reverseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMapMovingRef = useRef(false);                    // suppress move spam during programmatic setView

  // ─── State ───
  const [coords, setCoords] = useState<{ lat: number; lng: number }>(
    initialLocation ?? { lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] }
  );
  const [address, setAddress] = useState<ReverseGeocodeResult | null>(null);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [isMapPanning, setIsMapPanning] = useState(false); // user is dragging the map right now
  const [isConfirming, setIsConfirming] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  // Search
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<
    Array<{ lat: number; lng: number; displayName: string }>
  >([]);

  // GPS
  const [isLocating, setIsLocating] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);

  const [error, setError] = useState<MapError | null>(null);

  // ─── Helper: pretty error from a GeolocationPositionError ───
  const gpsErrorToMapError = useCallback((err: any): MapError => {
    if (err?.code === 1) {
      return {
        kind: "permission",
        message:
          "Location permission denied. Enable location access in your browser settings, then tap the GPS button again. You can also drag the map manually.",
      };
    }
    if (err?.code === 2) {
      return {
        kind: "position",
        message:
          "Your device couldn't provide a GPS position. Check that location services are on, or drag the map manually.",
      };
    }
    if (err?.code === 3) {
      return {
        kind: "timeout",
        message:
          "GPS detection timed out. Try moving to an open area, or drag the map manually.",
      };
    }
    return {
      kind: "generic",
      message:
        err?.message ||
        "Could not detect your GPS location. You can drag the map manually instead.",
    };
  }, []);

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
        // Clear prior reverse-geocode error on success
        setError((prev) => (prev?.kind === "reverse" ? null : prev));
      } catch (err: any) {
        if (err?.name === "AbortError") return;
        setAddress(null);
        setError({
          kind: "reverse",
          message:
            "Couldn't fetch address details for this spot. Drag the map to a clearer location, or confirm anyway.",
        });
      } finally {
        setIsReverseGeocoding(false);
      }
    }, REVERSE_GEOCODE_DEBOUNCE_MS);
  }, []);

  // ─── Initialize map on open ───
  useEffect(() => {
    if (!open || !mapRef.current) return;

    let cancelled = false;
    setIsMapReady(false);
    setError(null);
    setAddress(null);
    setIsReverseGeocoding(false);

    loadLeaflet()
      .then(() => {
        if (cancelled || !mapRef.current) return;
        const L = (window as any).L;

        const startCenter: [number, number] = initialLocation
          ? [initialLocation.lat, initialLocation.lng]
          : DEFAULT_CENTER;

        mapInstance.current = L.map(mapRef.current, {
          center: startCenter,
          zoom: DEFAULT_ZOOM,
          zoomControl: false,        // we render custom zoom buttons
          scrollWheelZoom: true,
          dragging: true,
          doubleClickZoom: false,    // avoid accidental zoom on tap-tap
          touchZoom: true,
          tap: true,
          tapTolerance: 15,
          attributionControl: false,
          inertia: true,
          worldCopyJump: true,
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          crossOrigin: true,
        }).addTo(mapInstance.current);

        // ─── Map move handlers (this is the heart of the center-pin pattern) ───
        // As the user drags the map, the lat/lng at the screen-center changes.
        // We capture it live on `move` (for instant UI feedback) and trigger
        // reverse geocode on `moveend` (when the user lets go).

        mapInstance.current.on("movestart", () => {
          if (isMapMovingRef.current) return; // we triggered this programmatically
          setIsMapPanning(true);
          setError(null);
        });

        mapInstance.current.on("move", () => {
          if (isMapMovingRef.current) return;
          if (mapInstance.current) {
            const c = mapInstance.current.getCenter();
            setCoords({ lat: c.lat, lng: c.lng });
            // Clear stale address so bottom sheet shows "Detecting…" skeleton
            setAddress(null);
            setGpsAccuracy(null); // user moved map — no longer pure GPS
          }
        });

        mapInstance.current.on("moveend", () => {
          if (isMapMovingRef.current) return;
          if (mapInstance.current) {
            const c = mapInstance.current.getCenter();
            setCoords({ lat: c.lat, lng: c.lng });
            scheduleReverseGeocode(c.lat, c.lng);
          }
          setIsMapPanning(false);
        });

        // Initial reverse geocode for the starting center
        scheduleReverseGeocode(startCenter[0], startCenter[1]);

        // ─── invalidateSize: critical for modal-mounted maps ───
        // Modal mounts → CSS animation runs → layout settles.
        // Use requestAnimationFrame for the FIRST invalidate (catches post-mount layout),
        // then a ResizeObserver for ongoing size changes.
        const invalidate = () => {
          if (mapInstance.current && !cancelled) {
            mapInstance.current.invalidateSize();
          }
        };
        requestAnimationFrame(() => {
          invalidate();
          setIsMapReady(true);
        });

        // ResizeObserver: invalidate on ANY size change to the wrapper.
        // This catches modal animations, mobile URL bar show/hide, orientation
        // changes, and font-load reflows — all in one place.
        let resizeObserver: ResizeObserver | null = null;
        if (mapContainerRef.current && typeof ResizeObserver !== "undefined") {
          resizeObserver = new ResizeObserver(() => invalidate());
          resizeObserver.observe(mapContainerRef.current);
        }
        // Safety-net invalidate for slow browsers
        const safetyTimer = setTimeout(invalidate, 400);

        return () => {
          if (resizeObserver) resizeObserver.disconnect();
          clearTimeout(safetyTimer);
        };
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
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ─── GPS Locate (recenter map on user's GPS) ───
  const handleLocate = useCallback(async () => {
    setIsLocating(true);
    setError(null);
    try {
      const loc = await getGPSLocation();
      setGpsAccuracy(loc.accuracy);
      if (mapInstance.current) {
        // Programmatic move — set guard flag so `movestart/move/moveend` handlers
        // don't treat this as a user-initiated pan (and don't reset `isMapPanning`).
        isMapMovingRef.current = true;
        mapInstance.current.setView([loc.lat, loc.lng], 17, { animate: true });
        // Reset guard after animation
        setTimeout(() => {
          isMapMovingRef.current = false;
          if (mapInstance.current) {
            const c = mapInstance.current.getCenter();
            setCoords({ lat: c.lat, lng: c.lng });
            setAddress(null);
            scheduleReverseGeocode(c.lat, c.lng);
          }
        }, 600);
      }
      setCoords({ lat: loc.lat, lng: loc.lng });
      setAddress(null);
      scheduleReverseGeocode(loc.lat, loc.lng);
    } catch (err: any) {
      setError(gpsErrorToMapError(err));
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

  const handleSelectSearchResult = useCallback((r: { lat: number; lng: number }) => {
    if (mapInstance.current) {
      // Programmatic move — guard flag prevents `movestart` from flicking panning state
      isMapMovingRef.current = true;
      mapInstance.current.setView([r.lat, r.lng], 17, { animate: true });
      setTimeout(() => {
        isMapMovingRef.current = false;
        if (mapInstance.current) {
          const c = mapInstance.current.getCenter();
          setCoords({ lat: c.lat, lng: c.lng });
          setAddress(null);
          scheduleReverseGeocode(c.lat, c.lng);
        }
      }, 600);
    }
    setCoords({ lat: r.lat, lng: r.lng });
    setAddress(null);
    scheduleReverseGeocode(r.lat, r.lng);
    setSearchQuery("");
    setSearchResults([]);
    setError(null);
  }, [scheduleReverseGeocode]);

  // ─── Zoom controls ───
  const handleZoomIn = useCallback(() => {
    mapInstance.current?.zoomIn();
  }, []);
  const handleZoomOut = useCallback(() => {
    mapInstance.current?.zoomOut();
  }, []);

  // ─── Confirm ───
  // Disabled while:
  //   - reverse geocoding is pending (no address resolved yet)
  //   - user is mid-pan (coords not settled)
  //   - confirm is in-flight
  const canConfirm = !isReverseGeocoding && !isMapPanning && !isConfirming;

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

  // ─── ESC key to close ───
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* ─── Inline styles (scoped via gp-* classes) ─── */}
      <style>{`
        /* ─── Fixed center pin (Blinkit-style: pin stays in middle of viewport,
              user pans the MAP underneath — no Leaflet marker needed) ─── */
        .gp-center-pin {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -100%);
          z-index: 50;
          pointer-events: none;
          width: 38px;
          height: 50px;
          animation: gp-pin-drop 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
          transform-origin: bottom center;
        }
        @keyframes gp-pin-drop {
          0%   { transform: translate(-50%, calc(-100% - 30px)) scale(0.8); opacity: 0; }
          55%  { transform: translate(-50%, calc(-100% + 6px)) scale(1.05); opacity: 1; }
          100% { transform: translate(-50%, -100%) scale(1);     opacity: 1; }
        }
        .gp-pin-head {
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
        .gp-pin-dot {
          position: absolute;
          top: 6px; left: 6px;
          width: 12px; height: 12px;
          background: white;
          border-radius: 50%;
          box-shadow: inset 0 0 0 2px rgba(26, 107, 60, 0.2);
        }
        .gp-pin-stem {
          position: absolute;
          top: 28px; left: 50%;
          transform: translateX(-50%);
          width: 4px;
          height: 14px;
          background: linear-gradient(180deg, #1A6B3C 0%, #0d4a26 100%);
          border-radius: 0 0 2px 2px;
        }
        .gp-pin-shadow {
          position: absolute;
          top: 42px; left: 50%;
          transform: translateX(-50%);
          width: 18px;
          height: 6px;
          background: rgba(0,0,0,0.25);
          border-radius: 50%;
          filter: blur(2.5px);
        }
        /* Center pin "pulse" while panning — visual feedback */
        .gp-center-pin.gp-panning .gp-pin-head {
          animation: gp-pin-pulse 0.9s ease-in-out infinite;
        }
        @keyframes gp-pin-pulse {
          0%, 100% { transform: translateX(-50%) rotate(-45deg) scale(1); }
          50%      { transform: translateX(-50%) rotate(-45deg) scale(1.08); }
        }

        /* ─── Leaflet container polish ─── */
        .leaflet-container {
          background: #e5e7eb;
          font-family: inherit;
          touch-action: none;
        }
        .leaflet-tile { filter: contrast(1.02) saturate(1.05); }

        /* ─── Animations ─── */
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
        @keyframes gp-sheet-in {
          from { transform: translateY(100%); opacity: 0.4; }
          to   { transform: translateY(0);     opacity: 1; }
        }
        .gp-sheet-enter { animation: gp-sheet-in 0.34s cubic-bezier(0.22, 1, 0.36, 1); }
      `}</style>

      {/* ─── Backdrop ─── */}
      <div
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-[2px] flex items-center justify-center gp-fade-in p-0 sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Location picker"
      >
        {/* ─── Modal shell ───
            Mobile  : 96vw × 92vh (almost full-screen)
            Desktop : 600px × 580px (centered, max 90vw × 88vh on smaller laptops)
            Flex column: header (auto) → map (1fr) → bottom sheet (auto).
            This is the KEY architectural choice: no `absolute inset-0` overlays
            fighting each other. The map's flex sibling sizes the map container
            deterministically, so Leaflet always has a stable size to render into. */}
        <div
          ref={mapContainerRef}
          className="relative gp-pop-in
                     w-[96vw] max-w-[600px]
                     h-[92vh] sm:h-[580px] sm:max-h-[88vh]
                     rounded-2xl overflow-hidden bg-white shadow-2xl
                     flex flex-col"
        >
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
                  Drag the map to position the pin
                </p>
              </div>
              {/* GPS locate button */}
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
            <div className="px-4 pb-3 relative">
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
                  className="w-full h-10 pl-10 pr-10 rounded-full bg-slate-100 focus:bg-white border border-transparent focus:border-[#1A6B3C] focus:ring-2 focus:ring-[#1A6B3C]/20 outline-none text-sm text-slate-700 placeholder:text-slate-400 transition-all"
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
                {isSearching && (
                  <Loader2 className="absolute right-9 top-1/2 -translate-y-1/2 size-4 animate-spin text-slate-400" />
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

          {/* ─── Map area (flex-1, min-h-0 → fills available space deterministically) ─── */}
          <div className="relative flex-1 min-h-0 bg-slate-200">
            {/* Leaflet mount point */}
            <div
              ref={mapRef}
              className="absolute inset-0 z-[1]"
              style={{ background: "#e5e7eb" }}
              aria-label="Interactive map — drag to position the center pin"
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

            {/* ─── FIXED CENTER PIN (the source of truth for selected coords) ─── */}
            {isMapReady && (
              <div
                className={cn("gp-center-pin", isMapPanning && "gp-panning")}
                aria-hidden="true"
              >
                <div className="gp-pin-shadow" />
                <div className="gp-pin-stem" />
                <div className="gp-pin-head">
                  <div className="gp-pin-dot" />
                </div>
              </div>
            )}

            {/* ─── Floating "Use Current Location" button (bottom-right, above zoom) ─── */}
            <button
              onClick={handleLocate}
              disabled={isLocating}
              className="absolute right-3 bottom-3 z-[1000] size-12 rounded-full bg-white shadow-lg flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-50 sm:hidden"
              aria-label="Use my current GPS location"
              title="Use my current GPS location"
            >
              {isLocating ? (
                <Loader2 className="size-5 text-[#1A6B3C] animate-spin" />
              ) : (
                <Crosshair className="size-5 text-[#1A6B3C]" />
              )}
            </button>

            {/* ─── Zoom controls (right side, vertically centered) ─── */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 z-[1000] flex flex-col gap-2">
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

            {/* ─── Top hint banner ─── */}
            {isMapReady && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[999] pointer-events-none">
                {isMapPanning ? (
                  <div className="bg-[#1A6B3C] text-white text-[11px] px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                    <Navigation className="size-3" />
                    Drag the map to position the pin
                  </div>
                ) : isReverseGeocoding ? (
                  <div className="bg-slate-900/85 text-white text-[11px] px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-sm shadow-lg">
                    <Loader2 className="size-3 animate-spin" />
                    Detecting address…
                  </div>
                ) : (
                  <div className="bg-slate-900/85 text-white text-[11px] px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-sm shadow-lg">
                    <MapPin className="size-3" />
                    Drag the map to set your exact location
                  </div>
                )}
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
                        {isMapPanning ? "Map moving…" : "No address yet"}
                      </p>
                      <p className="text-xs text-slate-500 leading-tight mt-0.5">
                        Drag the map to set your delivery spot.
                      </p>
                    </>
                  )}
                </div>
                {/* GPS accuracy badge */}
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
                    GPS accuracy is low ({Math.round(gpsAccuracy)}m). Drag the map to fine-tune your exact delivery location.
                  </span>
                </div>
              )}

              {/* Coordinates (monospace, subtle) */}
              <div className="mb-3 text-[10px] text-slate-400 tabular-nums font-mono">
                {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
              </div>

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
                  ) : isMapPanning ? (
                    <><Navigation className="size-4" /> Drop the map first</>
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
