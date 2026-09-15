import { useEffect, useState } from "react";

import { Check, Edit3, Loader2 } from "lucide-react";

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
    .replace(/[.,!?;:()[\\]{}]/g, " ")
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
    return aliases[key]?.some(
      (alias) =>
        normalized === normalizeSpeechText(alias) ||
        normalized.includes(normalizeSpeechText(alias))
    );
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
    <section className="voice-assistant flex min-h-0 w-full flex-1 flex-col">
      {/* Full-width container, wider left column so the prompt wraps less */}
      <div className="mx-auto flex w-full max-w-[1500px] flex-1 flex-col gap-3 px-4 py-3 sm:px-6 lg:grid lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center lg:gap-10 lg:px-10 lg:py-4">
        {/* Left column: prompt */}
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <p className="mb-1 text-[0.65rem] font-extrabold uppercase tracking-[0.28em] text-white/75 sm:text-xs lg:mb-2">
            MEDIKIOSK
          </p>

          <h1 className="font-display max-h-[55vh] overflow-y-auto text-2xl font-extrabold leading-snug text-white sm:text-3xl lg:text-[2rem] lg:leading-snug xl:text-4xl xl:leading-tight">
            {prompt}
          </h1>

          <div className="mt-3 flex justify-center lg:mt-4 lg:justify-start">
            <SpeakButton text={prompt} language={language} />
          </div>
        </div>

        {/* Right column: card with voice input, transcript, and actions */}
        <div className="flex min-h-0 w-full flex-col rounded-2xl border-2 border-white/40 bg-white/10 p-3 shadow-[0_12px_30px_rgba(0,50,90,.16)] backdrop-blur-sm sm:rounded-[1.75rem] sm:p-4 lg:max-h-[calc(100vh-2rem)] lg:p-4">
          <VoiceInput
            language={language}
            onTranscript={(spokenText) => setText(spokenText)}
            label={tapToSpeakLabel}
            listeningLabel={listeningLabel}
            autoStart={autoStart && voiceReady}
            className="min-h-[70px] rounded-2xl text-lg sm:min-h-[80px] sm:text-xl lg:min-h-[64px] lg:text-lg"
          />

          <div className="mt-3 flex min-h-0 flex-1 flex-col rounded-2xl border-2 border-sky-200 bg-white p-3 sm:p-4 lg:mt-3 lg:p-3">
            <div className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-sky-800 sm:text-sm">
              <Edit3 size={15} />
              <span>{transcriptLabel ?? editLabel}</span>
            </div>

            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={placeholder}
              disabled={submitting}
              rows={2}
              className="min-h-[60px] w-full flex-1 resize-none rounded-xl border-2 border-sky-200 bg-white p-3 text-base font-semibold leading-relaxed text-sky-950 outline-none focus:border-sky-500 focus:ring-4 focus:ring-sky-500/15 sm:text-lg lg:min-h-[52px] lg:p-3 lg:text-base"
              aria-label={editLabel}
            />

            {editHint && (
              <p className="mt-2 text-xs font-semibold text-sky-700 sm:text-sm">
                {editHint}
              </p>
            )}
          </div>

          {statusMessage && (
            <p
              className={`mt-2 rounded-xl px-3 py-2 text-center text-sm font-bold sm:text-base ${
                statusIsError
                  ? "bg-red-100 text-red-800"
                  : "bg-white text-sky-900"
              }`}
            >
              {statusMessage}
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-3 lg:mt-3 lg:gap-3">
            {onCancel && (
              <Button
                variant="ghost"
                onClick={onCancel}
                disabled={submitting}
                className="min-h-[52px] flex-1 sm:min-h-[56px] lg:min-h-[52px]"
              >
                {cancelLabel ?? t(language, "back")}
              </Button>
            )}

            <Button
              size="lg"
              onClick={submit}
              disabled={submitting || !text.trim()}
              className="min-h-[56px] flex-[2] sm:min-h-[60px] lg:min-h-[54px]"
            >
              {submitting ? (
                <Loader2 size={22} className="animate-spin" />
              ) : (
                <>
                  <Check size={22} /> {submitLabel}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}