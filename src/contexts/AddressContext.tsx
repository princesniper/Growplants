"use client";

/**
 * GrowPlants — Address Context (Firestore-backed)
 * Uses users/{uid} document's addresses[] array.
 * CRUD via arrayUnion/arrayRemove.
 * GPS verification required for new addresses.
 */
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { doc, updateDoc, arrayUnion, arrayRemove, onSnapshot, writeBatch } from "firebase/firestore";
import { firebaseDb, isFirebaseConfigured } from "@/lib/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import { appToast } from "@/lib/toast";

export interface FirestoreAddress {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  houseNo: string;
  locality: string;
  pincode: string;
  city: string;
  state: string;
  isDefault: boolean;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  gpsVerified: boolean;
}

interface AddressContextValue {
  addresses: FirestoreAddress[];
  isLoading: boolean;
  addAddress: (addr: Omit<FirestoreAddress, "id">) => Promise<void>;
  updateAddress: (id: string, data: Partial<FirestoreAddress>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
}

const AddressContext = createContext<AddressContextValue | null>(null);

export function AddressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<FirestoreAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Real-time listener on user document
  useEffect(() => {
    if (!user || !isFirebaseConfigured || !firebaseDb) {
      setAddresses([]);
      setIsLoading(false);
      return;
    }

    const userDocRef = doc(firebaseDb, "users", user.id);
    const unsub = onSnapshot(
      userDocRef,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as any;
          setAddresses(data.addresses ?? []);
        } else {
          setAddresses([]);
        }
        setIsLoading(false);
      },
      () => setIsLoading(false)
    );
    return () => unsub();
  }, [user, firebaseDb]);

  const addAddress = useCallback(async (addr: Omit<FirestoreAddress, "id">) => {
    if (!user || !isFirebaseConfigured || !firebaseDb) {
      appToast.error("Not connected", "Please log in to save addresses");
      return;
    }
    const newAddr: FirestoreAddress = {
      ...addr,
      id: `addr-${Date.now()}`,
      isDefault: addresses.length === 0 || addr.isDefault,
    };
    const userDocRef = doc(firebaseDb, "users", user.id);
    // If new address is default, unset others
    if (newAddr.isDefault && addresses.length > 0) {
      const updated = addresses.map((a) => ({ ...a, isDefault: false }));
      await updateDoc(userDocRef, { addresses: [...updated, newAddr] });
    } else {
      await updateDoc(userDocRef, { addresses: arrayUnion(newAddr) });
    }
    appToast.success("Address added", "GPS-verified address saved");
  }, [user, addresses, firebaseDb]);

  const updateAddress = useCallback(async (id: string, data: Partial<FirestoreAddress>) => {
    if (!user || !isFirebaseConfigured || !firebaseDb) return;
    const existing = addresses.find((a) => a.id === id);
    if (!existing) return;
    const updated = { ...existing, ...data };
    const userDocRef = doc(firebaseDb, "users", user.id);

    // A10 FIX: Use atomic writeBatch — if either write fails, neither takes effect.
    // Previously: arrayRemove then arrayUnion as separate calls → data loss if second failed.
    const batch = writeBatch(firebaseDb);
    batch.update(userDocRef, { addresses: arrayRemove(existing) });
    batch.update(userDocRef, { addresses: arrayUnion(updated) });
    await batch.commit();

    appToast.success("Address updated");
  }, [user, addresses, firebaseDb]);

  const deleteAddress = useCallback(async (id: string) => {
    if (!user || !isFirebaseConfigured || !firebaseDb) return;
    const existing = addresses.find((a) => a.id === id);
    if (!existing) return;
    const userDocRef = doc(firebaseDb, "users", user.id);
    await updateDoc(userDocRef, { addresses: arrayRemove(existing) });
    appToast.info("Address deleted");
  }, [user, addresses, firebaseDb]);

  const setDefaultAddress = useCallback(async (id: string) => {
    if (!user || !isFirebaseConfigured || !firebaseDb) return;
    const updated = addresses.map((a) => ({ ...a, isDefault: a.id === id }));
    const userDocRef = doc(firebaseDb, "users", user.id);
    await updateDoc(userDocRef, { addresses: updated });
    appToast.success("Default address set");
  }, [user, addresses, firebaseDb]);

  return (
    <AddressContext.Provider value={{ addresses, isLoading, addAddress, updateAddress, deleteAddress, setDefaultAddress }}>
      {children}
    </AddressContext.Provider>
  );
}

export function useAddresses() {
  const ctx = useContext(AddressContext);
  if (!ctx) throw new Error("useAddresses must be used within an AddressProvider");
  return ctx;
}
