import { Check } from "lucide-react";

interface Section { key: string; label: string; }
interface SectionTrackerProps { sections: Section[]; currentSection: string; }

export default function SectionTracker({ sections, currentSection }: SectionTrackerProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto py-1" aria-label="Intake progress by section">
      {sections.map((section) => {
        const active = section.key === currentSection;
        return (
          <div key={section.key} className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${active ? "border-white bg-white text-sky-800" : "border-white/25 bg-white/10 text-white/65"}`}>
            {active && <Check size={12} />}
            {section.label}
          </div>
        );
      })}
    </div>
  );
}
