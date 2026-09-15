import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import Button from "../components/Button";
import VoiceAssistant, { findSpokenOption } from "../components/VoiceAssistant";
import { useIntake } from "../services/IntakeContext";
import { t } from "../data/translations";

export default function ConsentPage() {
  const navigate = useNavigate();
  const { state, setState } = useIntake();
  const lang = state.language;
  const options = [
    { value: "yes", label: lang === "en" ? "Yes" : lang === "hi" ? "हाँ" : "होय" },
    { value: "no", label: lang === "en" ? "No" : lang === "hi" ? "नहीं" : "नाही" },
  ];

  const prompt = `${t(lang, "consentTitle")}. ${t(lang, "consentBody")} ${t(lang, "consentCheckbox")}`;

  return (
    <div className="kiosk-page flex min-h-screen flex-col">
      <header className="mx-auto w-full max-w-4xl px-6 pt-6 sm:px-8 sm:pt-8"><Logo size="sm" /></header>
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-6 py-8 sm:px-8 sm:py-10">
        <VoiceAssistant
          language={lang}
          prompt={prompt}
          placeholder={lang === "en" ? "Your answer will appear here…" : "आपका उत्तर यहाँ दिखाई देगा…"}
          submitLabel={t(lang, "continueBtn")}
          listeningLabel={t(lang, "listening")}
          tapToSpeakLabel={t(lang, "tapToSpeak")}
          editLabel={t(lang, "edit")}
          editHint={t(lang, "editTranscript")}
          autoStart
          onSubmit={(answer) => {
            const match = findSpokenOption(answer, options);
            if (match?.value === "yes") {
              setState((s) => ({ ...s, consentGiven: true, interactionMode: "voice" }));
              navigate("/abha");
            }
          }}
          onCancel={() => navigate("/language")}
        />
        <div className="mx-auto mt-5 max-w-3xl text-center text-sm font-bold text-white/80">
          {lang === "en" ? "Say “yes” to continue." : lang === "hi" ? "जारी रखने के लिए “हाँ” बोलें।" : "पुढे जाण्यासाठी “होय” म्हणा."}
        </div>
      </main>
    </div>
  );
}
