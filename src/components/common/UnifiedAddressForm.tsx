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
  MapPin, Map as MapIcon, Plus, Home as HomeIcon,
} from "lucide-react";
import { cn, isValidPincode } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { MapLocationPicker } from "@/components/common/MapLocationPicker";
import { getGPSLocation, reverseGeocode, GPS_ACCURACY_THRESHOLD } from "@/lib/gps";
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
}

type GpsState = "idle" | "detecting" | "fetching" | "verified" | "failed";

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

  const gpsVerified = gpsState === "verified";

  // ─── GPS-verified snapshot for field-change detection ───
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

  // ─── GPS auto-detect handler ───
  const handleGPS = useCallback(async () => {
    setGpsState("detecting");
    setGpsError("");
    try {
      const loc = await getGPSLocation();
      if (loc.accuracy > GPS_ACCURACY_THRESHOLD) {
        setGpsState("failed");
        setGpsError(`GPS accuracy too low (${Math.round(loc.accuracy)}m). Need within ${GPS_ACCURACY_THRESHOLD}m.`);
        return;
      }
      setGpsState("fetching");
      const geo = await reverseGeocode(loc.lat, loc.lng);
      setGpsCoords({ lat: loc.lat, lng: loc.lng, accuracy: loc.accuracy });
      setForm((f) => ({
        ...f,
        city: geo.city || f.city,
        state: geo.state || f.state,
        pincode: geo.pincode || f.pincode,
      }));
      setGpsState("verified");
      appToast.success("Location verified!", `Accuracy: ${Math.round(loc.accuracy)}m`);
    } catch (err) {
      setGpsState("failed");
      setGpsError(err instanceof Error ? err.message : "GPS verification failed");
    }
  }, []);

  // ─── Manual map location handler ───
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
    setGpsError("");
    appToast.success("Location set!", "Pin location confirmed on map");
  }, []);

  // ─── Validation ───
  const validate = useCallback((): boolean => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = "Full name is required";
    if (!form.phone.trim() || !/^[6-9]\d{9}$/.test(form.phone.replace(/\D/g, "")))
      e.phone = "Enter a valid 10-digit phone number";
    if (!form.houseNo.trim()) e.houseNo = "House / Flat number is required";
    if (!form.locality.trim()) e.locality = "Area / Street / Locality is required";
    if (!isValidPincode(form.pincode)) e.pincode = "Enter a valid 6-digit pincode";
    if (!form.city.trim()) e.city = "City is required";
    if (!form.state.trim()) e.state = "State is required";
    // GPS verification is ALWAYS required
    if (!gpsVerified) e.gps = "Please verify your location using GPS before saving this address.";
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form, gpsVerified]);

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

    // Double-check GPS verification at save logic level
    if (!gpsVerified || !gpsCoords) {
      setErrors((prev) => ({ ...prev, gps: "GPS verification is required to save this address." }));
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
                {gpsVerified ? "City, state, pincode auto-filled from GPS. You can adjust manually." :
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

        {/* Manual map link */}
        {!gpsVerified && (
          <div className="mt-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setMapPickerOpen(true)}
              className="text-xs text-[#1A6B3C] hover:underline font-medium flex items-center gap-1"
            >
              <MapIcon className="size-3.5" />
              Set Location Manually on Map
            </button>
          </div>
        )}

        {/* Coordinates display */}
        {gpsVerified && gpsCoords && (
          <div className="mt-2 pt-2 border-t border-green-200 flex items-center gap-2 text-xs text-green-700">
            <MapPin className="size-3" />
            <span className="tabular-nums">{gpsCoords.lat.toFixed(6)}, {gpsCoords.lng.toFixed(6)}</span>
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
          <Label className="text-sm">Pincode *</Label>
          <Input inputMode="numeric" maxLength={6} value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "") })} className="h-11" placeholder="131001" />
          {errors.pincode && <p className="text-xs text-red-500">{errors.pincode}</p>}
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
