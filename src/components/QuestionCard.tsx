
import type { IntakeQuestion, LanguageCode } from "../types/intake";
import VoiceAssistant, { findSpokenOption } from "./VoiceAssistant";
import { t } from "../data/translations";

interface QuestionCardProps {
  question: IntakeQuestion;
  language: LanguageCode;
  interactionMode: "touch" | "voice" | null;
  onAnswer: (value: string) => void;
  placeholder: string;
  continueLabel: string;
  micLabel: string;
  listeningLabel: string;
  editHint: string;
  submitting?: boolean;
  statusMessage?: string | null;
  statusIsError?: boolean;
  onSkip?: () => void;
  skipLabel?: string;
}

export default function QuestionCard({
  question,
  language,
  onAnswer,
  placeholder,
  continueLabel,
  micLabel,
  listeningLabel,
  editHint,
  submitting = false,
  statusMessage = null,
  statusIsError = false,
  onSkip,
  skipLabel,
}: QuestionCardProps) {
  const submit = (raw: string) => {
    if (submitting || !raw.trim()) return;

    if (question.questionType === "single_select" && question.options.length) {
      const match = findSpokenOption(raw, question.options);
      onAnswer(match?.label ?? "");
      return;
    }

    if (question.questionType === "multi_select" && question.options.length) {
      const matches = question.options.filter((option) => {
        const normalized = raw.toLocaleLowerCase();
        const label = option.label.toLocaleLowerCase();
        return normalized.includes(label) || normalized.includes(option.value.toLocaleLowerCase());
      });
      if (matches.length) {
        onAnswer(matches.map((match) => match.label).join(", "));
        return;
      }
    }

    onAnswer(raw.trim());
  };

  return (
    <VoiceAssistant
      language={language}
      prompt={question.message}
      placeholder={placeholder}
      submitLabel={continueLabel}
      listeningLabel={listeningLabel}
      tapToSpeakLabel={micLabel}
      editLabel={t(language, "edit")}
      editHint={editHint}
      submitting={submitting}
      statusMessage={statusMessage}
      statusIsError={statusIsError}
      autoStart
      onSubmit={(raw) => {
        submit(raw);
      }}
      transcriptLabel={t(language, "edit")}
    />
  );
}
