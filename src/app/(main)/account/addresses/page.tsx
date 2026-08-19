"use client";

import { useState } from "react";
import { Plus, MapPin, Edit2, Trash2, ShieldCheck, AlertCircle } from "lucide-react";
import { Container } from "@/components/common/Container";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAddresses, type FirestoreAddress } from "@/contexts/AddressContext";
import { MapLocationPicker } from "@/components/common/MapLocationPicker";

function AddressCardSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="pt-2">
        <Skeleton className="h-7 w-28 rounded-lg" />
      </div>
    </div>
  );
}

export default function AddressesPage() {
  const { addresses, isLoading, addAddress, updateAddress, deleteAddress, setDefaultAddress } = useAddresses();
  const [showPicker, setShowPicker] = useState(false);
  const [editing, setEditing] = useState<FirestoreAddress | null>(null);

  const handleSave = async (data: {
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
  }) => {
    const addrData: Omit<FirestoreAddress, "id"> = {
      label: data.label,
      fullName: data.fullName,
      phone: data.phone,
      houseNo: data.houseNo,
      locality: data.locality,
      pincode: data.pincode,
      city: data.city,
      state: data.state,
      isDefault: data.isDefault,
      latitude: data.latitude,
      longitude: data.longitude,
      accuracy: data.accuracy,
      // Backward-compat alias
      gpsVerified: data.gpsVerified,
      // New canonical location fields
      locationVerified: data.locationVerified,
      locationSource: data.locationSource,
      locationAccuracy: data.locationAccuracy,
    };
    if (editing) { await updateAddress(editing.id, addrData); }
    else { await addAddress(addrData); }
    setShowPicker(false);
    setEditing(null);
  };

  const handleEdit = (a: FirestoreAddress) => {
    setEditing(a);
    setShowPicker(true);
  };
  const handleAdd = () => {
    setEditing(null);
    setShowPicker(true);
  };

  return (
    <Container className="py-6 md:py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1A6B3C]">My Addresses</h1>
          <p className="text-sm text-slate-500 mt-1">{addresses.length} saved {addresses.length === 1 ? "address" : "addresses"}</p>
        </div>
        {!showPicker && (
          <Button
            onClick={handleAdd}
            className="bg-[#1A6B3C] hover:bg-[#16A34A] gap-2"
          >
            <Plus className="size-4" />Add Address
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Array.from({ length: 3 }).map((_, i) => <AddressCardSkeleton key={i} />)}
        </div>
      ) : addresses.length === 0 && !showPicker ? (
        <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
          <div className="size-16 rounded-full bg-[#F3F8F1] flex items-center justify-center">
            <MapPin className="size-8 text-[#1A6B3C]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">No saved addresses</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-md">
              Add your first delivery address. Location verification is required.
            </p>
          </div>
          <Button onClick={handleAdd} className="bg-[#1A6B3C] hover:bg-[#16A34A] gap-2">
            <Plus className="size-4" />Add First Address
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {addresses.map((a) => (
            <div
              key={a.id}
              className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-[#1A6B3C] bg-[#F0FAF4] px-2 py-0.5 rounded-full">
                    {a.label}
                  </span>
                  {a.isDefault && (
                    <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                      Default
                    </span>
                  )}
                  {a.locationVerified || a.gpsVerified ? (
                    <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      <ShieldCheck className="size-3" />
                      Verified
                      {a.locationSource && (
                        <span className="ml-0.5 text-[10px] opacity-75">
                          · {a.locationSource === "gps" ? "GPS" : "MAP"}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      <AlertCircle className="size-3" />Not Verified
                    </span>
                  )}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(a)} className="p-1.5 text-slate-400 hover:text-[#1A6B3C]" aria-label="Edit">
                    <Edit2 className="size-3.5" />
                  </button>
                  <button
                    onClick={() => { if (window.confirm("Delete this address? This cannot be undone.")) deleteAddress(a.id); }}
                    className="p-1.5 text-slate-400 hover:text-red-500"
                    aria-label="Delete"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-sm font-semibold text-slate-800">{a.fullName}</p>
              <p className="text-xs text-slate-600">{a.houseNo}, {a.locality}</p>
              <p className="text-xs text-slate-600">{a.city}, {a.state} - {a.pincode}</p>
              <p className="text-xs text-slate-500 mt-1">📞 {a.phone}</p>
              <div className="flex gap-2 mt-3">
                {!a.isDefault && (
                  <button
                    onClick={() => setDefaultAddress(a.id)}
                    className="text-xs font-medium text-[#1A6B3C] hover:underline"
                  >
                    Set as default
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ─── Map Location Picker (full-screen modal) ─── */}
      <MapLocationPicker
        open={showPicker}
        onClose={() => { setShowPicker(false); setEditing(null); }}
        onSave={handleSave}
        initial={editing ? {
          label: editing.label,
          fullName: editing.fullName,
          phone: editing.phone,
          houseNo: editing.houseNo,
          floor: "",
          locality: editing.locality,
          landmark: "",
          city: editing.city,
          state: editing.state,
          pincode: editing.pincode,
          latitude: editing.latitude,
          longitude: editing.longitude,
          accuracy: editing.accuracy,
          locationAccuracy: editing.locationAccuracy,
          locationVerified: editing.locationVerified,
          gpsVerified: editing.gpsVerified,
          isDefault: editing.isDefault,
        } : null}
      />
    </Container>
  );
}
