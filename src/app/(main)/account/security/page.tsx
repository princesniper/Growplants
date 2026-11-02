"use client";

import { useState } from "react";
import { Shield, Key, Smartphone, Monitor, LogOut, Loader2, Check } from "lucide-react";
import { Container } from "@/components/common/Container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { appToast } from "@/lib/toast";

export default function SecurityPage() {
  const [isChanging, setIsChanging] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [error, setError] = useState("");

  const handleChangePassword = async () => {
    setError("");
    if (!passwords.current || !passwords.new || !passwords.confirm) { setError("All fields are required"); return; }
    if (passwords.new.length < 8) { setError("New password must be at least 8 characters"); return; }
    if (passwords.new !== passwords.confirm) { setError("Passwords do not match"); return; }
    setIsChanging(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsChanging(false);
    setPasswords({ current: "", new: "", confirm: "" });
    appToast.success("Password changed", "Your password has been updated successfully");
  };

  const sessions = [
    { device: "Chrome on Windows", location: "Sonipat, Haryana", lastActive: "Current session", current: true, icon: Monitor },
    { device: "Safari on iPhone", location: "Sonipat, Haryana", lastActive: "2 hours ago", current: false, icon: Smartphone },
  ];

  return (
    <Container className="py-6 md:py-8">
      <h1 className="text-2xl font-bold text-[#16382B] mb-6">Security</h1>

      {/* Change password */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4"><Key className="size-5 text-[#16382B]" />Change Password</h2>
        <div className="space-y-3 max-w-md">
          <div className="space-y-1.5"><Label className="text-sm">Current Password</Label><Input type="password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} className="h-11" /></div>
          <div className="space-y-1.5"><Label className="text-sm">New Password</Label><Input type="password" value={passwords.new} onChange={(e) => setPasswords({ ...passwords, new: e.target.value })} className="h-11" /></div>
          <div className="space-y-1.5"><Label className="text-sm">Confirm New Password</Label><Input type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} className="h-11" /></div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <Button onClick={handleChangePassword} disabled={isChanging} className="bg-[#16382B] hover:bg-[#A8843F] gap-2">{isChanging ? <><Loader2 className="size-4 animate-spin" />Updating...</> : <><Check className="size-4" />Update Password</>}</Button>
        </div>
      </div>

      {/* Active sessions */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4">
        <h2 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4"><Shield className="size-5 text-[#16382B]" />Active Sessions</h2>
        <div className="space-y-3">
          {sessions.map((s, i) => (
            <div key={i} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-slate-50">
              <div className="flex items-center gap-3">
                <div className={`size-9 rounded-lg flex items-center justify-center ${s.current ? "bg-green-100 text-green-600" : "bg-slate-200 text-slate-500"}`}><s.icon className="size-4" /></div>
                <div><p className="text-sm font-medium text-slate-800">{s.device}{s.current && <span className="ml-2 text-xs font-semibold text-green-600">Active now</span>}</p><p className="text-xs text-slate-500">{s.location} · {s.lastActive}</p></div>
              </div>
              {!s.current && <Button variant="outline" size="sm" className="border-red-500 text-red-500 hover:bg-red-50 gap-1" onClick={() => appToast.success("Session revoked", "That device has been signed out")}><LogOut className="size-3.5" />Revoke</Button>}
            </div>
          ))}
        </div>
      </div>

      {/* Delete account */}
      <div className="bg-red-50 border border-red-200 rounded-xl p-5">
        <h2 className="text-base font-bold text-red-700 mb-1">Danger Zone</h2>
        <p className="text-sm text-red-600 mb-3">Permanently delete your account and all associated data. This cannot be undone.</p>
        <Button variant="outline" className="border-red-500 text-red-500 hover:bg-red-100" onClick={() => appToast.error("Not available", "Account deletion requires verification. Please contact support.")}>Delete Account</Button>
      </div>
    </Container>
  );
}
