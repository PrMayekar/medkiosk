import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: "div" | "button";
  selected?: boolean;
}

export default function Card({ selected, className = "", children, ...props }: CardProps) {
  return (
    <div
      className={`card p-6 transition-all duration-150 ${
        selected ? "border-sky-500 ring-4 ring-cyan-300/60" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

interface SelectableCardProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

export function SelectableCard({
  selected,
  className = "",
  children,
  ...props
}: SelectableCardProps) {
  return (
    <button
      type="button"
      className={`kiosk-selectable card touch-target w-full min-w-0 p-6 text-left transition-all duration-150 select-none hover:-translate-y-0.5 hover:shadow-xl active:translate-y-[3px] active:shadow-[0_2px_0_rgba(5,67,111,.35)] ${
        selected
          ? "selected border-sky-500 ring-4 ring-cyan-300/70 -translate-y-0.5"
          : ""
      } ${className}`}
      aria-pressed={selected}
      {...props}
    >
      {children}
    </button>
  );
}
