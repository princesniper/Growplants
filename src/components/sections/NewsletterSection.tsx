"use client";

import { useState } from "react";
import { Mail, Check, Loader2 } from "lucide-react";
import { Container } from "@/components/common/Container";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { appToast } from "@/lib/toast";
import { newsletterSchema } from "@/lib/validations/contact";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");
    const result = newsletterSchema.safeParse({ email });
    if (!result.success) {
      setStatus("error");
      setErrorMessage(result.error.issues[0]?.message ?? "Invalid email");
      return;
    }
    await new Promise((r) => setTimeout(r, 600));
    setStatus("success");
    appToast.success("Subscribed!", "You'll receive gardening tips and offers weekly.");
    setEmail("");
  };

  return (
    <section id="newsletter" style={{ backgroundColor: "#0F2A20" }} className="text-white scroll-mt-20">
      <Container className="py-12 md:py-16">
        <div className="max-w-2xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-sm font-medium">
            <Mail className="size-4" aria-hidden="true" />Newsletter
          </div>
          <h2 className="text-2xl md:text-4xl font-bold text-white">Get Gardening Tips, Offers &amp; New Arrivals</h2>
          <p className="text-lg text-white/80">Join 2,000+ plant lovers. One email per week — no spam, ever.</p>
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto pt-2" noValidate>
            <div className="flex-1">
              <label htmlFor="newsletter-email" className="sr-only">Your email address</label>
              <Input id="newsletter-email" type="email" value={email} onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle"); }} placeholder="Your email address" aria-invalid={status === "error"} aria-describedby={status === "error" ? "newsletter-error" : undefined} required className="bg-white text-slate-800 border-white/20 placeholder:text-slate-400 h-12" />
            </div>
            <Button type="submit" disabled={status === "loading" || status === "success"} className="gap-2 bg-[#C6A15B] hover:bg-[#A8843F] text-[#0E241C] shrink-0 h-12">
              {status === "loading" ? <><Loader2 className="size-4 animate-spin" aria-hidden="true" />Subscribing...</> : status === "success" ? <><Check className="size-4" aria-hidden="true" />Done</> : <>Subscribe</>}
            </Button>
          </form>
          {status === "error" && <p id="newsletter-error" role="alert" className="text-sm text-[#C6A15B]">{errorMessage}</p>}
          <p className="text-xs text-white/50">Unsubscribe anytime. Your information is safe with us.</p>
        </div>
      </Container>
    </section>
  );
}
