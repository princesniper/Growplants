"use client";

import { useState } from "react";
import { Plus, Minus, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Container } from "@/components/common/Container";
import { Button } from "@/components/ui/button";
import { FAQ_ITEMS } from "@/data/homepageData";

export function FAQSection() {
  const [openId, setOpenId] = useState<string | null>(FAQ_ITEMS[0]?.id ?? null);

  return (
    <section className="section-padding bg-white">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          <div className="lg:col-span-2 space-y-6">
            <div className="space-y-3">
              <p className="text-xs font-bold tracking-widest uppercase text-[#C6A15B]">FAQs</p>
              <h2 className="text-2xl md:text-4xl font-bold text-[#16382B]">Got Questions? We&apos;ve Got Answers</h2>
              <p className="text-base text-slate-600">Find answers to the most common questions about our plants, delivery, and services. Can&apos;t find yours? Contact us.</p>
            </div>
            <div className="rounded-lg bg-[#F3F8F1] border border-slate-100 p-5 space-y-3">
              <h3 className="text-base font-semibold text-slate-800">Still have questions?</h3>
              <p className="text-sm text-slate-600">Chat with us on WhatsApp — quick replies guaranteed.</p>
              <Button asChild className="w-full gap-2 bg-[#25D366] hover:bg-[#25D366]/90 text-white">
                <a href="https://wa.me/919812345678" target="_blank" rel="noopener noreferrer">
                  <MessageCircle className="size-4 fill-white" aria-hidden="true" />WhatsApp Us
                </a>
              </Button>
            </div>
          </div>

          <div className="lg:col-span-3">
            <ul className="space-y-3">
              {FAQ_ITEMS.map((item) => {
                const isOpen = openId === item.id;
                return (
                  <li key={item.id} className="rounded-lg bg-white border border-slate-200 overflow-hidden">
                    <button type="button" aria-expanded={isOpen} aria-controls={`faq-panel-${item.id}`} onClick={() => setOpenId(isOpen ? null : item.id)} className="w-full flex items-center justify-between gap-3 p-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16382B] focus-visible:ring-inset">
                      <span className="text-sm font-medium text-slate-800">{item.question}</span>
                      <span className="shrink-0 size-7 rounded-full bg-[#F3F8F1] text-[#16382B] flex items-center justify-center">
                        {isOpen ? <Minus className="size-4" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
                      </span>
                    </button>
                    <div id={`faq-panel-${item.id}`} role="region" className={cn("overflow-hidden transition-all duration-300", isOpen ? "max-h-96" : "max-h-0")}>
                      <p className="p-4 pt-0 text-sm text-slate-600 leading-relaxed">{item.answer}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
