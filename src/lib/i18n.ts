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
    aiSoon: "Feature in progress — AI translations and explanations are coming soon.", lessonLangSoon: "Lessons in this language are in progress. Showing English for now.", readinessHint: "Based on your accuracy in all 25 topics. Answer at least 20 questions per topic for a full score.", topicsCovered: "topics covered",
    nothingDue: "nothing due", settings: "Settings", appearance: "Appearance", language: "Language", account: "Account", signedInAs: "Signed in as", about: "About", privacyLink: "Privacy", appVersion: "Version", readinessCard: "Readiness", swipeHint: "Swipe for stats", themeHint: "Auto follows your device setting.", reportProblem: "Report a problem", reportWrongAnswer: "Wrong answer", reportTranslation: "Bad translation", reportImage: "Image problem", reportUnclear: "Unclear question", reportOther: "Other", reportNote: "Optional note", reportThanks: "Thanks — reported.", reportFailed: "Couldn't send. Try again.", cancel: "Cancel", send: "Send", aiLimit: "You've reached today's AI limit. It resets tomorrow.", leaveExamTitle: "Leave the exam?", leaveExamBody: "Your answers won't be saved.", leave: "Leave", stay: "Stay", generateLesson: "Generate lesson", poweredByAi: "Powered by AI",
    questionsFailed: "Couldn't load the questions. Check your connection.", signAlt: "Road sign for this question", unanswered: "unanswered", submitAnyway: "tap again to submit", study: "Study", quiz: "Quiz", keyPoints: "Key points", explained: "Explained", examTraps: "Exam traps", remember: "Remember", startQuiz: "Start quiz", primaryTopic: "Primary topic · 2 questions per exam", secondaryTopic: "Supporting topic · 1 question per exam", currentAccuracy: "Current accuracy", studyFirst: "Study the theory first?", topicNotFound: "Topic not found.", creatingLesson: "Creating your lesson…", lessonFailed: "Couldn't load this lesson.", thisWeek: "This week", accuracy: "Accuracy", streak: "Streak", last7: "Last 7 days", weakest: "Weakest topics", practice: "Practice", email: "Email", contactAdmin: "Contact admin for login credentials", tagline: "Your Italian driving license companion", themeLight: "Light", themeAuto: "Auto", themeDark: "Dark", theme: "Theme", stats: "Stats", unavailable: "Explanation unavailable right now.", translateFailed: "Translation unavailable right now.", translate: "Translate", randomQuiz: "Random practice", yourAnswer: "Your answer", noAnswer: "not answered", pageNotFound: "This page doesn't exist.", connError: "Can't connect right now. Check your internet and try again.", loadFailed: "Couldn't load your progress. Answers won't be saved until it loads.", saveFailed: "Offline — your answers are kept on this device and will sync automatically.", retry: "Retry", allCaughtUp: "All caught up — nothing to review.", nextReview: "next", reviewBack: "Back for review", reviewMastered: "Mastered — out of review", reviewEarly: "Extra practice — schedule unchanged",
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
    aiSoon: "Funzione in arrivo — traduzioni e spiegazioni AI saranno disponibili presto.", lessonLangSoon: "Le lezioni in questa lingua sono in arrivo. Per ora in inglese.", readinessHint: "Basato sulla tua precisione in tutti i 25 argomenti. Rispondi ad almeno 20 domande per argomento per il punteggio pieno.", topicsCovered: "argomenti coperti",
    nothingDue: "niente da ripassare", settings: "Impostazioni", appearance: "Aspetto", language: "Lingua", account: "Account", signedInAs: "Accesso effettuato come", about: "Informazioni", privacyLink: "Privacy", appVersion: "Versione", readinessCard: "Preparazione", swipeHint: "Scorri per le statistiche", themeHint: "Auto segue l'impostazione del dispositivo.", reportProblem: "Segnala un problema", reportWrongAnswer: "Risposta sbagliata", reportTranslation: "Traduzione errata", reportImage: "Problema immagine", reportUnclear: "Domanda poco chiara", reportOther: "Altro", reportNote: "Nota facoltativa", reportThanks: "Grazie — segnalato.", reportFailed: "Invio non riuscito. Riprova.", cancel: "Annulla", send: "Invia", aiLimit: "Hai raggiunto il limite AI di oggi. Si azzera domani.", leaveExamTitle: "Uscire dall'esame?", leaveExamBody: "Le risposte non verranno salvate.", leave: "Esci", stay: "Resta", generateLesson: "Genera lezione", poweredByAi: "Generato con AI",
    questionsFailed: "Impossibile caricare le domande. Controlla la connessione.", signAlt: "Segnale stradale della domanda", unanswered: "senza risposta", submitAnyway: "tocca di nuovo per consegnare", study: "Studia", quiz: "Quiz", keyPoints: "Punti chiave", explained: "Spiegazione", examTraps: "Trappole d'esame", remember: "Ricorda", startQuiz: "Inizia il quiz", primaryTopic: "Argomento principale · 2 domande per esame", secondaryTopic: "Argomento integrativo · 1 domanda per esame", currentAccuracy: "Precisione attuale", studyFirst: "Prima studi la teoria?", topicNotFound: "Argomento non trovato.", creatingLesson: "Creazione della lezione…", lessonFailed: "Impossibile caricare la lezione.", thisWeek: "Questa settimana", accuracy: "Precisione", streak: "Serie", last7: "Ultimi 7 giorni", weakest: "Argomenti più deboli", practice: "Esercitati", email: "Email", contactAdmin: "Contatta l'amministratore per le credenziali", tagline: "Il tuo compagno per la patente italiana", themeLight: "Chiaro", themeAuto: "Auto", themeDark: "Scuro", theme: "Tema", stats: "Statistiche", unavailable: "Spiegazione non disponibile al momento.", translateFailed: "Traduzione non disponibile al momento.", translate: "Traduci", randomQuiz: "Pratica casuale", yourAnswer: "La tua risposta", noAnswer: "nessuna risposta", pageNotFound: "Questa pagina non esiste.", connError: "Impossibile connettersi. Controlla la connessione e riprova.", loadFailed: "Impossibile caricare i tuoi progressi. Le risposte non verranno salvate finché non si caricano.", saveFailed: "Offline — le risposte restano su questo dispositivo e verranno sincronizzate automaticamente.", retry: "Riprova", allCaughtUp: "Tutto in ordine — niente da ripassare.", nextReview: "prossimo", reviewBack: "Torna in ripasso", reviewMastered: "Imparata — fuori dal ripasso", reviewEarly: "Pratica extra — calendario invariato",
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
    aiSoon: "இந்த வசதி தயாராகிறது — AI மொழிபெயர்ப்பும் விளக்கமும் விரைவில் வரும்.", lessonLangSoon: "இந்த மொழியில் பாடங்கள் தயாராகின்றன. இப்போதைக்கு ஆங்கிலத்தில்.", readinessHint: "25 தலைப்புகளிலும் உங்கள் சரியான விடைகளின் அடிப்படையில். முழு மதிப்பெண்ணுக்கு ஒவ்வொரு தலைப்பிலும் குறைந்தது 20 கேள்விகள்.", topicsCovered: "தலைப்புகள் முடிந்தன",
    nothingDue: "இப்போது எதுவும் இல்லை", settings: "அமைப்புகள்", appearance: "தோற்றம்", language: "மொழி", account: "கணக்கு", signedInAs: "உள்நுழைந்தவர்", about: "பற்றி", privacyLink: "தனியுரிமை", appVersion: "பதிப்பு", readinessCard: "தயார்நிலை", swipeHint: "புள்ளிவிவரங்களுக்கு நகர்த்தவும்", themeHint: "தானியங்கி உங்கள் சாதன அமைப்பைப் பின்பற்றும்.", reportProblem: "சிக்கலைப் புகாரளி", reportWrongAnswer: "தவறான விடை", reportTranslation: "தவறான மொழிபெயர்ப்பு", reportImage: "படச் சிக்கல்", reportUnclear: "தெளிவற்ற கேள்வி", reportOther: "மற்றவை", reportNote: "விருப்பக் குறிப்பு", reportThanks: "நன்றி — புகாரளிக்கப்பட்டது.", reportFailed: "அனுப்ப முடியவில்லை. மீண்டும் முயலவும்.", cancel: "ரத்து", send: "அனுப்பு", aiLimit: "இன்றைய AI வரம்பை அடைந்துவிட்டீர்கள். நாளை மீண்டும் கிடைக்கும்.", leaveExamTitle: "தேர்வை விட்டு வெளியேறவா?", leaveExamBody: "உங்கள் பதில்கள் சேமிக்கப்படாது.", leave: "வெளியேறு", stay: "இரு", generateLesson: "பாடத்தை உருவாக்கு", poweredByAi: "AI மூலம் உருவாக்கப்பட்டது",
    questionsFailed: "கேள்விகளை ஏற்ற முடியவில்லை. இணைப்பைச் சரிபார்க்கவும்.", signAlt: "இந்தக் கேள்விக்கான சாலை அடையாளம்", unanswered: "பதிலளிக்கப்படாதவை", submitAnyway: "சமர்ப்பிக்க மீண்டும் தொடவும்", study: "படி", quiz: "வினாடி வினா", keyPoints: "முக்கிய குறிப்புகள்", explained: "விளக்கம்", examTraps: "தேர்வு பொறிகள்", remember: "நினைவில் கொள்", startQuiz: "வினாடி வினாவைத் தொடங்கு", primaryTopic: "முதன்மைத் தலைப்பு · ஒரு தேர்வில் 2 கேள்விகள்", secondaryTopic: "துணைத் தலைப்பு · ஒரு தேர்வில் 1 கேள்வி", currentAccuracy: "தற்போதைய துல்லியம்", studyFirst: "முதலில் கோட்பாட்டைப் படிக்கவா?", topicNotFound: "தலைப்பு கிடைக்கவில்லை.", creatingLesson: "உங்கள் பாடம் தயாராகிறது…", lessonFailed: "இந்தப் பாடத்தை ஏற்ற முடியவில்லை.", thisWeek: "இந்த வாரம்", accuracy: "துல்லியம்", streak: "தொடர்", last7: "கடந்த 7 நாட்கள்", weakest: "பலவீனமான தலைப்புகள்", practice: "பயிற்சி", email: "மின்னஞ்சல்", contactAdmin: "உள்நுழைவு விவரங்களுக்கு நிர்வாகியைத் தொடர்பு கொள்ளவும்", tagline: "உங்கள் இத்தாலிய ஓட்டுநர் உரிமத் துணை", themeLight: "ஒளி", themeAuto: "தானியங்கி", themeDark: "இருள்", theme: "தீம்", stats: "புள்ளிவிவரம்", unavailable: "இப்போது விளக்கம் கிடைக்கவில்லை.", translateFailed: "இப்போது மொழிபெயர்ப்பு கிடைக்கவில்லை.", translate: "மொழிபெயர்", randomQuiz: "சீரற்ற பயிற்சி", yourAnswer: "உங்கள் பதில்", noAnswer: "பதில் இல்லை", pageNotFound: "இந்தப் பக்கம் இல்லை.", connError: "இணைக்க முடியவில்லை. இணையத்தைச் சரிபார்த்து மீண்டும் முயலவும்.", loadFailed: "உங்கள் முன்னேற்றத்தை ஏற்ற முடியவில்லை. அது ஏற்றப்படும் வரை பதில்கள் சேமிக்கப்படாது.", saveFailed: "இணைப்பு இல்லை — உங்கள் பதில்கள் இந்தச் சாதனத்தில் சேமிக்கப்பட்டு தானாக ஒத்திசைக்கப்படும்.", retry: "மீண்டும் முயல்", allCaughtUp: "அனைத்தும் முடிந்தது — மறுபார்வைக்கு எதுவும் இல்லை.", nextReview: "அடுத்து", reviewBack: "மீண்டும் மறுபார்வைக்கு", reviewMastered: "கற்றுக்கொண்டீர்கள் — மறுபார்வையிலிருந்து நீக்கப்பட்டது", reviewEarly: "கூடுதல் பயிற்சி — அட்டவணை மாறாது",
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
    aiSoon: "यह सुविधा जल्द आ रही है — AI अनुवाद और व्याख्या जल्द उपलब्ध होंगे।", lessonLangSoon: "इस भाषा में पाठ जल्द आ रहे हैं। अभी अंग्रेज़ी में।", readinessHint: "सभी 25 विषयों में आपकी सटीकता पर आधारित। पूरे स्कोर के लिए हर विषय में कम से कम 20 सवाल करें।", topicsCovered: "विषय पूरे",
    nothingDue: "अभी कुछ बाकी नहीं", settings: "सेटिंग्स", appearance: "दिखावट", language: "भाषा", account: "खाता", signedInAs: "इस रूप में साइन इन", about: "जानकारी", privacyLink: "गोपनीयता", appVersion: "संस्करण", readinessCard: "तैयारी", swipeHint: "आँकड़ों के लिए स्वाइप करें", themeHint: "ऑटो आपके डिवाइस की सेटिंग का पालन करता है।", reportProblem: "समस्या बताएँ", reportWrongAnswer: "गलत उत्तर", reportTranslation: "गलत अनुवाद", reportImage: "चित्र में समस्या", reportUnclear: "अस्पष्ट सवाल", reportOther: "अन्य", reportNote: "वैकल्पिक नोट", reportThanks: "धन्यवाद — रिपोर्ट हो गया।", reportFailed: "भेजा नहीं जा सका। फिर कोशिश करें।", cancel: "रद्द करें", send: "भेजें", aiLimit: "आज की AI सीमा पूरी हो गई। कल फिर मिलेगी।", leaveExamTitle: "परीक्षा छोड़ें?", leaveExamBody: "आपके जवाब सेव नहीं होंगे।", leave: "छोड़ें", stay: "रुकें", generateLesson: "पाठ बनाएँ", poweredByAi: "AI द्वारा",
    questionsFailed: "सवाल लोड नहीं हुए। कनेक्शन जाँचें।", signAlt: "इस सवाल का सड़क चिह्न", unanswered: "बिना जवाब", submitAnyway: "जमा करने के लिए फिर टैप करें", study: "पढ़ें", quiz: "क्विज़", keyPoints: "मुख्य बातें", explained: "विस्तार से", examTraps: "परीक्षा के जाल", remember: "याद रखें", startQuiz: "क्विज़ शुरू करें", primaryTopic: "मुख्य विषय · हर परीक्षा में 2 सवाल", secondaryTopic: "सहायक विषय · हर परीक्षा में 1 सवाल", currentAccuracy: "मौजूदा सटीकता", studyFirst: "पहले थ्योरी पढ़ें?", topicNotFound: "विषय नहीं मिला।", creatingLesson: "आपका पाठ बन रहा है…", lessonFailed: "यह पाठ लोड नहीं हुआ।", thisWeek: "इस हफ़्ते", accuracy: "सटीकता", streak: "लगातार दिन", last7: "पिछले 7 दिन", weakest: "कमज़ोर विषय", practice: "अभ्यास", email: "ईमेल", contactAdmin: "लॉगिन विवरण के लिए एडमिन से संपर्क करें", tagline: "आपका इतालवी ड्राइविंग लाइसेंस साथी", themeLight: "लाइट", themeAuto: "ऑटो", themeDark: "डार्क", theme: "थीम", stats: "आँकड़े", unavailable: "अभी व्याख्या उपलब्ध नहीं।", translateFailed: "अभी अनुवाद उपलब्ध नहीं।", translate: "अनुवाद", randomQuiz: "रैंडम अभ्यास", yourAnswer: "आपका जवाब", noAnswer: "जवाब नहीं दिया", pageNotFound: "यह पेज मौजूद नहीं है।", connError: "अभी कनेक्ट नहीं हो पा रहा। इंटरनेट जाँचें और फिर कोशिश करें।", loadFailed: "आपकी प्रगति लोड नहीं हुई। लोड होने तक जवाब सेव नहीं होंगे।", saveFailed: "ऑफ़लाइन — आपके जवाब इस डिवाइस पर रखे गए हैं और अपने-आप सिंक हो जाएँगे।", retry: "फिर कोशिश करें", allCaughtUp: "सब पूरा — रिव्यू के लिए कुछ नहीं।", nextReview: "अगला", reviewBack: "फिर से रिव्यू में", reviewMastered: "सीख लिया — रिव्यू से हटाया", reviewEarly: "अतिरिक्त अभ्यास — शेड्यूल नहीं बदला",
  },
} as const

export type UIKey = keyof typeof UI.en

export function t(lang: Language, key: UIKey): string {
  return UI[lang]?.[key] || UI.en[key]
}


const LOCALE: Record<Language, string> = { en: 'en', it: 'it', ta: 'ta', hi: 'hi' }

/** "in 3 days" / "tra 3 giorni" / … for a future epoch-ms timestamp. */
export function formatWhen(at: number, lang: Language, now = Date.now()): string {
  const rtf = new Intl.RelativeTimeFormat(LOCALE[lang], { numeric: 'auto' })
  const mins = Math.max(1, Math.round((at - now) / 60_000))
  if (mins < 60) return rtf.format(mins, 'minute')
  const hours = Math.round(mins / 60)
  if (hours < 24) return rtf.format(hours, 'hour')
  return rtf.format(Math.round(hours / 24), 'day')
}
