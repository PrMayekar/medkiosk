import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import Button from "../components/Button";
import LanguageSelector from "../components/LanguageSelector";
import DisclaimerFooter from "../components/DisclaimerFooter";
import { useIntake } from "../services/IntakeContext";
import { t } from "../data/translations";
import { initialIntakeState } from "../types/intake";

export default function Welcome() {
  const navigate = useNavigate();
  const { state, setState } = useIntake();
  const lang = state.language;

  // Modal visibility state
  const [showPrototypeModal, setShowPrototypeModal] = useState(true);

  const startNew = () => {
    setState({ ...initialIntakeState, language: lang });
    navigate("/language");
  };

  const continueReturning = () =>
    navigate(state.consentGiven ? "/intake" : "/language");

  return (
    <div className="kiosk-page flex min-h-screen flex-col">
      {/* ===== Prototype Disclaimer Modal ===== */}
      {showPrototypeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="prototype-modal-title"
        >
          <div className="relative w-full max-w-2xl rounded-2xl border border-white/20 bg-white/10 p-8 text-white shadow-2xl backdrop-blur-md">
            <button
              onClick={() => setShowPrototypeModal(false)}
              aria-label="Close disclaimer"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-lg font-bold text-white transition hover:bg-white/30"
            >
              ✕
            </button>

            <div className="mb-4 inline-block rounded-full bg-amber-400/20 px-3 py-1 text-xs font-extrabold uppercase tracking-widest text-amber-200">
              Prototype Notice
            </div>

            <h2
              id="prototype-modal-title"
              className="font-display text-2xl font-extrabold sm:text-3xl"
            >
              This is a Prototype Demo
            </h2>

            <div className="mt-4 space-y-3 text-sm text-white/85 sm:text-base">
              <p>
                This kiosk is a <strong>lightweight prototype</strong> built to
                demonstrate the intended user flow and experience. The language
                and speech models you see here are simplified versions for
                demonstration only.
              </p>
              <p>
                The <strong>production version</strong> will integrate proper
                AI models such as <strong>Bhashini AI</strong> for Indian
                language translation, speech-to-text, and text-to-speech —
                delivering accurate, multilingual, and region-aware
                interactions.
              </p>
              <p>
                The final system will be integrated with{" "}
                <strong>OpenEMR</strong> as the electronic medical records
                backend, with a <strong>PHP + MariaDB</strong> stack ensuring
                secure, standards-compliant data storage and proper clinical
                workflow integration.
              </p>
            </div>

            <div className="mt-6 flex flex-col items-center justify-end gap-3 sm:flex-row">
              <Button
                size="md"
                onClick={() => setShowPrototypeModal(false)}
                className="w-full sm:w-auto"
              >
                Got it
              </Button>
            </div>
          </div>
        </div>
      )}

      <header className="mx-auto flex w-full max-w-5xl items-center justify-between px-8 pt-8">
        <Logo />
        <LanguageSelector
          compact
          value={lang}
          onChange={(l) => setState((s) => ({ ...s, language: l }))}
        />
      </header>

      <div className="mx-auto w-full max-w-5xl px-8 pt-5">
        <div className="rounded-2xl border border-white/30 bg-white/10 px-5 py-3 text-center text-sm font-medium text-white/90 backdrop-blur-sm">
          <span className="font-extrabold">Prototype Notice:</span>{" "}
          {t(lang, "prototypeNotice")}
        </div>
      </div>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-8 py-10 text-center">
        <p className="mb-3 text-sm font-extrabold uppercase tracking-[0.3em] text-white/75">
          MediKiosk
        </p>
        <h1 className="font-display text-5xl font-extrabold tracking-tight sm:text-7xl">
          WELCOME
        </h1>
        <p className="mt-4 max-w-2xl text-lg font-semibold text-white/85 sm:text-xl">
          {t(lang, "heroSubtitle")}
        </p>

        <div className="mt-10 grid w-full max-w-3xl grid-cols-1 gap-5 sm:grid-cols-2">
          <Button size="lg" onClick={startNew} className="min-h-[96px] text-2xl">
            {t(lang, "ctaStart")}
          </Button>
          <Button
            size="lg"
            variant="secondary"
            onClick={continueReturning}
            className="min-h-[96px] text-2xl"
          >
            {t(lang, "continueReturning")}
          </Button>
          <Button
            size="lg"
            variant="secondary"
            onClick={() => navigate("/doctor")}
            className="min-h-[96px] text-2xl"
          >
            {t(lang, "ctaDoctor")}
          </Button>
          <Button
            size="lg"
            variant="ghost"
            onClick={() => navigate("/settings")}
            className="min-h-[96px] text-2xl"
          >
            Settings
          </Button>
        </div>

        <p className="mt-7 max-w-xl text-sm font-medium text-white/65">
          {t(lang, "demoNotice")}
        </p>
      </main>

      <DisclaimerFooter language={lang} />
    </div>
  );
}