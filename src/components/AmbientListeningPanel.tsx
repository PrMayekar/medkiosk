import { useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2, Save, CheckCircle2, Radio } from "lucide-react";
import type { LanguageCode } from "../types/intake";
import { isSpeechRecognitionSupported } from "./VoiceInput";
import { generateAmbientSummary } from "../services/ambientListening";
import { loadAmbientNote, saveAmbientNote, type AmbientNote } from "../services/ambientNotes";

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

function getRecognitionCtor(): (new () => MinimalSpeechRecognition) | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

interface AmbientListeningPanelProps {
  patientId: string;
  language: LanguageCode;
  onSaved?: () => void;
}

export default function AmbientListeningPanel({ patientId, language, onSaved }: AmbientListeningPanelProps) {
  const [consentGiven, setConsentGiven] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [generating, setGenerating] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [aiAvailable, setAiAvailable] = useState(true);
  const [saved, setSaved] = useState(false);

  const recognitionRef = useRef<MinimalSpeechRecognition | null>(null);
  const supportsVoice = isSpeechRecognitionSupported();

  // Load any previously saved ambient note for this patient.
  useEffect(() => {
    const existing = loadAmbientNote(patientId);
    if (existing) {
      setConsentGiven(existing.consentGiven);
      setTranscript(existing.transcript);
      setSummary(existing.summary);
    } else {
      setConsentGiven(false);
      setTranscript("");
      setSummary(null);
    }
    setSaved(false);
    setInterim("");
    setListening(false);
    recognitionRef.current?.stop();
  }, [patientId]);

  function startListening() {
    const Ctor = getRecognitionCtor();
    if (!Ctor || !consentGiven) return;

    const recognition = new Ctor();
    recognition.lang = language === "hi" ? "hi-IN" : language === "mr" ? "mr-IN" : "en-IN";
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event: any) => {
      let finalChunk = "";
      let interimChunk = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) finalChunk += `${result[0].transcript} `;
        else interimChunk += result[0].transcript;
      }
      if (finalChunk) setTranscript((prev) => `${prev}${prev && !prev.endsWith(" ") ? " " : ""}${finalChunk}`.trim() + " ");
      setInterim(interimChunk);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    setSaved(false);
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setListening(false);
    setInterim("");
  }

  async function handleGenerateSummary() {
    const text = transcript.trim();
    if (!text || generating) return;
    setGenerating(true);
    const result = await generateAmbientSummary(text, language);
    setSummary(result.summary);
    setAiAvailable(result.aiAvailable);
    setGenerating(false);
    setSaved(false);
  }

  function handleSave() {
    if (!summary) return;
    const note: AmbientNote = {
      patientId,
      consentGiven: true,
      transcript: transcript.trim(),
      summary,
      capturedAt: Date.now(),
    };
    saveAmbientNote(note);
    setSaved(true);
    onSaved?.();
  }

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
            <Radio size={17} />
          </div>
          <div>
            <p className="font-display text-lg font-semibold text-ink">Ambient Listening (Demo)</p>
            <p className="mt-1 text-sm text-ink-faint">
              Captures the doctor-patient conversation with the patient's consent and turns it into a short
              consultation note added to this patient's record. Uses the browser's built-in microphone — no
              external speech service, and nothing is sent anywhere without pressing "Generate Summary" below.
            </p>
          </div>
        </div>

        <label className="mt-4 flex touch-target cursor-pointer items-start gap-3 rounded-xl border border-line bg-paper/50 p-4">
          <input
            type="checkbox"
            checked={consentGiven}
            onChange={(e) => {
              setConsentGiven(e.target.checked);
              if (!e.target.checked) stopListening();
            }}
            className="mt-0.5 h-5 w-5 shrink-0 accent-teal-600"
          />
          <span className="text-sm font-medium text-ink">
            The patient has given verbal consent for this consultation to be listened to and summarized.
          </span>
        </label>
      </div>

      <div className={`card p-5 ${!consentGiven ? "opacity-50" : ""}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-ink">Live transcript</p>
          {supportsVoice ? (
            !listening ? (
              <button
                type="button"
                onClick={startListening}
                disabled={!consentGiven}
                className="touch-target inline-flex items-center gap-2 rounded-full bg-teal-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
              >
                <Mic size={15} /> Start Listening
              </button>
            ) : (
              <button
                type="button"
                onClick={stopListening}
                className="touch-target inline-flex items-center gap-2 rounded-full bg-signal-red px-4 py-2 text-sm font-semibold text-white"
              >
                <Square size={14} /> Stop
              </button>
            )
          ) : (
            <span className="text-xs text-ink-faint">Voice capture not supported in this browser — type or paste below.</span>
          )}
        </div>

        {listening && (
          <div className="mt-3 flex items-center gap-2 text-xs font-medium text-signal-red">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-signal-red opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-signal-red" />
            </span>
            Recording…
          </div>
        )}

        <textarea
          value={transcript + (interim ? (transcript ? " " : "") + interim : "")}
          onChange={(e) => {
            setTranscript(e.target.value);
            setSaved(false);
          }}
          disabled={!consentGiven || listening}
          placeholder="Transcript will appear here as the conversation is captured — or type/paste one manually."
          rows={6}
          className="mt-3 w-full resize-none rounded-xl border border-line bg-white p-3.5 text-sm leading-relaxed text-ink outline-none focus:border-teal-400 disabled:bg-paper disabled:text-ink-faint"
        />

        <button
          type="button"
          onClick={handleGenerateSummary}
          disabled={!consentGiven || !transcript.trim() || generating}
          className="touch-target mt-3 inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white disabled:opacity-30"
        >
          {generating ? <Loader2 size={15} className="animate-spin" /> : null}
          {generating ? "Generating summary..." : "Generate Summary"}
        </button>
      </div>

      {summary && (
        <div className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-ink">Consultation summary</p>
            {!aiAvailable && (
              <span className="rounded-full bg-clay-400/10 px-2.5 py-0.5 text-[11px] font-semibold text-clay-600">
                AI unavailable — offline summary
              </span>
            )}
          </div>
          <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-ink">{summary}</p>

          <button
            type="button"
            onClick={handleSave}
            className="touch-target mt-4 inline-flex items-center gap-2 rounded-full bg-teal-500 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-600"
          >
            {saved ? <CheckCircle2 size={15} /> : <Save size={15} />}
            {saved ? "Saved to patient record" : "Save to Patient Record"}
          </button>
        </div>
      )}
    </div>
  );
}
