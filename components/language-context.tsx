"use client"

import { createContext, useContext, useState, ReactNode } from "react"

export type Language = "hi" | "en" | "ta" | "te" | "bn" | "mr" | "gu" | "kn"

interface LanguageConfig {
  code: Language
  name: string
  nativeName: string
  flag: string
}

export const languages: LanguageConfig[] = [
  { code: "hi", name: "Hindi", nativeName: "हिंदी", flag: "🇮🇳" },
  { code: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", flag: "🇮🇳" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", flag: "🇮🇳" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", flag: "🇮🇳" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", flag: "🇮🇳" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", flag: "🇮🇳" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ", flag: "🇮🇳" },
]

type TranslationKey = 
  | "appName"
  | "safe"
  | "sosTagline"
  | "sending"
  | "voiceSOS"
  | "safeRoute"
  | "startingPoint"
  | "destination"
  | "findRoute"
  | "safest"
  | "fastest"
  | "wellLit"
  | "rakshakShare"
  | "shareLiveLocation"
  | "surakshaScore"
  | "areaSafetyRating"
  | "fakeCall"
  | "incomingCall"
  | "connected"
  | "callEnded"
  | "recentActivity"
  | "safeArrival"
  | "routeShared"
  | "sosCanceled"
  | "hoursAgo"
  | "yesterday"
  | "daysAgo"
  | "trackTitle"
  | "guardiansEye"
  | "trackingActive"
  | "trackingInactive"
  | "trustedContacts"
  | "startJourney"
  | "endJourney"
  | "journeyTime"
  | "shareLocation"
  | "safetyTitle"
  | "safetyScore"
  | "areaAnalysis"
  | "lighting"
  | "crowdDensity"
  | "policeProximity"
  | "recentIncidents"
  | "reportIncident"
  | "heatmap"
  | "circleTitle"
  | "createCircle"
  | "allMembersSee"
  | "enRoute"
  | "deviGreeting"
  | "deviName"

