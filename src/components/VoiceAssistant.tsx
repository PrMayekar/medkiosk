import { useEffect, useState } from "react";
import { Check, Edit3, Loader2, Volume2 } from "lucide-react";
import type { LanguageCode } from "../types/intake";
import VoiceInput, { SpeakButton, speakText } from "./VoiceInput";
import Button from "./Button";
import { t } from "../data/translations";

interface VoiceAssistantProps {
  language: LanguageCode;
  prompt: string;
  initialValue?: string;
  placeholder?: string;
  submitLabel: string;
  listeningLabel: string;
  tapToSpeakLabel: string;
  editLabel: string;
  editHint?: string;
  submitting?: boolean;
  statusMessage?: string | null;
  statusIsError?: boolean;
  autoStart?: boolean;
  onSubmit: (value: string) => void;
  onCancel?: () => void;
  cancelLabel?: string;
  transcriptLabel?: string;
}

export function normalizeSpeechText(value: string) {
  return value
    .toLocaleLowerCase()
    .replace(/[.,!?;:()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function findSpokenOption(
  transcript: string,
  options: Array<{ value: string; label: string }>
) {
  const normalized = normalizeSpeechText(transcript);
  if (!normalized) return null;

  const exact = options.find((option) => normalizeSpeechText(option.label) === normalized);
  if (exact) return exact;

  const contained = options.find((option) => {
    const label = normalizeSpeechText(option.label);
    return normalized.includes(label) || label.includes(normalized);
  });
  if (contained) return contained;

  const aliases: Record<string, string[]> = {
    yes: ["yes", "yeah", "yep", "haan", "हां", "हाँ", "होय", "हो"],
    no: ["no", "nope", "nah", "nahi", "नहीं", "नाही"],
    general: ["general", "general medicine", "general medical care", "सामान्य", "सामान्य चिकित्सा", "सामान्य वैद्यकीय सेवा"],
    ayush: ["ayush", "ayurvedic", "ayurveda", "आयुष", "आयुर्वेद", "आयुर्वेदिक", "आयुर्वेदिक आयुष"],
    male: ["male", "man", "पुरुष", "male person"],
    female: ["female", "woman", "महिला", "स्त्री"],
    other: ["other", "अन्य", "इतर"],
  };

  const match = options.find((option) => {
    const key = normalizeSpeechText(option.value);
    return aliases[key]?.some((alias) => normalized === normalizeSpeechText(alias) || normalized.includes(normalizeSpeechText(alias)));
  });

  return match ?? null;
}

export function spokenDigits(value: string) {
  const digitWords: Record<string, string> = {
    zero: "0", one: "1", two: "2", three: "3", four: "4", five: "5",
    six: "6", seven: "7", eight: "8", nine: "9",
    "शून्य": "0", "एक": "1", "दो": "2", "तीन": "3", "चार": "4", "पांच": "5", "पाँच": "5",
    "छह": "6", "छः": "6", "सात": "7", "आठ": "8", "नौ": "9",
    "शून्यं": "0", "दोन": "2", "पाच": "5", "सहा": "6", "नऊ": "9",
  };

  const directDigits = value.replace(/\D/g, "");
  const words = normalizeSpeechText(value).split(" ");
  const converted = words.map((word) => digitWords[word] ?? "").join("");
  return (directDigits || converted).slice(0, 14);
}

export default function VoiceAssistant({
  language,
  prompt,
  initialValue = "",
  placeholder = "",
  submitLabel,
  listeningLabel,
  tapToSpeakLabel,
  editLabel,
  editHint,
  submitting = false,
  statusMessage = null,
  statusIsError = false,
  autoStart = true,
  onSubmit,
  onCancel,
  cancelLabel,
  transcriptLabel,
}: VoiceAssistantProps) {
  const [text, setText] = useState(initialValue);
  const [voiceReady, setVoiceReady] = useState(false);

  useEffect(() => {
    setText(initialValue);
  }, [initialValue]);

  useEffect(() => {
    if (!autoStart) {
      setVoiceReady(false);
      return;
    }
    setVoiceReady(!("speechSynthesis" in window));
    const started = speakText(prompt, language, () => setVoiceReady(true));
    if (!started) setVoiceReady(true);
  }, [prompt, language, autoStart]);

  const submit = () => {
    const value = text.trim();
    if (!value || submitting) return;
    onSubmit(value);
  };

  return (
    <section className="voice-assistant w-full">
      <div className="mx-auto max-w-4xl text-center">
        <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.28em] text-white/75">MEDIKIOSK</p>
        <h1 className="font-display text-3xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
          {prompt}
        </h1>
        <div className="mt-7 flex justify-center">
          <SpeakButton text={prompt} language={language} />
        </div>
      </div>

      <div className="mx-auto mt-7 max-w-3xl rounded-[2rem] border-2 border-white/40 bg-white/10 p-5 shadow-[0_12px_30px_rgba(0,50,90,.16)] backdrop-blur-sm sm:p-7">
        <VoiceInput
          language={language}
          onTranscript={(spokenText) => setText(spokenText)}
          label={tapToSpeakLabel}
          listeningLabel={listeningLabel}
          autoStart={autoStart && voiceReady}
          className="min-h-[92px] rounded-3xl text-xl sm:min-h-[104px] sm:text-2xl"
        />

        <div className="mt-5 rounded-3xl border-2 border-sky-200 bg-white p-5 sm:p-7">
          <div className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wide text-sky-800">
            <Edit3 size={17} />
            <span>{transcriptLabel ?? editLabel}</span>
          </div>
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={placeholder}
            disabled={submitting}
            rows={3}
            className="w-full resize-none rounded-2xl border-2 border-sky-200 bg-white p-4 text-xl font-semibold leading-relaxed text-sky-950 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15 sm:text-2xl"
            aria-label={editLabel}
          />
          {editHint && <p className="mt-3 text-sm font-semibold text-sky-700">{editHint}</p>}
        </div>

        {statusMessage && (
          <p className={`mt-4 rounded-2xl px-4 py-3 text-center text-base font-bold ${statusIsError ? "bg-red-100 text-red-800" : "bg-white text-sky-900"}`}>
            {statusMessage}
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-4">
          {onCancel && (
            <Button variant="ghost" onClick={onCancel} disabled={submitting} className="min-h-[68px] flex-1">
              {cancelLabel ?? t(language, "back")}
            </Button>
          )}
          <Button size="lg" onClick={submit} disabled={submitting || !text.trim()} className="min-h-[76px] flex-[2]">
            {submitting ? <Loader2 size={24} className="animate-spin" /> : <><Check size={24} /> {submitLabel}</>}
          </Button>
        </div>
      </div>
    </section>
  );
}
