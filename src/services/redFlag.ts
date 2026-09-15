import type { IntakeAnswers, RedFlagResult } from "../types/intake";

/**
 * Deliberately simple, transparent, rule-based red-flag screening.
 * This is NOT a validated medical decision system and the AI is never
 * consulted for this check — it exists purely to demonstrate the concept
 * of pre-consultation safety triage described in the SIH problem
 * statement, and must always be labelled as a prototype in the UI.
 */
export function evaluateRedFlags(answers: IntakeAnswers): RedFlagResult {
  const text = Object.values(answers).join(" ").toLowerCase();

  const hasChestPain = /chest pain|chest discomfort|chest tightness/.test(text);
  const hasBreathlessness = /breathless|shortness of breath|difficulty breathing/.test(text);
  const hasSweating = /sweating/.test(text);
  const hasSevere = /severe/.test(text);
  const hasDizziness = /dizziness|fainting|light-?headed/.test(text);
  const riskFactors = /diabetes|hypertension|high blood pressure|heart disease|smoker|smoking/.test(text);

  if (hasChestPain && (hasBreathlessness || hasSweating)) {
    return {
      triggered: true,
      reason: "Chest pain reported together with breathlessness or sweating.",
    };
  }

  if (hasChestPain && riskFactors) {
    return {
      triggered: true,
      reason: "Chest pain reported alongside a relevant cardiovascular risk factor.",
    };
  }

  if (hasChestPain && hasSevere && hasDizziness) {
    return {
      triggered: true,
      reason: "Severe chest pain reported together with dizziness.",
    };
  }

  return { triggered: false, reason: "" };
}
