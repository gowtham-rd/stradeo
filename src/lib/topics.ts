import { TopicMeta } from '@/types'

export const TOPICS: TopicMeta[] = [
  { id: 1, it: "Definizioni generali", en: "General Definitions", ta: "பொது வரையறைகள்", hi: "सामान्य परिभाषाएं" },
  { id: 2, it: "Segnali di pericolo", en: "Danger Signs", ta: "ஆபத்து அறிகுறிகள்", hi: "खतरे के संकेत" },
  { id: 3, it: "Segnali di divieto", en: "Prohibition Signs", ta: "தடை அறிகுறிகள்", hi: "निषेध संकेत" },
  { id: 4, it: "Segnali di obbligo", en: "Mandatory Signs", ta: "கட்டாய அறிகுறிகள்", hi: "अनिवार्य संकेत" },
  { id: 5, it: "Segnali di precedenza", en: "Priority Signs", ta: "முன்னுரிமை அறிகுறிகள்", hi: "प्राथमिकता संकेत" },
  { id: 6, it: "Segnaletica orizzontale", en: "Road Markings", ta: "சாலை குறிகள்", hi: "सड़क चिह्न" },
  { id: 7, it: "Semafori e agenti", en: "Traffic Lights", ta: "போக்குவரத்து விளக்குகள்", hi: "ट्रैफिक लाइट" },
  { id: 8, it: "Segnali di indicazione", en: "Information Signs", ta: "தகவல் அறிகுறிகள்", hi: "सूचना संकेत" },
  { id: 9, it: "Segnali complementari", en: "Supplementary Signs", ta: "துணை அறிகுறிகள்", hi: "पूरक संकेत" },
  { id: 10, it: "Pannelli integrativi", en: "Supplementary Panels", ta: "துணை பேனல்கள்", hi: "पूरक पैनल" },
  { id: 11, it: "Limiti di velocità", en: "Speed Limits", ta: "வேக வரம்புகள்", hi: "गति सीमा" },
  { id: 12, it: "Distanza di sicurezza", en: "Safe Distance", ta: "பாதுகாப்பு தூரம்", hi: "सुरक्षित दूरी" },
  { id: 13, it: "Norme di circolazione", en: "Traffic Rules", ta: "போக்குவரத்து விதிகள்", hi: "यातायात नियम" },
  { id: 14, it: "Precedenza incroci", en: "Right of Way", ta: "வழிமுன்னுரிமை", hi: "रास्ते का अधिकार" },
  { id: 15, it: "Sorpasso", en: "Overtaking", ta: "முந்துதல்", hi: "ओवरटेकिंग" },
  { id: 16, it: "Fermata e sosta", en: "Stopping & Parking", ta: "நிறுத்தம்", hi: "रुकना और पार्किंग" },
  { id: 17, it: "Norme varie", en: "Misc Rules", ta: "இதர விதிகள்", hi: "विविध नियम" },
  { id: 18, it: "Luci e clacson", en: "Lights & Horn", ta: "விளக்குகள்", hi: "लाइट और हॉर्न" },
  { id: 19, it: "Cinture e casco", en: "Seatbelts", ta: "சீட்பெல்ட்", hi: "सीटबेल्ट" },
  { id: 20, it: "Patente e sanzioni", en: "License & Penalties", ta: "உரிமம்", hi: "लाइसेंस" },
  { id: 21, it: "Incidenti stradali", en: "Accidents", ta: "விபத்துகள்", hi: "दुर्घटनाएं" },
  { id: 22, it: "Alcool e primo soccorso", en: "Alcohol & First Aid", ta: "முதலுதவி", hi: "प्राथमिक चिकित्सा" },
  { id: 23, it: "Responsabilità e RCA", en: "Liability & Insurance", ta: "காப்பீடு", hi: "बीमा" },
  { id: 24, it: "Ambiente", en: "Environment", ta: "சுற்றுச்சூழல்", hi: "पर्यावरण" },
  { id: 25, it: "Elementi del veicolo", en: "Vehicle Components", ta: "வாகன உதிரிகள்", hi: "वाहन घटक" },
]

export function getTopicName(id: number, lang: string): string {
  const topic = TOPICS.find(t => t.id === id)
  if (!topic) return `Topic ${id}`
  return (topic as any)[lang] || topic.en
}

export function isPrimaryTopic(id: number): boolean {
  return id <= 15
}
