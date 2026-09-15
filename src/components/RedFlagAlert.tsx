import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { RedFlagResult } from "../types/intake";

interface RedFlagAlertProps {
  result: RedFlagResult;
  titleFlag: string;
  bodyFlag: string;
  note: string;
  normalMessage: string;
}

export default function RedFlagAlert({ result, titleFlag, bodyFlag, note, normalMessage }: RedFlagAlertProps) {
  if (result.triggered) {
    return (
      <div className="rounded-xl2 border border-signal-red/30 bg-signal-redBg p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 shrink-0 text-signal-red" size={22} />
          <div>
            <p className="font-display text-lg font-semibold text-signal-red">{titleFlag}</p>
            <p className="mt-1 text-sm text-ink-soft">{bodyFlag}</p>
            <p className="mt-2 text-xs font-medium uppercase tracking-wide text-signal-red/70">{note}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl2 border border-teal-200 bg-teal-50 p-5">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 shrink-0 text-teal-600" size={22} />
        <div>
          <p className="font-medium text-teal-800">{normalMessage}</p>
          <p className="mt-1 text-xs text-teal-700/70">{note}</p>
        </div>
      </div>
    </div>
  );
}
