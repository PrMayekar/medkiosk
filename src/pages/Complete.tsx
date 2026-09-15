import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, Clock, PartyPopper } from "lucide-react";
import Logo from "../components/Logo";
import Button from "../components/Button";
import DisclaimerFooter from "../components/DisclaimerFooter";
import { useIntake } from "../services/IntakeContext";
import { t } from "../data/translations";
import { initialIntakeState } from "../types/intake";

export default function Complete() {
  const navigate = useNavigate();
  const { state, setState } = useIntake();
  const lang = state.language;

  useEffect(() => {
    if (!state.queueNumber) navigate("/");
  }, [state.queueNumber, navigate]);

  const statuses = [t(lang, "statusHistory"), t(lang, "statusSummary"), t(lang, "statusSent")];

  const startAnother = () => {
    setState({ ...initialIntakeState, language: lang });
    navigate("/");
  };

  return (
    <div className="flex min-h-screen flex-col kiosk-page">
      <header className="mx-auto w-full max-w-lg px-5 pt-6">
        <Logo size="sm" />
      </header>
      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-5 py-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-500 text-white">
          <PartyPopper size={28} />
        </div>
        <h1 className="mt-6 font-display text-3xl font-semibold text-ink">{t(lang, "completeTitle")}</h1>

        <div className="mt-8 w-full card p-7">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">{t(lang, "queueLabel")}</p>
          <p className="font-display text-5xl font-semibold text-teal-600">{state.queueNumber}</p>
          <div className="mt-3 flex items-center justify-center gap-1.5 text-sm text-ink-faint">
            <Clock size={14} />
            <span>
              {t(lang, "waitLabel")}: {t(lang, "waitTime")}
            </span>
          </div>

          <div className="mt-6 space-y-2.5 border-t border-line pt-5 text-left">
            {statuses.map((status) => (
              <div key={status} className="flex items-center gap-2 text-sm text-ink">
                <CheckCircle2 size={16} className="shrink-0 text-teal-500" />
                {status}
              </div>
            ))}
          </div>
        </div>

        <p className="mt-6 text-sm text-ink-soft">{t(lang, "proceedWaiting")}</p>

        <div className="kiosk-actions mt-8 w-full max-w-lg">
          <Button variant="secondary" onClick={startAnother}>
            {t(lang, "startNew")}
          </Button>
          <Button onClick={() => navigate("/doctor")}>{t(lang, "ctaDoctor")}</Button>
        </div>
      </main>
      <DisclaimerFooter language={lang} />
    </div>
  );
}
