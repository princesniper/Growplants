"use client";

import { Container } from "@/components/common/Container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useUser } from "@/contexts/UserContext";
import { appToast } from "@/lib/toast";
import { Loader2, Upload, Trash2, Camera } from "lucide-react";
import { useState, useRef } from "react";
import { uploadProfileImage, deleteProfileImage } from "@/lib/firebase/storage";

export default function ProfilePage() {
  const { user } = useAuth();
  const { userData, updateProfile } = useUser();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    fullName: user?.fullName ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    gender: "prefer_not" as string,
    dateOfBirth: "",
    preferredLanguage: "en" as string,
  });

  // Get current profile image from UserContext (real-time)
  const profileImage = userData?.profileImage ?? user?.profileImageUrl ?? null;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({
        firstName: form.fullName.split(" ")[0] ?? "",
        lastName: form.fullName.split(" ").slice(1).join(" ") || "",
        phone: form.phone,
      });
      appToast.success("Profile updated", "Your changes have been saved");
    } catch (err) {
      console.error("[profile] save error:", err);
      appToast.error("Save failed", "Could not update profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      appToast.error("Invalid file", "Please select an image file (JPG, PNG)");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      appToast.error("File too large", "Image must be under 2MB");
      return;
    }

    setIsUploading(true);
    try {
      // Delete old profile image if it exists
      if (profileImage) {
        try {
          await deleteProfileImage(profileImage);
        } catch (err) {
          console.warn("[profile] could not delete old image:", err);
        }
      }

      // Upload new image to Firebase Storage
      const downloadUrl = await uploadProfileImage(user.id, file);

      // Update Firestore user document with new image URL
      await updateProfile({ profileImage: downloadUrl });

      appToast.success("Photo uploaded", "Your profile photo has been updated");
    } catch (err) {
      console.error("[profile] upload error:", err);
      appToast.error("Upload failed", "Could not upload image. Please try again.");
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemovePhoto = async () => {
    if (!user || !profileImage) return;
    setIsUploading(true);
    try {
      await deleteProfileImage(profileImage);
      await updateProfile({ profileImage: null });
      appToast.success("Photo removed", "Your profile photo has been removed");
    } catch (err) {
      console.error("[profile] remove error:", err);
      appToast.error("Remove failed", "Could not remove photo");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Container className="py-6 md:py-8">
      <h1 className="text-2xl font-bold text-[#1A6B3C] mb-6">My Profile</h1>
      <div className="max-w-2xl">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative size-20 rounded-full bg-[#1A6B3C] text-white flex items-center justify-center text-2xl font-bold overflow-hidden border-2 border-white shadow-md">
            {profileImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profileImage}
                alt={form.fullName}
                className="size-full object-cover rounded-full"
                referrerPolicy="no-referrer"
              />
            ) : (
              form.fullName.charAt(0).toUpperCase() || "U"
            )}
            {isUploading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="size-6 text-white animate-spin" />
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-[#1A6B3C] text-[#1A6B3C] gap-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <><Loader2 className="size-4 animate-spin" /> Uploading...</>
                ) : (
                  <><Upload className="size-4" /> {profileImage ? "Change Photo" : "Upload Photo"}</>
                )}
              </Button>
              {profileImage && (
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-300 text-red-600 hover:bg-red-50 gap-2"
                  onClick={handleRemovePhoto}
                  disabled={isUploading}
                >
                  <Trash2 className="size-4" /> Remove
                </Button>
              )}
            </div>
            <p className="text-xs text-slate-400">JPG, PNG max 2MB</p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5"><Label className="text-sm">Full Name</Label><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="h-11" /></div>
            <div className="space-y-1.5"><Label className="text-sm">Email</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-11" disabled /></div>
            <div className="space-y-1.5"><Label className="text-sm">Phone</Label><Input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-11" /></div>
            <div className="space-y-1.5"><Label className="text-sm">Date of Birth</Label><Input type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} className="h-11" /></div>
            <div className="space-y-1.5"><Label className="text-sm">Gender</Label><select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="w-full h-11 border border-slate-200 rounded-md px-3 text-sm"><option value="prefer_not">Prefer not to say</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
            <div className="space-y-1.5"><Label className="text-sm">Preferred Language</Label><select value={form.preferredLanguage} onChange={(e) => setForm({ ...form, preferredLanguage: e.target.value })} className="w-full h-11 border border-slate-200 rounded-md px-3 text-sm"><option value="en">English</option><option value="hi">हिन्दी</option></select></div>
          </div>
          <Button onClick={handleSave} disabled={isSaving} className="bg-[#1A6B3C] hover:bg-[#16A34A] gap-2">{isSaving ? <><Loader2 className="size-4 animate-spin" />Saving...</> : "Save Changes"}</Button>
        </div>
      </div>
    </Container>
  );
}
