import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import VoiceAssistant, { findSpokenOption } from "../components/VoiceAssistant";
import { useIntake } from "../services/IntakeContext";
import { t, tList } from "../data/translations";

export default function DemographicsPage() {
  const navigate = useNavigate();
  const { state, setState } = useIntake();
  const lang = state.language;
  const sexOptions = tList(lang, "sexOptions").map((label, index) => ({
    value: index === 0 ? "male" : index === 1 ? "female" : "other",
    label,
  }));
  const [step, setStep] = useState<"name" | "age" | "sex">("name");

  useEffect(() => {
    if (!state.pathway) navigate("/pathway");
  }, [state.pathway, navigate]);

  const prompts = {
    name: t(lang, "nameLabel"),
    age: t(lang, "ageLabel"),
    sex: t(lang, "sexLabel"),
  } as const;

  const nextStep = () => {
    if (step === "name") setStep("age");
    else if (step === "age") setStep("sex");
    else navigate("/intake");
  };

  const value = state.patient[step];
  const prompt = step === "sex"
    ? `${prompts.sex}. ${sexOptions.map((option) => option.label).join(", ")}`
    : prompts[step];

  return (
    <div className="kiosk-page flex min-h-screen flex-col">
      <header className="mx-auto w-full max-w-4xl px-6 pt-6 sm:px-8 sm:pt-8"><Logo size="sm" /></header>
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-6 py-8 sm:px-8 sm:py-10">
        <VoiceAssistant
          key={step}
          language={lang}
          prompt={prompt}
          initialValue={value}
          placeholder={step === "name" ? t(lang, "nameLabel") : step === "age" ? t(lang, "ageLabel") : t(lang, "sexLabel")}
          submitLabel={t(lang, "continueBtn")}
          listeningLabel={t(lang, "listening")}
          tapToSpeakLabel={t(lang, "tapToSpeak")}
          editLabel={t(lang, "edit")}
          editHint={t(lang, "editTranscript")}
          autoStart
          onSubmit={(answer) => {
            if (step === "sex") {
              const match = findSpokenOption(answer, sexOptions);
              if (!match) return;
              setState((s) => ({ ...s, patient: { ...s.patient, sex: match.label } }));
              nextStep();
              return;
            }
            setState((s) => ({ ...s, patient: { ...s.patient, [step]: answer } }));
            nextStep();
          }}
          onCancel={() => navigate("/pathway")}
        />
        <div className="mx-auto mt-5 text-center text-sm font-extrabold text-white/80">
          {t(lang, "stepLabel")} {step === "name" ? 1 : step === "age" ? 2 : 3} {t(lang, "of")} 3
        </div>
      </main>
    </div>
  );
}
