import { Languages, Check } from "lucide-react";
import type { LanguageCode } from "../types/intake";
import { languageMeta } from "../data/translations";
import { SelectableCard } from "./Card";

interface LanguageSelectorProps {
  value: LanguageCode;
  onChange: (lang: LanguageCode) => void;
  compact?: boolean;
}

export default function LanguageSelector({ value, onChange, compact }: LanguageSelectorProps) {
  const codes = Object.keys(languageMeta) as LanguageCode[];

  if (compact) {
    return (
      <div className="kiosk-language-selector flex max-w-full items-center gap-1 rounded-2xl border-2 border-white/75 bg-white p-1.5 shadow-[0_4px_0_rgba(7,71,115,.25)]">
        <Languages size={18} className="ml-1.5 shrink-0 text-sky-800" aria-hidden="true" />
        {codes.map((code) => {
          const active = value === code;
          return (
            <button
              key={code}
              type="button"
              onClick={() => onChange(code)}
              className={`kiosk-language-option flex min-h-[48px] min-w-[54px] items-center justify-center rounded-xl px-3 py-2 text-sm font-extrabold leading-none transition-all duration-150 active:translate-y-[2px] ${
                active
                  ? "bg-sky-600 text-white shadow-[0_3px_0_#075985]"
                  : "text-sky-900 hover:bg-sky-100 active:bg-sky-200"
              }`}
              aria-pressed={active}
              aria-label={`Select ${languageMeta[code].label}`}
              title={languageMeta[code].label}
            >
              {languageMeta[code].native}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {codes.map((code) => {
        const active = value === code;
        return (
          <SelectableCard
            key={code}
            selected={active}
            onClick={() => onChange(code)}
            className="min-h-[120px] text-center"
          >
            <div className="flex items-center justify-center gap-2">
              {active && <Check size={20} strokeWidth={3} className="text-sky-700" />}
              <span className="font-display text-2xl font-extrabold text-ink">
                {languageMeta[code].native}
              </span>
            </div>
            <span className="mt-2 block text-sm font-bold text-ink-soft">
              {languageMeta[code].label}
            </span>
          </SelectableCard>
        );
      })}
    </div>
  );
}
