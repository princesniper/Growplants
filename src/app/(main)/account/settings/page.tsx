"use client";

import { useState } from "react";
import { Bell, Globe, Moon, Mail, Smartphone } from "lucide-react";
import { Container } from "@/components/common/Container";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { appToast } from "@/lib/toast";

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`relative w-11 h-6 rounded-full transition-colors ${on ? "bg-[#16382B]" : "bg-slate-200"}`}>
      <span className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : ""}`} />
    </button>
  );
}

export default function SettingsPage() {
  const [emailNotif, setEmailNotif] = useState(true);
  const [smsNotif, setSmsNotif] = useState(false);
  const [pushNotif, setPushNotif] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(true);
  const [language, setLanguage] = useState("en");

  return (
    <Container className="py-6 md:py-8">
      <h1 className="text-2xl font-bold text-[#16382B] mb-6">Settings</h1>

      {/* Notifications */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4"><Bell className="size-5 text-[#16382B]" />Notifications</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Mail className="size-4 text-slate-400" /><span className="text-sm text-slate-700">Email Notifications</span></div><Toggle on={emailNotif} onClick={() => setEmailNotif(!emailNotif)} /></div>
          <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Smartphone className="size-4 text-slate-400" /><span className="text-sm text-slate-700">SMS Notifications</span></div><Toggle on={smsNotif} onClick={() => setSmsNotif(!smsNotif)} /></div>
          <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Bell className="size-4 text-slate-400" /><span className="text-sm text-slate-700">Push Notifications</span></div><Toggle on={pushNotif} onClick={() => setPushNotif(!pushNotif)} /></div>
          <Separator />
          <div className="flex items-center justify-between"><div><span className="text-sm text-slate-700">Marketing Emails</span><p className="text-xs text-slate-400">Offers, new arrivals, and gardening tips</p></div><Toggle on={marketingEmails} onClick={() => setMarketingEmails(!marketingEmails)} /></div>
        </div>
      </div>

      {/* Language */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4"><Globe className="size-5 text-[#16382B]" />Language Preference</h2>
        <div className="flex gap-2">
          <button onClick={() => setLanguage("en")} className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${language === "en" ? "border-[#16382B] bg-[#F3F8F1] text-[#16382B]" : "border-slate-200 text-slate-600"}`}>English</button>
          <button onClick={() => setLanguage("hi")} className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${language === "hi" ? "border-[#16382B] bg-[#F3F8F1] text-[#16382B]" : "border-slate-200 text-slate-600"}`}>हिन्दी</button>
        </div>
      </div>

      {/* Dark mode (coming soon) */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4 opacity-60">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-2"><Moon className="size-5 text-[#16382B]" />Dark Mode</h2>
        <p className="text-sm text-slate-500">Coming soon! We&apos;re working on a beautiful dark theme for GrowPlants.</p>
      </div>

      <Button onClick={() => appToast.success("Settings saved", "Your preferences have been updated")} className="bg-[#16382B] hover:bg-[#A8843F]">Save Settings</Button>
    </Container>
  );
}
