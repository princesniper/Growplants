"use client";

/**
 * GrowPlants — UnifiedAddressForm
 * ============================================================================
 * SINGLE source of truth for address creation + editing + GPS verification.
 * Used by BOTH:
 *   - Account → Addresses → Add/Edit Address
 *   - Checkout → Add New Address
 *
 * Features:
 *   - GPS verification (auto-detect or manual map pin)
 *   - MapLocationPicker integration (draggable pin)
 *   - GPS state: idle → detecting → fetching → verified / failed
 *   - Red error state when GPS not verified
 *   - Save button disabled until GPS verified
 *   - GPS resets when city/state/pincode change
 *   - Same fields, same validation, same data model everywhere
 * ============================================================================
 */
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Navigation, ShieldCheck, AlertCircle, Loader2, Check, X,
  MapPin, Map as MapIcon, Plus, Home as HomeIcon, Search,
} from "lucide-react";
import { cn, isValidPincode } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MapLocationPicker } from "@/components/common/MapLocationPicker";
import { getGPSLocation } from "@/lib/gps";
import { appToast } from "@/lib/toast";

// ─── Unified address data model (used everywhere) ───
export interface UnifiedAddress {
  id?: string;
  label: string;
  fullName: string;
  phone: string;
  houseNo: string;
  locality: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  gpsVerified: boolean;
  isDefault: boolean;
  // ─── New canonical location fields ───
  locationVerified: boolean;
  locationSource: "gps" | "manual" | null;
  locationAccuracy: number | null;
}

type GpsState = "idle" | "detecting" | "fetching" | "verified" | "failed";
type PincodeStatus = "idle" | "fetching" | "ok" | "not-found" | "error";

interface UnifiedAddressFormProps {
  /** Initial values for editing (null = new address) */
  initial?: Partial<UnifiedAddress> | null;
  /** Called when user clicks Save. Return true if save succeeded, false if failed. */
  onSave: (addr: Omit<UnifiedAddress, "id">) => void | Promise<void>;
  /** Called when user clicks Cancel */
  onCancel: () => void;
  /** Show "Save for next time" checkbox (checkout mode) */
  showSaveCheckbox?: boolean;
  /** Title override */
  title?: string;
}