const translations: Record<Language, Record<TranslationKey, string>> = {
  hi: {
    appName: "SafeHer",
    safe: "सुरक्षित",
    sosTagline: "एक स्पर्श — सुरक्षा",
    sending: "भेज रहे हैं...",
    voiceSOS: "🎙️ BACHAO बोलने पर भी काम करेगा",
    safeRoute: "सुरक्षित रास्ता",
    startingPoint: "शुरुआती जगह",
    destination: "मंजिल",
    findRoute: "रास्ता ढूंढो",
    safest: "सबसे सुरक्षित",
    fastest: "सबसे तेज़",
    wellLit: "रोशनदार",
    rakshakShare: "रक्षक शेयर",
    shareLiveLocation: "लाइव लोकेशन शेयर करें",
    surakshaScore: "सुरक्षा स्कोर",
    areaSafetyRating: "क्षेत्र सुरक्षा रेटिंग",
    fakeCall: "नकली कॉल मंगाओ 📞",
    incomingCall: "इनकमिंग कॉल...",
    connected: "कनेक्टेड",
    callEnded: "कॉल समाप्त",
    recentActivity: "हाल की गतिविधि",
    safeArrival: "घर सुरक्षित पहुंचे",
    routeShared: "माँ के साथ रास्ता साझा किया",
    sosCanceled: "SOS रद्द (टेस्ट)",
    hoursAgo: "{n} घंटे पहले",
    yesterday: "कल",
    daysAgo: "{n} दिन पहले",
    trackTitle: "ट्रैक",
    guardiansEye: "रक्षक दृष्टि",
    trackingActive: "ट्रैकिंग चालू",
    trackingInactive: "ट्रैकिंग बंद",
    trustedContacts: "विश्वसनीय संपर्क",
    startJourney: "यात्रा शुरू करें",
    endJourney: "यात्रा समाप्त करें",
    journeyTime: "यात्रा समय",
    shareLocation: "लोकेशन शेयर करें",
    safetyTitle: "सुरक्षा",
    safetyScore: "सुरक्षा स्कोर",
    areaAnalysis: "क्षेत्र विश्लेषण",
    lighting: "रोशनी",
    crowdDensity: "भीड़ घनत्व",
    policeProximity: "पुलिस निकटता",
    recentIncidents: "हाल की घटनाएं",
    reportIncident: "घटना रिपोर्ट करें",
    heatmap: "हीटमैप",
    circleTitle: "SafeCircle",
    createCircle: "नया सर्कल बनाएं",
    allMembersSee: "सभी सदस्य एक-दूसरे को लाइव देख सकते हैं",
    enRoute: "रास्ते में",
    deviGreeting: "नमस्ते 🙏 मैं देवी हूं। क्या पूछना चाहती हैं?",
    deviName: "देवी AI - आपकी सुरक्षा साथी",
  },
  en: {
    appName: "SafeHer",
    safe: "Safe",
    sosTagline: "One Touch — Safety",
    sending: "Sending...",
    voiceSOS: "🎙️ Say BACHAO to activate",
    safeRoute: "Safe Route",
    startingPoint: "Starting point",
    destination: "Destination",
    findRoute: "Find Route",
    safest: "Safest",
    fastest: "Fastest",
    wellLit: "Well-lit",
    rakshakShare: "Guardian Share",
    shareLiveLocation: "Share live location",
    surakshaScore: "Safety Score",
    areaSafetyRating: "Area safety rating",
    fakeCall: "Get Fake Call 📞",
    incomingCall: "Incoming Call...",
    connected: "Connected",
    callEnded: "Call Ended",
    recentActivity: "Recent Activity",
    safeArrival: "Safe arrival at Home",
    routeShared: "Route shared with Mom",
    sosCanceled: "SOS canceled (test)",
    hoursAgo: "{n} hours ago",
    yesterday: "Yesterday",
    daysAgo: "{n} days ago",
    trackTitle: "Track",
    guardiansEye: "Guardian's Eye",
    trackingActive: "Tracking Active",
    trackingInactive: "Tracking Inactive",
    trustedContacts: "Trusted Contacts",
    startJourney: "Start Journey",
    endJourney: "End Journey",
    journeyTime: "Journey Time",
    shareLocation: "Share Location",
    safetyTitle: "Safety",
    safetyScore: "Safety Score",
    areaAnalysis: "Area Analysis",
    lighting: "Lighting",
    crowdDensity: "Crowd Density",
    policeProximity: "Police Proximity",
    recentIncidents: "Recent Incidents",
    reportIncident: "Report Incident",
    heatmap: "Heatmap",
    circleTitle: "SafeCircle",
    createCircle: "Create New Circle",
    allMembersSee: "All members can see each other live",
    enRoute: "En Route",
    deviGreeting: "Namaste 🙏 I am Devi. How can I help you?",
    deviName: "Devi AI - Your Safety Companion",
  },
  ta: {
    appName: "SafeHer",
    safe: "பாதுகாப்பு",
    sosTagline: "ஒரு தொடுதல் — பாதுகாப்பு",
    sending: "அனுப்புகிறது...",
    voiceSOS: "🎙️ BACHAO சொல்லவும்",
    safeRoute: "பாதுகாப்பான வழி",
    startingPoint: "தொடக்க இடம்",
    destination: "இலக்கு",
    findRoute: "வழி கண்டுபிடி",
    safest: "மிக பாதுகாப்பான",
    fastest: "வேகமான",
    wellLit: "ஒளி உள்ள",
    rakshakShare: "காவலர் பகிர்வு",
    shareLiveLocation: "நேரடி இருப்பிடம் பகிர்",
    surakshaScore: "பாதுகாப்பு மதிப்பெண்",
    areaSafetyRating: "பகுதி பாதுகாப்பு மதிப்பீடு",
    fakeCall: "போலி அழைப்பு 📞",
    incomingCall: "உள்வரும் அழைப்பு...",
    connected: "இணைக்கப்பட்டது",
    callEnded: "அழைப்பு முடிந்தது",
    recentActivity: "சமீபத்திய செயல்பாடு",
    safeArrival: "வீட்டில் பாதுகாப்பாக வந்தது",
    routeShared: "அம்மாவுடன் வழி பகிர்ந்தது",
    sosCanceled: "SOS ரத்து (சோதனை)",
    hoursAgo: "{n} மணி நேரம் முன்",
    yesterday: "நேற்று",
    daysAgo: "{n} நாட்கள் முன்",
    trackTitle: "கண்காணி",
    guardiansEye: "காவலர் கண்",
    trackingActive: "கண்காணிப்பு செயலில்",
    trackingInactive: "கண்காணிப்பு நிறுத்தப்பட்டது",
    trustedContacts: "நம்பகமான தொடர்புகள்",
    startJourney: "பயணம் தொடங்கு",
    endJourney: "பயணம் முடி",
    journeyTime: "பயண நேரம்",
    shareLocation: "இருப்பிடம் பகிர்",
    safetyTitle: "பாதுகாப்பு",
    safetyScore: "பாதுகாப்பு மதிப்பெண்",
    areaAnalysis: "பகுதி பகுப்பாய்வு",
    lighting: "ஒளி",
    crowdDensity: "கூட்ட அடர்த்தி",
    policeProximity: "காவல் அருகாமை",
    recentIncidents: "சமீபத்திய சம்பவங்கள்",
    reportIncident: "சம்பவம் புகார்",
    heatmap: "வெப்ப வரைபடம்",
    circleTitle: "SafeCircle",
    createCircle: "புதிய வட்டம் உருவாக்கு",
    allMembersSee: "அனைவரும் ஒருவரையொருவர் நேரடியாக காணலாம்",
    enRoute: "வழியில்",
    deviGreeting: "வணக்கம் 🙏 நான் தேவி. உதவ என்ன?",
    deviName: "தேவி AI - உங்கள் பாதுகாப்பு துணை",
  },
  te: {
    appName: "SafeHer",
    safe: "సురక్షితం",
    sosTagline: "ఒక స్పర్శ — భద్రత",
    sending: "పంపుతోంది...",
    voiceSOS: "🎙️ BACHAO చెప్పండి",
    safeRoute: "సురక్షిత మార్గం",
    startingPoint: "ప్రారంభ స్థానం",
    destination: "గమ్యం",
    findRoute: "మార్గం కనుగొను",
    safest: "అత్యంత సురక్షితం",
    fastest: "వేగవంతమైన",
    wellLit: "వెలుగుతున్న",
    rakshakShare: "సంరక్షక షేర్",
    shareLiveLocation: "లైవ్ స్థానం షేర్",
    surakshaScore: "భద్రతా స్కోరు",
    areaSafetyRating: "ప్రాంత భద్రతా రేటింగ్",
    fakeCall: "నకిలీ కాల్ 📞",
    incomingCall: "ఇన్‌కమింగ్ కాల్...",
    connected: "కనెక్ట్ అయింది",
    callEnded: "కాల్ ముగిసింది",
    recentActivity: "ఇటీవలి కార్యకలాపం",
    safeArrival: "ఇంటికి సురక్షితంగా చేరుకున్నారు",
    routeShared: "అమ్మతో మార్గం షేర్ చేశారు",
    sosCanceled: "SOS రద్దు (పరీక్ష)",
    hoursAgo: "{n} గంటల క్రితం",
    yesterday: "నిన్న",
    daysAgo: "{n} రోజుల క్రితం",
    trackTitle: "ట్రాక్",
    guardiansEye: "సంరక్షక కన్ను",
    trackingActive: "ట్రాకింగ్ యాక్టివ్",
    trackingInactive: "ట్రాకింగ్ ఆఫ్",
    trustedContacts: "విశ్వసనీయ పరిచయాలు",
    startJourney: "ప్రయాణం ప్రారంభించు",
    endJourney: "ప్రయాణం ముగించు",
    journeyTime: "ప్రయాణ సమయం",
    shareLocation: "స్థానం షేర్",
    safetyTitle: "భద్రత",
    safetyScore: "భద్రతా స్కోరు",
    areaAnalysis: "ప్రాంత విశ్లేషణ",
    lighting: "వెలుతురు",
    crowdDensity: "జన సాంద్రత",
    policeProximity: "పోలీసు సమీపం",
    recentIncidents: "ఇటీవలి సంఘటనలు",
    reportIncident: "సంఘటన నివేదించు",
    heatmap: "హీట్‌మ్యాప్",
    circleTitle: "SafeCircle",
    createCircle: "కొత్త సర్కిల్ సృష్టించు",
    allMembersSee: "అందరూ ఒకరినొకరు లైవ్‌లో చూడవచ్చు",
    enRoute: "మార్గంలో",
    deviGreeting: "నమస్కారం 🙏 నేను దేవిని. ఏమి సహాయం?",
    deviName: "దేవి AI - మీ భద్రతా సహచరి",
  },
  bn: {
    appName: "SafeHer",
    safe: "নিরাপদ",
    sosTagline: "এক স্পর্শ — সুরক্ষা",
    sending: "পাঠানো হচ্ছে...",
    voiceSOS: "🎙️ BACHAO বলুন",
    safeRoute: "নিরাপদ পথ",
    startingPoint: "শুরুর স্থান",
    destination: "গন্তব্য",
    findRoute: "পথ খুঁজুন",
    safest: "সবচেয়ে নিরাপদ",
    fastest: "দ্রুততম",
    wellLit: "আলোকিত",
    rakshakShare: "রক্ষক শেয়ার",
    shareLiveLocation: "লাইভ লোকেশন শেয়ার",
    surakshaScore: "সুরক্ষা স্কোর",
    areaSafetyRating: "এলাকা সুরক্ষা রেটিং",
    fakeCall: "নকল কল নিন 📞",
    incomingCall: "ইনকামিং কল...",
    connected: "সংযুক্ত",
    callEnded: "কল শেষ",
    recentActivity: "সাম্প্রতিক কার্যকলাপ",
    safeArrival: "বাড়িতে নিরাপদে পৌঁছেছেন",
    routeShared: "মায়ের সাথে পথ শেয়ার করা হয়েছে",
    sosCanceled: "SOS বাতিল (পরীক্ষা)",
    hoursAgo: "{n} ঘন্টা আগে",
    yesterday: "গতকাল",
    daysAgo: "{n} দিন আগে",
    trackTitle: "ট্র্যাক",
    guardiansEye: "অভিভাবকের চোখ",
    trackingActive: "ট্র্যাকিং চালু",
    trackingInactive: "ট্র্যাকিং বন্ধ",
    trustedContacts: "বিশ্বস্ত পরিচিতি",
    startJourney: "যাত্রা শুরু",
    endJourney: "যাত্রা শেষ",
    journeyTime: "যাত্রার সময়",
    shareLocation: "লোকেশন শেয়ার",
    safetyTitle: "সুরক্ষা",
    safetyScore: "সুরক্ষা স্কোর",
    areaAnalysis: "এলাকা বিশ্লেষণ",
    lighting: "আলো",
    crowdDensity: "ভিড়ের ঘনত্ব",
    policeProximity: "পুলিশ নৈকট্য",
    recentIncidents: "সাম্প্রতিক ঘটনা",
    reportIncident: "ঘটনা রিপোর্ট",
    heatmap: "হিটম্যাপ",
    circleTitle: "SafeCircle",
    createCircle: "নতুন সার্কেল তৈরি",
    allMembersSee: "সব সদস্য একে অপরকে লাইভ দেখতে পারেন",
    enRoute: "পথে",
    deviGreeting: "নমস্কার 🙏 আমি দেবী। কী সাহায্য করতে পারি?",
    deviName: "দেবী AI - আপনার সুরক্ষা সঙ্গী",
  },
  mr: {
    appName: "SafeHer",
    safe: "सुरक्षित",
    sosTagline: "एक स्पर्श — सुरक्षा",
    sending: "पाठवत आहे...",
    voiceSOS: "🎙️ BACHAO म्हणा",
    safeRoute: "सुरक्षित मार्ग",
    startingPoint: "सुरुवातीचे ठिकाण",
    destination: "गंतव्य",
    findRoute: "मार्ग शोधा",
    safest: "सर्वात सुरक्षित",
    fastest: "सर्वात वेगवान",
    wellLit: "प्रकाशमान",
    rakshakShare: "रक्षक शेअर",
    shareLiveLocation: "लाइव्ह लोकेशन शेअर",
    surakshaScore: "सुरक्षा स्कोअर",
    areaSafetyRating: "क्षेत्र सुरक्षा रेटिंग",
    fakeCall: "बनावट कॉल मिळवा 📞",
    incomingCall: "इनकमिंग कॉल...",
    connected: "जोडले",
    callEnded: "कॉल संपला",
    recentActivity: "अलीकडील क्रियाकलाप",
    safeArrival: "घरी सुरक्षित पोहोचलो",
    routeShared: "आईसोबत मार्ग शेअर केला",
    sosCanceled: "SOS रद्द (चाचणी)",
    hoursAgo: "{n} तासांपूर्वी",
    yesterday: "काल",
    daysAgo: "{n} दिवसांपूर्वी",
    trackTitle: "ट्रॅक",
    guardiansEye: "रक्षकाची नजर",
    trackingActive: "ट्रॅकिंग सक्रिय",
    trackingInactive: "ट्रॅकिंग बंद",
    trustedContacts: "विश्वासू संपर्क",
    startJourney: "प्रवास सुरू करा",
    endJourney: "प्रवास संपवा",
    journeyTime: "प्रवास वेळ",
    shareLocation: "लोकेशन शेअर",
    safetyTitle: "सुरक्षा",
    safetyScore: "सुरक्षा स्कोअर",
    areaAnalysis: "क्षेत्र विश्लेषण",
    lighting: "प्रकाश",
    crowdDensity: "गर्दी घनता",
    policeProximity: "पोलीस निकटता",
    recentIncidents: "अलीकडील घटना",
    reportIncident: "घटना नोंदवा",
    heatmap: "हीटमॅप",
    circleTitle: "SafeCircle",
    createCircle: "नवीन सर्कल तयार करा",
    allMembersSee: "सर्व सदस्य एकमेकांना लाइव्ह पाहू शकतात",
    enRoute: "मार्गात",
    deviGreeting: "नमस्कार 🙏 मी देवी आहे. काय मदत करू?",
    deviName: "देवी AI - तुमची सुरक्षा साथी",
  },
  gu: {
    appName: "SafeHer",
    safe: "સુરક્ષિત",
    sosTagline: "એક સ્પર્શ — સુરક્ષા",
    sending: "મોકલી રહ્યા છીએ...",
    voiceSOS: "🎙️ BACHAO બોલો",
    safeRoute: "સુરક્ષિત માર્ગ",
    startingPoint: "શરૂઆતનું સ્થળ",
    destination: "ગંતવ્ય",
    findRoute: "માર્ગ શોધો",
    safest: "સૌથી સુરક્ષિત",
    fastest: "સૌથી ઝડપી",
    wellLit: "પ્રકાશિત",
    rakshakShare: "રક્ષક શેર",
    shareLiveLocation: "લાઇવ લોકેશન શેર",
    surakshaScore: "સુરક્ષા સ્કોર",
    areaSafetyRating: "વિસ્તાર સુરક્ષા રેટિંગ",
    fakeCall: "નકલી કોલ મેળવો 📞",
    incomingCall: "ઇનકમિંગ કોલ...",
    connected: "જોડાયેલ",
    callEnded: "કોલ સમાપ્ત",
    recentActivity: "તાજેતરની પ્રવૃત્તિ",
    safeArrival: "ઘરે સુરક્ષિત પહોંચ્યા",
    routeShared: "મમ્મી સાથે માર્ગ શેર કર્યો",
    sosCanceled: "SOS રદ (ટેસ્ટ)",
    hoursAgo: "{n} કલાક પહેલાં",
    yesterday: "ગઈકાલે",
    daysAgo: "{n} દિવસ પહેલાં",
    trackTitle: "ટ્રેક",
    guardiansEye: "રક્ષકની નજર",
    trackingActive: "ટ્રેકિંગ સક્રિય",
    trackingInactive: "ટ્રેકિંગ બંધ",
    trustedContacts: "વિશ્વાસુ સંપર્કો",
    startJourney: "યાત્રા શરૂ કરો",
    endJourney: "યાત્રા સમાપ્ત કરો",
    journeyTime: "યાત્રા સમય",
    shareLocation: "લોકેશન શેર",
    safetyTitle: "સુરક્ષા",
    safetyScore: "સુરક્ષા સ્કોર",
    areaAnalysis: "વિસ્તાર વિશ્લેષણ",
    lighting: "પ્રકાશ",
    crowdDensity: "ભીડ ઘનતા",
    policeProximity: "પોલીસ નિકટતા",
    recentIncidents: "તાજેતરની ઘટનાઓ",
    reportIncident: "ઘટના નોંધાવો",
    heatmap: "હીટમેપ",
    circleTitle: "SafeCircle",
    createCircle: "નવું વર્તુળ બનાવો",
    allMembersSee: "બધા સભ્યો એકબીજાને લાઇવ જોઈ શકે છે",
    enRoute: "માર્ગમાં",
    deviGreeting: "નમસ્તે 🙏 હું દેવી છું. શું મદદ કરું?",
    deviName: "દેવી AI - તમારી સુરક્ષા સાથી",
  },
  kn: {
    appName: "SafeHer",
    safe: "ಸುರಕ್ಷಿತ",
    sosTagline: "ಒಂದು ಸ್ಪರ್ಶ — ಸುರಕ್ಷತೆ",
    sending: "ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ...",
    voiceSOS: "🎙️ BACHAO ಹೇಳಿ",
    safeRoute: "ಸುರಕ್ಷಿತ ಮಾರ್ಗ",
    startingPoint: "ಆರಂಭ ಸ್ಥಳ",
    destination: "ಗಮ್ಯಸ್ಥಾನ",
    findRoute: "ಮಾರ್ಗ ಹುಡುಕಿ",
    safest: "ಅತ್ಯಂತ ಸುರಕ್ಷಿತ",
    fastest: "ವೇಗವಾದ",
    wellLit: "ಬೆಳಕಿನ",
    rakshakShare: "ರಕ್ಷಕ ಹಂಚಿಕೆ",
    shareLiveLocation: "ಲೈವ್ ಸ್ಥಳ ಹಂಚಿಕೊಳ್ಳಿ",
    surakshaScore: "ಸುರಕ್ಷತಾ ಅಂಕ",
    areaSafetyRating: "ಪ್ರದೇಶ ಸುರಕ್ಷತಾ ರೇಟಿಂಗ್",
    fakeCall: "ನಕಲಿ ಕರೆ ಪಡೆಯಿರಿ 📞",
    incomingCall: "ಒಳಬರುವ ಕರೆ...",
    connected: "ಸಂಪರ್ಕಿಸಲಾಗಿದೆ",
    callEnded: "ಕರೆ ಮುಗಿಯಿತು",
    recentActivity: "ಇತ್ತೀಚಿನ ಚಟುವಟಿಕೆ",
    safeArrival: "ಮನೆಗೆ ಸುರಕ್ಷಿತವಾಗಿ ತಲುಪಿದೆ",
    routeShared: "ಅಮ್ಮನೊಂದಿಗೆ ಮಾರ್ಗ ಹಂಚಿಕೊಂಡಿದೆ",
    sosCanceled: "SOS ರದ್ದು (ಪರೀಕ್ಷೆ)",
    hoursAgo: "{n} ಗಂಟೆಗಳ ಹಿಂದೆ",
    yesterday: "ನಿನ್ನೆ",
    daysAgo: "{n} ದಿನಗಳ ಹಿಂದೆ",
    trackTitle: "ಟ್ರ್ಯಾಕ್",
    guardiansEye: "ರಕ್ಷಕನ ಕಣ್ಣು",
    trackingActive: "ಟ್ರ್ಯಾಕಿಂಗ್ ಸಕ್ರಿಯ",
    trackingInactive: "ಟ್ರ್ಯಾಕಿಂಗ್ ನಿಷ್ಕ್ರಿಯ",
    trustedContacts: "ವಿಶ್ವಾಸಾರ್ಹ ಸಂಪರ್ಕಗಳು",
    startJourney: "ಪ್ರಯಾಣ ಪ್ರಾರಂಭಿಸಿ",
    endJourney: "ಪ್ರಯಾಣ ಮುಗಿಸಿ",
    journeyTime: "ಪ್ರಯಾಣ ಸಮಯ",
    shareLocation: "ಸ್ಥಳ ಹಂಚಿಕೊಳ್ಳಿ",
    safetyTitle: "ಸುರಕ್ಷತೆ",
    safetyScore: "ಸುರಕ್ಷತಾ ಅಂಕ",
    areaAnalysis: "ಪ್ರದೇಶ ವಿಶ್ಲೇಷಣೆ",
    lighting: "ಬೆಳಕು",
    crowdDensity: "ಜನಸಾಂದ್ರತೆ",
    policeProximity: "ಪೊಲೀಸ್ ಸಾಮೀಪ್ಯ",
    recentIncidents: "ಇತ್ತೀಚಿನ ಘಟನೆಗಳು",
    reportIncident: "ಘಟನೆ ವರದಿ",
    heatmap: "ಹೀಟ್‌ಮ್ಯಾಪ್",
    circleTitle: "SafeCircle",
    createCircle: "ಹೊಸ ವೃತ್ತ ರಚಿಸಿ",
    allMembersSee: "ಎಲ್ಲಾ ಸದಸ್ಯರು ಒಬ್ಬರನ್ನೊಬ್ಬರು ಲೈವ್ ನೋಡಬಹುದು",
    enRoute: "ಮಾರ್ಗದಲ್ಲಿ",
    deviGreeting: "ನಮಸ್ಕಾರ 🙏 ನಾನು ದೇವಿ. ಏನು ಸಹಾಯ?",
    deviName: "ದೇವಿ AI - ನಿಮ್ಮ ಸುರಕ್ಷತಾ ಸಂಗಾತಿ",
  },
}

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>("hi")

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations.en[key] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
