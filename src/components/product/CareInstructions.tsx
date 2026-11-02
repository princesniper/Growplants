import { Sun, Droplets, Thermometer, Wind, Leaf } from "lucide-react";
import type { CareInstructions as CareType } from "@/lib/product-data";

export function CareInstructions({ instructions }: { instructions: CareType }) {
  if (!instructions || !instructions.light) return null;

  const items = [
    { icon: Sun, label: "Sunlight", value: instructions.light },
    { icon: Droplets, label: "Watering", value: instructions.water },
    { icon: Thermometer, label: "Temperature", value: instructions.temperature },
    { icon: Wind, label: "Humidity", value: instructions.humidity },
    { icon: Leaf, label: "Fertilizer", value: instructions.fertilizer ?? "Balanced fertilizer every 4-6 weeks" },
  ].filter((i) => i.value && i.value !== "N/A");

  return (
    <div className="border-t border-gray-200 pt-8 lg:pt-12">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Care Instructions</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <div key={item.label} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="size-10 rounded-lg flex items-center justify-center mb-3" style={{ background: "#C6A15B15" }}>
              <item.icon className="size-5" style={{ color: "#C6A15B" }} aria-hidden="true" />
            </div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{item.label}</p>
            <p className="text-sm text-gray-700 mt-1 leading-relaxed">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
