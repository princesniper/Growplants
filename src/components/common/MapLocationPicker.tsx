"use client";

/**
 * GrowPlants — MapLocationPicker (Blinkit-style production picker)
 * ============================================================================
 * Complete address location picker — map + address form integrated.
 *
 * Layout:
 *   - Desktop (sm+): centered modal, two columns:
 *       LEFT  (~50%): Map + search bar + GPS button + selected-location card.
 *       RIGHT (~50%): Full address form (type / house / floor / area / landmark /
 *                      name / phone / Save).
 *
 *   - Mobile (< sm): full-screen stepped flow:
 *       Step 1: Map fills screen. Search bar floats top. GPS button floats
 *               right. Bottom sheet shows selected area + pincode + a large
 *               "Confirm Location" button.
 *       Step 2 (after Confirm): Full address form sheet replaces the map.
 *               "Back" returns to map step and resets verification.
 *
 * Map architecture (fixed center pin):
 *   - The pin is anchored to the center of the map area (CSS, not a Leaflet marker).
 *   - The user pans the MAP underneath; pin never moves.
 *   - map.getCenter() is always the selected coords.
 *   - movestart/move/moveend handlers update coords live + trigger reverse geocode.
 *
 * Verification state:
 *   - `locationVerified = false` until the user clicks "Confirm Location".
 *   - Re-entering the map step (clicking "Back" / "Adjust Location") resets it.
 *   - Save button is disabled until verified.
 *
 * Compatibility:
 *   - The picker emits the full address payload (including location fields) via
 *     `onSave`. The parent doesn't need to manage location state separately.
 *   - Data shape matches `UnifiedAddress` so consumers (addresses page, checkout)
 *     work without changes.
 * ============================================================================
 */
import { useState, useEffect, useRef, useCallback } from "react";
import {
  MapPin, Check, X, Loader2, Search, AlertCircle,
  Navigation, Locate, Plus, Minus, Crosshair, ChevronLeft,
  Home, Briefcase, Building2, ShieldCheck,
} from "lucide-react";
import { cn, isValidPincode, isValidIndianPhone } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getGPSLocation } from "@/lib/gps";
import { appToast } from "@/lib/toast";

// ─── Defaults / config ───
const DEFAULT_CENTER: [number, number] = [28.9965, 77.0203]; // Sonipat
const DEFAULT_ZOOM = 15;
const REVERSE_GEOCODE_DEBOUNCE_MS = 350;

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

// ─── Types ───
interface ReverseGeocodeResult {
  city: string;
  state: string;
  pincode: string;
  street?: string;
  area?: string;
  displayName?: string;
}

export interface PickerLocation {
  lat: number;
  lng: number;
  accuracy: number;
  city?: string;
  state?: string;
  pincode?: string;
}

interface MapLocationPickerProps {
  open: boolean;
  onClose: () => void;
  /** Fires when user confirms location AND clicks "Save Address". */
  onSave: (addr: {
    label: string;
    fullName: string;
    phone: string;
    houseNo: string;
    floor: string;
    locality: string;
    landmark: string;
    city: string;
    state: string;
    pincode: string;
    latitude: number | null;
    longitude: number | null;
    accuracy: number;
    isDefault: boolean;
    locationVerified: boolean;
    locationSource: "gps" | "manual" | null;
    locationAccuracy: number;
    gpsVerified: boolean;
  }) => void | Promise<void>;
  /** Initial values for editing (optional). */
  initial?: {
    label?: string;
    fullName?: string;
    phone?: string;
    houseNo?: string;
    floor?: string;
    locality?: string;
    landmark?: string;
    city?: string;
    state?: string;
    pincode?: string;
    latitude?: number | null;
    longitude?: number | null;
    accuracy?: number | null;
    locationAccuracy?: number | null;
    locationVerified?: boolean;
    gpsVerified?: boolean;
    isDefault?: boolean;
  } | null;
}

type MapErrorKind =
  | "load"
  | "permission"
  | "position"
  | "timeout"
  | "search"
  | "reverse"
  | "generic";

interface MapError {
  kind: MapErrorKind;
  message: string;
}

const ADDRESS_LABELS = [
  { value: "Home", label: "Home", icon: Home },
  { value: "Work", label: "Work", icon: Briefcase },
  { value: "Hotel", label: "Hotel", icon: Building2 },
  { value: "Other", label: "Other", icon: Plus },
] as const;

