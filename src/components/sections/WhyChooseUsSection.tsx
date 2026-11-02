import { Leaf, Truck, ShieldCheck, Sprout, Heart, Clock, Calendar, Recycle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Container } from "@/components/common/Container";
import { SectionHeader } from "@/components/common/SectionHeader";
import { WHY_CHOOSE_CARDS } from "@/data/homepageData";

const ICON_MAP: Record<string, LucideIcon> = {
  leaf: Leaf, truck: Truck, shield: ShieldCheck, sprout: Sprout,
  heart: Heart, clock: Clock, calendar: Calendar, recycle: Recycle,
};

export function WhyChooseUsSection() {
  return (
    <section className="section-padding bg-paper">
      <Container>
        <SectionHeader
          title="The GrowPlants Difference"
          subtitle="Sonipat's first professional plant & gardening service — built on quality, trust, and green values."
          align="center"
          className="mb-10"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {WHY_CHOOSE_CARDS.map((card) => {
            const Icon = ICON_MAP[card.icon] ?? Leaf;
            return (
              <div key={card.id} className="flex flex-col items-start gap-3 p-5 rounded-lg bg-[#F3F8F1] border border-slate-100 hover:shadow-md hover:border-[#16382B]/20 transition-all">
                <div className="size-12 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#C6A15B15" }}>
                  <Icon className="size-6" style={{ color: "#C6A15B" }} aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-800 mb-1">{card.title}</h3>
                  <p className="text-sm text-slate-600">{card.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
