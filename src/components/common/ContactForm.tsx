"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { contactSchema, type ContactInput } from "@/lib/validations/contact";
import { appToast } from "@/lib/toast";

export function ContactForm() {
  const [isSuccess, setIsSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", phone: "", subject: "", message: "" },
  });

  const onSubmit = async (data: ContactInput) => {
    await new Promise((r) => setTimeout(r, 800));
    appToast.success("Message sent!", "We'll get back to you within 24 hours.");
    reset();
    setIsSuccess(true);
    setTimeout(() => setIsSuccess(false), 5000);
  };

  if (isSuccess) {
    return (
      <div className="rounded-lg bg-green-50 border border-green-200 p-8 text-center space-y-3">
        <div className="size-14 rounded-full bg-green-100 text-green-600 flex items-center justify-center mx-auto">
          <Check className="size-7" aria-hidden="true" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800">Message Sent!</h3>
        <p className="text-sm text-slate-600">Thank you for reaching out. We&apos;ll get back to you within 24 hours.</p>
        <Button onClick={() => setIsSuccess(false)} variant="outline" className="mt-2">Send Another Message</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="contact-name" className="text-sm font-medium text-slate-700">Full Name *</Label>
          <Input id="contact-name" type="text" placeholder="Priya Sharma" className="h-12 rounded-md" aria-invalid={!!errors.name} aria-describedby={errors.name ? "contact-name-error" : undefined} {...register("name")} />
          {errors.name && <p id="contact-name-error" className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="size-3" aria-hidden="true" />{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-phone" className="text-sm font-medium text-slate-700">Phone Number *</Label>
          <Input id="contact-phone" type="tel" placeholder="9876543210" className="h-12 rounded-md" aria-invalid={!!errors.phone} aria-describedby={errors.phone ? "contact-phone-error" : undefined} {...register("phone")} />
          {errors.phone && <p id="contact-phone-error" className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="size-3" aria-hidden="true" />{errors.phone.message}</p>}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-email" className="text-sm font-medium text-slate-700">Email *</Label>
        <Input id="contact-email" type="email" placeholder="you@email.com" className="h-12 rounded-md" aria-invalid={!!errors.email} aria-describedby={errors.email ? "contact-email-error" : undefined} {...register("email")} />
        {errors.email && <p id="contact-email-error" className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="size-3" aria-hidden="true" />{errors.email.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-subject" className="text-sm font-medium text-slate-700">Subject *</Label>
        <Input id="contact-subject" type="text" placeholder="How can we help?" className="h-12 rounded-md" aria-invalid={!!errors.subject} aria-describedby={errors.subject ? "contact-subject-error" : undefined} {...register("subject")} />
        {errors.subject && <p id="contact-subject-error" className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="size-3" aria-hidden="true" />{errors.subject.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="contact-message" className="text-sm font-medium text-slate-700">Message *</Label>
        <Textarea id="contact-message" rows={5} placeholder="Tell us more about your query..." className="rounded-md" aria-invalid={!!errors.message} aria-describedby={errors.message ? "contact-message-error" : undefined} {...register("message")} />
        {errors.message && <p id="contact-message-error" className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="size-3" aria-hidden="true" />{errors.message.message}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full h-12 gap-2 bg-[#16382B] hover:bg-[#A8843F]">
        {isSubmitting ? (<><Loader2 className="size-4 animate-spin" aria-hidden="true" />Sending...</>) : "Send Message"}
      </Button>
    </form>
  );
}
