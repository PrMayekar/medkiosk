import { FileCheck } from "lucide-react";

interface MedicalSummaryProps {
  summary: string;
  note: string;
}

export default function MedicalSummary({ summary, note }: MedicalSummaryProps) {
  const blocks = summary.split(/\n\n+/).filter(Boolean);

  return (
    <div className="card p-6 text-slate-900">
      <div className="mb-4 flex items-center gap-2 text-teal-600">
        <FileCheck size={18} />
        <span className="text-xs font-semibold uppercase tracking-wide">{note}</span>
      </div>
      <div className="space-y-4">
        {blocks.map((block, i) => {
          const lines = block.split("\n");
          const heading = lines[0];
          const isHeading = heading === heading.toUpperCase() && heading.length > 2 && !/^\s/.test(heading);
          return (
            <div key={i}>
              {isHeading ? (
                <>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{heading}</p>
                  <p className="mt-1 whitespace-pre-line text-[15px] leading-relaxed text-slate-900">
                    {lines.slice(1).join("\n")}
                  </p>
                </>
              ) : (
                <p className="whitespace-pre-line text-[15px] leading-relaxed text-slate-900">{block}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
