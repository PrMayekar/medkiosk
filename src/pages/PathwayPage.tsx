import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import VoiceAssistant, { findSpokenOption } from "../components/VoiceAssistant";
import { useIntake } from "../services/IntakeContext";
import { t } from "../data/translations";

export default function PathwayPage() {
  const navigate = useNavigate();
  const { state, setState } = useIntake();
  const lang = state.language;
  const options = [
    { value: "general", label: t(lang, "pathwayGeneral") },
    { value: "ayush", label: t(lang, "pathwayAyush") },
  ];

  const prompt = `${t(lang, "pathwayTitle")}. ${t(lang, "pathwayGeneral")}, ${t(lang, "pathwayAyush")}.`;

  return (
    <div className="kiosk-page flex min-h-screen flex-col">
      <header className="mx-auto w-full max-w-4xl px-6 pt-6 sm:px-8 sm:pt-8"><Logo size="sm" /></header>
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-6 py-8 sm:px-8 sm:py-10">
        <VoiceAssistant
          language={lang}
          prompt={prompt}
          placeholder={lang === "en" ? "Say General Medical Care or Ayurvedic / AYUSH Care…" : lang === "hi" ? "सामान्य चिकित्सा या आयुर्वेदिक / आयुष बोलें…" : "सामान्य वैद्यकीय सेवा किंवा आयुर्वेदिक / आयुष म्हणा…"}
          submitLabel={t(lang, "continueBtn")}
          listeningLabel={t(lang, "listening")}
          tapToSpeakLabel={t(lang, "tapToSpeak")}
          editLabel={t(lang, "edit")}
          editHint={t(lang, "editTranscript")}
          autoStart
          onSubmit={(answer) => {
            const match = findSpokenOption(answer, options);
            if (!match) return;
            setState((s) => ({ ...s, pathway: match.value as "general" | "ayush" }));
            navigate("/demographics");
          }}
          onCancel={() => navigate("/abha")}
        />
      </main>
    </div>
  );
}
