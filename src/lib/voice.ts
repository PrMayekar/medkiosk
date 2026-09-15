declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
  type SpeechRecognition = any;
  type SpeechRecognitionEvent = any;
}

export interface VoiceRecognitionOptions {
  language?: string;
  onResult?: (transcript: string) => void;
  onError?: (error: any) => void;
  onEnd?: () => void;
}

export function getSpeechRecognition() {
  if (typeof window === "undefined") return null;
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  return SpeechRecognition ? new SpeechRecognition() : null;
}

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

export function startListening(options: VoiceRecognitionOptions = {}) {
  const recognition = getSpeechRecognition();
  if (!recognition) return null;

  recognition.lang = options.language || "en-IN";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onresult = (event: SpeechRecognitionEvent) => {
    const transcript = event.results?.[0]?.[0]?.transcript ?? "";
    if (transcript && options.onResult) {
      options.onResult(transcript);
    }
  };

  if (options.onError) {
    recognition.onerror = options.onError;
  }

  if (options.onEnd) {
    recognition.onend = options.onEnd;
  }

  try {
    recognition.start();
  } catch (e) {
    console.error("Failed to start speech recognition:", e);
  }

  return recognition;
}