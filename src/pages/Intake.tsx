import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Info } from "lucide-react";
import Logo from "../components/Logo";
import ProgressBar from "../components/ProgressBar";
import SectionTracker from "../components/SectionTracker";
import ChatMessage from "../components/ChatMessage";
import QuestionCard from "../components/QuestionCard";
import DocumentUpload from "../components/DocumentUpload";
import { useIntake } from "../services/IntakeContext";
import { t } from "../data/translations";
import { getNextQuestion } from "../services/groq";
import { classifyRelevance } from "../services/relevance";
import type { IntakeQuestion, SectionKey, TranscriptTurn } from "../types/intake";

const ESTIMATED_TOTAL_STEPS = 11;
const MAX_ATTEMPTS_BEFORE_SKIP = 2;

const EXTRA_NOTES_CHOICE_FIELD = "extra_notes_choice";
const ADDITIONAL_NOTES_FIELD = "additional_notes";
const DOCUMENT_UPLOAD_FIELD = "document_upload";

function buildSections(lang: ReturnType<typeof useIntake>["state"]["language"]) {
  return [
    { key: "presenting_complaint" as SectionKey, label: t(lang, "sectionPresenting") },
    { key: "past_medical_history" as SectionKey, label: t(lang, "sectionHistory") },
    { key: "medications" as SectionKey, label: t(lang, "sectionMeds") },
    { key: "allergies" as SectionKey, label: t(lang, "sectionAllergies") },
    { key: "lifestyle" as SectionKey, label: t(lang, "sectionLifestyle") },
    { key: "review" as SectionKey, label: t(lang, "sectionReview") },
  ];
}

function makeTurn(role: TranscriptTurn["role"], text: string): TranscriptTurn {
  return { id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, role, text, timestamp: Date.now() };
}

