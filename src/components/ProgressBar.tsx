interface ProgressBarProps { step: number; total: number; }

export default function ProgressBar({ step, total }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (step / total) * 100));
  return (
    <div className="w-full">
      <div className="h-3 w-full overflow-hidden rounded-full border border-white/30 bg-white/20">
        <div className="h-full rounded-full bg-white transition-all duration-500 ease-out" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
