import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import Button from "../components/Button";
import LanguageSelector from "../components/LanguageSelector";
import { useIntake } from "../services/IntakeContext";
import { t } from "../data/translations";

export default function LanguagePage() {
  const navigate = useNavigate();
  const { state, setState } = useIntake();
  const lang = state.language;

  return (
    <div className="kiosk-page flex min-h-screen flex-col">
      <header className="mx-auto w-full max-w-3xl px-8 pt-8"><Logo size="sm" /></header>
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-8 py-10">
        <div className="text-center">
          <p className="text-sm font-extrabold uppercase tracking-[0.25em] text-white/70">STEP 1</p>
          <h1 className="mt-3 font-display text-4xl font-extrabold sm:text-5xl">{t(lang, "chooseLanguage")}</h1>
          <p className="mt-3 text-lg text-white/80">{t(lang, "chooseLanguageSub")}</p>
        </div>
        <div className="mt-9"><LanguageSelector value={lang} onChange={(l) => setState((s) => ({ ...s, language: l }))} /></div>
        <div className="mt-10 flex justify-between gap-4">
          <Button variant="ghost" onClick={() => navigate("/")}>{t(lang, "back")}</Button>
          <Button size="lg" onClick={() => { setState((s) => ({ ...s, interactionMode: "voice" })); navigate("/consent"); }}>{t(lang, "continueBtn")}</Button>
        </div>
      </main>
    </div>
  );
}
