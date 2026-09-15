import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "md" | "lg";
}

const base =
  "kiosk-button touch-target inline-flex min-w-0 items-center justify-center gap-2 rounded-2xl border-2 font-extrabold leading-tight transition-all duration-150 select-none disabled:cursor-not-allowed disabled:opacity-45";

const variants: Record<string, string> = {
  primary:
    "border-cyan-300 bg-cyan-200 text-sky-950 shadow-[0_5px_0_#0879b8] hover:bg-cyan-100 active:translate-y-[3px] active:shadow-[0_2px_0_#0879b8]",
  secondary:
    "border-white/80 bg-white text-sky-900 shadow-[0_5px_0_rgba(7,71,115,.35)] hover:bg-sky-50 active:translate-y-[3px] active:shadow-[0_2px_0_rgba(7,71,115,.35)]",
  ghost:
    "border-white/45 bg-white/10 text-white shadow-none hover:bg-white/20 active:translate-y-[2px] active:bg-white/25",
  danger:
    "border-red-200 bg-red-100 text-red-800 shadow-[0_5px_0_#a63d2b] hover:bg-red-50 active:translate-y-[3px] active:shadow-[0_2px_0_#a63d2b]",
};

const sizes: Record<string, string> = {
  md: "min-h-[58px] px-6 py-3 text-base sm:px-7",
  lg: "min-h-[72px] px-7 py-4 text-lg sm:px-9 sm:text-xl",
};

export default function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  );
}
