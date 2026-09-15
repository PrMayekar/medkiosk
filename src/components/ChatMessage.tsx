import { Plus, User } from "lucide-react";
import type { TranscriptTurn } from "../types/intake";

export default function ChatMessage({ turn }: { turn: TranscriptTurn }) {
  const isAssistant = turn.role === "assistant";
  return (
    <div className={`flex items-start gap-3 animate-rise ${isAssistant ? "" : "flex-row-reverse"}`}>
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
          isAssistant ? "bg-teal-500 text-white" : "bg-ink text-white"
        }`}
        aria-hidden
      >
        {isAssistant ? <Plus size={16} /> : <User size={15} />}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed ${
          isAssistant ? "bg-white border border-line text-ink" : "bg-teal-500 text-white"
        }`}
      >
        {turn.text}
      </div>
    </div>
  );
}