export function UnifiedAddressForm({
  initial,
  onSave,
  onCancel,
  showSaveCheckbox = false,
  title,
}: UnifiedAddressFormProps) {
  // ─── Form state ───
  const [form, setForm] = useState({
    label: initial?.label ?? "Home",
    fullName: initial?.fullName ?? "",
    phone: initial?.phone ?? "",
    houseNo: initial?.houseNo ?? "",
    locality: initial?.locality ?? "",
    landmark: initial?.landmark ?? "",
    city: initial?.city ?? "",
    state: initial?.state ?? "",
    pincode: initial?.pincode ?? "",
    isDefault: initial?.isDefault ?? false,
  });

  // ─── GPS state ───
  const [gpsState, setGpsState] = useState<GpsState>(
    initial?.gpsVerified && initial?.latitude != null && initial?.longitude != null
      ? "verified" : "idle"
  );
  const [gpsError, setGpsError] = useState("");
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(
    initial?.gpsVerified && initial?.latitude != null && initial?.longitude != null
      ? { lat: initial.latitude, lng: initial.longitude, accuracy: initial.accuracy ?? 0 }
      : null
  );
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // ─── Pincode auto-fill state ───
  const [pincodeStatus, setPincodeStatus] = useState<PincodeStatus>("idle");
  const [pincodeMessage, setPincodeMessage] = useState(""); // success or error text
  const pincodeAbortRef = useRef<AbortController | null>(null);

  // ─── Location source (gps | manual | null) ───
  const [locationSource, setLocationSource] = useState<"gps" | "manual" | null>(
    initial?.gpsVerified || initial?.locationVerified
      ? (initial?.locationSource ?? (initial?.gpsVerified ? "gps" : null))
      : null
  );

  const gpsVerified = gpsState === "verified";
  // locationVerified is the canonical name — true whenever GPS or manual map has been confirmed.
  const locationVerified = gpsVerified;
  // When user types a valid 6-digit pincode, fetch city/district + state from /api/pincode/[pincode]
  useEffect(() => {
    const pincode = form.pincode.trim();

    // Reset state if input is empty or invalid
    if (!pincode) {
      setPincodeStatus("idle");
      setPincodeMessage("");
      return;
    }
    if (!isValidPincode(pincode)) {
      // Only show error when user has typed all 6 digits but pattern still fails
      // (pattern: must start with 1-9 and be exactly 6 digits)
      if (pincode.length === 6) {
        setPincodeStatus("not-found");
        setPincodeMessage("Invalid pincode. Must start with 1-9.");
      } else {
        setPincodeStatus("idle");
        setPincodeMessage("");
      }
      return;
    }

    // Valid format — debounce fetch
    setPincodeStatus("fetching");
    setPincodeMessage("");

    // Cancel previous in-flight request
    if (pincodeAbortRef.current) pincodeAbortRef.current.abort();
    const controller = new AbortController();
    pincodeAbortRef.current = controller;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/pincode/${pincode}`, {
          signal: controller.signal,
        });
        const json = await res.json();
        if (!res.ok || !json.ok) {
          setPincodeStatus("not-found");
          setPincodeMessage(json.error || "Pincode not found. Please check and re-enter.");
          return;
        }
        const info = json.data;
        setPincodeStatus("ok");
        setPincodeMessage(
          `${info.city || info.district}${info.state ? ", " + info.state : ""}`
        );
        // Auto-fill city + state (only if user hasn't typed something different already)
        setForm((f) => ({
          ...f,
          city: info.city || info.district || f.city,
          state: info.state || f.state,
        }));
      } catch (err: any) {
        if (err?.name === "AbortError") return; // superseded by a newer request
        setPincodeStatus("error");
        setPincodeMessage("Could not verify pincode. Check your connection.");
      }
    }, 450);

    return () => {
      clearTimeout(timer);
      // Don't abort on cleanup — let the request complete unless replaced.
    };
  }, [form.pincode]);

  // ─── Reset verification when city/state/pincode manually change ───
  // Pin move/drag reset is handled inside MapLocationPicker (user must click
  // "Confirm Location" again after dragging). Here we only reset when the user
  // edits text fields that were originally auto-filled from the GPS/map.
  const gpsVerifiedRef = useRef<{ city: string; state: string; pincode: string } | null>(null);

  useEffect(() => {
    if (gpsState === "verified") {
      gpsVerifiedRef.current = { city: form.city, state: form.state, pincode: form.pincode };
    }
  }, [gpsState]);

  useEffect(() => {
    if (gpsState === "verified" && gpsVerifiedRef.current) {
      if (
        gpsVerifiedRef.current.city !== form.city ||
        gpsVerifiedRef.current.state !== form.state ||
        gpsVerifiedRef.current.pincode !== form.pincode
      ) {
        setGpsState("idle");
        gpsVerifiedRef.current = null;
      }
    }
  }, [form.city, form.state, form.pincode, gpsState]);

  // ─── "Use Current Location" handler ───
  // Blinks-style: opens the full-screen picker, pre-centered on the user's GPS.
  // If GPS fails entirely, we still open the picker at the default center and let
  // the user drag the map / search manually.
  const handleGPS = useCallback(async () => {
    setGpsState("detecting");
    setGpsError("");
    try {
      const loc = await getGPSLocation();
      // Pre-center picker on GPS location. We no longer reject low-accuracy
      // GPS outright — instead we pass it to the picker, which shows the
      // accuracy as a hint and lets the user fine-tune the pin manually.
      setGpsCoords({ lat: loc.lat, lng: loc.lng, accuracy: loc.accuracy });
      setMapPickerOpen(true);
      // Keep state as "detecting" until user confirms in the picker.
      // The picker's onLocationSelect → handleMapLocationSelect will flip it to "verified".
    } catch (err) {
      // GPS failed entirely — still open picker at default center so user can
      // search / drag to position. Show the error as a hint.
      setGpsCoords(null);
      setMapPickerOpen(true);
      setGpsError(
        err instanceof Error
          ? `${err.message} You can still pick your location manually on the map.`
          : "GPS detection failed. Please pick your location manually on the map."
      );
      setGpsState("idle");
    }
  }, []);

  // ─── "Adjust Location" handler ───
  // Opens the picker at the currently-saved coordinates (or default center).
  const handleAdjustLocation = useCallback(() => {
    setMapPickerOpen(true);
  }, []);

  // ─── Manual map location handler ───
  // Called when user clicks "Confirm Location" inside MapLocationPicker.
  // At this point the user has explicitly confirmed, so verification is granted.
  const handleMapLocationSelect = useCallback((location: {
    lat: number; lng: number; accuracy: number;
    city?: string; state?: string; pincode?: string;
  }) => {
    setGpsCoords({ lat: location.lat, lng: location.lng, accuracy: location.accuracy });
    setForm((f) => ({
      ...f,
      city: location.city || f.city,
      state: location.state || f.state,
      pincode: location.pincode || f.pincode,
    }));
    setGpsState("verified");
    // Location source: "gps" if accuracy > 0 (came from a GPS reading),
    // "manual" if the user dragged/searched (accuracy 0).
    setLocationSource(location.accuracy > 0 ? "gps" : "manual");
    setGpsError("");
    appToast.success(
      "Location confirmed!",
      location.accuracy > 0
        ? `GPS accuracy: ${Math.round(location.accuracy)}m`
        : "Pin location confirmed on map"
    );
  }, []);

  // ─── Reset "detecting" state if picker closes without confirmation ───
  // handleGPS sets state to "detecting" right before opening the picker. If
  // the user closes the picker without confirming, we revert to "idle" so the
  // button shows up again and the user can retry.
  useEffect(() => {
    if (!mapPickerOpen && gpsState === "detecting") {
      setGpsState("idle");
    }
  }, [mapPickerOpen, gpsState]);

  // ─── Reset location source when verification resets ───
  useEffect(() => {
    if (gpsState !== "verified") {
      setLocationSource(null);
    }
  }, [gpsState]);

  // ─── Validation ───
  const validate = useCallback((): boolean => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required";
    if (!form.phone.trim() || !/^[6-9]\d{9}$/.test(form.phone.replace(/\D/g, "")))
      e.phone = "Enter a valid 10-digit phone number";
    if (!form.houseNo.trim()) e.houseNo = "House / Flat number is required";
    if (!form.locality.trim()) e.locality = "Area / Street / Locality is required";
    if (!isValidPincode(form.pincode)) e.pincode = "Enter a valid 6-digit pincode";
    else if (pincodeStatus === "not-found") e.pincode = pincodeMessage || "Pincode not found";
    else if (pincodeStatus === "fetching") e.pincode = "Verifying pincode...";
    else if (pincodeStatus === "error") e.pincode = pincodeMessage;
    if (!form.city.trim()) e.city = "City is required";
    if (!form.state.trim()) e.state = "State is required";
    // Location verification is ALWAYS required (GPS or manual map pin)
    if (!locationVerified) e.gps = "Please confirm your location using GPS or map pin before saving this address.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form, locationVerified, pincodeStatus, pincodeMessage]);

  // ─── Save handler ───
  const handleSave = async () => {
    // Final validation (including GPS check)
    if (!validate()) {
      // Scroll to GPS section if that's the error
      if (!gpsVerified) {
        const gpsSection = document.getElementById("gps-section");
        gpsSection?.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }

    // Double-check location verification at save logic level
    if (!locationVerified || !gpsCoords) {
      setErrors((prev) => ({ ...prev, gps: "Location verification is required to save this address." }));
      return;
    }
    if (!locationSource) {
      setErrors((prev) => ({ ...prev, gps: "Could not determine location source." }));
      return;
    }

    setIsSaving(true);
    try {
      await onSave({
        label: form.label,
        fullName: form.fullName,
        phone: form.phone,
        houseNo: form.houseNo,
        locality: form.locality,
        landmark: form.landmark,
        city: form.city,
        state: form.state,
        pincode: form.pincode,
        latitude: gpsCoords.lat,
        longitude: gpsCoords.lng,
        accuracy: gpsCoords.accuracy,
        gpsVerified: true,
        isDefault: form.isDefault,
        // ─── New canonical fields ───
        locationVerified: true,
        locationSource,
        locationAccuracy: gpsCoords.accuracy,
      });
    } catch (err) {
      appToast.error("Save failed", err instanceof Error ? err.message : "Could not save address");
    } finally {
      setIsSaving(false);
    }
  };

  const gpsButtonContent = () => {
    switch (gpsState) {
      case "detecting": return <><Loader2 className="size-4 animate-spin" /> Detecting...</>;
      case "fetching": return <><Loader2 className="size-4 animate-spin" /> Fetching address...</>;
      case "verified": return <><ShieldCheck className="size-4" /> GPS Verified ({gpsCoords ? Math.round(gpsCoords.accuracy) : 0}m)</>;
      case "failed": return <><AlertCircle className="size-4" /> Retry GPS</>;
      default: return <><Navigation className="size-4" /> Verify via GPS</>;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 animate-scale-in">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-slate-800">{title ?? (initial?.id ? "Edit Address" : "Add New Address")}</h2>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600"><X className="size-5" /></button>
      </div>

      {/* ─── GPS Verification Section ─── */}
      <div
        id="gps-section"
        className={cn(
          "rounded-lg border-2 p-4 transition-all",
          errors.gps ? "border-red-400 bg-red-50" :
          gpsVerified ? "border-green-300 bg-green-50" :
          gpsState === "failed" ? "border-red-300 bg-red-50" :
          "border-slate-200 bg-slate-50"
        )}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1">
            {gpsVerified ? (
              <ShieldCheck className="size-5 text-green-600 shrink-0" />
            ) : gpsState === "detecting" || gpsState === "fetching" ? (
              <Loader2 className="size-5 text-[#1A6B3C] animate-spin shrink-0" />
            ) : gpsState === "failed" ? (
              <AlertCircle className="size-5 text-red-500 shrink-0" />
            ) : (
              <Navigation className="size-5 text-[#1A6B3C] shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-800">
                {gpsVerified ? "Location Verified" :
                 gpsState === "detecting" ? "Detecting your GPS..." :
                 gpsState === "fetching" ? "Fetching address from GPS..." :
                 gpsState === "failed" ? "GPS verification failed" :
                 "GPS Location Verification"}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                {gpsVerified ? `Confirmed via ${locationSource === "gps" ? "GPS" : "map pin"}. City, state, pincode auto-filled. You can adjust manually.` :
                 "Verify your exact delivery location. Required to save address."}
              </p>
            </div>
          </div>
          {!gpsVerified && gpsState !== "detecting" && gpsState !== "fetching" && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="border-[#1A6B3C] text-[#1A6B3C] gap-1.5 animate-pulse-ring shrink-0"
              onClick={handleGPS}
            >
              {gpsButtonContent()}
            </Button>
          )}
        </div>

        {/* GPS error */}
        {gpsError && (
          <p className="text-xs text-red-500 mt-2 flex items-start gap-1">
            <AlertCircle className="size-3.5 shrink-0 mt-0.5" /> {gpsError}
          </p>
        )}

        {/* Validation error (red) */}
        {errors.gps && !gpsVerified && (
          <p className="text-xs text-red-600 mt-2 flex items-start gap-1 font-medium animate-shake">
            <AlertCircle className="size-3.5 shrink-0 mt-0.5" /> {errors.gps}
          </p>
        )}

        {/* Manual map link — always visible (lets user re-position even after GPS verified) */}
        <div className="mt-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setMapPickerOpen(true)}
            className="text-xs text-[#1A6B3C] hover:underline font-medium flex items-center gap-1"
          >
            <MapIcon className="size-3.5" />
            {gpsVerified ? "Adjust location on map" : "Set Location Manually on Map"}
          </button>
        </div>

        {/* Coordinates display */}
        {gpsVerified && gpsCoords && (
          <div className="mt-2 pt-2 border-t border-green-200 flex items-center justify-between gap-2 text-xs text-green-700">
            <div className="flex items-center gap-2">
              <MapPin className="size-3" />
              <span className="tabular-nums">{gpsCoords.lat.toFixed(6)}, {gpsCoords.lng.toFixed(6)}</span>
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wide bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
              via {locationSource === "gps" ? "GPS" : "MAP PIN"}
            </span>
          </div>
        )}
      </div>

      {/* ─── Form Fields ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-sm">Label</Label>
          <select
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            className="w-full h-11 border border-slate-200 rounded-md px-3 text-sm"
          >
            <option value="Home">Home</option>
            <option value="Work">Work</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">Full Name *</Label>
          <Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="h-11" />
          {errors.fullName && <p className="text-xs text-red-500">{errors.fullName}</p>}
        </div>
      </div>

      {/* Phone with +91 prefix */}
      <div className="space-y-1.5">
        <Label className="text-sm">Phone Number *</Label>
        <div className="flex h-11 rounded-md border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-[#1A6B3C]/20 focus-within:border-[#1A6B3C]">
          <span className="flex items-center px-3 bg-slate-50 text-sm font-medium text-slate-600 border-r border-slate-200">+91</span>
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
        {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm">House No / Flat No *</Label>
        <Input value={form.houseNo} onChange={(e) => setForm({ ...form, houseNo: e.target.value })} className="h-11" placeholder="123, 2nd Floor" />
        {errors.houseNo && <p className="text-xs text-red-500">{errors.houseNo}</p>}
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm">Area / Street / Locality *</Label>
        <Input value={form.locality} onChange={(e) => setForm({ ...form, locality: e.target.value })} className="h-11" placeholder="Green Street, Sector 12" />
        {errors.locality && <p className="text-xs text-red-500">{errors.locality}</p>}
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm">Landmark (optional)</Label>
        <Input value={form.landmark} onChange={(e) => setForm({ ...form, landmark: e.target.value })} className="h-11" placeholder="Near City Mall" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="space-y-1.5">
          <Label className="text-sm flex items-center gap-1.5">
            Pincode *
            {pincodeStatus === "fetching" && (
              <Loader2 className="size-3 animate-spin text-slate-400" />
            )}
            {pincodeStatus === "ok" && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-green-600 bg-green-50 px-1.5 py-0.5 rounded-full">
                <Check className="size-2.5" /> Verified
              </span>
            )}
          </Label>
          <Input
            inputMode="numeric"
            maxLength={6}
            value={form.pincode}
            onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "") })}
            className={cn(
              "h-11",
              pincodeStatus === "ok" && "border-green-300 focus-visible:ring-green-200",
              pincodeStatus === "not-found" && "border-red-300 focus-visible:ring-red-200",
              pincodeStatus === "error" && "border-amber-300 focus-visible:ring-amber-200"
            )}
            placeholder="131001"
          />
          {pincodeStatus === "ok" && pincodeMessage && (
            <p className="text-xs text-green-600 flex items-center gap-1 animate-fade-in">
              <Check className="size-3 shrink-0" /> {pincodeMessage}
            </p>
          )}
          {pincodeStatus === "not-found" && pincodeMessage && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <AlertCircle className="size-3 shrink-0" /> {pincodeMessage}
            </p>
          )}
          {pincodeStatus === "error" && pincodeMessage && (
            <p className="text-xs text-amber-600 flex items-center gap-1">
              <AlertCircle className="size-3 shrink-0" /> {pincodeMessage}
            </p>
          )}
          {errors.pincode && !pincodeMessage && (
            <p className="text-xs text-red-500">{errors.pincode}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">City *</Label>
          <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="h-11" />
          {errors.city && <p className="text-xs text-red-500">{errors.city}</p>}
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm">State *</Label>
          <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="h-11" />
          {errors.state && <p className="text-xs text-red-500">{errors.state}</p>}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        <input type="checkbox" id="isDefault" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} className="size-4 accent-[#1A6B3C]" />
        <Label htmlFor="isDefault" className="text-sm cursor-pointer">Set as default address</Label>
      </div>

      <Separator />

      {/* Actions */}
      <div className="flex gap-3 pt-1">
        <Button
          onClick={handleSave}
          disabled={!gpsVerified || isSaving}
          className={cn("gap-2 flex-1", gpsVerified ? "bg-[#1A6B3C] hover:bg-[#16A34A]" : "bg-slate-300 cursor-not-allowed")}
        >
          {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          {initial?.id ? "Update" : "Save"} Address
        </Button>
        <Button variant="outline" onClick={onCancel} className="border-slate-300 text-slate-600">Cancel</Button>
      </div>
      {!gpsVerified && (
        <p className="text-xs text-slate-400 text-center flex items-center justify-center gap-1">
          🔒 Address save blocked until GPS verified
        </p>
      )}

      {/* Map Location Picker Dialog */}
      <MapLocationPicker
        open={mapPickerOpen}
        onClose={() => setMapPickerOpen(false)}
        onLocationSelect={handleMapLocationSelect}
        initialLocation={gpsCoords ? { lat: gpsCoords.lat, lng: gpsCoords.lng } : null}
      />
    </div>
  );
}
