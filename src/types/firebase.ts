/**
 * GrowPlants — Firebase Firestore Types
 * Source: 03_database_design.md §2 Firestore Database Schema
 *
 * These match the documents stored under users/{uid} and orders/{orderId}.
 */
import type { PreferredLanguage } from "@/lib/enums";

export interface FirestoreUser {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profileImage: string | null;
  memberSince: import("firebase/firestore").Timestamp | Date | string | import("firebase/firestore").FieldValue;
  preferences: {
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
    };
    darkMode: boolean;
    language: PreferredLanguage;
  };
  addresses: FirestoreAddress[];
  wishlist: FirestoreWishlistItem[];
  cart: FirestoreCartItem[];
}

export interface FirestoreAddress {
  id: string;
  fullName: string;
  phone: string;
  houseNumber: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  isDefault: boolean;
}

export interface FirestoreCartItem {
  id: string;
  productId: string;
  variantId: string | null;
  name: string;
  price: number;
  image: string;
  quantity: number;
  inStock: boolean;
  addedAt: import("firebase/firestore").Timestamp | Date | string;
}

export interface FirestoreWishlistItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  inStock: boolean;
  addedAt: import("firebase/firestore").Timestamp | Date | string;
}

export interface FirestoreOrderProduct {
  id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  type: string;              // "plant" | "pot" | "gardening"
  size: string;              // variant size (e.g. "Small", "Medium")
  status: string;            // item-level status (e.g. "placed", "shipped")
  slug?: string;
  variantId?: string | null;
}

export interface FirestoreOrderAddressDetails {
  house: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  lat: number | null;
  lng: number | null;
  instructions: string;
}

export interface FirestoreOrderStatusEvent {
  status: string;
  timestamp: import("firebase/firestore").Timestamp | Date | string;
  note?: string;
  updatedBy?: string;
}

/**
 * Firestore Order Document — orders/{orderId}
 * Matches the admin panel's structure exactly.
 *
 * Dual status fields (kept in sync):
 *   - status (lowercase): "placed" | "confirmed" | "processing" | "packed" |
 *                         "shipped" | "out_for_delivery" | "delivered" | "cancelled"
 *   - orderStatus (capitalized): "Placed" | "Confirmed" | ... (backward compat)
 */
export interface FirestoreOrder {
  orderId: string;
  userId: string;
  orderPlacedAt: import("firebase/firestore").Timestamp | Date | string;
  /** Formatted display string: "12 Jul 2026, 03:45 PM" */
  orderTime: string;
  paymentMethod: string;                            // "cod" | "online"
  paymentStatus: string;                            // "Pending" | "Paid"
  name: string;                                     // recipient fullName
  phone: string;
  /** Formatted: "Name, house, street, city, state - pincode" */
  address: string;
  addressDetails: FirestoreOrderAddressDetails;
  products: FirestoreOrderProduct[];
  subtotal: number;
  shippingFee: number;
  /** Alias for shippingFee (some admin panels use this field name) */
  shippingCharge?: number;
  discount?: number;
  totalAmount: number;
  orderNumber?: string;
  /** Capitalized — "Placed" | "Confirmed" | ... (backward compat, kept in sync with status) */
  orderStatus: string;
  /** Lowercase — PRIMARY field used by timeline */
  status: string;
  /** Admin notes (editable from admin panel) */
  adminNotes: string;
  /** Audit trail of every status change */
  statusHistory?: FirestoreOrderStatusEvent[];
  /** Optional tax (GST) — not in original spec but kept for compatibility */
  tax?: number;
  /** Optional customer notes (null when not provided — Firestore rejects undefined) */
  notes?: string | null;
}
