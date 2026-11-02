"use client";

import { useState } from "react";
import { Check, ChevronRight, Upload, Sprout } from "lucide-react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/common/Container";
import { PageHero } from "@/components/common/PageHero";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { appToast } from "@/lib/toast";

const STEPS = ["Personal Info", "Experience", "Service Area", "Documents", "Review"];
const SERVICE_OPTIONS = ["Balcony Garden Setup", "Garden Maintenance", "Terrace Garden Setup", "Gardener Hiring", "Lawn Care", "Plant Health Inspection", "Landscape Design", "Plant Installation"];

export default function BecomeProviderPage() {
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", dateOfBirth: "",
    businessName: "", experienceYears: "", specializations: [] as string[],
    city: "Sonipat", state: "Haryana", serviceRadius: "", addressLine1: "", pincode: "",
    aadharNumber: "", panNumber: "",
    bankAccountName: "", bankAccountNumber: "", bankIfsc: "",
    agreedToTerms: false,
  });

  const toggleService = (s: string) => {
    setForm((f) => ({ ...f, specializations: f.specializations.includes(s) ? f.specializations.filter((x) => x !== s) : [...f.specializations, s] }));
  };

  const handleNext = () => { if (step < STEPS.length - 1) setStep(step + 1); };
  const handleBack = () => { if (step > 0) setStep(step - 1); };

  const handleSubmit = () => {
    if (!form.agreedToTerms) { appToast.error("Please accept the terms", "You must agree to the Terms & Conditions"); return; }
    setSubmitted(true);
    appToast.success("Application submitted!", "We'll review your application within 3-5 business days.");
  };

  if (submitted) {
    return (
      <Container className="py-16">
        <div className="max-w-md mx-auto text-center space-y-4">
          <div className="size-16 rounded-full bg-green-100 flex items-center justify-center mx-auto"><Check className="size-8 text-green-600" /></div>
          <h1 className="text-2xl font-bold text-[#16382B]">Application Submitted!</h1>
          <p className="text-sm text-slate-500">Thank you for applying to become a GrowPlants service provider. Our team will review your application within 3-5 business days and contact you on {form.phone}.</p>
          <Button asChild className="bg-[#16382B] hover:bg-[#A8843F]"><a href="/">Back to Home</a></Button>
        </div>
      </Container>
    );
  }

  return (
    <>
      <PageHero overline="Join GrowPlants" title="Become a Service Provider" subtitle="Earn with GrowPlants and grow your gardening business across Sonipat. Set your schedule, work on your terms." breadcrumbs={[{ label: "Home", href: "/" }, { label: "Become a Provider" }]} />

      <Container className="py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          {/* Stepper */}
          <div className="flex items-center justify-center gap-1 mb-8 overflow-x-auto pb-2">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-1 shrink-0">
                <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors", i === step ? "bg-[#16382B] text-white" : i < step ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400")}>
                  {i < step ? <Check className="size-3" /> : <span className="size-4 rounded-full flex items-center justify-center text-[10px]">{i + 1}</span>}
                  <span className="hidden sm:inline">{label}</span>
                </div>
                {i < STEPS.length - 1 && <ChevronRight className="size-3 text-slate-300" />}
              </div>
            ))}
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            {step === 0 && (
              <>
                <h2 className="text-base font-bold text-[#16382B]">Personal Information</h2>
                <Separator />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label className="text-sm">Full Name *</Label><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="h-11" /></div>
                  <div className="space-y-1.5"><Label className="text-sm">Email *</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-11" /></div>
                  <div className="space-y-1.5"><Label className="text-sm">Phone *</Label><Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-11" /></div>
                  <div className="space-y-1.5"><Label className="text-sm">Date of Birth</Label><Input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} className="h-11" /></div>
                </div>
              </>
            )}
            {step === 1 && (
              <>
                <h2 className="text-base font-bold text-[#16382B]">Experience & Specializations</h2>
                <Separator />
                <div className="space-y-1.5"><Label className="text-sm">Business Name (if any)</Label><Input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} className="h-11" /></div>
                <div className="space-y-1.5"><Label className="text-sm">Years of Experience *</Label><Input type="number" min="0" value={form.experienceYears} onChange={(e) => setForm({ ...form, experienceYears: e.target.value })} className="h-11" /></div>
                <div className="space-y-2"><Label className="text-sm">Services You Offer *</Label><div className="grid grid-cols-2 gap-2">{SERVICE_OPTIONS.map((s) => <button key={s} onClick={() => toggleService(s)} className={cn("px-3 py-2 rounded-lg border-2 text-xs font-medium text-left transition-all", form.specializations.includes(s) ? "border-[#16382B] bg-[#F3F8F1] text-[#16382B]" : "border-slate-200 text-slate-600")}>{s}</button>)}</div></div>
              </>
            )}
            {step === 2 && (
              <>
                <h2 className="text-base font-bold text-[#16382B]">Service Area</h2>
                <Separator />
                <div className="space-y-1.5"><Label className="text-sm">Address *</Label><Input value={form.addressLine1} onChange={(e) => setForm({ ...form, addressLine1: e.target.value })} className="h-11" /></div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5"><Label className="text-sm">City</Label><Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="h-11" /></div>
                  <div className="space-y-1.5"><Label className="text-sm">State</Label><Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="h-11" /></div>
                  <div className="space-y-1.5"><Label className="text-sm">Pincode</Label><Input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "") })} maxLength={6} className="h-11" /></div>
                </div>
                <div className="space-y-1.5"><Label className="text-sm">Service Radius (km) *</Label><Input type="number" min="1" max="50" value={form.serviceRadius} onChange={(e) => setForm({ ...form, serviceRadius: e.target.value })} className="h-11" /></div>
              </>
            )}
            {step === 3 && (
              <>
                <h2 className="text-base font-bold text-[#16382B]">Documents & Bank Details</h2>
                <Separator />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5"><Label className="text-sm">Aadhar Number *</Label><Input value={form.aadharNumber} onChange={(e) => setForm({ ...form, aadharNumber: e.target.value })} className="h-11" /></div>
                  <div className="space-y-1.5"><Label className="text-sm">PAN Number *</Label><Input value={form.panNumber} onChange={(e) => setForm({ ...form, panNumber: e.target.value })} className="h-11" /></div>
                </div>
                <div className="p-3 bg-[#F3F8F1] rounded-lg flex items-center gap-2 text-xs text-slate-600"><Upload className="size-4 text-[#16382B]" />Upload Aadhar (front+back) and PAN card photos. Max 5MB each.</div>
                <Separator />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5"><Label className="text-sm">Bank Account Name</Label><Input value={form.bankAccountName} onChange={(e) => setForm({ ...form, bankAccountName: e.target.value })} className="h-11" /></div>
                  <div className="space-y-1.5"><Label className="text-sm">Account Number</Label><Input value={form.bankAccountNumber} onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })} className="h-11" /></div>
                  <div className="space-y-1.5"><Label className="text-sm">IFSC Code</Label><Input value={form.bankIfsc} onChange={(e) => setForm({ ...form, bankIfsc: e.target.value })} className="h-11" /></div>
                </div>
              </>
            )}
            {step === 4 && (
              <>
                <h2 className="text-base font-bold text-[#16382B]">Review & Submit</h2>
                <Separator />
                <div className="space-y-2 text-sm">
                  <p><strong>Name:</strong> {form.fullName || "—"}</p>
                  <p><strong>Email:</strong> {form.email || "—"}</p>
                  <p><strong>Phone:</strong> {form.phone || "—"}</p>
                  <p><strong>Experience:</strong> {form.experienceYears || "—"} years</p>
                  <p><strong>Services:</strong> {form.specializations.join(", ") || "—"}</p>
                  <p><strong>City:</strong> {form.city}, {form.state} - {form.pincode || "—"}</p>
                  <p><strong>Service Radius:</strong> {form.serviceRadius || "—"} km</p>
                </div>
                <Separator />
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.agreedToTerms} onChange={(e) => setForm({ ...form, agreedToTerms: e.target.checked })} className="mt-1 size-4 accent-[#16382B]" />
                  <span className="text-sm text-slate-600">I agree to the <a href="/terms" className="text-[#16382B] hover:underline">Terms & Conditions</a> and <a href="/privacy-policy" className="text-[#16382B] hover:underline">Privacy Policy</a>. I confirm all information provided is accurate.</span>
                </label>
              </>
            )}

            {/* Navigation */}
            <div className="flex gap-3 pt-2">
              {step > 0 && <Button variant="outline" onClick={handleBack} className="border-[#16382B] text-[#16382B]">Back</Button>}
              {step < STEPS.length - 1 ? <Button onClick={handleNext} className="bg-[#16382B] hover:bg-[#A8843F] flex-1 gap-2">Continue<ChevronRight className="size-4" /></Button> : <Button onClick={handleSubmit} className="bg-[#16382B] hover:bg-[#A8843F] flex-1 gap-2"><Sprout className="size-4" />Submit Application</Button>}
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}
