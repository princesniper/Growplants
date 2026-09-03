/**
 * GrowPlants — Server-Side Product Price Authority
 * ============================================================================
 * CRITICAL SECURITY: This module is the SINGLE source of truth for product
 * prices on the server. The API routes MUST use this to validate client-
 * supplied prices — never trust the client.
 *
 * Reads from the same JSON data files as the client (plants-data.json +
 * pots-data.json), but this module is server-only (no client imports).
 * ============================================================================
 */
import plantsData from "@/data/plants-data.json";
import potsData from "@/data/pots-data.json";

export interface AuthoritativeProduct {
  id: string;
  name: string;
  price: number;          // current selling price (authoritative)
  stock: number | null;   // null = unknown (treat as unlimited for now)
  inStock: boolean;
  productType: "plant" | "pot";
}

/**
 * In-memory index of all products by their ID/slug for O(1) lookup.
 * Built once at module load (server-side).
 *
 * For plants: key is the slug (e.g. "poinsettia-pink-plant")
 * For pots: key is the slug (e.g. "tokyo-high-planter")
 */
const productIndex: Map<string, AuthoritativeProduct> = new Map();

// Index plants
for (const [slug, raw] of Object.entries(plantsData)) {
  const r = raw as Record<string, unknown>;
  const price = typeof r.price === "number" ? r.price : 0;
  const stock = typeof r.stock === "number" ? r.stock : null;
  productIndex.set(slug, {
    id: slug,
    name: String(r.name ?? slug),
    price,
    stock,
    inStock: stock === null ? true : stock > 0,
    productType: "plant",
  });
}

// Index pots
for (const [slug, raw] of Object.entries(potsData)) {
  const r = raw as Record<string, unknown>;
  // Pots have a `prices` object with size-based pricing; use the first/lowest
  const prices = r.prices as Record<string, number> | undefined;
  let price = 0;
  if (prices && typeof prices === "object") {
    const priceValues = Object.values(prices).filter((v) => typeof v === "number" && v > 0);
    if (priceValues.length > 0) {
      price = Math.min(...priceValues); // conservative: use lowest size price
    }
  }
  // Fallback to oldPrice if no prices
  if (price === 0 && typeof r.oldPrice === "number") {
    price = r.oldPrice;
  }
  const stock = typeof r.stock === "number" ? r.stock : null;
  productIndex.set(slug, {
    id: slug,
    name: String(r.name ?? slug),
    price,
    stock,
    inStock: stock === null ? true : stock > 0,
    productType: "pot",
  });
}

/**
 * Get authoritative product data by ID/slug.
 * Returns null if product not found.
 */
export function getAuthoritativeProduct(productId: string): AuthoritativeProduct | null {
  return productIndex.get(productId) ?? null;
}

/**
 * Validate and compute the authoritative price for a cart line item.
 *
 * Returns:
 *   - { valid: true, unitPrice, lineTotal } if product exists and is purchasable
 *   - { valid: false, error } if product doesn't exist, is out of stock, or qty invalid
 *
 * CRITICAL: The returned `unitPrice` is the SERVER-AUTHORITATIVE price,
 * NOT the client-supplied price. The caller MUST use this value.
 */
export function validateLineItem(
  productId: string,
  requestedQuantity: number,
): { valid: true; unitPrice: number; lineTotal: number; product: AuthoritativeProduct }
  | { valid: false; error: string } {

  const product = getAuthoritativeProduct(productId);
  if (!product) {
    return { valid: false, error: `Product not found: ${productId}` };
  }

  if (!product.inStock) {
    return { valid: false, error: `Product out of stock: ${product.name}` };
  }

  // Validate quantity
  if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
    return { valid: false, error: `Invalid quantity for ${product.name}: ${requestedQuantity}` };
  }

  const MAX_QTY = 10; // matches CART_MAX_QUANTITY_PER_ITEM
  if (requestedQuantity > MAX_QTY) {
    return { valid: false, error: `Quantity exceeds max (${MAX_QTY}) for ${product.name}` };
  }

  // Check stock if known
  if (product.stock !== null && requestedQuantity > product.stock) {
    return { valid: false, error: `Insufficient stock for ${product.name}: requested ${requestedQuantity}, available ${product.stock}` };
  }

  const unitPrice = product.price; // SERVER-AUTHORITATIVE
  const lineTotal = unitPrice * requestedQuantity;

  return { valid: true, unitPrice, lineTotal, product };
}

/**
 * Compute the full order totals server-side from validated line items.
 * The client's totals are IGNORED — this is the authoritative calculation.
 *
 * Pricing model: GST removed — prices shown are the final prices.
 * Old orders with `tax > 0` are still displayed with their GST breakdown
 * in order detail pages (backward compat). New orders always have `tax = 0`.
 */
export function computeOrderTotals(
  lineItems: Array<{ unitPrice: number; quantity: number }>,
  options: {
    discount?: number;      // from validated coupon (not client-supplied)
    shippingFee?: number;   // from server logic
  } = {},
): {
  subtotal: number;
  discount: number;
  shippingFee: number;
  tax: number;
  total: number;
} {
  const subtotal = lineItems.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const discount = Math.min(options.discount ?? 0, subtotal); // can't discount more than subtotal
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = 0; // GST removed — prices are inclusive
  const shippingFee = options.shippingFee ?? 0;
  const total = taxableAmount + shippingFee + tax;

  return { subtotal, discount, shippingFee, tax, total };
}

/**
 * Get the total product count (for health checks / debugging).
 */
export function getProductCount(): number {
  return productIndex.size;
}
