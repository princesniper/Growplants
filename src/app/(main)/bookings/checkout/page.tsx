"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronLeft, ChevronRight, MapPin, CreditCard, Check, Loader2,
  Calendar, Clock, User, Phone, ShieldCheck, Plus, AlertCircle,
} from "lucide-react";
import { cn, isValidPincode, isValidIndianPhone } from "@/lib/utils";
import { Container } from "@/components/common/Container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getServiceBySlug, PROVIDERS } from "@/data/services-data";
import { useBookings } from "@/contexts/BookingsContext";
import { useAddresses, type FirestoreAddress } from "@/contexts/AddressContext";
import { formatINR } from "@/lib/utils";
import { appToast } from "@/lib/toast";

const PENDING_BOOKING_KEY = "growplants-pending-booking";

interface PendingBooking {
  serviceSlug: string;
  date: string;
  timeSlot: string;
  providerId: string | null;
  notes: string;
}

function BookingCheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serviceSlug = searchParams.get("service");
  const { createBooking } = useBookings();
  const { addresses } = useAddresses();

  const [pending, setPending] = useState<PendingBooking | null>(null);
  const [service, setService] = useState<ReturnType<typeof getServiceBySlug> | null>(null);
  const [provider, setProvider] = useState<typeof PROVIDERS[0] | null>(null);

  // ─── Address state ───
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [address, setAddress] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "Sonipat",
    state: "Haryana",
    pincode: "",
  });
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});

  // ─── Payment state ───
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">("razorpay");
  const [isPlacing, setIsPlacing] = useState(false);

  // ─── Load pending booking from sessionStorage ───
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = sessionStorage.getItem(PENDING_BOOKING_KEY);
      if (!raw) {
        appToast.error("No pending booking", "Please select a service and time slot first.");
        router.push("/services");
        return;
      }
      const parsed = JSON.parse(raw) as PendingBooking;
      setPending(parsed);

      const svc = getServiceBySlug(parsed.serviceSlug);
      if (!svc) {
        appToast.error("Service not found", "The service you selected is no longer available.");
        router.push("/services");
        return;
      }
      setService(svc);
      if (parsed.providerId) {
        const p = PROVIDERS.find((p) => p.id === parsed.providerId);
        if (p) setProvider(p);
      }
    } catch (err) {
      appToast.error("Invalid booking data", "Please try selecting your service again.");
      router.push("/services");
    }
  }, [router]);

  // ─── Auto-select default address if available ───
  useEffect(() => {
    if (addresses.length > 0 && !selectedAddressId) {
      const defaultAddr = addresses.find((a) => a.isDefault) ?? addresses[0];
      const isVerified =
        Boolean(defaultAddr.locationVerified) || Boolean(defaultAddr.gpsVerified);
      const hasCoords =
        defaultAddr.latitude != null && defaultAddr.longitude != null;
      if (isVerified && hasCoords) {
        setSelectedAddressId(defaultAddr.id);
        setAddress({
          fullName: defaultAddr.fullName,
          phone: defaultAddr.phone,
          addressLine1: defaultAddr.houseNo,
          addressLine2: defaultAddr.locality,
          city: defaultAddr.city,
          state: defaultAddr.state,
          pincode: defaultAddr.pincode,
        });
      }
    }
  }, [addresses, selectedAddressId]);

  // ─── Select a saved address ───
  const handleSelectAddress = (addr: FirestoreAddress) => {
    const isVerified =
      Boolean(addr.locationVerified) || Boolean(addr.gpsVerified);
    const hasCoords = addr.latitude != null && addr.longitude != null;
    if (!isVerified || !hasCoords) {
      appToast.warning(
        "Address not verified",
        "This address doesn't have location verification. Please verify it in Address Book or enter a new address manually."
      );
      return;
    }
    setSelectedAddressId(addr.id);
    setAddress({
      fullName: addr.fullName,
      phone: addr.phone,
      addressLine1: addr.houseNo,
      addressLine2: addr.locality,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
    });
    setAddressErrors({});
  };

  // ─── Use a new (manual) address ───
  const handleUseNewAddress = () => {
    setSelectedAddressId(null);
    setAddress({
      fullName: "", phone: "", addressLine1: "", addressLine2: "",
      city: "Sonipat", state: "Haryana", pincode: "",
    });
  };

  // ─── Validate address ───
  const validateAddress = (): boolean => {
    const errs: Record<string, string> = {};
    if (!address.fullName.trim()) errs.fullName = "Name is required";
    if (!address.phone.trim() || !isValidIndianPhone(address.phone))
      errs.phone = "Enter a valid 10-digit phone number";
    if (!address.addressLine1.trim()) errs.addressLine1 = "Address is required";
    if (!address.city.trim()) errs.city = "City is required";
    if (!address.state.trim()) errs.state = "State is required";
    if (!isValidPincode(address.pincode)) errs.pincode = "Enter a valid 6-digit pincode";
    setAddressErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ─── Confirm booking ───
  const handleConfirmBooking = async () => {
    if (!service || !pending) return;
    if (!validateAddress()) {
      appToast.error("Address incomplete", "Please fill in all required address fields.");
      return;
    }
    setIsPlacing(true);
    try {
      // Simulate async (future: API call)
      await new Promise((r) => setTimeout(r, 600));

      const booking = createBooking({
        service: {
          serviceId: service.id,
          serviceName: service.name,
          serviceSlug: service.slug,
          providerId: pending.providerId,
          providerName: provider?.name ?? null,
          priceFrom: service.priceFrom,
          pricingType: service.pricingType,
          priceUnit: service.priceUnit,
          image: service.image,
        },
        address: {
          fullName: address.fullName,
          phone: address.phone,
          addressLine1: address.addressLine1,
          city: address.city,
          state: address.state,
          pincode: address.pincode,
        },
        date: pending.date,
        timeSlot: pending.timeSlot,
        notes: pending.notes.trim() || undefined,
        paymentMethod,
      });

      // Clear pending booking
      sessionStorage.removeItem(PENDING_BOOKING_KEY);

      appToast.success("Booking confirmed!", `Booking ${booking.bookingNumber} placed`);
      router.push(`/account/bookings/${booking.id}`);
    } catch (err) {
      appToast.error(
        "Booking failed",
        err instanceof Error ? err.message : "Could not place your booking. Please try again."
      );
    } finally {
      setIsPlacing(false);
    }
  };

  // ─── Loading state ───
  if (!service || !pending) {
    return (
      <Container className="py-16 text-center">
        <Loader2 className="size-8 animate-spin text-[#1A6B3C] mx-auto" />
        <p className="text-sm text-slate-500 mt-3">Loading booking details…</p>
      </Container>
    );
  }

  const priceLabel =
    service.pricingType === "quote_based"
      ? "Custom Quote"
      : formatINR(service.priceFrom) + (service.priceUnit ? ` / ${service.priceUnit}` : "");

  return (
    <Container className="py-6 md:py-10 max-w-5xl">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
        <Link href="/" className="hover:text-[#1A6B3C]">Home</Link>
        <ChevronRight className="size-3" />
        <Link href="/services" className="hover:text-[#1A6B3C]">Services</Link>
        <ChevronRight className="size-3" />
        <Link href={`/services/${service.slug}`} className="hover:text-[#1A6B3C] truncate max-w-[120px]">{service.name}</Link>
        <ChevronRight className="size-3" />
        <span className="text-slate-800 font-semibold">Checkout</span>
      </nav>

      <h1 className="text-2xl font-bold text-[#1A6B3C] mb-1">Booking Checkout</h1>
      <p className="text-sm text-slate-500 mb-6">
        Confirm your address and payment method to complete the booking.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Address + Payment */}
        <div className="lg:col-span-2 space-y-6">
          {/* ─── Service Summary ─── */}
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
              <Calendar className="size-4 text-[#1A6B3C]" />
              Service Summary
            </h2>
            <div className="flex gap-3">
              <div className="relative size-16 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                <Image src={service.image} alt={service.name} fill sizes="64px" className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{service.name}</p>
                <p className="text-xs text-slate-500">{service.category} · {service.duration}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-600">
                  <span className="flex items-center gap-1"><Calendar className="size-3" />{pending.date}</span>
                  <span className="flex items-center gap-1"><Clock className="size-3" />{pending.timeSlot}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-[#1A6B3C]">{priceLabel}</p>
              </div>
            </div>
            {provider && (
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                <div className="relative size-8 rounded-full overflow-hidden bg-slate-100 shrink-0">
                  <Image src={provider.avatarImage} alt={provider.name} fill sizes="32px" className="object-cover" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-700">{provider.name}</p>
                  <p className="text-[10px] text-slate-500">{provider.rating.toFixed(1)}★ · {provider.experienceYears} yrs exp</p>
                </div>
              </div>
            )}
            {pending.notes && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <p className="text-[10px] font-semibold text-slate-500 uppercase mb-1">Notes for Gardener</p>
                <p className="text-xs text-slate-600">{pending.notes}</p>
              </div>
            )}
            <div className="mt-3">
              <Link
                href={`/services/${service.slug}`}
                className="text-xs text-[#1A6B3C] hover:underline font-medium flex items-center gap-1"
              >
                <ChevronLeft className="size-3" /> Change service details
              </Link>
            </div>
          </div>

          {/* ─── Address Section ─── */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-4">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <MapPin className="size-4 text-[#1A6B3C]" />
              Delivery Address
            </h2>

            {/* Saved addresses */}
            {addresses.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-500 uppercase">Saved Addresses</p>
                {addresses.map((addr) => {
                  const isVerified = Boolean(addr.locationVerified || addr.gpsVerified);
                  const isSelected = selectedAddressId === addr.id;
                  return (
                    <button
                      key={addr.id}
                      onClick={() => handleSelectAddress(addr)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg border-2 transition-all",
                        isSelected
                          ? "border-[#1A6B3C] bg-[#F3F8F1]"
                          : "border-slate-200 hover:border-slate-300"
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-[#1A6B3C] bg-[#F0FAF4] px-2 py-0.5 rounded-full">{addr.label}</span>
                            {isVerified && (
                              <span className="text-[10px] font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                <ShieldCheck className="size-2.5" /> Verified
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-semibold text-slate-800">{addr.fullName}</p>
                          <p className="text-xs text-slate-600">{addr.houseNo}, {addr.locality}</p>
                          <p className="text-xs text-slate-600">{addr.city}, {addr.state} - {addr.pincode}</p>
                          <p className="text-xs text-slate-500 mt-0.5">📞 {addr.phone}</p>
                        </div>
                        {isSelected && (
                          <Check className="size-5 text-[#1A6B3C] shrink-0" />
                        )}
                      </div>
                    </button>
                  );
                })}
                <button
                  onClick={handleUseNewAddress}
                  className={cn(
                    "w-full p-3 rounded-lg border-2 border-dashed transition-all flex items-center justify-center gap-2 text-sm",
                    !selectedAddressId
                      ? "border-[#1A6B3C] bg-[#F3F8F1] text-[#1A6B3C]"
                      : "border-slate-300 text-slate-500 hover:border-[#1A6B3C]/50 hover:text-[#1A6B3C]"
                  )}
                >
                  <Plus className="size-4" /> Enter new address manually
                </button>
              </div>
            )}

            {/* Manual address form (shown when no saved address selected, or always if no saved addresses) */}
            {!selectedAddressId && (
              <div className="space-y-3 pt-2">
                {addresses.length > 0 && <Separator />}
                <div className="space-y-1.5">
                  <Label className="text-sm flex items-center gap-1.5"><User className="size-3.5" />Full Name *</Label>
                  <Input
                    value={address.fullName}
                    onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                    className={cn("h-11", addressErrors.fullName && "border-red-300")}
                    placeholder="Full name"
                  />
                  {addressErrors.fullName && <p className="text-xs text-red-500">{addressErrors.fullName}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm flex items-center gap-1.5"><Phone className="size-3.5" />Phone Number *</Label>
                  <div className="flex h-11 rounded-md border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-[#1A6B3C]/20 focus-within:border-[#1A6B3C]">
                    <span className="flex items-center px-3 bg-slate-50 text-sm font-medium text-slate-600 border-r border-slate-200">+91</span>
                    <input
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
                <div className="space-y-1.5">
                  <Label className="text-sm">Address Line *</Label>
                  <Input
                    value={address.addressLine1}
                    onChange={(e) => setAddress({ ...address, addressLine1: e.target.value })}
                    className={cn("h-11", addressErrors.addressLine1 && "border-red-300")}
                    placeholder="House / Flat / Street"
                  />
                  {addressErrors.addressLine1 && <p className="text-xs text-red-500">{addressErrors.addressLine1}</p>}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-sm">City *</Label>
                    <Input
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      className={cn("h-11", addressErrors.city && "border-red-300")}
                    />
                    {addressErrors.city && <p className="text-xs text-red-500">{addressErrors.city}</p>}
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">State *</Label>
                    <Input
                      value={address.state}
                      onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      className={cn("h-11", addressErrors.state && "border-red-300")}
                    />
                    {addressErrors.state && <p className="text-xs text-red-500">{addressErrors.state}</p>}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Pincode *</Label>
                  <Input
                    inputMode="numeric"
                    maxLength={6}
                    value={address.pincode}
                    onChange={(e) => setAddress({ ...address, pincode: e.target.value.replace(/\D/g, "") })}
                    className={cn("h-11", addressErrors.pincode && "border-red-300")}
                    placeholder="131001"
                  />
                  {addressErrors.pincode && <p className="text-xs text-red-500">{addressErrors.pincode}</p>}
                </div>
                <div className="rounded-md bg-amber-50 border border-amber-100 p-2.5 flex items-start gap-1.5">
                  <AlertCircle className="size-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-700">
                    For new manual addresses, location verification (GPS/map pin) is recommended. You can verify this address later from your Address Book.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ─── Payment Section ─── */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <CreditCard className="size-4 text-[#1A6B3C]" />
              Payment Method
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setPaymentMethod("razorpay")}
                className={cn(
                  "p-3 rounded-lg border-2 transition-all text-left",
                  paymentMethod === "razorpay"
                    ? "border-[#1A6B3C] bg-[#F3F8F1]"
                    : "border-slate-200 hover:border-slate-300"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className={cn("size-4", paymentMethod === "razorpay" ? "text-[#1A6B3C]" : "text-slate-400")} />
                  <span className="text-sm font-semibold text-slate-800">Pay Online</span>
                </div>
                <p className="text-[10px] text-slate-500">Razorpay · UPI / Cards / Wallets</p>
              </button>
              <button
                onClick={() => setPaymentMethod("cod")}
                className={cn(
                  "p-3 rounded-lg border-2 transition-all text-left",
                  paymentMethod === "cod"
                    ? "border-[#1A6B3C] bg-[#F3F8F1]"
                    : "border-slate-200 hover:border-slate-300"
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={cn("text-sm font-semibold", paymentMethod === "cod" ? "text-[#1A6B3C]" : "text-slate-700")}>₹</span>
                  <span className="text-sm font-semibold text-slate-800">Cash on Delivery</span>
                </div>
                <p className="text-[10px] text-slate-500">Pay when gardener arrives</p>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Online payments are processed securely via Razorpay. You won&apos;t be charged until the booking is confirmed.
            </p>
          </div>
        </div>

        {/* Right: Order Summary (sticky) */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white border border-slate-200 rounded-xl p-5 space-y-3">
            <h2 className="text-base font-bold text-slate-800">Booking Summary</h2>
            <Separator />
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Service</span>
                <span className="font-medium text-slate-800 text-right">{service.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Date</span>
                <span className="font-medium text-slate-800">{pending.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Time Slot</span>
                <span className="font-medium text-slate-800">{pending.timeSlot}</span>
              </div>
              {provider && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Gardener</span>
                  <span className="font-medium text-slate-800 text-right">{provider.name}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Payment</span>
                <span className="font-medium text-slate-800">
                  {paymentMethod === "cod" ? "Cash on Delivery" : "Online"}
                </span>
              </div>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-slate-700">Total</span>
              <span className="text-xl font-bold text-[#1A6B3C]">{priceLabel}</span>
            </div>
            <Button
              onClick={handleConfirmBooking}
              disabled={isPlacing}
              className="w-full bg-[#1A6B3C] hover:bg-[#16A34A] gap-2 h-12"
            >
              {isPlacing ? (
                <><Loader2 className="size-4 animate-spin" /> Confirming…</>
              ) : (
                <><Check className="size-4" /> Confirm Booking</>
              )}
            </Button>
            <p className="text-[10px] text-slate-400 text-center">
              Free cancellation up to 24h before the scheduled time.
            </p>
          </div>
        </div>
      </div>
    </Container>
  );
}

export default function BookingCheckoutPage() {
  return (
    <Suspense
      fallback={
        <Container className="py-16 text-center">
          <Loader2 className="size-8 animate-spin text-[#1A6B3C] mx-auto" />
          <p className="text-sm text-slate-500 mt-3">Loading…</p>
        </Container>
      }
    >
      <BookingCheckoutContent />
    </Suspense>
  );
}
