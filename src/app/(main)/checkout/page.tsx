"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ChevronRight, Check, Truck, CreditCard, Banknote, MapPin, Loader2, ShoppingCart, Plus, Home, Navigation, ShieldCheck, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/common/Container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { useOrders, type OrderAddress, type PaymentMethod } from "@/contexts/OrdersContext";
import { useAddresses } from "@/contexts/AddressContext";
import { formatINR, isValidPincode } from "@/lib/utils";
import { appToast } from "@/lib/toast";
import { FREE_SHIPPING_THRESHOLD, COD_MAX_AMOUNT } from "@/lib/constants";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

const STEPS = ["Address", "Review", "Payment"] as const;

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, itemCount, clearCart } = useCart();
  const { createOrder } = useOrders();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { addresses, isLoading: addressesLoading } = useAddresses();

  const [step, setStep] = useState(0);
  const [isPlacing, setIsPlacing] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);

  // Address form
  const [address, setAddress] = useState<OrderAddress>({
    fullName: "", phone: "", addressLine1: "", addressLine2: "", landmark: "",
    city: "Sonipat", state: "Haryana", pincode: "",
  });
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});

  // GPS verification for checkout new address
  const [gpsState, setGpsState] = useState<"idle" | "detecting" | "fetching" | "verified" | "failed">("idle");
  const [gpsError, setGpsError] = useState("");
  const gpsVerified = gpsState === "verified";

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("razorpay");
  const [notes, setNotes] = useState("");
  // D1: couponDiscount is 0 until coupon feature is implemented
  const [couponDiscount] = useState(0);

  const shipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 49;
  // GST 18% on (subtotal - discount). Tax-exclusive model.
  const taxableAmount = Math.max(0, subtotal - couponDiscount);
  const tax = Math.round(taxableAmount * 0.18);
  // Total MUST include tax — previously tax was dropped (18% revenue loss)
  const total = taxableAmount + shipping + tax;

  // Auto-select default address on mount
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find((a) => a.isDefault) ?? addresses[0];
      setSelectedAddressId(defaultAddr.id);
      // Populate the address form with the default address
      setAddress({
        fullName: defaultAddr.fullName,
        phone: defaultAddr.phone,
        addressLine1: defaultAddr.houseNo,
        addressLine2: defaultAddr.locality,
        landmark: "",
        city: defaultAddr.city,
        state: defaultAddr.state,
        pincode: defaultAddr.pincode,
      });
    }
  }, [addresses, selectedAddressId]);

  // Handle selecting a saved address — BYPASS FIX: only allow GPS-verified addresses
  const handleSelectAddress = (addrId: string) => {
    const addr = addresses.find((a) => a.id === addrId);
    if (!addr) return;
    // BYPASS FIX: Block selection of non-GPS-verified addresses
    if (!addr.gpsVerified) {
      appToast.warning("Address not verified", "This address doesn't have GPS verification. Please verify it in Address Book or add a new address.");
      return;
    }
    setSelectedAddressId(addrId);
    setShowNewAddressForm(false);
    setAddress({
      fullName: addr.fullName,
      phone: addr.phone,
      addressLine1: addr.houseNo,
      addressLine2: addr.locality,
      landmark: "",
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
    });
    setAddressErrors({});
  };

  // Handle "Add new address" click
  const handleAddNewAddress = () => {
    setSelectedAddressId(null);
    setShowNewAddressForm(true);
    setAddress({
      fullName: "", phone: "", addressLine1: "", addressLine2: "", landmark: "",
      city: "Sonipat", state: "Haryana", pincode: "",
    });
    setAddressErrors({});
    setGpsState("idle");
    setGpsError("");
  };

  // GPS verification handler for checkout new address
  const handleGPS = async () => {
    setGpsState("detecting");
    setGpsError("");
    try {
      if (!navigator.geolocation) {
        setGpsState("failed");
        setGpsError("GPS not supported on this device");
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          if (accuracy > 100) {
            setGpsState("failed");
            setGpsError(`GPS accuracy too low (${Math.round(accuracy)}m). Need within 100m.`);
            return;
          }
          setGpsState("fetching");
          try {
            const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`;
            const res = await fetch(url, {
              headers: { "Accept-Language": "en", "User-Agent": "GrowPlants/1.0 (hello@growplants.in)" },
            });
            if (!res.ok) throw new Error("Reverse geocoding failed");
            const data = await res.json();
            const addr = data.address || {};
            setAddress((prev) => ({
              ...prev,
              city: addr.city || addr.town || addr.village || addr.county || prev.city,
              state: addr.state || prev.state,
              pincode: addr.postcode || prev.pincode,
            }));
            setGpsState("verified");
            appToast.success("Location verified!", `Accuracy: ${Math.round(accuracy)}m`);
          } catch (geoErr) {
            setGpsState("failed");
            setGpsError("Could not fetch address from GPS. Please enter manually.");
          }
        },
        (err) => {
          setGpsState("failed");
          if (err.code === 1) setGpsError("Location permission denied. Please allow location access.");
          else if (err.code === 2) setGpsError("Location unavailable. Check your GPS settings.");
          else if (err.code === 3) setGpsError("Location request timed out. Try again.");
          else setGpsError("Failed to get location.");
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } catch (err) {
      setGpsState("failed");
      setGpsError(err instanceof Error ? err.message : "GPS verification failed");
    }
  };

  // Reset GPS when switching to a saved address
  useEffect(() => {
    if (selectedAddressId) {
      setGpsState("idle");
      setGpsError("");
    }
  }, [selectedAddressId]);

  // BYPASS FIX: Track GPS-verified values — if user edits city/state/pincode after GPS verify, reset
  const gpsVerifiedRef = useRef<{ city: string; state: string; pincode: string } | null>(null);
  useEffect(() => {
    if (gpsState === "verified") {
      gpsVerifiedRef.current = { city: address.city, state: address.state, pincode: address.pincode };
    }
  }, [gpsState]); // intentionally not depending on address to avoid re-trigger

  useEffect(() => {
    // If GPS was verified and user changes city/state/pincode, reset GPS
    if (gpsState === "verified" && gpsVerifiedRef.current) {
      if (
        gpsVerifiedRef.current.city !== address.city ||
        gpsVerifiedRef.current.state !== address.state ||
        gpsVerifiedRef.current.pincode !== address.pincode
      ) {
        setGpsState("idle");
        gpsVerifiedRef.current = null;
      }
    }
  }, [address.city, address.state, address.pincode, gpsState]);

  // C3 FIX: Auth guard — redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login?redirect=/checkout");
    }
  }, [authLoading, isAuthenticated, router]);

  // C2 FIX: COD max amount enforcement
  const codExceedsLimit = paymentMethod === "cod" && total > COD_MAX_AMOUNT;

  // Empty cart guard
  if (itemCount === 0 && !isPlacing) {
    return (
      <Container className="py-16">
        <div className="text-center space-y-4">
          <div className="size-16 rounded-full bg-[#F3F8F1] flex items-center justify-center mx-auto">
            <ShoppingCart className="size-8 text-[#1A6B3C]" aria-hidden="true" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Your cart is empty</h1>
          <p className="text-sm text-slate-500">Add some products before checking out.</p>
          <Button asChild className="bg-[#1A6B3C] hover:bg-[#16A34A] gap-2"><Link href="/shop">Browse Shop</Link></Button>
        </div>
      </Container>
    );
  }

  const validateAddress = () => {
    const errs: Record<string, string> = {};
    if (!address.fullName.trim()) errs.fullName = "Name is required";
    if (!address.phone.trim() || !/^[6-9]\d{9}$/.test(address.phone.replace(/\D/g, ""))) errs.phone = "Enter a valid 10-digit phone number";
    if (!address.addressLine1.trim()) errs.addressLine1 = "Address is required";
    if (!address.city.trim()) errs.city = "City is required";
    if (!address.state.trim()) errs.state = "State is required";
    if (!isValidPincode(address.pincode)) errs.pincode = "Enter a valid 6-digit pincode";
    // BYPASS FIX: Require GPS verification for new addresses (not for saved addresses)
    if (showNewAddressForm && !selectedAddressId && !gpsVerified) {
      errs.gps = "GPS verification is required for new addresses";
    }
    setAddressErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (step === 0 && !validateAddress()) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handlePlaceOrder = async () => {
    // C2 FIX: Enforce COD max amount
    if (paymentMethod === "cod" && total > COD_MAX_AMOUNT) {
      appToast.error("COD limit exceeded", `Cash on Delivery is only available for orders up to ₹${COD_MAX_AMOUNT}. Please choose online payment.`);
      return;
    }
    setIsPlacing(true);
    try {
      const order = await createOrder({
        items: items.map((i) => ({ productId: i.productId, name: i.name, slug: i.slug, price: i.price, image: i.image, quantity: i.quantity, variantId: i.variantId })),
        subtotal, shipping, discount: couponDiscount, tax, total,
        address, paymentMethod, notes: notes.trim() || undefined,
      });

      // Only clear cart + redirect on genuine success (createOrder throws on failure)
      clearCart();
      appToast.success("Order placed!", `Order ${order.orderNumber} confirmed`);
      router.push(`/order-confirmation/${order.id}`);
      // D3: isPlacing is NOT reset — page navigates away, so it's fine
      // (the next page mount will have a fresh state)
    } catch (err) {
      console.error("[checkout] createOrder failed:", err);
      // A7 FIX: Show the actual error message from the API; cart is NOT cleared
      const message = err instanceof Error ? err.message : "Could not place your order. Please try again.";
      appToast.error("Order failed", message);
      setIsPlacing(false);
    }
  };

  return (
    <Container className="py-6 md:py-10">
      {/* Stepper */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={label} className="flex items-center gap-2 animate-scale-in" style={{ animationDelay: `${i * 80}ms` }}>
            <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors", i === step ? "bg-[#1A6B3C] text-white" : i < step ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500")}>
              {i < step ? <Check className="size-3.5" /> : <span className="size-5 rounded-full flex items-center justify-center text-xs">{i + 1}</span>}
              {label}
            </div>
            {i < STEPS.length - 1 && <ChevronRight className="size-4 text-slate-300" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left: Step content */}
        <div className="lg:col-span-2 space-y-4">
          {/* Step 1: Address */}
          {step === 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <h2 className="text-base font-bold text-[#1A6B3C] flex items-center gap-2"><MapPin className="size-5" />Delivery Address</h2>
              <Separator />

              {/* Saved Addresses Section */}
              {!addressesLoading && addresses.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-700">Saved Addresses</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {addresses.map((addr) => (
                      <button
                        key={addr.id}
                        type="button"
                        onClick={() => handleSelectAddress(addr.id)}
                        className={cn(
                          "text-left p-4 rounded-xl border-2 transition-all relative",
                          selectedAddressId === addr.id
                            ? "border-[#1A6B3C] bg-[#F3F8F1] shadow-sm"
                            : "border-slate-200 hover:border-[#1A6B3C]/30 bg-white",
                          !addr.gpsVerified && "opacity-60 cursor-not-allowed hover:border-slate-200"
                        )}
                      >
                        {selectedAddressId === addr.id && (
                          <div className="absolute top-3 right-3 size-5 rounded-full bg-[#1A6B3C] flex items-center justify-center">
                            <Check className="size-3 text-white" strokeWidth={3} />
                          </div>
                        )}
                        <div className="flex items-start gap-2 mb-2">
                          <div className="size-8 rounded-lg bg-[#1A6B3C]/10 flex items-center justify-center shrink-0">
                            <Home className="size-4 text-[#1A6B3C]" />
                          </div>
                          <div className="min-w-0 flex-1 pr-6">
                            <p className="text-sm font-bold text-slate-800 truncate">
                              {addr.fullName}
                              {addr.isDefault && (
                                <span className="ml-2 text-[10px] font-semibold text-[#1A6B3C] bg-[#1A6B3C]/10 px-1.5 py-0.5 rounded-full">
                                  Default
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-slate-500">{addr.label} · {addr.phone}</p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {addr.houseNo}, {addr.locality}, {addr.city}, {addr.state} - {addr.pincode}
                        </p>
                        {addr.gpsVerified ? (
                          <p className="text-[10px] text-green-600 mt-1.5 flex items-center gap-1">
                            <ShieldCheck className="size-2.5" /> GPS Verified
                          </p>
                        ) : (
                          <p className="text-[10px] text-red-500 mt-1.5 flex items-center gap-1">
                            <AlertCircle className="size-2.5" /> Not GPS Verified — tap to fix
                          </p>
                        )}
                      </button>
                    ))}

                    {/* Add New Address Card */}
                    <button
                      type="button"
                      onClick={handleAddNewAddress}
                      className={cn(
                        "p-4 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 min-h-[120px]",
                        showNewAddressForm
                          ? "border-[#1A6B3C] bg-[#F3F8F1]"
                          : "border-slate-300 hover:border-[#1A6B3C]/50 text-slate-500 hover:text-[#1A6B3C]"
                      )}
                    >
                      <Plus className="size-6" />
                      <span className="text-sm font-medium">Add New Address</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Loading state */}
              {addressesLoading && (
                <div className="space-y-2">
                  <div className="h-4 bg-slate-100 rounded animate-pulse w-32" />
                  <div className="h-24 bg-slate-100 rounded animate-pulse" />
                </div>
              )}

              {/* New Address Form (shown when "Add New" clicked OR no saved addresses) */}
              {(showNewAddressForm || addresses.length === 0) && (
                <div className="space-y-3 pt-2">
                  {addresses.length > 0 && (
                    <p className="text-sm font-semibold text-slate-700">Enter New Address</p>
                  )}

                  {/* GPS Verification Button */}
                  <div className="p-3 bg-[#F3F8F1] rounded-lg border border-[#1A6B3C]/10">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {gpsVerified ? (
                          <ShieldCheck className="size-5 text-green-600" />
                        ) : gpsState === "detecting" || gpsState === "fetching" ? (
                          <Loader2 className="size-5 text-[#1A6B3C] animate-spin" />
                        ) : gpsState === "failed" ? (
                          <AlertCircle className="size-5 text-red-500" />
                        ) : (
                          <Navigation className="size-5 text-[#1A6B3C]" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-slate-700">
                            {gpsVerified ? "Location Verified" : gpsState === "detecting" ? "Detecting location..." : gpsState === "fetching" ? "Fetching address..." : "GPS Verification"}
                          </p>
                          <p className="text-xs text-slate-500">
                            {gpsVerified ? "City, state, pincode auto-filled from GPS" : "Verify your delivery location (within 100m accuracy)"}
                          </p>
                        </div>
                      </div>
                      {!gpsVerified && gpsState !== "detecting" && gpsState !== "fetching" && (
                        <Button type="button" size="sm" variant="outline" className="border-[#1A6B3C] text-[#1A6B3C] gap-1.5 animate-pulse-ring" onClick={handleGPS}>
                          <Navigation className="size-3.5" /> Verify
                        </Button>
                      )}
                    </div>
                    {gpsError && <p className="text-xs text-red-500 mt-2">{gpsError}</p>}
                    {addressErrors.gps && !gpsVerified && (
                      <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                        <AlertCircle className="size-3.5 shrink-0" />{addressErrors.gps}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label htmlFor="fullName" className="text-sm">Full Name *</Label><Input id="fullName" value={address.fullName} onChange={(e) => setAddress({ ...address, fullName: e.target.value })} className="h-11" />{addressErrors.fullName && <p className="text-xs text-red-500">{addressErrors.fullName}</p>}</div>
                    {/* Phone field with +91 prefix built-in */}
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-sm">Phone Number *</Label>
                      <div className="flex h-11 rounded-md border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-[#1A6B3C]/20 focus-within:border-[#1A6B3C]">
                        <span className="flex items-center px-3 bg-slate-50 text-sm font-medium text-slate-600 border-r border-slate-200">+91</span>
                        <input
                          id="phone"
                          type="tel"
                          inputMode="numeric"
                          maxLength={10}
                          placeholder="9876543210"
                          value={address.phone}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                            setAddress({ ...address, phone: digits });
                          }}
                          className="flex-1 px-3 text-sm bg-transparent outline-none"
                        />
                      </div>
                      {addressErrors.phone && <p className="text-xs text-red-500">{addressErrors.phone}</p>}
                    </div>
                  </div>
                  <div className="space-y-1.5"><Label htmlFor="addr1" className="text-sm">Address Line 1 *</Label><Input id="addr1" placeholder="House no, Building, Street" value={address.addressLine1} onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })} className="h-11" />{addressErrors.addressLine1 && <p className="text-xs text-red-500">{addressErrors.addressLine1}</p>}</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5"><Label htmlFor="addr2" className="text-sm">Address Line 2</Label><Input id="addr2" value={address.addressLine2} onChange={(e) => setAddress({ ...address, addressLine2: e.target.value })} className="h-11" /></div>
                    <div className="space-y-1.5"><Label htmlFor="landmark" className="text-sm">Landmark</Label><Input id="landmark" placeholder="Near..." value={address.landmark} onChange={(e) => setAddress({ ...address, landmark: e.target.value })} className="h-11" /></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5"><Label htmlFor="city" className="text-sm">City *</Label><Input id="city" value={address.city} onChange={(e) => { setAddress({ ...address, city: e.target.value }); setGpsState("idle"); }} className="h-11" />{addressErrors.city && <p className="text-xs text-red-500">{addressErrors.city}</p>}</div>
                    <div className="space-y-1.5"><Label htmlFor="state" className="text-sm">State *</Label><Input id="state" value={address.state} onChange={(e) => { setAddress({ ...address, state: e.target.value }); setGpsState("idle"); }} className="h-11" />{addressErrors.state && <p className="text-xs text-red-500">{addressErrors.state}</p>}</div>
                    <div className="space-y-1.5"><Label htmlFor="pincode" className="text-sm">Pincode *</Label><Input id="pincode" inputMode="numeric" maxLength={6} placeholder="131001" value={address.pincode} onChange={(e) => { setAddress({ ...address, pincode: e.target.value.replace(/\D/g, "") }); setGpsState("idle"); }} className="h-11" />{addressErrors.pincode && <p className="text-xs text-red-500">{addressErrors.pincode}</p>}</div>
                  </div>
                </div>
              )}

              {/* Link to manage addresses */}
              {addresses.length > 0 && (
                <div className="pt-2">
                  <Link href="/account/addresses" className="text-xs text-[#1A6B3C] hover:underline font-medium">
                    Manage saved addresses →
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Review */}
          {step === 1 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <h2 className="text-base font-bold text-[#1A6B3C]">Review Your Order</h2>
              <Separator />
              {/* Delivery address summary */}
              <div className="p-3 bg-[#F3F8F1] rounded-lg">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Delivering To</p>
                <p className="text-sm font-medium text-slate-800">{address.fullName} · {address.phone}</p>
                <p className="text-sm text-slate-600">{address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ""}, {address.city}, {address.state} - {address.pincode}</p>
              </div>
              {/* Items */}
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <div className="relative size-14 rounded-lg overflow-hidden bg-slate-50 shrink-0">
                      {item.image && <Image src={item.image} alt={item.name} fill sizes="56px" className="object-cover" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 line-clamp-1">{item.name}</p>
                      <p className="text-xs text-slate-500">Qty: {item.quantity} × {formatINR(item.price)}</p>
                    </div>
                    <p className="text-sm font-bold text-[#1A6B3C] tabular-nums">{formatINR(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>
              <Separator />
              {/* Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-sm">Special Instructions (optional)</Label>
                <Textarea id="notes" rows={2} placeholder="Any delivery preferences..." value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
          )}

          {/* Step 3: Payment */}
          {step === 2 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
              <h2 className="text-base font-bold text-[#1A6B3C]">Payment Method</h2>
              <Separator />
              <div className="space-y-3">
                {/* Razorpay */}
                <button onClick={() => setPaymentMethod("razorpay")} className={cn("w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left", paymentMethod === "razorpay" ? "border-[#1A6B3C] bg-[#F3F8F1]" : "border-slate-200 hover:border-slate-300")}>
                  <CreditCard className="size-5 text-[#1A6B3C]" />
                  <div className="flex-1"><p className="text-sm font-semibold text-slate-800">Pay Online</p><p className="text-xs text-slate-500">UPI, Cards, Net Banking, Wallets via Razorpay</p></div>
                  <div className={cn("size-5 rounded-full border-2 flex items-center justify-center", paymentMethod === "razorpay" ? "border-[#1A6B3C] bg-[#1A6B3C]" : "border-slate-300")}>{paymentMethod === "razorpay" && <Check className="size-3 text-white" />}</div>
                </button>
                {/* COD — C2 FIX: disabled when total exceeds COD_MAX_AMOUNT */}
                <button
                  onClick={() => !codExceedsLimit && setPaymentMethod("cod")}
                  disabled={total > COD_MAX_AMOUNT}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left",
                    total > COD_MAX_AMOUNT ? "border-slate-200 opacity-50 cursor-not-allowed" :
                    paymentMethod === "cod" ? "border-[#1A6B3C] bg-[#F3F8F1]" : "border-slate-200 hover:border-slate-300"
                  )}
                >
                  <Banknote className="size-5 text-[#1A6B3C]" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-800">Cash on Delivery</p>
                    <p className="text-xs text-slate-500">
                      {total > COD_MAX_AMOUNT
                        ? `Not available for orders above ₹${COD_MAX_AMOUNT.toLocaleString()}`
                        : "Pay in cash when your order arrives. Available for orders up to ₹5,000."}
                    </p>
                  </div>
                  <div className={cn("size-5 rounded-full border-2 flex items-center justify-center", paymentMethod === "cod" ? "border-[#1A6B3C] bg-[#1A6B3C]" : "border-slate-300")}>{paymentMethod === "cod" && <Check className="size-3 text-white" />}</div>
                </button>
              </div>
              {paymentMethod === "razorpay" && (
                <div className="p-3 bg-blue-50 rounded-lg flex items-center gap-2 text-xs text-blue-700">
                  <Truck className="size-4 shrink-0" /> You will be redirected to Razorpay's secure payment gateway. Your card details are never stored on our servers.
                </div>
              )}
              {paymentMethod === "cod" && (
                <div className="p-3 bg-amber-50 rounded-lg text-xs text-amber-700">Please keep exact change ready. COD orders may take an extra day for delivery confirmation.</div>
              )}
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex items-center gap-3">
            {step > 0 && <Button variant="outline" onClick={() => setStep((s) => s - 1)} className="border-[#1A6B3C] text-[#1A6B3C]">Back</Button>}
            {step < STEPS.length - 1 ? (
              <Button onClick={handleNext} className="bg-[#1A6B3C] hover:bg-[#16A34A] flex-1 gap-2">Continue <ChevronRight className="size-4" /></Button>
            ) : (
              <Button onClick={handlePlaceOrder} disabled={isPlacing} className="bg-[#1A6B3C] hover:bg-[#16A34A] flex-1 gap-2">
                {isPlacing ? <><Loader2 className="size-4 animate-spin" />Placing Order...</> : <>Place Order · {formatINR(total)}</>}
              </Button>
            )}
          </div>
        </div>

        {/* Right: Order summary (sticky) */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <h3 className="text-base font-bold text-[#1A6B3C]">Order Summary</h3>
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-600">Subtotal ({itemCount} items)</span><span className="font-medium text-slate-800 tabular-nums">{formatINR(subtotal)}</span></div>
              {couponDiscount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span className="font-medium tabular-nums">-{formatINR(couponDiscount)}</span></div>}
              <div className="flex justify-between"><span className="text-slate-600">Delivery</span><span className="font-medium text-slate-800 tabular-nums">{shipping === 0 ? "FREE" : formatINR(shipping)}</span></div>
              <div className="flex justify-between text-xs text-slate-400"><span>GST (18%)</span><span className="tabular-nums">{formatINR(tax)}</span></div>
            </div>
            <Separator />
            <div className="flex justify-between items-baseline"><span className="text-base font-bold text-slate-800">Total</span><span className="text-xl font-bold text-[#1A6B3C] tabular-nums">{formatINR(total)}</span></div>
            <div className="flex items-center gap-2 text-xs text-slate-500 pt-2"><Truck className="size-3.5 text-[#1A6B3C]" />{shipping === 0 ? "Free delivery applied!" : `Add ${formatINR(FREE_SHIPPING_THRESHOLD - subtotal)} more for free delivery`}</div>
          </div>
        </div>
      </div>
    </Container>
  );
}
