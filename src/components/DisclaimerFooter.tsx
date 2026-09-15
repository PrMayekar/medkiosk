import { ShieldAlert } from "lucide-react";
import type { LanguageCode } from "../types/intake";
import { t } from "../data/translations";

export default function DisclaimerFooter({ language }: { language: LanguageCode }) {
  return (
    <footer className="mx-auto mt-10 max-w-2xl px-4 pb-8">
      <div className="flex items-start gap-2 rounded-xl border border-line bg-white/60 p-3.5 text-xs leading-relaxed text-ink-faint">
        <ShieldAlert size={15} className="mt-0.5 shrink-0" />
        <p>{t(language, "disclaimer")}</p>
      </div>
    </footer>
  );
}