export default function Intake() {
  const navigate = useNavigate();
  const { state, setState } = useIntake();
  const lang = state.language;
  const sections = buildSections(lang);

  const [currentQuestion, setCurrentQuestion] = useState<IntakeQuestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusIsError, setStatusIsError] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fetchedForCount = useRef<number>(-1);

  useEffect(() => {
    if (!state.pathway) {
      navigate("/pathway");
    }
  }, [state.pathway, navigate]);

  // Reset per-question UI state (attempts, status message) whenever the
  // active question actually changes, so stale errors don't linger.
  useEffect(() => {
    setAttemptCount(0);
    setStatusMessage(null);
    setStatusIsError(false);
  }, [currentQuestion?.field]);

  // Fetch the next question from Groq (or the local fallback) whenever the
  // running question count advances.
  useEffect(() => {
    if (state.isComplete) {
      navigate("/review");
      return;
    }
    if (fetchedForCount.current === state.questionsAsked) return;
    fetchedForCount.current = state.questionsAsked;
    void fetchQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.questionsAsked, state.isComplete]);

  // Ensure the conversation container scrolls to the bottom after any new content (assistant turn, next question, or loading).
  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    // Allow the DOM to paint the new content before measuring.
    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  }, [state.transcript.length, currentQuestion, loading]);

  async function fetchQuestion() {
    setLoading(true);
    const { question, aiAvailable } = await getNextQuestion(
      {
        language: lang,
        pathway: state.pathway,
        conversation: state.transcript,
        patientData: { answers: state.answers },
      },
      state.questionsAsked
    );
    setLoading(false);

    if (question.isComplete) {
      // The interview engine is complete. Make document upload the final
      // intake question before moving to the optional additional-notes step.
      const documentQuestion: IntakeQuestion = {
        message: t(lang, "documentQuestion"),
        questionType: "text",
        options: [],
        field: DOCUMENT_UPLOAD_FIELD,
        nextSection: "review",
        isComplete: false,
      };
      setCurrentQuestion(documentQuestion);
      setState((s) => ({
        ...s,
        aiAvailable,
        currentSection: "review",
        transcript: [...s.transcript, makeTurn("assistant", documentQuestion.message)],
      }));
      return;
    }

    setCurrentQuestion(question);
    setState((s) => ({
      ...s,
      aiAvailable,
      currentSection: question.nextSection,
      transcript: [...s.transcript, makeTurn("assistant", question.message)],
    }));
  }

  function acceptAnswer(rawValue: string, field: string) {
    const displayValue = rawValue.trim() || t(lang, "notProvided");
    setState((s) => ({
      ...s,
      answers: { ...s.answers, [field]: displayValue },
      transcript: [...s.transcript, makeTurn("patient", displayValue)],
      questionsAsked: s.questionsAsked + 1,
    }));
    setCurrentQuestion(null);
    setSubmitting(false);
    setStatusMessage(null);
  }

  function handleExtraNotesChoice(label: string, value: string) {
    setState((s) => ({ ...s, transcript: [...s.transcript, makeTurn("patient", label)] }));

    if (value === "yes") {
      const notesQuestion: IntakeQuestion = {
        message: t(lang, "extraNotesPrompt"),
        questionType: "text",
        options: [],
        field: ADDITIONAL_NOTES_FIELD,
        nextSection: "review",
        isComplete: false,
      };
      setCurrentQuestion(notesQuestion);
      setState((s) => ({ ...s, transcript: [...s.transcript, makeTurn("assistant", notesQuestion.message)] }));
    } else {
      setCurrentQuestion(null);
      setState((s) => ({ ...s, isComplete: true }));
    }
  }

  function handleAdditionalNotes(value: string) {
    const trimmed = value.trim();
    setState((s) => ({
      ...s,
      answers: { ...s.answers, additionalNotes: trimmed || t(lang, "notProvided") },
      transcript: trimmed ? [...s.transcript, makeTurn("patient", trimmed)] : s.transcript,
      isComplete: true,
    }));
    setCurrentQuestion(null);
  }

  function moveToExtraNotes() {
    const extraNotesQuestion: IntakeQuestion = {
      message: t(lang, "extraNotesQuestion"),
      questionType: "single_select",
      options: [
        { value: "yes", label: t(lang, "extraNotesYes") },
        { value: "no", label: t(lang, "extraNotesNo") },
      ],
      field: EXTRA_NOTES_CHOICE_FIELD,
      nextSection: "review",
      isComplete: false,
    };
    setCurrentQuestion(extraNotesQuestion);
    setState((s) => ({ ...s, transcript: [...s.transcript, makeTurn("assistant", extraNotesQuestion.message)] }));
  }

  function addDocument(doc: import("../types/intake").UploadedDocument) {
    setState((s) => ({ ...s, documents: [...s.documents, doc] }));
  }

  function markDocumentProcessed(id: string, extracted: string[]) {
    setState((s) => ({
      ...s,
      documents: s.documents.map((d) => d.id === id ? { ...d, status: "processed" as const, extracted } : d),
    }));
  }

  function handleDocumentContinue() {
    if (submitting) return;
    setState((s) => ({ ...s, answers: { ...s.answers, [DOCUMENT_UPLOAD_FIELD]: s.documents.length ? `${s.documents.length} document(s) uploaded` : "No document uploaded" } }));
    moveToExtraNotes();
  }

  async function handleAnswer(value: string) {
    if (!currentQuestion || submitting) return;

    if (!value.trim()) {
      setStatusMessage(t(lang, "emptyAnswerError"));
      setStatusIsError(true);
      return;
    }

    if (currentQuestion.field === DOCUMENT_UPLOAD_FIELD) {
      handleDocumentContinue();
      return;
    }

    if (currentQuestion.field === EXTRA_NOTES_CHOICE_FIELD) {
      const option = currentQuestion.options.find((o) => o.label === value);
      if (!option) {
        setStatusMessage(t(lang, "clarificationMessage"));
        setStatusIsError(true);
        return;
      }
      handleExtraNotesChoice(option.label, option.value);
      return;
    }

    if (currentQuestion.field === ADDITIONAL_NOTES_FIELD) {
      handleAdditionalNotes(value);
      return;
    }

    // Select-type answers (buttons/cards) during the normal interview never
    // need AI relevance classification — they're already constrained.
    if (currentQuestion.questionType !== "text") {
      acceptAnswer(value, currentQuestion.field);
      return;
    }

    const trimmed = value.trim();
    setSubmitting(true);
    setStatusIsError(false);
    setStatusMessage(t(lang, "checkingResponse"));

    const result = await classifyRelevance({
      question: currentQuestion.message,
      response: trimmed,
      language: lang,
      field: currentQuestion.field,
      pathway: state.pathway,
    });

    if (result.relevant) {
      acceptAnswer(result.cleanedResponse || trimmed, currentQuestion.field);
      return;
    }

    // Irrelevant response: don't save it, show a spoken clarification, and
    // let the patient try again (with a skip option after repeated misses).
    setSubmitting(false);
    setStatusMessage(null);
    setAttemptCount((c) => c + 1);
    setState((s) => ({ ...s, transcript: [...s.transcript, makeTurn("assistant", t(lang, "clarificationMessage"))] }));
  }

  function handleSkip() {
    if (!currentQuestion || submitting) return;
    acceptAnswer(t(lang, "notProvided"), currentQuestion.field);
  }

  const stepNumber = Math.min(state.questionsAsked + 1, ESTIMATED_TOTAL_STEPS);
  const showSkip =
    attemptCount >= MAX_ATTEMPTS_BEFORE_SKIP &&
    currentQuestion?.questionType === "text" &&
    currentQuestion.field !== ADDITIONAL_NOTES_FIELD;

  return (
    <div className="flex min-h-screen flex-col kiosk-page">
      <header className="border-b border-line bg-sky-900/20 backdrop-blur">
        <div className="mx-auto max-w-3xl px-5 py-4">
          <div className="flex items-center justify-between">
            <Logo size="sm" />
            <span className="text-xs font-medium text-ink-faint">
              {t(lang, "stepLabel")} {stepNumber} {t(lang, "of")} {ESTIMATED_TOTAL_STEPS}
            </span>
          </div>
          <div className="mt-3">
            <ProgressBar step={stepNumber} total={ESTIMATED_TOTAL_STEPS} />
          </div>
          <div className="mt-3 overflow-x-auto">
            <SectionTracker sections={sections} currentSection={state.currentSection} />
          </div>
        </div>
      </header>

      {!state.aiAvailable && (
        <div className="mx-auto mt-3 flex w-full max-w-3xl items-center gap-2 px-5">
          <div className="flex items-center gap-2 rounded-full bg-clay-400/10 px-3.5 py-1.5 text-xs font-medium text-clay-600">
            <Info size={13} />
            {t(lang, "aiUnavailable")}
          </div>
        </div>
      )}

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-5 py-6">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-extrabold uppercase tracking-[0.2em] text-white/70">PATIENT INTAKE</p>
            <p className="mt-1 text-base font-bold text-white">{t(lang, "intakeGreeting")}</p>
          </div>
          <div className="rounded-2xl border border-white/30 bg-white/10 px-4 py-3 text-right">
            <p className="text-xs font-bold text-white/60">STEP</p>
            <p className="text-xl font-extrabold text-white">{stepNumber}/{ESTIMATED_TOTAL_STEPS}</p>
          </div>
        </div>

        <div ref={scrollRef} className="flex flex-1 items-center justify-center overflow-y-auto py-6" style={{ scrollBehavior: "smooth" }}>
          <div className="w-full">
            {loading && (
              <div className="flex items-center justify-center gap-3 py-10 text-sm font-bold text-white/75">
                <span className="h-3 w-3 animate-pulse rounded-full bg-white" />
                {t(lang, "patientIntake")}…
              </div>
            )}
          </div>
          <div ref={bottomRef} />
        </div>

        {currentQuestion && !loading && (
          <div className="sticky bottom-0 border-t border-white/20 bg-transparent pb-[max(1rem,env(safe-area-inset-bottom))] pt-5">
            {currentQuestion.field === DOCUMENT_UPLOAD_FIELD ? (
              <DocumentUpload
                documents={state.documents}
                onAdd={addDocument}
                onProcessed={markDocumentProcessed}
                title={t(lang, "documentsTitle")}
                subtitle={t(lang, "documentsSub")}
                uploadLabel={t(lang, "uploadDoc")}
                processedLabel={t(lang, "processed")}
                processingLabel={t(lang, "processing")}
                viewLabel={t(lang, "documentView")}
                closeLabel={t(lang, "documentClose")}
                sampleNote={t(lang, "documentSampleOnly")}
                continueLabel={t(lang, "continue")}
                skipLabel={t(lang, "skipDocument")}
                onContinue={handleDocumentContinue}
              />
            ) : (
              <QuestionCard
                question={currentQuestion}
                language={lang}
                interactionMode={state.interactionMode}
                onAnswer={handleAnswer}
                placeholder={t(lang, "typeAnswer")}
                continueLabel={t(lang, "continue")}
                micLabel={t(lang, "tapToSpeak")}
                listeningLabel={t(lang, "listening")}
                editHint={t(lang, "editTranscript")}
                submitting={submitting}
                statusMessage={statusMessage}
                statusIsError={statusIsError}
                onSkip={showSkip ? handleSkip : undefined}
                skipLabel={t(lang, "skipForNow")}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
