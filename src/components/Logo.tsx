import { HeartPulse } from "lucide-react";

interface LogoProps { size?: "sm" | "md"; }

export default function Logo({ size = "md" }: LogoProps) {
  const iconSize = size === "sm" ? 18 : 22;
  const textSize = size === "sm" ? "text-lg" : "text-xl";
  const box = size === "sm" ? "h-9 w-9" : "h-11 w-11";
  return (
    <div className="flex items-center gap-3">
      <div className={`${box} flex shrink-0 items-center justify-center rounded-xl border-2 border-white/60 bg-white/90 text-sky-700 shadow-md`}>
        <HeartPulse size={iconSize} strokeWidth={2.5} />
      </div>
      <span className={`font-display ${textSize} font-extrabold tracking-tight text-white`}>MediKiosk</span>
    </div>
  );
}
