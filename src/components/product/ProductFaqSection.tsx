import { ChevronDown } from "lucide-react";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import type { CareInstructions as CareType } from "@/lib/product-data";

export function ProductFaqSection({
  productName,
  attributes,
  careInstructions,
}: {
  productName: string;
  attributes: Array<{ name: string; value: string }>;
  careInstructions: CareType;
}) {
  const faqs: { q: string; a: string }[] = [];

  if (careInstructions.light && careInstructions.light !== "N/A") {
    faqs.push({ q: `How much sunlight does the ${productName} need?`, a: careInstructions.light });
  }
  if (careInstructions.water && careInstructions.water !== "N/A") {
    faqs.push({ q: `How often should I water the ${productName}?`, a: careInstructions.water });
  }
  if (careInstructions.temperature && careInstructions.temperature !== "N/A") {
    faqs.push({ q: `What temperature is best for the ${productName}?`, a: careInstructions.temperature });
  }
  if (careInstructions.humidity && careInstructions.humidity !== "N/A") {
    faqs.push({ q: `Does the ${productName} need high humidity?`, a: careInstructions.humidity });
  }

  if (faqs.length === 0) return null;

  return (
    <div className="border-t border-gray-200 pt-8 lg:pt-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, i) => (
          <AccordionItem key={i} value={`faq-${i}`} className="border-slate-100">
            <AccordionTrigger className="text-sm font-medium text-slate-800 hover:text-[#16382B] py-4">
              {faq.q}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-slate-600 leading-relaxed pb-4">
              {faq.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}
