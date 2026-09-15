import { useCallback, useEffect, useRef, useState } from "react";
import { Mic, MicOff, Volume2 } from "lucide-react";
import type { LanguageCode } from "../types/intake";

interface MinimalSpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
}

const speechLangMap: Record<LanguageCode, string> = {
  en: "en-IN",
  hi: "hi-IN",
  mr: "mr-IN",
};

function getRecognitionCtor(): (new () => MinimalSpeechRecognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export function isSpeechRecognitionSupported() {
  return getRecognitionCtor() !== null;
}

export function isSpeechSynthesisSupported() {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function speakText(text: string, language: LanguageCode, onEnd?: () => void) {
  if (!text.trim() || !isSpeechSynthesisSupported()) return false;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const targetLang = speechLangMap[language];
    utterance.lang = targetLang;
    const voices = window.speechSynthesis.getVoices();
    const prefix = targetLang.split("-")[0];
    const match = voices.find((voice) => voice.lang === targetLang) || voices.find((voice) => voice.lang?.startsWith(prefix));
    if (match) utterance.voice = match;
    if (onEnd) {
      utterance.onend = onEnd;
      utterance.onerror = onEnd;
    }
    window.speechSynthesis.speak(utterance);
    return true;
  } catch {
    onEnd?.();
    return false;
  }
}

interface VoiceInputProps {
  language: LanguageCode;
  onTranscript: (text: string) => void;
  label: string;
  listeningLabel: string;
  className?: string;
  autoStart?: boolean;
}

export default function VoiceInput({ language, onTranscript, label, listeningLabel, className = "", autoStart = false }: VoiceInputProps) {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [message, setMessage] = useState("");
  const recognitionRef = useRef<MinimalSpeechRecognition | null>(null);
  const mountedRef = useRef(true);
  const onTranscriptRef = useRef(onTranscript);

  useEffect(() => {
    onTranscriptRef.current = onTranscript;
  }, [onTranscript]);

  useEffect(() => {
    mountedRef.current = true;
    setSupported(isSpeechRecognitionSupported());
    return () => {
      mountedRef.current = false;
      try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    };
  }, []);

  const startListening = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setSupported(false);
      setMessage("Speech recognition is not available in this browser.");
      return;
    }

    try {
      recognitionRef.current?.stop();
      const recognition = new Ctor();
      recognition.lang = speechLangMap[language] || "en-IN";
      recognition.interimResults = false;
      recognition.continuous = false;
      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          onTranscriptRef.current(transcript.trim());
          if (mountedRef.current) setMessage("");
        }
      };
      recognition.onerror = (event: any) => {
        if (!mountedRef.current) return;
        setListening(false);
        if (event?.error === "not-allowed" || event?.error === "service-not-allowed") {
          setMessage("Microphone access is blocked. Allow microphone access and tap the microphone again.");
        } else if (event?.error === "no-speech") {
          setMessage("I didn't hear anything. Please speak again.");
        } else {
          setMessage("Voice input stopped. Please try again.");
        }
      };
      recognition.onend = () => {
        if (mountedRef.current) setListening(false);
      };
      recognitionRef.current = recognition;
      recognition.start();
      setMessage("");
      setListening(true);
    } catch {
      setListening(false);
      setMessage("Tap the microphone to start speaking.");
    }
  }, [language]);

  const stopListening = () => {
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    setListening(false);
  };

  useEffect(() => {
    if (!autoStart || !supported) return;
    const timer = window.setTimeout(() => startListening(), 700);
    return () => window.clearTimeout(timer);
  }, [autoStart, supported, startListening]);

  if (!supported) {
    return (
      <div className={`rounded-3xl border-2 border-red-200 bg-red-50 p-5 text-center text-base font-bold text-red-800 ${className}`}>
        Voice input is not supported in this browser. Please use Google Chrome for the kiosk.
      </div>
    );
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={listening ? stopListening : startListening}
        className={`kiosk-button relative flex min-h-[76px] w-full min-w-0 items-center justify-center gap-4 rounded-3xl border-2 border-cyan-300 bg-cyan-200 px-5 text-sky-950 shadow-[0_6px_0_#0879b8] transition-all hover:bg-cyan-100 active:translate-y-[3px] active:shadow-[0_2px_0_#0879b8] ${listening ? "bg-cyan-100 ring-4 ring-white/60" : ""} ${className}`}
        aria-label={listening ? listeningLabel : label}
        aria-pressed={listening}
      >
        {listening && <span className="absolute inset-0 rounded-3xl bg-cyan-300 animate-pulse opacity-45" aria-hidden />}
        {listening ? <Mic size={34} className="relative" /> : <MicOff size={34} className="relative" />}
        <span className="relative text-xl font-extrabold sm:text-2xl">{listening ? listeningLabel : label}</span>
      </button>
      {message && <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-center text-sm font-bold text-sky-900">{message}</p>}
    </div>
  );
}

export function SpeakButton({ text, language }: { text: string; language: LanguageCode }) {
  const [supported] = useState(isSpeechSynthesisSupported());
  if (!supported) return null;
  return (
    <button
      type="button"
      onClick={() => speakText(text, language)}
      className="touch-target flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-white/60 bg-white/15 text-white transition-all hover:bg-white/25 active:scale-95"
      aria-label="Hear this question read aloud"
    >
      <Volume2 size={23} />
    </button>
  );
}
