"use client";

/**
 * GrowPlants — MapLocationPicker
 * ============================================================================
 * Interactive map with draggable pin for manual location selection.
 * Uses Leaflet + OpenStreetMap tiles (loaded from CDN, no npm install).
 *
 * Flow:
 *   1. User clicks "Set Location Manually"
 *   2. Map opens in a modal dialog
 *   3. User drags the pin to their exact location
 *   4. User clicks "Confirm Location"
 *   5. Component reverse geocodes the coordinates
 *   6. Calls onLocationSelect({lat, lng, accuracy: 0})
 *   7. Parent sets GPS state to "verified" + fills city/state/pincode
 * ============================================================================
 */
import { useEffect, useRef, useState } from "react";
import { MapPin, Check, X, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Default center: Sonipat, Haryana
const DEFAULT_CENTER: [number, number] = [28.9965, 77.0203];
const DEFAULT_ZOOM = 14;

// Load Leaflet CSS and JS from CDN
let leafletLoaded = false;
let leafletLoadPromise: Promise<void> | null = null;

function loadLeaflet(): Promise<void> {
  if (leafletLoaded) return Promise.resolve();
  if (leafletLoadPromise) return leafletLoadPromise;

  leafletLoadPromise = new Promise<void>((resolve, reject) => {
    // Load CSS
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    // Load JS
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

interface MapLocationPickerProps {
  open: boolean;
  onClose: () => void;
  onLocationSelect: (location: { lat: number; lng: number; accuracy: number; city?: string; state?: string; pincode?: string }) => void;
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
  const markerRef = useRef<any>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number }>(
    initialLocation ?? { lat: DEFAULT_CENTER[0], lng: DEFAULT_CENTER[1] }
  );
  const [isConfirming, setIsConfirming] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState("");

  // Initialize map when dialog opens
  useEffect(() => {
    if (!open || !mapRef.current) return;

    let cancelled = false;

    loadLeaflet()
      .then(() => {
        if (cancelled || !mapRef.current) return;
        const L = (window as any).L;

        // Initialize map
        const center: [number, number] = initialLocation
          ? [initialLocation.lat, initialLocation.lng]
          : DEFAULT_CENTER;

        mapInstance.current = L.map(mapRef.current, {
          center,
          zoom: DEFAULT_ZOOM,
          zoomControl: true,
          scrollWheelZoom: true,
        });

        // Add OpenStreetMap tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(mapInstance.current);

        // Add draggable marker
        markerRef.current = L.marker(center, {
          draggable: true,
          title: "Drag me to your location",
        }).addTo(mapInstance.current);

        // Update coords on marker drag
        markerRef.current.on("dragend", () => {
          const pos = markerRef.current.getLatLng();
          setCoords({ lat: pos.lat, lng: pos.lng });
          setError("");
        });

        // Also update marker position on map click
        mapInstance.current.on("click", (e: any) => {
          markerRef.current.setLatLng(e.latlng);
          setCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
          setError("");
        });

        // Fix map size after render
        setTimeout(() => {
          if (mapInstance.current && !cancelled) {
            mapInstance.current.invalidateSize();
          }
        }, 200);
      })
      .catch((err) => {
        setError("Failed to load map. Please check your internet connection.");
        console.error("[MapPicker] Leaflet load error:", err);
      });

    return () => {
      cancelled = true;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markerRef.current = null;
      }
    };
  }, [open, initialLocation]);

  // Handle search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setError("");
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1&countrycodes=in`;
      const res = await fetch(url, {
        headers: { "Accept-Language": "en", "User-Agent": "GrowPlants/1.0 (hello@growplants.in)" },
      });
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        const L = (window as any).L;
        if (mapInstance.current && markerRef.current) {
          mapInstance.current.setView([lat, lng], 16);
          markerRef.current.setLatLng([lat, lng]);
          setCoords({ lat, lng });
        }
      } else {
        setError("Location not found. Try a different search term.");
      }
    } catch (err) {
      setError("Search failed. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  // Handle confirm
  const handleConfirm = async () => {
    setIsConfirming(true);
    setError("");
    try {
      // Reverse geocode to verify the location is valid
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lng}&addressdetails=1`;
      const res = await fetch(url, {
        headers: { "Accept-Language": "en", "User-Agent": "GrowPlants/1.0 (hello@growplants.in)" },
      });
      if (!res.ok) throw new Error("Reverse geocoding failed");
      const data = await res.json();

      // Call parent callback with location + reverse geocoded data
      onLocationSelect({
        lat: coords.lat,
        lng: coords.lng,
        accuracy: 0, // manual selection = perfect accuracy
        city: data.address?.city || data.address?.town || data.address?.village || data.address?.county || "",
        state: data.address?.state || "",
        pincode: data.address?.postcode || "",
      });
      onClose();
    } catch (err) {
      setError("Could not verify location. Please try again.");
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden gap-0">
        <DialogHeader className="p-4 border-b border-slate-200 bg-[#F3F8F1]">
          <DialogTitle className="flex items-center gap-2 text-[#1A6B3C]">
            <MapPin className="size-5" />
            Set Your Location on Map
          </DialogTitle>
          <p className="text-xs text-slate-500 mt-1">
            Drag the pin to your exact delivery location, or search for an address.
          </p>
        </DialogHeader>

        {/* Search bar */}
        <div className="p-3 border-b border-slate-100 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search for your area, street, or landmark..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9 h-10"
            />
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-[#1A6B3C] text-[#1A6B3C] gap-1.5"
            onClick={handleSearch}
            disabled={isSearching || !searchQuery.trim()}
          >
            {isSearching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            Search
          </Button>
        </div>

        {/* Map container */}
        <div
          ref={mapRef}
          className="w-full"
          style={{ height: "400px", background: "#e5e7eb" }}
        />

        {/* Coordinate display + confirm */}
        <div className="p-4 border-t border-slate-200 bg-white space-y-3">
          {/* Coordinates */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-lg bg-[#F3F8F1] flex items-center justify-center">
                <MapPin className="size-4 text-[#1A6B3C]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-700">Selected Location</p>
                <p className="text-xs text-slate-500 tabular-nums">
                  {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <MapPin className="size-3" />
              <span>Drag pin to adjust</span>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-red-500 flex items-center gap-1">
              <X className="size-3" /> {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 border-slate-300 text-slate-600"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-[#1A6B3C] hover:bg-[#16A34A] gap-2"
              onClick={handleConfirm}
              disabled={isConfirming}
            >
              {isConfirming ? (
                <><Loader2 className="size-4 animate-spin" /> Verifying...</>
              ) : (
                <><Check className="size-4" /> Confirm Location</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
