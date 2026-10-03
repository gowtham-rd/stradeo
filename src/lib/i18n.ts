import { Language } from '@/types'

export const LANGUAGES: Record<Language, string> = {
  en: 'English',
  it: 'Italiano',
  ta: 'தமிழ்',
  hi: 'हिन्दी',
}

export const LANG_PROMPT: Record<Language, string> = {
  en: 'English',
  it: 'Italian',
  ta: 'Tamil',
  hi: 'Hindi',
}

export const UI = {
  en: {
    login: "Log in", username: "Username", password: "Password", loginBtn: "Sign In",
    wrongCreds: "Invalid email or password", home: "Home", examSim: "Exam Simulation",
    examSimSub: "30 questions · max 3 errors", review: "Review", correct: "correct",
    wrong: "wrong", remaining: "remaining", readiness: "Exam Readiness",
    startStudy: "Start studying to track progress", ready: "Ready for the exam!",
    close: "Getting close", good: "Good progress", keep: "Keep studying",
    next: "Next", submit: "Submit", again: "Try Again", newExam: "New Exam",
    passed: "PASSED!", failed: "FAILED", errors: "errors", max3: "max 3",
    topicsTitle: "25 Topics · 7,139 Questions", questions: "questions",
    why: "Why?", gettingExp: "Getting explanation...", correctBadge: "Correct!",
    explain: "Explain why", loading: "Loading...", smartReview: "Smart Review",
    qDue: "due", logout: "Log out", welcome: "Welcome back",
    aiSoon: "🚧 Feature in progress — AI translations and explanations are coming soon.", lessonLangSoon: "🚧 Lessons in this language are in progress. Showing English for now.", readinessHint: "Based on your accuracy in all 25 topics. Answer at least 20 questions per topic for a full score.", topicsCovered: "topics covered",
  },
  it: {
    login: "Accedi", username: "Nome utente", password: "Password", loginBtn: "Accedi",
    wrongCreds: "Credenziali non valide", home: "Home", examSim: "Simulazione Esame",
    examSimSub: "30 domande · max 3 errori", review: "Revisione", correct: "corrette",
    wrong: "errate", remaining: "rimanenti", readiness: "Preparazione",
    startStudy: "Inizia a studiare", ready: "Pronto!", close: "Quasi pronto",
    good: "Buon progresso", keep: "Continua", next: "Prossima", submit: "Consegna",
    again: "Riprova", newExam: "Nuovo Esame", passed: "PROMOSSO!", failed: "NON PROMOSSO",
    errors: "errori", max3: "max 3", topicsTitle: "25 Argomenti · 7.139 Domande",
    questions: "domande", why: "Perché?", gettingExp: "Caricamento...",
    correctBadge: "Corretto!", explain: "Spiega", loading: "Caricamento...",
    smartReview: "Ripasso", qDue: "da ripassare", logout: "Esci", welcome: "Bentornato",
    aiSoon: "🚧 Funzione in arrivo — traduzioni e spiegazioni AI saranno disponibili presto.", lessonLangSoon: "🚧 Le lezioni in questa lingua sono in arrivo. Per ora in inglese.", readinessHint: "Basato sulla tua precisione in tutti i 25 argomenti. Rispondi ad almeno 20 domande per argomento per il punteggio pieno.", topicsCovered: "argomenti coperti",
  },
  ta: {
    login: "உள்நுழை", username: "பயனர்பெயர்", password: "கடவுச்சொல்",
    loginBtn: "உள்நுழை", wrongCreds: "தவறான சான்றுகள்", home: "முகப்பு",
    examSim: "தேர்வு", examSimSub: "30 கேள்விகள்", review: "மறுபார்வை",
    correct: "சரி", wrong: "தவறு", remaining: "மீதம்", readiness: "தயார்நிலை",
    startStudy: "படிக்க தொடங்கு", ready: "தயார்!", close: "கிட்டத்தில்",
    good: "நல்ல முன்னேற்றம்", keep: "தொடரு", next: "அடுத்து", submit: "சமர்ப்பி",
    again: "மீண்டும்", newExam: "புதிய தேர்வு", passed: "தேர்ச்சி!", failed: "தோல்வி",
    errors: "பிழைகள்", max3: "அதிகபட்சம் 3", topicsTitle: "25 தலைப்புகள்",
    questions: "கேள்விகள்", why: "ஏன்?", gettingExp: "ஏற்றுகிறது...",
    correctBadge: "சரி!", explain: "விளக்கு", loading: "ஏற்றுகிறது...",
    smartReview: "மறுபார்வை", qDue: "நிலுவை", logout: "வெளியேறு", welcome: "மீண்டும் வருக",
    aiSoon: "🚧 இந்த வசதி தயாராகிறது — AI மொழிபெயர்ப்பும் விளக்கமும் விரைவில் வரும்.", lessonLangSoon: "🚧 இந்த மொழியில் பாடங்கள் தயாராகின்றன. இப்போதைக்கு ஆங்கிலத்தில்.", readinessHint: "25 தலைப்புகளிலும் உங்கள் சரியான விடைகளின் அடிப்படையில். முழு மதிப்பெண்ணுக்கு ஒவ்வொரு தலைப்பிலும் குறைந்தது 20 கேள்விகள்.", topicsCovered: "தலைப்புகள் முடிந்தன",
  },
  hi: {
    login: "लॉग इन", username: "यूजरनेम", password: "पासवर्ड", loginBtn: "साइन इन",
    wrongCreds: "गलत यूजरनेम या पासवर्ड", home: "होम", examSim: "परीक्षा सिमुलेशन",
    examSimSub: "30 सवाल · अधिकतम 3 गलतियाँ", review: "समीक्षा", correct: "सही",
    wrong: "गलत", remaining: "शेष", readiness: "तैयारी", startStudy: "पढ़ाई शुरू करें",
    ready: "तैयार!", close: "करीब", good: "अच्छी प्रगति", keep: "जारी रखें",
    next: "अगला", submit: "जमा करें", again: "फिर से", newExam: "नई परीक्षा",
    passed: "पास!", failed: "फेल", errors: "गलतियाँ", max3: "अधिकतम 3",
    topicsTitle: "25 विषय", questions: "सवाल", why: "क्यों?",
    gettingExp: "लोड हो रहा...", correctBadge: "सही!", explain: "कारण बताएं",
    loading: "लोड हो रहा...", smartReview: "स्मार्ट रिव्यू", qDue: "बाकी",
    logout: "लॉग आउट", welcome: "वापसी पर स्वागत",
    aiSoon: "🚧 यह सुविधा जल्द आ रही है — AI अनुवाद और व्याख्या जल्द उपलब्ध होंगे।", lessonLangSoon: "🚧 इस भाषा में पाठ जल्द आ रहे हैं। अभी अंग्रेज़ी में।", readinessHint: "सभी 25 विषयों में आपकी सटीकता पर आधारित। पूरे स्कोर के लिए हर विषय में कम से कम 20 सवाल करें।", topicsCovered: "विषय पूरे",
  },
} as const

export type UIKey = keyof typeof UI.en

export function t(lang: Language, key: UIKey): string {
  return UI[lang]?.[key] || UI.en[key]
}