export function MapLocationPicker({
  open,
  onClose,
  onSave,
  initial,
}: MapLocationPickerProps) {
  // ─── Refs ───
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const reverseAbortRef = useRef<AbortController | null>(null);
  const reverseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMapMovingRef = useRef(false);

  // ─── Step (mobile only — desktop shows both) ───
  const [step, setStep] = useState<"map" | "form">("map");

  // ─── Map state ───
  const [coords, setCoords] = useState<{ lat: number; lng: number }>(
    initial?.latitude != null && initial?.longitude != null
      ? { lat: initial.latitude, lng: initial.longitude }
      : { lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] }
  );
  const [address, setAddress] = useState<ReverseGeocodeResult | null>(
    initial?.city
      ? {
          city: initial.city,
          state: initial.state ?? "",
          pincode: initial.pincode ?? "",
          street: initial.houseNo,
          area: [initial.locality, initial.city].filter(Boolean).join(", "),
        }
      : null
  );
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);
  const [isMapPanning, setIsMapPanning] = useState(false);
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

  // ─── Form state (address details) ───
  const [form, setForm] = useState({
    label: (initial?.label as typeof ADDRESS_LABELS[number]["value"]) ?? "Home",
    fullName: initial?.fullName ?? "",
    phone: initial?.phone ?? "",
    houseNo: initial?.houseNo ?? "",
    floor: initial?.floor ?? "",
    locality: initial?.locality ?? "",
    landmark: initial?.landmark ?? "",
    isDefault: initial?.isDefault ?? false,
  });

  // ─── Location verified state (critical for save gating) ───
  const [locationVerified, setLocationVerified] = useState<boolean>(
    Boolean(initial?.locationVerified ?? initial?.gpsVerified)
  );

  const [isSaving, setIsSaving] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // ─── Reset state when modal reopens ───
  useEffect(() => {
    if (!open) return;
    setStep("map");
    setFormErrors({});
    setSearchQuery("");
    setSearchResults([]);
    setError(null);
    setIsLocating(false);
    setGpsAccuracy(null);
    if (initial) {
      setForm({
        label: (initial.label as typeof ADDRESS_LABELS[number]["value"]) ?? "Home",
        fullName: initial.fullName ?? "",
        phone: initial.phone ?? "",
        houseNo: initial.houseNo ?? "",
        floor: initial.floor ?? "",
        locality: initial.locality ?? "",
        landmark: initial.landmark ?? "",
        isDefault: initial.isDefault ?? false,
      });
      if (initial.latitude != null && initial.longitude != null) {
        setCoords({ lat: initial.latitude, lng: initial.longitude });
      }
      if (initial.city) {
        setAddress({
          city: initial.city,
          state: initial.state ?? "",
          pincode: initial.pincode ?? "",
          street: initial.houseNo,
          area: [initial.locality, initial.city].filter(Boolean).join(", "),
        });
      }
      setLocationVerified(
        Boolean(initial.locationVerified ?? initial.gpsVerified)
      );
    } else {
      setLocationVerified(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ─── GPS error formatter ───
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

  // ─── Initialize map ───
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

        const startCenter: [number, number] =
          initial?.latitude != null && initial?.longitude != null
            ? [initial.latitude, initial.longitude]
            : DEFAULT_CENTER;

        mapInstance.current = L.map(mapRef.current, {
          center: startCenter,
          zoom: DEFAULT_ZOOM,
          zoomControl: false,
          scrollWheelZoom: true,
          dragging: true,
          doubleClickZoom: false,
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

        // ─── Map move handlers (center-pin pattern) ───
        mapInstance.current.on("movestart", () => {
          if (isMapMovingRef.current) return;
          setIsMapPanning(true);
          setError(null);
        });

        mapInstance.current.on("move", () => {
          if (isMapMovingRef.current) return;
          if (mapInstance.current) {
            const c = mapInstance.current.getCenter();
            setCoords({ lat: c.lat, lng: c.lng });
            setAddress(null);
            setGpsAccuracy(null);
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

        scheduleReverseGeocode(startCenter[0], startCenter[1]);

        // invalidateSize: requestAnimationFrame + ResizeObserver
        const invalidate = () => {
          if (mapInstance.current && !cancelled) {
            mapInstance.current.invalidateSize();
          }
        };
        requestAnimationFrame(() => {
          invalidate();
          setIsMapReady(true);
        });

        let resizeObserver: ResizeObserver | null = null;
        if (mapContainerRef.current && typeof ResizeObserver !== "undefined") {
          resizeObserver = new ResizeObserver(() => invalidate());
          resizeObserver.observe(mapContainerRef.current);
        }
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

  // ─── GPS Locate (recenter) ───
  const handleLocate = useCallback(async () => {
    setIsLocating(true);
    setError(null);
    try {
      const loc = await getGPSLocation();
      setGpsAccuracy(loc.accuracy);
      if (mapInstance.current) {
        isMapMovingRef.current = true;
        mapInstance.current.setView([loc.lat, loc.lng], 17, { animate: true });
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

  // ─── Search ───
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

  const handleSelectSearchResult = useCallback(
    (r: { lat: number; lng: number }) => {
      if (mapInstance.current) {
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
    },
    [scheduleReverseGeocode]
  );

  // ─── Zoom ───
  const handleZoomIn = useCallback(() => mapInstance.current?.zoomIn(), []);
  const handleZoomOut = useCallback(() => mapInstance.current?.zoomOut(), []);

  // ─── Confirm Location (map step) ───
  const canConfirmLocation = !isReverseGeocoding && !isMapPanning;
  const handleConfirmLocation = useCallback(() => {
    if (!canConfirmLocation) return;
    setLocationVerified(true);
    setStep("form"); // mobile advances to form step
    // Pre-fill locality from reverse-geocoded street if user hasn't typed one
    if (!form.locality && address?.street) {
      setForm((f) => ({ ...f, locality: address.street ?? "" }));
    }
    appToast.success(
      "Location confirmed!",
      gpsAccuracy != null
        ? `GPS accuracy: ${Math.round(gpsAccuracy)}m`
        : "Pin location confirmed"
    );
  }, [canConfirmLocation, address, gpsAccuracy, form.locality]);

  // ─── Back to map (mobile form step) — resets verification ───
  const handleBackToMap = useCallback(() => {
    setLocationVerified(false);
    setStep("map");
  }, []);

  // ─── Adjust location (form step → back to map) ───
  const handleAdjustLocation = useCallback(() => {
    setLocationVerified(false);
    setStep("map");
  }, []);

  // ─── Validation + Save ───
  const validate = useCallback((): boolean => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = "Name is required";
    if (!form.phone.trim() || !isValidIndianPhone(form.phone))
      e.phone = "Enter a valid 10-digit Indian phone number";
    if (!form.houseNo.trim()) e.houseNo = "Flat / House / Building is required";
    if (!form.locality.trim()) e.locality = "Area / Locality is required";
    if (!address?.pincode || !isValidPincode(address.pincode))
      e.pincode = "Pincode missing — confirm your location first";
    if (!address?.city?.trim()) e.city = "City missing — confirm your location first";
    if (!address?.state?.trim()) e.state = "State missing — confirm your location first";
    if (!locationVerified) e.location = "Please confirm your location first";
    setFormErrors(e);
    return Object.keys(e).length === 0;
  }, [form, address, locationVerified]);

  const handleSave = useCallback(async () => {
    if (!validate()) return;
    setIsSaving(true);
    try {
      await onSave({
        label: form.label,
        fullName: form.fullName,
        phone: form.phone,
        houseNo: form.houseNo,
        floor: form.floor,
        locality: form.locality,
        landmark: form.landmark,
        city: address?.city ?? "",
        state: address?.state ?? "",
        pincode: address?.pincode ?? "",
        latitude: coords.lat,
        longitude: coords.lng,
        accuracy: gpsAccuracy ?? 0,
        isDefault: form.isDefault,
        locationVerified: true,
        locationSource: gpsAccuracy != null ? "gps" : "manual",
        locationAccuracy: gpsAccuracy ?? 0,
        gpsVerified: true,
      });
    } catch (err) {
      appToast.error(
        "Save failed",
        err instanceof Error ? err.message : "Could not save address"
      );
    } finally {
      setIsSaving(false);
    }
  }, [validate, form, address, coords, gpsAccuracy, onSave]);

  // ─── Body scroll lock + ESC ───
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (step === "form") handleBackToMap();
        else onClose();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose, step, handleBackToMap]);

  if (!open) return null;

  // ─── Shared: Address Form (right column on desktop, full-screen step on mobile) ───
  const addressForm = (
    <div className="flex flex-col h-full bg-white">
      {/* Form header */}
      <div className="shrink-0 px-4 py-3 border-b border-slate-100 flex items-center gap-3">
        <button
          onClick={handleBackToMap}
          className="sm:hidden size-9 shrink-0 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center transition-all"
          aria-label="Back to map"
        >
          <ChevronLeft className="size-5 text-slate-700" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-slate-800 leading-tight">
            Enter Complete Address
          </h2>
          <p className="text-[11px] text-slate-500 leading-tight">
            Fill in your delivery details
          </p>
        </div>
        <button
          onClick={onClose}
          className="size-9 shrink-0 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 flex items-center justify-center transition-all"
          aria-label="Close"
        >
          <X className="size-5 text-slate-700" />
        </button>
      </div>

      {/* Form body */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-4">
        {/* Address type selector */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
            Address Type
          </Label>
          <div className="grid grid-cols-4 gap-2">
            {ADDRESS_LABELS.map((opt) => {
              const Icon = opt.icon;
              const active = form.label === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, label: opt.value }))}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 rounded-xl border-2 transition-all active:scale-95",
                    active
                      ? "border-[#1A6B3C] bg-[#F0FAF4] text-[#1A6B3C]"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                  )}
                  aria-pressed={active}
                >
                  <Icon className="size-4" />
                  <span className="text-[10px] font-semibold">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Flat / House / Building */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">
            Flat / House / Building Name <span className="text-red-500">*</span>
          </Label>
          <Input
            value={form.houseNo}
            onChange={(e) => setForm({ ...form, houseNo: e.target.value })}
            placeholder="e.g. Flat 302, Green Residency"
            className={cn(
              "h-11",
              formErrors.houseNo && "border-red-300 focus-visible:ring-red-200"
            )}
          />
          {formErrors.houseNo && <p className="text-xs text-red-500">{formErrors.houseNo}</p>}
        </div>

        {/* Floor */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Floor</Label>
          <Input
            value={form.floor}
            onChange={(e) => setForm({ ...form, floor: e.target.value })}
            placeholder="e.g. 3rd Floor (optional)"
            className="h-11"
          />
        </div>

        {/* Area / Locality */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">
            Area / Sector / Locality <span className="text-red-500">*</span>
          </Label>
          <Input
            value={form.locality}
            onChange={(e) => setForm({ ...form, locality: e.target.value })}
            placeholder="e.g. Sector 12, Green Street"
            className={cn(
              "h-11",
              formErrors.locality && "border-red-300 focus-visible:ring-red-200"
            )}
          />
          {formErrors.locality && <p className="text-xs text-red-500">{formErrors.locality}</p>}
        </div>

        {/* Nearby Landmark */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Nearby Landmark</Label>
          <Input
            value={form.landmark}
            onChange={(e) => setForm({ ...form, landmark: e.target.value })}
            placeholder="e.g. Near City Mall (optional)"
            className="h-11"
          />
        </div>

        <div className="h-px bg-slate-100 my-2" />

        {/* Name */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">
            Name <span className="text-red-500">*</span>
          </Label>
          <Input
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            placeholder="Full name"
            className={cn(
              "h-11",
              formErrors.fullName && "border-red-300 focus-visible:ring-red-200"
            )}
          />
          {formErrors.fullName && <p className="text-xs text-red-500">{formErrors.fullName}</p>}
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-slate-700">Phone Number</Label>
          <div className="flex h-11 rounded-md border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-[#1A6B3C]/20 focus-within:border-[#1A6B3C]">
            <span className="flex items-center px-3 bg-slate-50 text-sm font-medium text-slate-600 border-r border-slate-200">
              +91
            </span>
            <input
              type="tel"
              inputMode="numeric"
              maxLength={10}
              placeholder="9876543210"
              value={form.phone}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                setForm({ ...form, phone: digits });
              }}
              className="flex-1 px-3 text-sm bg-transparent outline-none"
            />
          </div>
          {formErrors.phone && <p className="text-xs text-red-500">{formErrors.phone}</p>}
        </div>

        {/* Default checkbox */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="picker-isDefault"
            checked={form.isDefault}
            onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
            className="size-4 accent-[#1A6B3C]"
          />
          <Label htmlFor="picker-isDefault" className="text-sm cursor-pointer">
            Set as default address
          </Label>
        </div>

        {/* Errors summary */}
        {(formErrors.location || formErrors.pincode) && (
          <div className="rounded-md bg-red-50 border border-red-100 p-3 space-y-1">
            {formErrors.location && (
              <p className="text-xs text-red-600 flex items-start gap-1.5">
                <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
                {formErrors.location}
              </p>
            )}
            {formErrors.pincode && (
              <p className="text-xs text-red-600 flex items-start gap-1.5">
                <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
                {formErrors.pincode}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Save button (sticky footer) */}
      <div className="shrink-0 px-4 py-3 border-t border-slate-100 bg-white">
        <Button
          onClick={handleSave}
          disabled={isSaving || !locationVerified}
          className={cn(
            "w-full h-12 gap-2 text-sm font-semibold",
            locationVerified && !isSaving
              ? "bg-[#1A6B3C] hover:bg-[#16A34A] shadow-md shadow-[#1A6B3C]/20"
              : "bg-slate-300 text-slate-500 cursor-not-allowed"
          )}
        >
          {isSaving ? (
            <><Loader2 className="size-5 animate-spin" /> Saving…</>
          ) : !locationVerified ? (
            <><MapPin className="size-5" /> Confirm location first</>
          ) : (
            <><Check className="size-5" /> Save Address</>
          )}
        </Button>
      </div>
    </div>
  );

  // ─── Shared: Map column (left column on desktop, full-screen step on mobile) ───
  const mapColumn = (
    <div
      ref={mapContainerRef}
      className="relative bg-slate-200 w-full h-full overflow-hidden"
    >
      {/* ─── Top floating bar (search + close + GPS) ─── */}
      <div className="absolute top-0 inset-x-0 z-[1000] p-3 pointer-events-none">
        <div className="flex items-start gap-2 pointer-events-auto">
          {/* Close (mobile) — also closes picker */}
          <button
            onClick={onClose}
            className="sm:hidden size-10 shrink-0 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all"
            aria-label="Close"
          >
            <X className="size-5 text-slate-700" />
          </button>

          {/* Search */}
          <div className="flex-1 min-w-0 relative">
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
              className="w-full h-10 pl-10 pr-10 rounded-full bg-white shadow-md focus:ring-2 focus:ring-[#1A6B3C]/20 focus:border-[#1A6B3C] border border-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400 transition-all"
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

            {/* Search results dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-100 max-h-[40vh] overflow-y-auto z-[1001]">
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

          {/* GPS locate */}
          <button
            onClick={handleLocate}
            disabled={isLocating}
            className="size-10 shrink-0 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-50"
            aria-label="Use my current GPS location"
            title="Use my current GPS location"
          >
            {isLocating ? (
              <Loader2 className="size-5 text-[#1A6B3C] animate-spin" />
            ) : (
              <Crosshair className="size-5 text-[#1A6B3C]" />
            )}
          </button>
        </div>
      </div>

      {/* ─── Leaflet mount ─── */}
      <div
        ref={mapRef}
        className="absolute inset-0 z-[1]"
        style={{ background: "#e5e7eb" }}
        aria-label="Interactive map — drag to position the center pin"
      />

      {/* ─── Loading overlay ─── */}
      {!isMapReady && (
        <div className="absolute inset-0 z-[2] flex items-center justify-center bg-slate-100">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="size-7 animate-spin text-[#1A6B3C]" />
            <p className="text-xs text-slate-500">Loading map…</p>
          </div>
        </div>
      )}

      {/* ─── Load-error overlay ─── */}
      {error?.kind === "load" && (
        <div className="absolute inset-0 z-[2] flex items-center justify-center bg-slate-100 p-6">
          <div className="flex flex-col items-center gap-2 max-w-xs text-center">
            <AlertCircle className="size-9 text-red-500" />
            <p className="text-xs font-medium text-slate-700">{error.message}</p>
            <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
          </div>
        </div>
      )}

      {/* ─── FIXED CENTER PIN ─── */}
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

      {/* ─── Zoom controls (right side) ─── */}
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
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[999] pointer-events-none">
          {isMapPanning ? (
            <div className="bg-[#1A6B3C] text-white text-[11px] px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
              <Navigation className="size-3" />
              Move the map to position the pin
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

      {/* ─── Bottom card (selected location + Confirm CTA) ───
          On desktop: a small card pinned to bottom-left of the map column.
          On mobile: a bottom sheet pinned to bottom of screen. */}
      <div className="absolute bottom-0 inset-x-0 z-[1000] p-3 pointer-events-none">
        <div className="pointer-events-auto bg-white rounded-xl shadow-lg border border-slate-100 max-w-md mx-auto">
          <div className="p-3 space-y-2">
            {/* Address row */}
            <div className="flex items-start gap-3">
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
                      No address yet
                    </p>
                    <p className="text-xs text-slate-500 leading-tight mt-0.5">
                      Drag the map to set your delivery spot.
                    </p>
                  </>
                )}
              </div>
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

            {/* Error / warning */}
            {error && error.kind !== "load" && (
              <div className={cn(
                "flex items-start gap-1.5 text-[11px] px-2.5 py-1.5 rounded-md",
                error.kind === "permission" || error.kind === "position" || error.kind === "timeout"
                  ? "text-amber-700 bg-amber-50"
                  : "text-red-600 bg-red-50"
              )}>
                <AlertCircle className="size-3.5 shrink-0 mt-0.5" />
                <span>{error.message}</span>
              </div>
            )}

            {/* Coordinates */}
            <div className="text-[10px] text-slate-400 tabular-nums font-mono">
              {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
            </div>

            {/* Confirm / Adjust button */}
            {locationVerified ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 h-10 border-slate-300 text-slate-600"
                  onClick={handleAdjustLocation}
                >
                  Adjust Location
                </Button>
                <div className="flex items-center gap-1.5 px-3 h-10 rounded-md bg-green-50 text-green-700 text-xs font-semibold">
                  <ShieldCheck className="size-4" />
                  Confirmed
                </div>
              </div>
            ) : (
              <Button
                onClick={handleConfirmLocation}
                disabled={!canConfirmLocation}
                className={cn(
                  "w-full h-11 gap-2 text-sm font-semibold",
                  canConfirmLocation
                    ? "bg-[#1A6B3C] hover:bg-[#16A34A] shadow-md shadow-[#1A6B3C]/20"
                    : "bg-slate-300 text-slate-500 cursor-not-allowed"
                )}
              >
                {isMapPanning ? (
                  <><Navigation className="size-4" /> Drop the map first</>
                ) : isReverseGeocoding ? (
                  <><Loader2 className="size-4 animate-spin" /> Detecting address…</>
                ) : (
                  <><Check className="size-4" /> Confirm Location</>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ─── Inline styles (scoped via gp-* classes) ─── */}
      <style>{`
        /* ─── Fixed center pin ─── */
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
        .gp-center-pin.gp-panning .gp-pin-head {
          animation: gp-pin-pulse 0.9s ease-in-out infinite;
        }
        @keyframes gp-pin-pulse {
          0%, 100% { transform: translateX(-50%) rotate(-45deg) scale(1); }
          50%      { transform: translateX(-50%) rotate(-45deg) scale(1.08); }
        }

        /* ─── Leaflet polish ─── */
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
          0%   { opacity: 0; transform: scale(0.97) translateY(8px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .gp-pop-in { animation: gp-pop-in 0.28s cubic-bezier(0.22, 1, 0.36, 1); }
      `}</style>

      {/* ─── Backdrop ─── */}
      <div
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-[2px] flex items-center justify-center gp-fade-in p-0 sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Address location picker"
      >
        {/*
          ─── Modal shell ───
          Mobile : full-screen, shows one column at a time (map OR form)
          Desktop: two columns side-by-side, ~960px × 620px, centered
          Flexbox layout — no `absolute inset-0` overlays fighting each other.
        */}
        <div
          className={cn(
            "relative bg-white shadow-2xl overflow-hidden flex gp-pop-in",
            "w-full h-[100dvh]",
            "sm:w-[min(960px,95vw)] sm:h-[min(620px,90vh)]",
            "sm:rounded-2xl"
          )}
        >
          {/* Map column */}
          <div
            className={cn(
              "shrink-0 bg-slate-200",
              // Mobile: full-screen, shown when step === "map"
              step === "map" ? "block" : "hidden",
              "w-full h-full",
              // Desktop: half width, always visible
              "sm:block sm:w-1/2 sm:h-full"
            )}
          >
            {mapColumn}
          </div>

          {/* Address form column */}
          <div
            className={cn(
              "shrink-0 bg-white",
              // Mobile: full-screen, shown when step === "form"
              step === "form" ? "block" : "hidden",
              "w-full h-full",
              // Desktop: half width, always visible
              "sm:block sm:w-1/2 sm:h-full"
            )}
          >
            {addressForm}
          </div>
        </div>
      </div>
    </>
  );
}
