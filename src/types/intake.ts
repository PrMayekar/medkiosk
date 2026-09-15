export type LanguageCode = "en" | "hi" | "mr";

export type InteractionMode = "touch" | "voice";

export type Pathway = "general" | "ayush";

export type QuestionType = "text" | "single_select" | "multi_select" | "scale";

export interface QuestionOption {
  value: string;
  label: string;
}

/** A single question turn, whether from Groq or the local fallback engine. */
export interface IntakeQuestion {
  message: string;
  questionType: QuestionType;
  options: QuestionOption[];
  field: string;
  nextSection: SectionKey;
  isComplete: boolean;
}

export type SectionKey =
  | "demographics"
  | "presenting_complaint"
  | "history_present_illness"
  | "past_medical_history"
  | "medications"
  | "allergies"
  | "family_history"
  | "lifestyle"
  | "review_of_systems"
  | "ayush_assessment"
  | "review";

export interface TranscriptTurn {
  id: string;
  role: "assistant" | "patient";
  text: string;
  timestamp: number;
}

export interface PatientProfile {
  name: string;
  age: string;
  sex: string;
  language: LanguageCode;
}

export interface IntakeAnswers {
  [field: string]: string;
}

export interface RedFlagResult {
  triggered: boolean;
  reason: string;
}

export interface UploadedDocument {
  id: string;
  name: string;
  /** MIME type reported by the browser, e.g. "image/jpeg" or "application/pdf". */
  type: string;
  sizeLabel: string;
  status: "processing" | "processed";
  extracted?: string[];
  /**
   * Object URL (blob:) created from the uploaded File so the doctor
   * dashboard can actually preview it during this browser session. Not a
   * real document store — see README limitations.
   */
  url?: string;
  /** True for documents generated as illustrative demo/sample data rather than an actual upload. */
  isSample?: boolean;
}

export interface IntakeState {
  language: LanguageCode;
  interactionMode: InteractionMode | null;
  consentGiven: boolean;
  abhaConsent: boolean;
  abhaId: string | null;
  abhaLinked: boolean;
  pathway: Pathway | null;
  patient: PatientProfile;
  answers: IntakeAnswers;
  transcript: TranscriptTurn[];
  currentSection: SectionKey;
  questionsAsked: number;
  isComplete: boolean;
  redFlag: RedFlagResult;
  summary: string | null;
  documents: UploadedDocument[];
  queueNumber: string | null;
  aiAvailable: boolean;
}

export const initialIntakeState: IntakeState = {
  language: "en",
  interactionMode: null,
  consentGiven: false,
  abhaConsent: false,
  abhaId: null,
  abhaLinked: false,
  pathway: null,
  patient: { name: "", age: "", sex: "", language: "en" },
  answers: {},
  transcript: [],
  currentSection: "presenting_complaint",
  questionsAsked: 0,
  isComplete: false,
  redFlag: { triggered: false, reason: "" },
  summary: null,
  documents: [],
  queueNumber: null,
  aiAvailable: true,
};
