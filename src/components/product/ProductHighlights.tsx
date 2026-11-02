import { Sun, Droplets, Thermometer, Wind } from "lucide-react";
import type { CareInstructions as CareType } from "@/lib/product-data";

export function ProductHighlights({
  attributes,
  careInstructions,
}: {
  attributes: Array<{ name: string; value: string }>;
  careInstructions: CareType;
}) {
  const highlights = [
    { icon: Sun, label: "Sunlight", value: careInstructions.light },
    { icon: Droplets, label: "Watering", value: careInstructions.water },
    { icon: Thermometer, label: "Temperature", value: careInstructions.temperature },
    { icon: Wind, label: "Humidity", value: careInstructions.humidity },
  ].filter((h) => h.value && h.value !== "N/A");

  if (highlights.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3">
      {highlights.map((h) => (
        <div key={h.label} className="flex items-start gap-2 p-3 rounded-lg bg-[#F3F8F1] border border-slate-100">
          <div className="size-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "#C6A15B15" }}>
            <h.icon className="size-4" style={{ color: "#C6A15B" }} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500 uppercase">{h.label}</p>
            <p className="text-xs text-slate-700 line-clamp-2">{h.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
