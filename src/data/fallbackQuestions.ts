import type { IntakeAnswers, IntakeQuestion, LanguageCode, Pathway, SectionKey } from "../types/intake";

/**
 * Deterministic, offline question sequence. This is what keeps MediKiosk
 * fully usable when GROQ_API_KEY is missing, Groq is rate-limited, or the
 * network call fails outright — the interview never stalls. It mirrors the
 * same IntakeQuestion shape Groq returns so the UI doesn't need to know
 * which engine produced a question.
 */

const baseSequence: Array<Omit<IntakeQuestion, "isComplete">> = [
  {
    message: "What is the main problem or symptom that brought you in today?",
    questionType: "text",
    options: [],
    field: "presenting_complaint",
    nextSection: "presenting_complaint",
  },
  {
    message: "When did this first start?",
    questionType: "single_select",
    options: [
      { value: "today", label: "Today" },
      { value: "few_days", label: "A few days ago" },
      { value: "week_plus", label: "A week or more ago" },
      { value: "chronic", label: "Ongoing / long-term" },
    ],
    field: "onset",
    nextSection: "history_present_illness",
  },
  {
    message: "How severe would you say it is right now?",
    questionType: "single_select",
    options: [
      { value: "mild", label: "Mild" },
      { value: "moderate", label: "Moderate" },
      { value: "severe", label: "Severe" },
    ],
    field: "severity",
    nextSection: "history_present_illness",
  },
  {
    message: "Do you have any past medical conditions we should know about (e.g. diabetes, hypertension, asthma)?",
    questionType: "text",
    options: [],
    field: "past_medical_history",
    nextSection: "past_medical_history",
  },
  {
    message: "Are you currently taking any medications?",
    questionType: "text",
    options: [],
    field: "medications",
    nextSection: "medications",
  },
  {
    message: "Do you have any known allergies, including to medicines?",
    questionType: "text",
    options: [],
    field: "allergies",
    nextSection: "allergies",
  },
  {
    message: "Is there any relevant family history of illness we should note?",
    questionType: "text",
    options: [],
    field: "family_history",
    nextSection: "family_history",
  },
  {
    message: "Do you smoke, drink alcohol, or have other lifestyle factors worth mentioning?",
    questionType: "text",
    options: [],
    field: "lifestyle",
    nextSection: "lifestyle",
  },
];

const chestPainFollowUps: Array<Omit<IntakeQuestion, "isComplete">> = [
  {
    message: "Where exactly is the pain located?",
    questionType: "text",
    options: [],
    field: "pain_location",
    nextSection: "history_present_illness",
  },
  {
    message: "Does the discomfort spread anywhere, such as your arm, jaw, or back?",
    questionType: "single_select",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
    field: "pain_radiates",
    nextSection: "history_present_illness",
  },
  {
    message: "Are you also experiencing breathlessness, sweating, or dizziness?",
    questionType: "multi_select",
    options: [
      { value: "breathlessness", label: "Breathlessness" },
      { value: "sweating", label: "Sweating" },
      { value: "dizziness", label: "Dizziness" },
      { value: "none", label: "None of these" },
    ],
    field: "associated_symptoms",
    nextSection: "review_of_systems",
  },
];

const headacheFollowUps: Array<Omit<IntakeQuestion, "isComplete">> = [
  {
    message: "Is the headache on one side, both sides, or all over?",
    questionType: "single_select",
    options: [
      { value: "one_side", label: "One side" },
      { value: "both_sides", label: "Both sides" },
      { value: "all_over", label: "All over" },
    ],
    field: "headache_location",
    nextSection: "history_present_illness",
  },
  {
    message: "Do you also have nausea, sensitivity to light, or blurred vision?",
    questionType: "multi_select",
    options: [
      { value: "nausea", label: "Nausea" },
      { value: "light_sensitivity", label: "Sensitivity to light" },
      { value: "blurred_vision", label: "Blurred vision" },
      { value: "none", label: "None of these" },
    ],
    field: "associated_symptoms",
    nextSection: "review_of_systems",
  },
];

