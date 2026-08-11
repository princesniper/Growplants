"use client";

/**
 * GrowPlants — Wishlist Context (Firestore-synced)
 * Uses localStorage for guests, Firestore users/{uid}.wishlist for logged-in users.
 * Real-time sync via onSnapshot when user is logged in.
 */
import {
  createContext, useContext, useState, useEffect, useCallback, type ReactNode,
} from "react";
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { firebaseDb, isFirebaseConfigured } from "@/lib/firebase/client";
import { useAuth } from "@/contexts/AuthContext";

interface WishlistContextValue {
  wishlistIds: string[];
  count: number;
  isWishlisted: (productId: string) => boolean;
  toggleWishlist: (productId: string) => void;
  addToWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);
const STORAGE_KEY = "growplants-wishlist";

function loadFromStorage(): string[] {
  if (typeof window === "undefined") return [];
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch (_e) { return []; }
}
function saveToStorage(ids: string[]) {
  if (typeof window !== "undefined") try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ids)); } catch (_e) {}
}

export function WishlistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Real-time Firestore listener when logged in
  useEffect(() => {
    if (user && isFirebaseConfigured && firebaseDb) {
      const userDocRef = doc(firebaseDb, "users", user.id);
      const unsub = onSnapshot(userDocRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data() as any;
          const firestoreWishlist = (data.wishlist ?? []).map((w: any) => w.productId || w);
          setWishlistIds(firestoreWishlist);
          saveToStorage(firestoreWishlist);
        }
        setIsHydrated(true);
      }, () => setIsHydrated(true));
      return () => unsub();
    } else {
      // Guest: load from localStorage
      setWishlistIds(loadFromStorage());
      setIsHydrated(true);
    }
  }, [user, firebaseDb]);

  // Persist to localStorage for guests
  useEffect(() => { if (isHydrated && !user) saveToStorage(wishlistIds); }, [wishlistIds, isHydrated, user]);

  const syncToFirestore = useCallback((ids: string[]) => {
    if (!user || !isFirebaseConfigured || !firebaseDb) return;
    const userDocRef = doc(firebaseDb, "users", user.id);
    const wishlistItems = ids.map((id) => ({ productId: id, addedAt: new Date().toISOString() }));
    updateDoc(userDocRef, { wishlist: wishlistItems }).catch(() => {});
  }, [user]);

  const isWishlisted = useCallback((productId: string) => wishlistIds.includes(productId), [wishlistIds]);

  // B14 FIX: Maximum wishlist size to prevent Firestore document size overflow (1 MiB limit)
  const WISHLIST_MAX_ITEMS = 100;

  const toggleWishlist = useCallback((productId: string) => {
    setWishlistIds((prev) => {
      if (prev.includes(productId)) {
        const newIds = prev.filter((id) => id !== productId);
        syncToFirestore(newIds);
        return newIds;
      }
      if (prev.length >= WISHLIST_MAX_ITEMS) {
        import("@/lib/toast").then(({ appToast }) => appToast.warning("Wishlist full", `Maximum ${WISHLIST_MAX_ITEMS} items allowed`));
        return prev;
      }
      const newIds = [...prev, productId];
      syncToFirestore(newIds);
      return newIds;
    });
  }, [syncToFirestore]);

  const addToWishlist = useCallback((productId: string) => {
    setWishlistIds((prev) => {
      if (prev.includes(productId)) return prev;
      if (prev.length >= WISHLIST_MAX_ITEMS) {
        import("@/lib/toast").then(({ appToast }) => appToast.warning("Wishlist full", `Maximum ${WISHLIST_MAX_ITEMS} items allowed`));
        return prev;
      }
      const newIds = [...prev, productId];
      syncToFirestore(newIds);
      return newIds;
    });
  }, [syncToFirestore]);

  const removeFromWishlist = useCallback((productId: string) => {
    setWishlistIds((prev) => {
      const newIds = prev.filter((id) => id !== productId);
      syncToFirestore(newIds);
      return newIds;
    });
  }, [syncToFirestore]);

  return (
    <WishlistContext.Provider value={{ wishlistIds, count: wishlistIds.length, isWishlisted, toggleWishlist, addToWishlist, removeFromWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within a WishlistProvider");
  return ctx;
}
