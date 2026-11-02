"use client";

import { useState } from "react";
import { Container } from "@/components/common/Container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Loader2, Check } from "lucide-react";
import { appToast } from "@/lib/toast";
import { useAuth } from "@/contexts/AuthContext";

const SERVICE_OPTIONS = ["Balcony Garden Setup", "Garden Maintenance", "Terrace Garden Setup", "Gardener Hiring", "Lawn Care", "Plant Health Inspection", "Landscape Design", "Plant Installation"];

export default function ProviderProfilePage() {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    bio: "Experienced landscape gardener with 8+ years specializing in balcony and indoor gardens in Sonipat.",
    specializations: ["Balcony Garden Setup", "Plant Installation", "Garden Maintenance"] as string[],
    experienceYears: "8",
    city: "Sonipat",
    serviceRadius: "10",
    bankAccountName: "Ramesh Kumar",
    bankAccountNumber: "XXXX1234",
    bankIfsc: "SBIN0001234",
    upiId: "ramesh@upi",
    // Availability
    monStart: "09:00", monEnd: "18:00", monAvail: true,
    tueStart: "09:00", tueEnd: "18:00", tueAvail: true,
    wedStart: "09:00", wedEnd: "18:00", wedAvail: true,
    thuStart: "09:00", thuEnd: "18:00", thuAvail: true,
    friStart: "09:00", friEnd: "18:00", friAvail: true,
    satStart: "09:00", satEnd: "18:00", satAvail: true,
    sunStart: "10:00", sunEnd: "17:00", sunAvail: true,
  });

  const toggleService = (s: string) => {
    setForm((f) => ({ ...f, specializations: f.specializations.includes(s) ? f.specializations.filter((x) => x !== s) : [...f.specializations, s] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsSaving(false);
    appToast.success("Profile updated", "Your provider profile has been saved");
  };

  const DAYS = [
    { label: "Monday", startKey: "monStart", endKey: "monEnd", availKey: "monAvail" },
    { label: "Tuesday", startKey: "tueStart", endKey: "tueEnd", availKey: "tueAvail" },
    { label: "Wednesday", startKey: "wedStart", endKey: "wedEnd", availKey: "wedAvail" },
    { label: "Thursday", startKey: "thuStart", endKey: "thuEnd", availKey: "thuAvail" },
    { label: "Friday", startKey: "friStart", endKey: "friEnd", availKey: "friAvail" },
    { label: "Saturday", startKey: "satStart", endKey: "satEnd", availKey: "satAvail" },
    { label: "Sunday", startKey: "sunStart", endKey: "sunEnd", availKey: "sunAvail" },
  ] as const;

  return (
    <Container className="py-6 md:py-8">
      <h1 className="text-2xl font-bold text-[#16382B] mb-6">Provider Profile</h1>

      {/* Bio + Specializations */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4 space-y-4">
        <h2 className="text-base font-bold text-slate-800">About & Expertise</h2>
        <Separator />
        <div className="space-y-1.5"><Label className="text-sm">Bio</Label><Textarea rows={3} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label className="text-sm">Experience (years)</Label><Input type="number" value={form.experienceYears} onChange={(e) => setForm({ ...form, experienceYears: e.target.value })} className="h-11" /></div>
          <div className="space-y-1.5"><Label className="text-sm">Service Radius (km)</Label><Input type="number" value={form.serviceRadius} onChange={(e) => setForm({ ...form, serviceRadius: e.target.value })} className="h-11" /></div>
        </div>
        <div className="space-y-2"><Label className="text-sm">Services Offered</Label><div className="grid grid-cols-2 gap-2">{SERVICE_OPTIONS.map((s) => <button key={s} onClick={() => toggleService(s)} className={`px-3 py-2 rounded-lg border-2 text-xs font-medium text-left transition-all ${form.specializations.includes(s) ? "border-[#16382B] bg-[#F3F8F1] text-[#16382B]" : "border-slate-200 text-slate-600"}`}>{s}</button>)}</div></div>
      </div>

      {/* Availability */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4 space-y-3">
        <h2 className="text-base font-bold text-slate-800">Weekly Availability</h2>
        <Separator />
        {DAYS.map((day) => (
          <div key={day.label} className="flex items-center gap-3">
            <label className="flex items-center gap-2 w-28 cursor-pointer">
              <input type="checkbox" checked={form[day.availKey] as boolean} onChange={(e) => setForm({ ...form, [day.availKey]: e.target.checked })} className="size-4 accent-[#16382B]" />
              <span className="text-sm text-slate-700">{day.label}</span>
            </label>
            {form[day.availKey] as boolean && (
              <div className="flex items-center gap-2">
                <Input type="time" value={form[day.startKey] as string} onChange={(e) => setForm({ ...form, [day.startKey]: e.target.value })} className="h-9 w-28 text-sm" />
                <span className="text-xs text-slate-400">to</span>
                <Input type="time" value={form[day.endKey] as string} onChange={(e) => setForm({ ...form, [day.endKey]: e.target.value })} className="h-9 w-28 text-sm" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bank Details */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4 space-y-3">
        <h2 className="text-base font-bold text-slate-800">Bank & Payout Details</h2>
        <Separator />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1.5"><Label className="text-sm">Account Name</Label><Input value={form.bankAccountName} onChange={(e) => setForm({ ...form, bankAccountName: e.target.value })} className="h-11" /></div>
          <div className="space-y-1.5"><Label className="text-sm">Account Number</Label><Input value={form.bankAccountNumber} onChange={(e) => setForm({ ...form, bankAccountNumber: e.target.value })} className="h-11" /></div>
          <div className="space-y-1.5"><Label className="text-sm">IFSC</Label><Input value={form.bankIfsc} onChange={(e) => setForm({ ...form, bankIfsc: e.target.value })} className="h-11" /></div>
        </div>
        <div className="space-y-1.5"><Label className="text-sm">UPI ID</Label><Input value={form.upiId} onChange={(e) => setForm({ ...form, upiId: e.target.value })} className="h-11" /></div>
      </div>

      <Button onClick={handleSave} disabled={isSaving} className="bg-[#16382B] hover:bg-[#A8843F] gap-2">{isSaving ? <><Loader2 className="size-4 animate-spin" />Saving...</> : <><Check className="size-4" />Save Profile</>}</Button>
    </Container>
  );
}