const ayushFollowUps: Array<Omit<IntakeQuestion, "isComplete">> = [
  {
    message: "How would you describe your appetite and digestion lately?",
    questionType: "single_select",
    options: [
      { value: "good", label: "Good and regular" },
      { value: "variable", label: "Variable" },
      { value: "poor", label: "Poor / sluggish" },
    ],
    field: "digestion",
    nextSection: "ayush_assessment",
  },
  {
    message: "How has your sleep been?",
    questionType: "single_select",
    options: [
      { value: "sound", label: "Sound and restful" },
      { value: "disturbed", label: "Disturbed" },
      { value: "little", label: "Very little sleep" },
    ],
    field: "sleep",
    nextSection: "ayush_assessment",
  },
  {
    message: "How would you describe your general stress levels recently?",
    questionType: "single_select",
    options: [
      { value: "low", label: "Low" },
      { value: "moderate", label: "Moderate" },
      { value: "high", label: "High" },
    ],
    field: "stress",
    nextSection: "ayush_assessment",
  },
];

/**
 * Picks the next question deterministically based on how many questions
 * have been asked and whether the presenting complaint mentions a known
 * symptom pattern (chest pain / headache) that warrants adaptive follow-up.
 */
export function getFallbackQuestion(
  answers: IntakeAnswers,
  questionsAsked: number,
  pathway: Pathway | null, language: LanguageCode = "en"
): IntakeQuestion {
  const complaint = (answers.presenting_complaint || "").toLowerCase();
  const mentionsChestPain = /chest/.test(complaint);
  const mentionsHeadache = /headache|migraine|head pain/.test(complaint);
let sequence = [...baseSequence];

  // Insert adaptive follow-ups right after the severity question (index 2).
  if (mentionsChestPain) {
    sequence = [...sequence.slice(0, 3), ...chestPainFollowUps, ...sequence.slice(3)];
  } else if (mentionsHeadache) {
    sequence = [...sequence.slice(0, 3), ...headacheFollowUps, ...sequence.slice(3)];
  }

  if (pathway === "ayush") {
    sequence = [...sequence, ...ayushFollowUps];
  }
// Translation map for fallback question messages AND option labels
const translationMap: Record<LanguageCode, { messages: Record<string, string>; options: Record<string, string> }> = {
  hi: {
    messages: {
      "What is the main problem or symptom that brought you in today?": "आज आपको यहाँ लाने वाली मुख्य समस्या या लक्षण क्या है?",
      "When did this first start?": "यह पहली बार कब शुरू हुआ?",
      "How severe would you say it is right now?": "आप अभी इसे कितनी गंभीर कहेंगे?",
      "Do you have any past medical conditions we should know about (e.g. diabetes, hypertension, asthma)?": "क्या आपके पास कोई पूर्व चिकित्सीय स्थितियां हैं जिन्हें हमें जानना चाहिए (जैसे डाइबिटीज़, हाई ब्लड प्रेशर, अस्थमा)?",
      "Are you currently taking any medications?": "क्या आप वर्तमान में कोई दवा ले रहे हैं?",
      "Do you have any known allergies, including to medicines?": "क्या आपको कोई ज्ञात एलर्जी है, जिसमें दवाओं से एलर्जी भी शामिल है?",
      "Is there any relevant family history of illness we should note?": "क्या कोई प्रासंगिक पारिवारिक बीमारी इतिहास है जिसे हमें नोट करना चाहिए?",
      "Do you smoke, drink alcohol, or have other lifestyle factors worth mentioning?": "क्या आप धूम्रपान करते हैं, शराब पीते हैं, या अन्य जीवनशैली संबंधी बातें हैं जो उल्लेखनीय हों?",
      "Where exactly is the pain located?": "दर्द ठीक कहाँ स्थित है?",
      "Does the discomfort spread anywhere, such as your arm, jaw, or back?": "क्या असहजता कहीं और फैलती है, जैसे आपके हाथ, जबड़ा, या पीठ?",
      "Are you also experiencing breathlessness, sweating, or dizziness?": "क्या आपको साँस फूलना, पसीना या चक्कर आना भी हो रहा है?",
      "Is the headache on one side, both sides, or all over?": "सिरदर्द एक तरफ़ है, दोनों तरफ़ या पूरे सिर में?",
      "Do you also have nausea, sensitivity to light, or blurred vision?": "क्या आपको उल्टी, रोशनी के प्रति संवेदनशीलता, या धुंधली दृष्टि भी है?",
      "How would you describe your appetite and digestion lately?": "हाल ही में आपका भूख और पाचन कैसे रहा है?",
      "How has your sleep been?": "आपकी नींद कैसी रही है?",
      "How would you describe your general stress levels recently?": "हाल ही में आपका सामान्य तनाव स्तर कैसे है?",
      "Thank you. That's everything we need for now — let's review what you've shared.": "धन्यवाद। अभी के लिये यही सब है — चलिए आपके बताए हुए को देख लेते हैं।"
    },
    options: {
      // onset
      "Today": "आज",
      "A few days ago": "कुछ दिन पहले",
      "A week or more ago": "एक सप्ताह या उससे अधिक पहले",
      "Ongoing / long-term": "लंबे समय से चल रहा है",
      // severity
      "Mild": "हल्का",
      "Moderate": "मध्यम",
      "Severe": "गंभीर",
      // yes/no
      "Yes": "हाँ",
      "No": "नहीं",
      // chest pain associated
      "Breathlessness": "साँस फूलना",
      "Sweating": "पसीना आना",
      "Dizziness": "चक्कर आना",
      "None of these": "इनमें से कोई नहीं",
      // headache location
      "One side": "एक तरफ",
      "Both sides": "दोनों तरफ",
      "All over": "पूरे सिर में",
      // headache associated
      "Nausea": "मतली",
      "Sensitivity to light": "रोशनी के प्रति संवेदनशीलता",
      "Blurred vision": "धुंधली दृष्टि",
      // ayush
      "Good and regular": "अच्छी और नियमित",
      "Variable": "बदलती रहती है",
      "Poor / sluggish": "खराब / सुस्त",
      "Sound and restful": "गहरी और आरामदायक",
      "Disturbed": "अशांत",
      "Very little sleep": "बहुत कम नींद",
      "Low": "कम",
      "High": "अधिक",
    }
  },
  mr: {
    messages: {
      "What is the main problem or symptom that brought you in today?": "आज तुम्हाला इथे आणणारी मुख्य समस्या किंवा लक्षण काय आहे?",
      "When did this first start?": "हे प्रथम कधी सुरू झाले?",
      "How severe would you say it is right now?": "तुम्हाला हा सध्या किती तीव्र वाटतो?",
      "Do you have any past medical conditions we should know about (e.g. diabetes, hypertension, asthma)?": "तुमच्याकडे काही पूर्व वैद्यकीय स्थिती आहेत का ज्या आम्हाला माहित असाव्यात (उदा. मधुमेह, उच्च रक्तदाब, दमा)?",
      "Are you currently taking any medications?": "तुम्ही सध्या काही औषधे घेत आहात का?",
      "Do you have any known allergies, including to medicines?": "तुमची कोणतीही ज्ञात अॅलर्जी आहे का, औषधांसहित?",
      "Is there any relevant family history of illness we should note?": "कुठलीही संबंधित कुटुंबीय रोग इतिहास आहे का ज्याची नोंद घ्यावी?",
      "Do you smoke, drink alcohol, or have other lifestyle factors worth mentioning?": "तुम्ही धूम्रपान करता, अल्कोहॉल पीता किंवा इतर जीवनशैली घटक उल्लेखनीय आहेत का?",
      "Where exactly is the pain located?": "दुखणे नेमके कुठे आहे?",
      "Does the discomfort spread anywhere, such as your arm, jaw, or back?": "दुखणारी भावना कुठे कुठे पसरते का, जसे हात, जबडा किंवा पाठी?",
      "Are you also experiencing breathlessness, sweating, or dizziness?": "तुम्हाला श्वास घेणे, घाम येणे किंवा चक्कर येणेही होत आहे का?",
      "Is the headache on one side, both sides, or all over?": "डोकेदुखी एक बाजूला, दोन्ही बाजूला किंवा संपूर्ण आहे का?",
      "Do you also have nausea, sensitivity to light, or blurred vision?": "तुम्हाला मळमळ, प्रकाशाची संवेदनशीलता किंवा धुसर दृष्टीही आहे का?",
      "How would you describe your appetite and digestion lately?": "अलीकडे तुमची भूकेची भावना आणि पाचन कसे आहे?",
      "How has your sleep been?": "तुमची झोप कशी होती?",
      "How would you describe your general stress levels recently?": "साधारणतः तुम्ही अलीकडे ताणाची पातळी कशी वाटते?",
      "Thank you. That's everything we need for now — let's review what you've shared.": "धन्यवाद. हे सर्व हवे होते — तुमचा दिलेला डेटा आभारी आहोत."
    },
    options: {
      // onset
      "Today": "आज",
      "A few days ago": "काही दिवसांपूर्वी",
      "A week or more ago": "एक आठवडा किंवा त्यापेक्षा जास्त पूर्वी",
      "Ongoing / long-term": "दीर्घकालीन / सतत चालू",
      // severity
      "Mild": "सौम्य",
      "Moderate": "मध्यम",
      "Severe": "तीव्र",
      // yes/no
      "Yes": "होय",
      "No": "नाही",
      // chest pain associated
      "Breathlessness": "श्वास लागणे",
      "Sweating": "घाम येणे",
      "Dizziness": "चक्कर येणे",
      "None of these": "यापैकी काहीही नाही",
      // headache location
      "One side": "एक बाजू",
      "Both sides": "दोन्ही बाजू",
      "All over": "संपूर्ण डोक्यात",
      // headache associated
      "Nausea": "मळमळ",
      "Sensitivity to light": "प्रकाशाची संवेदनशीलता",
      "Blurred vision": "धुसर दृष्टी",
      // ayush
      "Good and regular": "चांगली आणि नियमित",
      "Variable": "बदलणारी",
      "Poor / sluggish": "खराब / मंद",
      "Sound and restful": "शांत आणि आरामदायी",
      "Disturbed": "विस्कळीत",
      "Very little sleep": "खूप कमी झोप",
      "Low": "कमी",
      "High": "जास्त",
    }
  },
  en: { messages: {}, options: {} }
};

// Apply translations if needed
if (language !== "en") {
  const { messages: msgMap, options: optMap } = translationMap[language] ?? { messages: {}, options: {} };
  sequence = sequence.map(q => ({
    ...q,
    message: msgMap[q.message] || q.message,
    options: q.options.map(opt => ({
      ...opt,
      label: optMap[opt.label] || opt.label,
    })),
  }));
}

const MAX_QUESTIONS = Math.min(sequence.length, 12);

if (questionsAsked >= MAX_QUESTIONS) {
  const finalMsg = translationMap[language].messages["Thank you. That's everything we need for now — let's review what you've shared."] || "Thank you. That's everything we need for now — let's review what you've shared.";
  return {
    message: finalMsg,
    questionType: "text",
    options: [],
    field: "review",
    nextSection: "review" as SectionKey,
    isComplete: true,
  };
}

const next = sequence[questionsAsked];
return { ...next, isComplete: false };
}
