import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import Logo from "../components/Logo";
import VoiceAssistant, { findSpokenOption, spokenDigits } from "../components/VoiceAssistant";
import { useIntake } from "../services/IntakeContext";
import { t } from "../data/translations";

const DEMO_ABHA_ID = "91-7482-1093-5567";

type Step = "choice" | "id" | "linked";

function formatAbhaInput(raw: string) {
  const digits = spokenDigits(raw);
  const parts = [digits.slice(0, 2), digits.slice(2, 6), digits.slice(6, 10), digits.slice(10, 14)].filter(Boolean);
  return parts.join("-");
}

export default function ABHAPage() {
  const navigate = useNavigate();
  const { state, setState } = useIntake();
  const lang = state.language;
  const [step, setStep] = useState<Step>(state.abhaLinked ? "linked" : "choice");
  const [idInput, setIdInput] = useState(state.abhaId ?? "");
  const [linking, setLinking] = useState(false);

  const yesNo = [
    { value: "yes", label: lang === "en" ? "Yes" : lang === "hi" ? "हाँ" : "होय" },
    { value: "no", label: lang === "en" ? "No" : lang === "hi" ? "नहीं" : "नाही" },
  ];

  if (step === "linked") {
    return (
      <div className="kiosk-page flex min-h-screen flex-col">
        <header className="mx-auto w-full max-w-4xl px-6 pt-6 sm:px-8 sm:pt-8"><Logo size="sm" /></header>
        <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-6 py-8 sm:px-8 sm:py-10">
          <div className="mx-auto w-full max-w-3xl rounded-[2rem] border-2 border-white/40 bg-white p-7 text-center shadow-[0_10px_0_rgba(5,67,111,.25)] sm:p-10">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"><CheckCircle2 size={44} /></div>
            <h1 className="mt-6 font-display text-3xl font-extrabold text-sky-950 sm:text-5xl">{t(lang, "abhaLinkedConfirmation")}</h1>
            <p className="mt-4 text-xl font-bold text-sky-800">{state.abhaId}</p>
            <button type="button" onClick={() => navigate("/pathway")} className="mt-8 min-h-[72px] w-full rounded-3xl bg-sky-700 px-7 text-xl font-extrabold text-white shadow-[0_6px_0_#075985] active:translate-y-[3px] active:shadow-[0_2px_0_#075985]">{t(lang, "continueBtn")}</button>
          </div>
        </main>
      </div>
    );
  }

  if (step === "choice") {
    return (
      <div className="kiosk-page flex min-h-screen flex-col">
        <header className="mx-auto w-full max-w-4xl px-6 pt-6 sm:px-8 sm:pt-8"><Logo size="sm" /></header>
        <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-6 py-8 sm:px-8 sm:py-10">
          <VoiceAssistant
            language={lang}
            prompt={`${t(lang, "abhaTitle")}. ${t(lang, "abhaSubtitle")}`}
            placeholder={lang === "en" ? "Say yes or no…" : lang === "hi" ? "हाँ या नहीं बोलें…" : "होय किंवा नाही म्हणा…"}
            submitLabel={t(lang, "continueBtn")}
            listeningLabel={t(lang, "listening")}
            tapToSpeakLabel={t(lang, "tapToSpeak")}
            editLabel={t(lang, "edit")}
            editHint={t(lang, "editTranscript")}
            autoStart
            onSubmit={(answer) => {
              const match = findSpokenOption(answer, yesNo);
              if (!match) return;
              if (match.value === "no") {
                setState((s) => ({ ...s, abhaConsent: false }));
                navigate("/pathway");
                return;
              }
              setState((s) => ({ ...s, abhaConsent: true }));
              setStep("id");
            }}
            onCancel={() => navigate("/consent")}
          />
          <div className="mx-auto mt-5 max-w-3xl text-center text-sm font-bold text-white/80">
            {t(lang, "abhaDemoNote")}
          </div>
        </main>
      </div>
    );
  }

  const formattedId = formatAbhaInput(idInput);
  const validId = formattedId.replace(/\D/g, "").length === 14;

  return (
    <div className="kiosk-page flex min-h-screen flex-col">
      <header className="mx-auto w-full max-w-4xl px-6 pt-6 sm:px-8 sm:pt-8"><Logo size="sm" /></header>
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-6 py-8 sm:px-8 sm:py-10">
        <VoiceAssistant
          language={lang}
          prompt={t(lang, "abhaIdLabel")}
          initialValue={idInput}
          placeholder={t(lang, "abhaIdPlaceholder")}
          submitLabel={linking ? t(lang, "abhaLinking") : t(lang, "abhaLinkButton")}
          listeningLabel={t(lang, "listening")}
          tapToSpeakLabel={t(lang, "tapToSpeak")}
          editLabel={t(lang, "edit")}
          editHint={lang === "en" ? "Say all 14 digits, or edit the number below." : lang === "hi" ? "14 अंक बोलें, या नीचे नंबर संपादित करें।" : "14 अंक म्हणा किंवा खालील क्रमांक संपादित करा."}
          autoStart
          submitting={linking}
          onSubmit={(answer) => {
            const formatted = formatAbhaInput(answer);
            setIdInput(formatted);
            if (formatted.replace(/\D/g, "").length !== 14) return;
            setLinking(true);
            window.setTimeout(() => {
              setLinking(false);
              setState((s) => ({ ...s, abhaConsent: true, abhaId: formatted, abhaLinked: true }));
              setStep("linked");
            }, 700);
          }}
          onCancel={() => setStep("choice")}
        />
        {!validId && idInput && <p className="mx-auto mt-4 rounded-2xl bg-white px-4 py-3 text-center text-sm font-bold text-red-700">{t(lang, "abhaIdPlaceholder")}</p>}
        <button
          type="button"
          onClick={() => setIdInput(DEMO_ABHA_ID)}
          className="mx-auto mt-4 min-h-[52px] rounded-2xl border-2 border-white/40 bg-white/10 px-5 text-sm font-extrabold text-white underline underline-offset-4 transition-all active:translate-y-0.5"
        >
          {t(lang, "abhaUseDemoId")}
        </button>
      </main>
    </div>
  );
}
