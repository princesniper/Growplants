"use client";

import { useState } from "react";
import { Bell, Globe, Moon, Mail, Smartphone } from "lucide-react";
import { Container } from "@/components/common/Container";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { appToast } from "@/lib/toast";

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`relative w-11 h-6 rounded-full transition-colors ${on ? "bg-pine" : "bg-sand"}`}>
      <span className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-paper shadow transition-transform ${on ? "translate-x-5" : ""}`} />
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
      <h1 className="font-display text-2xl text-pine mb-6">Settings</h1>

      {/* Notifications */}
      <div className="bg-paper border border-line rounded-[18px] p-5 mb-4">
        <h2 className="font-display text-base text-ink flex items-center gap-2 mb-4"><Bell className="size-5 text-pine" />Notifications</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Mail className="size-4 text-ink-soft/60" /><span className="text-sm text-ink">Email Notifications</span></div><Toggle on={emailNotif} onClick={() => setEmailNotif(!emailNotif)} /></div>
          <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Smartphone className="size-4 text-ink-soft/60" /><span className="text-sm text-ink">SMS Notifications</span></div><Toggle on={smsNotif} onClick={() => setSmsNotif(!smsNotif)} /></div>
          <div className="flex items-center justify-between"><div className="flex items-center gap-2"><Bell className="size-4 text-ink-soft/60" /><span className="text-sm text-ink">Push Notifications</span></div><Toggle on={pushNotif} onClick={() => setPushNotif(!pushNotif)} /></div>
          <Separator />
          <div className="flex items-center justify-between"><div><span className="text-sm text-ink">Marketing Emails</span><p className="text-xs text-ink-soft/60">Offers, new arrivals, and gardening tips</p></div><Toggle on={marketingEmails} onClick={() => setMarketingEmails(!marketingEmails)} /></div>
        </div>
      </div>

      {/* Language */}
      <div className="bg-paper border border-line rounded-[18px] p-5 mb-4">
        <h2 className="font-display text-base text-ink flex items-center gap-2 mb-4"><Globe className="size-5 text-pine" />Language Preference</h2>
        <div className="flex gap-2">
          <button onClick={() => setLanguage("en")} className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${language === "en" ? "border-pine bg-sage-wash text-pine" : "border-line text-ink-soft"}`}>English</button>
          <button onClick={() => setLanguage("hi")} className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${language === "hi" ? "border-pine bg-sage-wash text-pine" : "border-line text-ink-soft"}`}>हिन्दी</button>
        </div>
      </div>

      {/* Dark mode (coming soon) */}
      <div className="bg-paper border border-line rounded-[18px] p-5 mb-4 opacity-60">
        <h2 className="font-display text-base text-ink flex items-center gap-2 mb-2"><Moon className="size-5 text-pine" />Dark Mode</h2>
        <p className="text-sm text-ink-soft">Coming soon! We&apos;re working on a beautiful dark theme for GrowPlants.</p>
      </div>

      <Button onClick={() => appToast.success("Settings saved", "Your preferences have been updated")} className="bg-pine hover:bg-brass-deep">Save Settings</Button>
    </Container>
  );
}
