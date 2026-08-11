"use client";

/**
 * GrowPlants — Cart Context (Firestore-synced)
 * Uses localStorage for guests, Firestore users/{uid}.cart for logged-in users.
 * Dual-sync: writes to both localStorage (instant) and Firestore (persistence).
 *
 * B1 FIX: On login, fetches Firestore cart and merges with local cart.
 * Prevents empty local cart from overwriting server cart.
 */
import {
  createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode,
} from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { firebaseDb, isFirebaseConfigured } from "@/lib/firebase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  CART_MAX_ITEMS, CART_MAX_QUANTITY_PER_ITEM, FREE_SHIPPING_THRESHOLD,
} from "@/lib/constants";

export interface CartItem {
  id: string;
  productId: string;
  variantId: string | null;
  name: string;
  slug: string;
  price: number;
  image: string;
  quantity: number;
  inStock: boolean;
  addedAt: string;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  isDrawerOpen: boolean;
  isSyncing: boolean;
  freeShippingProgress: { threshold: number; remaining: number; achieved: boolean };
  addItem: (item: Omit<CartItem, "id" | "addedAt">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "growplants-cart";

function loadFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; } catch (_e) { return []; }
}
function saveToStorage(items: CartItem[]) {
  if (typeof window !== "undefined") try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch (_e) {}
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  // B1 FIX: Flag to prevent syncing during initial Firestore load
  const isFirestoreLoading = useRef(false);
  const hasLoadedFromFirestore = useRef(false);

  // Hydrate from localStorage on mount
  useEffect(() => { setItems(loadFromStorage()); setIsHydrated(true); }, []);
  useEffect(() => { if (isHydrated && !isFirestoreLoading.current) saveToStorage(items); }, [items, isHydrated]);

  // B1 FIX: On login, fetch Firestore cart and merge with local
  useEffect(() => {
    if (!user || !isFirebaseConfigured || !firebaseDb || !isHydrated) return;
    if (hasLoadedFromFirestore.current) return; // only once per login
    hasLoadedFromFirestore.current = true;

    isFirestoreLoading.current = true;
    setIsSyncing(true);

    (async () => {
      try {
        const userDocRef = doc(firebaseDb, "users", user.id);
        const snap = await getDoc(userDocRef);
        if (snap.exists()) {
          const data = snap.data() as { cart?: CartItem[] };
          const firestoreCart = data.cart ?? [];

          if (firestoreCart.length > 0) {
            // Merge: local cart + Firestore cart
            // Strategy: dedupe by item.id, use higher quantity
            setItems((prev) => {
              const merged = new Map<string, CartItem>();
              // Add Firestore items first
              for (const item of firestoreCart) {
                merged.set(item.id, item);
              }
              // Merge local items (use higher quantity for duplicates)
              for (const item of prev) {
                const existing = merged.get(item.id);
                if (existing) {
                  merged.set(item.id, {
                    ...existing,
                    quantity: Math.min(CART_MAX_QUANTITY_PER_ITEM, Math.max(existing.quantity, item.quantity)),
                  });
                } else {
                  merged.set(item.id, item);
                }
              }
              const mergedArray = Array.from(merged.values()).slice(0, CART_MAX_ITEMS);
              saveToStorage(mergedArray);
              // Sync merged cart back to Firestore
              try { setDoc(userDocRef, { cart: mergedArray }, { merge: true }); } catch (_e) {}
              return mergedArray;
            });
          }
        }
      } catch (err) {
        console.warn("[Cart] Failed to load Firestore cart:", err);
      } finally {
        isFirestoreLoading.current = false;
        setIsSyncing(false);
      }
    })();
  }, [user, isHydrated]);

  // Reset Firestore loaded flag on logout
  useEffect(() => {
    if (!user) hasLoadedFromFirestore.current = false;
  }, [user]);

  // Sync to Firestore when user is logged in (B1 FIX: use setDoc merge instead of updateDoc)
  const syncToFirestore = useCallback((cartItems: CartItem[]) => {
    if (!user || !isFirebaseConfigured || !firebaseDb) return;
    if (isFirestoreLoading.current) return; // don't sync during initial load
    const userDocRef = doc(firebaseDb, "users", user.id);
    // B1 FIX: Use setDoc with merge: true — works even if user doc doesn't exist yet
    setDoc(userDocRef, { cart: cartItems }, { merge: true }).catch((e) => {
      console.warn("[Cart] Firestore sync failed:", e);
    });
  }, [user]);

  const addItem = useCallback((item: Omit<CartItem, "id" | "addedAt">) => {
    if (!isHydrated) return; // B1 FIX: gate on hydration
    setItems((prev) => {
      const lineId = `${item.productId}${item.variantId ? `-${item.variantId}` : ""}`;
      const existing = prev.find((i) => i.id === lineId);
      let newItems: CartItem[];
      if (existing) {
        const newQty = Math.min(CART_MAX_QUANTITY_PER_ITEM, existing.quantity + item.quantity);
        newItems = prev.map((i) => i.id === lineId ? { ...i, quantity: newQty } : i);
      } else {
        if (prev.length >= CART_MAX_ITEMS) return prev;
        newItems = [...prev, { ...item, id: lineId, addedAt: new Date().toISOString() }];
      }
      syncToFirestore(newItems);
      return newItems;
    });
  }, [syncToFirestore, isHydrated]);

  const removeItem = useCallback((id: string) => {
    if (!isHydrated) return;
    setItems((prev) => {
      const newItems = prev.filter((i) => i.id !== id);
      syncToFirestore(newItems);
      return newItems;
    });
  }, [syncToFirestore, isHydrated]);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (!isHydrated) return;
    setItems((prev) => {
      const newItems = quantity <= 0
        ? prev.filter((i) => i.id !== id)
        : prev.map((i) => i.id === id ? { ...i, quantity: Math.min(CART_MAX_QUANTITY_PER_ITEM, quantity) } : i);
      syncToFirestore(newItems);
      return newItems;
    });
  }, [syncToFirestore, isHydrated]);

  const clearCart = useCallback(() => {
    setItems([]);
    syncToFirestore([]);
  }, [syncToFirestore]);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setIsDrawerOpen((v) => !v), []);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const freeShippingProgress = {
    threshold: FREE_SHIPPING_THRESHOLD,
    remaining: Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal),
    achieved: subtotal >= FREE_SHIPPING_THRESHOLD,
  };

  return (
    <CartContext.Provider value={{ items, itemCount, subtotal, isDrawerOpen, isSyncing, freeShippingProgress, addItem, removeItem, updateQuantity, clearCart, openDrawer, closeDrawer, toggleDrawer }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
