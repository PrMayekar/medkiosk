import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Pencil, Check } from "lucide-react";
import Logo from "../components/Logo";
import Button from "../components/Button";
import RedFlagAlert from "../components/RedFlagAlert";
import { useIntake } from "../services/IntakeContext";
import { t } from "../data/translations";
import { evaluateRedFlags } from "../services/redFlag";
import { getClinicalSummary } from "../services/groq";
import { addQueuedPatient, nextQueueNumber, type QueuedPatient } from "../services/patientQueue";
import { mockPatients } from "../data/mockPatients";

const reviewFields: { field: string; labelKey: Parameters<typeof t>[1] }[] = [
  { field: "presenting_complaint", labelKey: "sectionPresenting" },
  { field: "past_medical_history", labelKey: "sectionHistory" },
  { field: "medications", labelKey: "sectionMeds" },
  { field: "allergies", labelKey: "sectionAllergies" },
  { field: "lifestyle", labelKey: "sectionLifestyle" },
  { field: "additionalNotes", labelKey: "sectionAdditionalNotes" },
];

export default function Review() {
  const navigate = useNavigate();
  const { state, setState } = useIntake();
  const lang = state.language;
  const [editingField, setEditingField] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const redFlag = evaluateRedFlags(state.answers);

  const updateAnswer = (field: string, value: string) =>
    setState((s) => ({ ...s, answers: { ...s.answers, [field]: value } }));

  async function handleSubmit() {
    setSubmitting(true);
    const { summary } = await getClinicalSummary({
      language: lang,
      pathway: state.pathway,
      patientData: { answers: state.answers },
      redFlag: redFlag.triggered,
    });

    const queueNumber = nextQueueNumber(mockPatients.map((p) => p.queueNumber));

    const queuedPatient: QueuedPatient = {
      id: `intake-${Date.now()}`,
      queueNumber,
      name: state.patient.name || "Demo Patient",
      age: Number(state.patient.age) || 0,
      sex: state.patient.sex || "—",
      pathway: state.pathway === "ayush" ? "Ayurvedic / AYUSH" : "General Medicine",
      status: "Ready for Review",
      redFlag: redFlag.triggered,
      redFlagReason: redFlag.reason,
      abhaLinked: state.abhaLinked,
      abhaId: state.abhaId,
      complaint: state.answers.presenting_complaint || "Not provided",
      symptoms: state.answers.associated_symptoms || "Not provided",
      medications: state.answers.medications || "Not provided",
      allergies: state.answers.allergies || "Not provided",
      familyHistory: state.answers.family_history || "Not provided",
      additionalNotes: state.answers.additionalNotes || "Not provided",
      answers: state.answers,
      transcript: state.transcript.map((t) => ({ role: t.role, text: t.text })),
      documents: state.documents,
      aiNotes: redFlag.triggered
        ? `Rule-based screening flagged: ${redFlag.reason}`
        : "No red-flag criteria met by rule-based screening.",
      submittedAt: Date.now(),
      summary,
    };

    // Additive — appends to whatever is already in the queue, never
    // replaces an existing patient.
    addQueuedPatient(queuedPatient);

    setState((s) => ({ ...s, summary, redFlag, queueNumber }));
    setSubmitting(false);
    navigate("/complete");
  }

  return (
    <div className="flex min-h-screen flex-col kiosk-page">
      <header className="mx-auto w-full max-w-2xl px-5 pt-6">
        <Logo size="sm" />
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-5 py-8">
        <h1 className="font-display text-3xl font-semibold text-ink">{t(lang, "reviewTitle")}</h1>
        <p className="mt-2 text-sm text-ink-faint">{t(lang, "reviewSub")}</p>
        {state.abhaLinked && (
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">
            {t(lang, "abhaLinkedConfirmation")}
          </span>
        )}

        <div className="mt-6">
          <RedFlagAlert
            result={redFlag}
            titleFlag={t(lang, "redFlagTitle")}
            bodyFlag={t(lang, "redFlagBody")}
            note={t(lang, "redFlagNote")}
            normalMessage={t(lang, "normalQueue")}
          />
        </div>

        <div className="mt-6 space-y-3">
          {reviewFields.map(({ field, labelKey }) => {
            const value = state.answers[field] || "";
            const isEditing = editingField === field;
            const isOptional = field === "additionalNotes";
            if (isOptional && !value && !isEditing) return null;
            return (
              <div key={field} className="card p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                    {t(lang, labelKey)}
                  </span>
                  <button
                    onClick={() => setEditingField(isEditing ? null : field)}
                    className="touch-target flex h-8 w-8 items-center justify-center rounded-full text-teal-600 hover:bg-teal-50"
                    aria-label={t(lang, "edit")}
                  >
                    {isEditing ? <Check size={15} /> : <Pencil size={15} />}
                  </button>
                </div>
                {isEditing ? (
                  <textarea
                    autoFocus
                    value={value}
                    onChange={(e) => updateAnswer(field, e.target.value)}
                    className="mt-2 w-full resize-none rounded-lg border border-line bg-white p-2.5 text-sm outline-none focus:border-teal-400"
                    rows={2}
                  />
                ) : (
                  <p className="mt-1.5 text-[15px] text-ink">{value || "—"}</p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex justify-between">
          <Button variant="ghost" onClick={() => navigate("/intake")}>
            {t(lang, "back")}
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "…" : t(lang, "submitIntake")}
          </Button>
        </div>
      </main>
    </div>
  );
}
