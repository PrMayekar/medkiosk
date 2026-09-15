import { useNavigate } from "react-router-dom";
import { ChevronLeft, RotateCcw } from "lucide-react";
import Logo from "../components/Logo";
import Button from "../components/Button";
import LanguageSelector from "../components/LanguageSelector";
import { useIntake } from "../services/IntakeContext";
import { clearSession } from "../services/session";
import { initialIntakeState } from "../types/intake";
import { t } from "../data/translations";

export default function Settings() {
  const navigate = useNavigate();
  const { state, setState } = useIntake();
  const lang = state.language;

  const resetDemo = () => {
    clearSession();
    setState(initialIntakeState);
    navigate("/");
  };

  return (
    <div className="flex min-h-screen flex-col kiosk-page">
      <header className="mx-auto flex w-full max-w-xl items-center gap-3 px-5 pt-6">
        <button
          onClick={() => navigate(-1)}
          className="touch-target flex h-9 w-9 items-center justify-center rounded-full hover:bg-black/5"
          aria-label="Back"
        >
          <ChevronLeft size={18} />
        </button>
        <Logo size="sm" />
      </header>

      <main className="mx-auto w-full max-w-xl flex-1 px-5 py-10">
        <h1 className="font-display text-2xl font-semibold text-ink">Prototype Settings</h1>
        <p className="mt-1 text-sm text-ink-faint">{t(lang, "privacyNote")}</p>

        <div className="mt-8 card p-6">
          <p className="text-sm font-semibold text-ink">{t(lang, "chooseLanguage")}</p>
          <div className="mt-3">
            <LanguageSelector value={lang} onChange={(l) => setState((s) => ({ ...s, language: l }))} />
          </div>
        </div>

        <div className="mt-6 card p-6">
          <p className="text-sm font-semibold text-ink">Interaction mode</p>
          <p className="mt-1 text-sm text-ink-faint">
            Currently: <span className="font-medium text-ink">{state.interactionMode ?? "Not set"}</span>
          </p>
        </div>

        <div className="mt-6 card p-6">
          <p className="text-sm font-semibold text-ink">Reset demo session</p>
          <p className="mt-1 text-sm text-ink-faint">
            Clears the locally stored demo intake and returns you to the welcome screen. No hospital record system
            is affected — this prototype does not use a database.
          </p>
          <Button variant="danger" className="mt-4" onClick={resetDemo}>
            <RotateCcw size={15} />
            Reset demo
          </Button>
        </div>
      </main>
    </div>
  );
}
