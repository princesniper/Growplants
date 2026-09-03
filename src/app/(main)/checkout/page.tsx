"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  ChevronRight, Check, Truck, CreditCard, Banknote, MapPin, Loader2,
  ShoppingCart, Plus, Home, Navigation, ShieldCheck, AlertCircle,
  Map as MapIcon, Calendar, Clock, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/common/Container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { useOrders, type OrderAddress, type PaymentMethod } from "@/contexts/OrdersContext";
import { useBookings } from "@/contexts/BookingsContext";
import { useAddresses } from "@/contexts/AddressContext";
import { formatINR, isValidPincode, isValidIndianPhone } from "@/lib/utils";
import { appToast } from "@/lib/toast";
import { FREE_SHIPPING_THRESHOLD, COD_MAX_AMOUNT } from "@/lib/constants";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { MapLocationPicker } from "@/components/common/MapLocationPicker";
import { getServiceBySlug, PROVIDERS } from "@/data/services-data";

const PENDING_BOOKING_KEY = "growplants-pending-booking";

interface PendingBooking {
  serviceSlug: string;
  date: string;
  timeSlot: string;
  providerId: string | null;
  notes: string;
}

const STEPS = ["Address", "Review", "Payment"] as const;

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ─── Mode detection: "order" (default) or "booking" ───
  const mode = (searchParams.get("mode") as "order" | "booking") ?? "order";

  const { items, subtotal, itemCount, clearCart } = useCart();
  const { createOrder } = useOrders();
  const { createBooking } = useBookings();
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { addresses, isLoading: addressesLoading, addAddress } = useAddresses();

  // ─── Booking mode state ───
  const [pendingBooking, setPendingBooking] = useState<PendingBooking | null>(null);
  const [bookingService, setBookingService] = useState<ReturnType<typeof getServiceBySlug> | null>(null);
  const [bookingProvider, setBookingProvider] = useState<typeof PROVIDERS[0] | null>(null);

  useEffect(() => {
    if (mode !== "booking") return;
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(PENDING_BOOKING_KEY);
      if (!raw) {
        appToast.error("No pending booking", "Please select a service and time slot first.");
        router.push("/services");
        return;
      }
      const parsed = JSON.parse(raw) as PendingBooking;
      setPendingBooking(parsed);
      const svc = getServiceBySlug(parsed.serviceSlug);
      if (!svc) {
        appToast.error("Service not found", "The service you selected is no longer available.");
        router.push("/services");
        return;
      }
      setBookingService(svc);
      if (parsed.providerId) {
        const p = PROVIDERS.find((p) => p.id === parsed.providerId);
        if (p) setBookingProvider(p);
      }
    } catch (err) {
      appToast.error("Invalid booking data", "Please try selecting your service again.");
      router.push("/services");
    }
  }, [mode, router]);

  // ─── Compute totals based on mode ───
  // Order mode: subtotal + shipping (GST removed — prices are inclusive)
  // Booking mode: only the service price (no shipping/tax for services)
  const isBookingMode = mode === "booking" && bookingService && pendingBooking;

  const orderSubtotal = isBookingMode
    ? (bookingService!.pricingType === "quote_based" ? 0 : bookingService!.priceFrom)
    : subtotal;

  const orderShipping = isBookingMode
    ? 0  // services have no delivery fee
    : (subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 49);

  const orderTax = 0; // GST removed — prices are inclusive

  const total = isBookingMode
    ? orderSubtotal
    : Math.max(0, subtotal - 0) + orderShipping + orderTax;

  // ─── UI state ───
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
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const gpsVerified = gpsState === "verified";
  const [mapPickerOpen, setMapPickerOpen] = useState(false);

  // Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("razorpay");
  const [notes, setNotes] = useState(() => isBookingMode ? (pendingBooking?.notes ?? "") : "");
  // D1: couponDiscount is 0 until coupon feature is implemented
  const [couponDiscount] = useState(0);

  const shipping = orderShipping;
  const tax = orderTax;

  // Auto-select default address on mount
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find((a) => a.isDefault) ?? addresses[0];
      const isVerified =
        Boolean(defaultAddr.locationVerified) || Boolean(defaultAddr.gpsVerified);
      const hasCoords =
        defaultAddr.latitude != null && defaultAddr.longitude != null;
      if (!isVerified || !hasCoords) {
        return;
      }
      setSelectedAddressId(defaultAddr.id);
      setAddress({
        fullName: defaultAddr.fullName,
        phone: defaultAddr.phone,
        addressLine1: defaultAddr.houseNo,
        addressLine2: defaultAddr.locality,
        landmark: "",
        city: defaultAddr.city,
        state: defaultAddr.state,
        pincode: defaultAddr.pincode,
        latitude: defaultAddr.latitude,
        longitude: defaultAddr.longitude,
      });
      setGpsCoords({
        lat: defaultAddr.latitude!,
        lng: defaultAddr.longitude!,
        accuracy: defaultAddr.accuracy ?? defaultAddr.locationAccuracy ?? 0,
      });
      setGpsState("verified");
      setGpsError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addresses.length]);

  // Handle selecting a saved address
  const handleSelectAddress = (addrId: string) => {
    const addr = addresses.find((a) => a.id === addrId);
    if (!addr) return;
    const isVerified =
      Boolean(addr.locationVerified) || Boolean(addr.gpsVerified);
    const hasCoords = addr.latitude != null && addr.longitude != null;
    if (!isVerified || !hasCoords) {
      appToast.warning(
        "Address not verified",
        "This address doesn't have location verification. Please verify it in Address Book or add a new address."
      );
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
      latitude: addr.latitude,
      longitude: addr.longitude,
    });
    setGpsCoords({
      lat: addr.latitude!,
      lng: addr.longitude!,
      accuracy: addr.accuracy ?? addr.locationAccuracy ?? 0,
    });
    setGpsState("verified");
    setGpsError("");
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

  const codExceedsLimit = total > COD_MAX_AMOUNT;

  const validateAddress = () => {
    const errs: Record<string, string> = {};
    if (!address.fullName.trim()) errs.fullName = "Name is required";
    if (!address.phone.trim() || !isValidIndianPhone(address.phone))
      errs.phone = "Enter a valid 10-digit phone number";
    if (!address.addressLine1.trim()) errs.addressLine1 = "Address is required";
    if (!address.city.trim()) errs.city = "City is required";
    if (!address.state.trim()) errs.state = "State is required";
    if (!isValidPincode(address.pincode)) errs.pincode = "Enter a valid 6-digit pincode";
    if (showNewAddressForm && !selectedAddressId && !gpsVerified) {
      errs.gps = "GPS verification is required for new addresses";
    }
    if (
      address.latitude === null || address.latitude === undefined ||
      address.longitude === null || address.longitude === undefined
    ) {
      if (!errs.gps) {
        errs.gps = "Location verification missing. Please re-select or re-verify your address.";
      }
    }
    setAddressErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (step === 0 && !validateAddress()) return;
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  // ─── Place Order OR Confirm Booking (mode-aware) ───
  const handlePlaceOrder = async () => {
    if (paymentMethod === "cod" && total > COD_MAX_AMOUNT) {
      appToast.error("COD limit exceeded", `Cash on Delivery is only available for orders up to ₹${COD_MAX_AMOUNT}. Please choose online payment.`);
      return;
    }

    // ─── Booking mode ───
    if (isBookingMode && bookingService && pendingBooking) {
      setIsPlacing(true);
      try {
        await new Promise((r) => setTimeout(r, 500)); // simulate async
        const booking = createBooking({
          service: {
            serviceId: bookingService.id,
            serviceName: bookingService.name,
            serviceSlug: bookingService.slug,
            providerId: pendingBooking.providerId,
            providerName: bookingProvider?.name ?? null,
            priceFrom: bookingService.priceFrom,
            pricingType: bookingService.pricingType,
            priceUnit: bookingService.priceUnit,
            image: bookingService.image,
          },
          address: {
            fullName: address.fullName,
            phone: address.phone,
            addressLine1: address.addressLine1,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
          },
          date: pendingBooking.date,
          timeSlot: pendingBooking.timeSlot,
          notes: notes.trim() || undefined,
          // Cast: orders' PaymentMethod is wider; bookings only accept "razorpay" | "cod"
          paymentMethod: (paymentMethod === "cod" ? "cod" : "razorpay") as import("@/contexts/BookingsContext").PaymentMethod,
        });
        sessionStorage.removeItem(PENDING_BOOKING_KEY);
        appToast.success("Booking confirmed!", `Booking ${booking.bookingNumber} placed`);
        router.push(`/account/bookings/${booking.id}`);
      } catch (err) {
        console.error("[checkout] createBooking failed:", err);
        const message = err instanceof Error ? err.message : "Could not place your booking. Please try again.";
        appToast.error("Booking failed", message);
        setIsPlacing(false);
      }
      return;
    }

    // ─── Order mode (existing logic) ───
    const validItems = items.filter((i) => typeof i.productId === "string" && i.productId.trim() !== "");
    if (validItems.length === 0) {
      appToast.error(
        "Cart has invalid items",
        "Some items in your cart are missing product info. Please clear your cart and add items again."
      );
      return;
    }
    if (validItems.length !== items.length) {
      console.warn(
        `[checkout] Filtered out ${items.length - validItems.length} invalid cart item(s) before sending to API.`
      );
    }

    setIsPlacing(true);
    try {
      const order = await createOrder({
        items: validItems.map((i) => ({ productId: i.productId, name: i.name, slug: i.slug, price: i.price, image: i.image, quantity: i.quantity, variantId: i.variantId })),
        subtotal, shipping, discount: couponDiscount, tax, total,
        address, paymentMethod, notes: notes.trim() || undefined,
      });
      clearCart();
      appToast.success("Order placed!", `Order ${order.orderNumber} confirmed`);
      router.push(`/order-confirmation/${order.id}`);
    } catch (err) {
      console.error("[checkout] createOrder failed:", err);
      const message = err instanceof Error ? err.message : "Could not place your order. Please try again.";
      appToast.error("Order failed", message);
      setIsPlacing(false);
    }
  };

  // ─── Empty-cart guard for order mode ───
  if (mode === "order" && itemCount === 0 && !authLoading) {
    return (
      <Container className="py-16 text-center">
        <div className="size-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
          <ShoppingCart className="size-8 text-slate-400" />
        </div>
        <h1 className="text-xl font-bold text-slate-800 mb-2">Your cart is empty</h1>
        <p className="text-sm text-slate-500 mb-6">Add some plants to your cart before checking out.</p>
        <Button asChild className="bg-[#1A6B3C] hover:bg-[#16A34A] gap-2">
          <Link href="/shop">Browse Shop</Link>
        </Button>
      </Container>
    );
  }

  // ─── Loading state for booking mode (waiting for sessionStorage) ───
  if (mode === "booking" && !bookingService) {
    return (
      <Container className="py-16 text-center">
        <Loader2 className="size-8 animate-spin text-[#1A6B3C] mx-auto" />
        <p className="text-sm text-slate-500 mt-3">Loading booking details…</p>
      </Container>
    );
  }

  // ─── Auth guard ───
  if (!authLoading && !isAuthenticated) {
    return (
      <Container className="py-16 text-center">
        <h1 className="text-xl font-bold text-slate-800 mb-2">Please log in to continue</h1>
        <p className="text-sm text-slate-500 mb-6">You need an account to place an order.</p>
        <Button asChild className="bg-[#1A6B3C] hover:bg-[#16A34A] gap-2">
          <Link href="/login?redirect=/checkout">Log In</Link>
        </Button>
      </Container>
    );
  }

  // ─── Compute display labels ───
  const pageTitle = isBookingMode ? "Booking Checkout" : "Checkout";
  const summaryTitle = isBookingMode ? "Booking Summary" : "Order Summary";
  const placeButtonLabel = isBookingMode
    ? "Confirm Booking"
    : `Place Order · ${formatINR(total)}`;
  const placeButtonLoading = isBookingMode ? "Confirming…" : "Placing Order...";

  // Booking price label
  const bookingPriceLabel = bookingService
    ? bookingService.pricingType === "quote_based"
      ? "Custom Quote"
      : formatINR(bookingService.priceFrom) + (bookingService.priceUnit ? ` / ${bookingService.priceUnit}` : "")
    : "";

  return (
    <Container className="py-6 md:py-10">
      {/* Breadcrumb for booking mode */}
      {isBookingMode && bookingService && (
        <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
          <Link href="/" className="hover:text-[#1A6B3C]">Home</Link>
          <ChevronRight className="size-3" />
          <Link href="/services" className="hover:text-[#1A6B3C]">Services</Link>
          <ChevronRight className="size-3" />
          <Link href={`/services/${bookingService.slug}`} className="hover:text-[#1A6B3C] truncate max-w-[120px]">{bookingService.name}</Link>
          <ChevronRight className="size-3" />
          <span className="text-slate-800 font-semibold">Checkout</span>
        </nav>
      )}

      <h1 className="text-2xl font-bold text-[#1A6B3C] mb-1">{pageTitle}</h1>
      <p className="text-sm text-slate-500 mb-6">
        {isBookingMode
          ? "Confirm your address and payment method to complete the booking."
          : "Confirm your address and payment method to place your order."}
      </p>

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

          {/* ─── Booking mode: Service Summary card (always visible at top) ─── */}
          {isBookingMode && bookingService && pendingBooking && (
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Calendar className="size-4 text-[#1A6B3C]" />
                Service Summary
              </h2>
              <div className="flex gap-3">
                <div className="relative size-16 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                  <Image src={bookingService.image} alt={bookingService.name} fill sizes="64px" className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-800">{bookingService.name}</p>
                  <p className="text-xs text-slate-500">{bookingService.category} · {bookingService.duration}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-600 flex-wrap">
                    <span className="flex items-center gap-1"><Calendar className="size-3" />{pendingBooking.date}</span>
                    <span className="flex items-center gap-1"><Clock className="size-3" />{pendingBooking.timeSlot}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-[#1A6B3C]">{bookingPriceLabel}</p>
                </div>
              </div>
              {bookingProvider && (
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <div className="relative size-8 rounded-full overflow-hidden bg-slate-100 shrink-0">
                    <Image src={bookingProvider.avatarImage} alt={bookingProvider.name} fill sizes="32px" className="object-cover" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-700">{bookingProvider.name}</p>
                    <p className="text-[10px] text-slate-500">{bookingProvider.rating.toFixed(1)}★ · {bookingProvider.experienceYears} yrs exp</p>
                  </div>
                </div>
              )}
              <div className="mt-3">
                <Link
                  href={`/services/${bookingService.slug}`}
                  className="text-xs text-[#1A6B3C] hover:underline font-medium flex items-center gap-1"
                >
                  <ChevronRight className="size-3 rotate-180" /> Change service details
                </Link>
              </div>
            </div>
          )}

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
                    {addresses.map((addr) => {
                      const isVerified = Boolean(addr.locationVerified || addr.gpsVerified);
                      return (
                        <button
                          key={addr.id}
                          type="button"
                          onClick={() => handleSelectAddress(addr.id)}
                          className={cn(
                            "text-left p-4 rounded-xl border-2 transition-all relative",
                            selectedAddressId === addr.id
                              ? "border-[#1A6B3C] bg-[#F3F8F1] shadow-sm"
                              : "border-slate-200 hover:border-[#1A6B3C]/30 bg-white",
                            !isVerified && "opacity-60 cursor-not-allowed hover:border-slate-200"
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
                          {isVerified ? (
                            <p className="text-[10px] text-green-600 mt-1.5 flex items-center gap-1">
                              <ShieldCheck className="size-2.5" /> Verified
                            </p>
                          ) : (
                            <p className="text-[10px] text-red-500 mt-1.5 flex items-center gap-1">
                              <AlertCircle className="size-2.5" /> Not Verified — tap to fix
                            </p>
                          )}
                        </button>
                      );
                    })}

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

              {/* New Address Form — opens the full MapLocationPicker */}
              {(showNewAddressForm || addresses.length === 0) && (
                <div className="p-4 rounded-xl border-2 border-dashed border-[#1A6B3C] bg-[#F3F8F1] flex flex-col items-center justify-center gap-3 min-h-[160px] text-center">
                  <MapPin className="size-8 text-[#1A6B3C]" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Add a new delivery address</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Open the map picker to verify your delivery location and fill in address details.
                    </p>
                  </div>
                  <Button
                    onClick={() => setMapPickerOpen(true)}
                    className="bg-[#1A6B3C] hover:bg-[#16A34A] gap-2"
                  >
                    <MapPin className="size-4" />Open Location Picker
                  </Button>
                </div>
              )}

              {/* Selected address display */}
              {selectedAddressId && (
                <div className="p-3 bg-[#F3F8F1] rounded-lg flex items-start gap-3">
                  <Check className="size-5 text-[#1A6B3C] shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{address.fullName} · {address.phone}</p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ""}, {address.city}, {address.state} - {address.pincode}
                    </p>
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
              <h2 className="text-base font-bold text-[#1A6B3C]">
                {isBookingMode ? "Review Your Booking" : "Review Your Order"}
              </h2>
              <Separator />
              {/* Delivery address summary */}
              <div className="p-3 bg-[#F3F8F1] rounded-lg">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Delivering To</p>
                <p className="text-sm font-medium text-slate-800">{address.fullName} · {address.phone}</p>
                <p className="text-sm text-slate-600">{address.addressLine1}{address.addressLine2 ? `, ${address.addressLine2}` : ""}, {address.city}, {address.state} - {address.pincode}</p>
              </div>

              {/* Items / Service */}
              {isBookingMode && bookingService ? (
                <div className="space-y-3">
                  <div className="flex gap-3 items-center">
                    <div className="relative size-14 rounded-lg overflow-hidden bg-slate-50 shrink-0">
                      <Image src={bookingService.image} alt={bookingService.name} fill sizes="56px" className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 line-clamp-1">{bookingService.name}</p>
                      <p className="text-xs text-slate-500">
                        {pendingBooking?.date} · {pendingBooking?.timeSlot}
                      </p>
                      {bookingProvider && (
                        <p className="text-[11px] text-slate-400 mt-0.5">Gardener: {bookingProvider.name}</p>
                      )}
                    </div>
                    <p className="text-sm font-bold text-[#1A6B3C] tabular-nums">{bookingPriceLabel}</p>
                  </div>
                </div>
              ) : (
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
              )}
              <Separator />
              {/* Notes */}
              <div className="space-y-1.5">
                <Label htmlFor="notes" className="text-sm">
                  {isBookingMode ? "Notes for Gardener (optional)" : "Special Instructions (optional)"}
                </Label>
                <Textarea
                  id="notes"
                  rows={2}
                  placeholder={isBookingMode ? "Any specific instructions for the gardener…" : "Any delivery preferences..."}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
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
                {/* COD */}
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
                        : isBookingMode
                        ? "Pay in cash when the gardener arrives."
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
                <div className="p-3 bg-amber-50 rounded-lg text-xs text-amber-700">
                  {isBookingMode
                    ? "Please keep exact change ready when the gardener arrives."
                    : "Please keep exact change ready. COD orders may take an extra day for delivery confirmation."}
                </div>
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
                {isPlacing ? <><Loader2 className="size-4 animate-spin" />{placeButtonLoading}</> : <>{placeButtonLabel}</>}
              </Button>
            )}
          </div>
        </div>

        {/* Right: Order/Booking summary (sticky) */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <h3 className="text-base font-bold text-[#1A6B3C]">{summaryTitle}</h3>
            <Separator />

            {isBookingMode && bookingService ? (
              /* ─── Booking summary ─── */
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Service</span>
                  <span className="font-medium text-slate-800 text-right">{bookingService.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Date</span>
                  <span className="font-medium text-slate-800">{pendingBooking?.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Time Slot</span>
                  <span className="font-medium text-slate-800">{pendingBooking?.timeSlot}</span>
                </div>
                {bookingProvider && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Gardener</span>
                    <span className="font-medium text-slate-800 text-right">{bookingProvider.name}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment</span>
                  <span className="font-medium text-slate-800">
                    {paymentMethod === "cod" ? "Cash on Delivery" : "Online"}
                  </span>
                </div>
              </div>
            ) : (
              /* ─── Order summary ─── */
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-600">Subtotal ({itemCount} items)</span><span className="font-medium text-slate-800 tabular-nums">{formatINR(subtotal)}</span></div>
                {couponDiscount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span className="font-medium tabular-nums">-{formatINR(couponDiscount)}</span></div>}
                <div className="flex justify-between"><span className="text-slate-600">Delivery</span><span className="font-medium text-slate-800 tabular-nums">{shipping === 0 ? "FREE" : formatINR(shipping)}</span></div>
                {/* GST removed — prices are inclusive. Old orders with tax>0 still show in order detail pages. */}
              </div>
            )}

            <Separator />
            <div className="flex justify-between items-baseline">
              <span className="text-base font-bold text-slate-800">Total</span>
              <span className="text-xl font-bold text-[#1A6B3C] tabular-nums">
                {isBookingMode ? bookingPriceLabel : formatINR(total)}
              </span>
            </div>
            {!isBookingMode && (
              <div className="flex items-center gap-2 text-xs text-slate-500 pt-2">
                <Truck className="size-3.5 text-[#1A6B3C]" />
                {shipping === 0 ? "Free delivery applied!" : `Add ${formatINR(FREE_SHIPPING_THRESHOLD - subtotal)} more for free delivery`}
              </div>
            )}
            {isBookingMode && (
              <p className="text-[10px] text-slate-400 text-center pt-1">
                Free cancellation up to 24h before the scheduled time.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Map Location Picker Dialog — full Blinkit-style modal */}
      <MapLocationPicker
        open={mapPickerOpen}
        onClose={() => setMapPickerOpen(false)}
        onSave={async (data) => {
          // Save to address book (persistent — same as Account page)
          if (user) {
            try {
              await addAddress({
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
                gpsVerified: data.gpsVerified,
                locationVerified: data.locationVerified,
                locationSource: data.locationSource,
                locationAccuracy: data.locationAccuracy,
              });
              await new Promise((r) => setTimeout(r, 500));
            } catch (err) {
              console.warn("[checkout] Failed to save address to book:", err);
            }
          }
          // Set as selected address for this order/booking
          setAddress({
            fullName: data.fullName,
            phone: data.phone,
            addressLine1: data.houseNo,
            addressLine2: data.locality,
            landmark: data.landmark,
            city: data.city,
            state: data.state,
            pincode: data.pincode,
            latitude: data.latitude,
            longitude: data.longitude,
          });
          setShowNewAddressForm(false);
          setGpsState("verified");
          setGpsError("");
          setGpsCoords({ lat: data.latitude ?? 0, lng: data.longitude ?? 0, accuracy: data.accuracy ?? 0 });
          appToast.success("Address saved", "Address added to your address book");
        }}
      />
    </Container>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <Container className="py-16 text-center">
          <Loader2 className="size-8 animate-spin text-[#1A6B3C] mx-auto" />
          <p className="text-sm text-slate-500 mt-3">Loading checkout…</p>
        </Container>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
