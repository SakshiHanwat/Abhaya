"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { MapPin, Share2, Shield, ChevronRight, Clock, Mic, MicOff, Phone, PhoneOff, Globe, LogOut, Navigation } from "lucide-react"
import { MandalaBackground } from "@/components/mandala-background"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useLanguage } from "@/components/language-context"
import { useTheme } from "@/components/theme-context"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { saveSOS, getContacts, getUser } from "@/lib/auth"
import { supabase } from "@/lib/supabase"

type TabType = 'home' | 'track' | 'safety' | 'circle' | 'profile'

interface HomeScreenProps {
  onLogout?: () => void
  onNavigate?: (tab: TabType) => void
  onRouteSelect?: (origin: string, destination: string) => void
}

interface ActivityItem {
  id: string
  type: 'sos' | 'incident' | 'location'
  text: string
  time: string
  icon: string
  color: string
}

// ─── Voice trigger keywords ───────────────────────────────────────────────────
const TRIGGER_WORDS = [
  // Hindi
  'bachao', 'बचाओ', 'bachao bachao', 'बचाओ बचाओ',
  'madad', 'madad karo', 'मदद', 'मदद करो',
  // English
  'help', 'help me', 'help please', 'mayday', 'sos', 'emergency',
  // Hinglish / phonetic Hindi in English script
  'help mi', 'help mi please', 'help mee',
  'bachaw', 'bachhao', 'bacho',
  // Hindi words typed in English (how speech API returns them)
  'हेल्प', 'हेल्प मी', 'हेल्प मी प्लीज', 'हेल्प मी प्लीज़',
  'इमरजेंसी', 'खतरा', 'बचा लो', 'बचा लो मुझे',
  'pleej', 'pliz',
]

// Fuzzy check — agar koi bhi trigger word transcript mein hai
function isTriggerWord(transcript: string): boolean {
  const t = transcript.toLowerCase().trim()
  return TRIGGER_WORDS.some(word => t.includes(word.toLowerCase()))
}

function MandalaCorner({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className}>
      <path d="M 0 40 Q 0 0 40 0" fill="none" stroke="#c9933a" strokeWidth={1.5} />
      <circle cx={10} cy={10} r={3} fill="#c9933a" fillOpacity={0.6} />
      <circle cx={5} cy={20} r={2} fill="#c9933a" fillOpacity={0.4} />
      <circle cx={20} cy={5} r={2} fill="#c9933a" fillOpacity={0.4} />
      <path d="M 2 30 Q 10 20 20 18 Q 15 10 30 2" fill="none" stroke="#c9933a" strokeWidth={0.5} strokeOpacity={0.5} />
    </svg>
  )
}

// ─── Internet check ───────────────────────────────────────────────────────────
async function isOnline(): Promise<boolean> {
  if (!navigator.onLine) return false
  try {
    await fetch('https://www.google.com/favicon.ico', { method: 'HEAD', mode: 'no-cors', signal: AbortSignal.timeout(3000) })
    return true
  } catch { return false }
}

// ─── Core SOS sender (shared between button + voice) ─────────────────────────
async function sendSOS(onSent?: (via: string) => void) {
  let lat = 0, lng = 0
  try {
    const pos = await new Promise<GeolocationPosition>((res, rej) =>
      navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
    )
    lat = pos.coords.latitude; lng = pos.coords.longitude
  } catch { }

  await saveSOS(lat, lng)
  const online = await isOnline()
  const contacts = await getContacts()
  const mapsLink = lat ? `https://maps.google.com/?q=${lat},${lng}` : 'Location unavailable'

  if (contacts.length > 0) {
    if (online) {
      const waMsg = encodeURIComponent(`🚨 EMERGENCY SOS! Mujhe madad chahiye!\n📍 Location: ${mapsLink}\n\nAbhaya Safety App`)
      window.open(`https://wa.me/${contacts[0].phone.replace(/\D/g, '')}?text=${waMsg}`, '_blank')
      const smsBody = encodeURIComponent(`🚨 EMERGENCY! Mujhe madad chahiye!\nLocation: ${mapsLink}\n- Abhaya App`)
      contacts.slice(1).forEach((c: any, i: number) => {
        setTimeout(() => { window.location.href = `sms:${c.phone.replace(/\D/g, '')}?body=${smsBody}` }, (i + 1) * 800)
      })
      onSent?.('WhatsApp + SMS')
    } else {
      const smsBody = encodeURIComponent(`🚨 EMERGENCY! Mujhe madad chahiye!\nLocation: ${mapsLink}\n- Abhaya App`)
      contacts.forEach((c: any, i: number) => {
        setTimeout(() => { window.location.href = `sms:${c.phone.replace(/\D/g, '')}?body=${smsBody}` }, i * 800)
      })
      onSent?.('SMS (No Internet)')
    }
  } else {
    window.location.href = `sms:112?body=${encodeURIComponent(`🚨 EMERGENCY! Location: ${lat},${lng}`)}`
    onSent?.('SMS to 112')
  }
}

// ─── Voice SOS Hook ───────────────────────────────────────────────────────────
function useVoiceSOS(onTriggered: () => void) {
  const [isListening, setIsListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [supported, setSupported] = useState(false)
  const [error, setError] = useState('')
  const recognitionRef = useRef<any>(null)
  const isListeningRef = useRef(false)

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (SpeechRecognition) setSupported(true)
  }, [])

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) { setError('Yeh browser voice support nahi karta'); return }

    const recognition = new SpeechRecognition()
    recognition.lang = 'hi-IN'
    recognition.continuous = true
    recognition.interimResults = true
    recognition.maxAlternatives = 5

    recognition.onstart = () => { setIsListening(true); isListeningRef.current = true; setError('') }

    recognition.onresult = (event: any) => {
      // Collect ALL alternatives from ALL results
      const allTexts: string[] = []
      for (let i = 0; i < event.results.length; i++) {
        for (let j = 0; j < event.results[i].length; j++) {
          allTexts.push(event.results[i][j].transcript.toLowerCase().trim())
        }
      }
      setTranscript(allTexts[0] || '')

      // Check trigger in ALL alternatives
      const triggered = allTexts.some(text => isTriggerWord(text))
      if (triggered && isListeningRef.current) {
        recognition.stop()
        onTriggered()
      }
    }

    recognition.onerror = (e: any) => {
      if (e.error === 'not-allowed') setError('Microphone permission do settings mein')
      else if (e.error === 'network') setError('Network error — dobara try karo')
      setIsListening(false)
      isListeningRef.current = false
    }

    recognition.onend = () => {
      // Auto restart if still listening
      if (isListeningRef.current) {
        try { recognition.start() } catch { }
      } else {
        setIsListening(false)
        setTranscript('')
      }
    }

    recognitionRef.current = recognition
    try { recognition.start() } catch (e) { setError('Microphone shuru nahi ho saka') }
  }, [onTriggered])

  const stopListening = useCallback(() => {
    isListeningRef.current = false
    recognitionRef.current?.stop()
    setIsListening(false)
    setTranscript('')
    setError('')
  }, [])

  const toggle = useCallback(() => {
    if (isListening) stopListening()
    else startListening()
  }, [isListening, startListening, stopListening])

  return { isListening, transcript, supported, error, toggle, stopListening }
}

// ─── Voice Badge with real speech ────────────────────────────────────────────
function VoiceBadge({ onVoiceTriggered }: { onVoiceTriggered: () => void }) {
  const { colors } = useTheme()
  const { isListening, transcript, supported, error, toggle } = useVoiceSOS(onVoiceTriggered)

  if (!supported) return null

  return (
    <div className="flex flex-col items-center gap-1">
      <motion.button
        onClick={toggle}
        className="relative flex items-center gap-2 px-4 py-2 rounded-full"
        style={{
          background: isListening
            ? 'linear-gradient(135deg, rgba(76,175,80,0.3), rgba(76,175,80,0.1))'
            : `${colors.accent}20`,
          border: isListening ? '1.5px solid #4caf50' : `1.5px solid ${colors.accent}`,
        }}
        animate={{
          boxShadow: isListening
            ? ['0 0 12px rgba(76,175,80,0.6)', '0 0 25px rgba(76,175,80,0.9)', '0 0 12px rgba(76,175,80,0.6)']
            : [`0 0 5px ${colors.accent}30`, `0 0 12px ${colors.accent}50`, `0 0 5px ${colors.accent}30`],
        }}
        transition={{ duration: 1.2, repeat: Infinity }}
        whileTap={{ scale: 0.95 }}
      >
        {/* Pulse rings when listening */}
        {isListening && (
          <>
            {[1, 2].map(r => (
              <motion.div key={r} className="absolute inset-0 rounded-full border border-[#4caf50]"
                animate={{ scale: [1, 1.4 + r * 0.2], opacity: [0.6, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: r * 0.3 }} />
            ))}
          </>
        )}

        <div className="relative">
          {isListening
            ? <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity }}>
                <Mic className="w-4 h-4 text-[#4caf50]" />
              </motion.div>
            : <Mic className="w-4 h-4" style={{ color: colors.accent }} />
          }
        </div>

        <span className="text-xs font-medium" style={{ color: isListening ? '#4caf50' : colors.accent }}>
          {isListening ? '🔴 Sun rahi hoon...' : '🎙️ BACHAO bolne par bhi kaam karega'}
        </span>

        {isListening && (
          <motion.div
            onClick={(e) => { e.stopPropagation(); toggle() }}
            className="ml-1 p-0.5 rounded-full cursor-pointer"
            style={{ background: 'rgba(76,175,80,0.2)' }}
            whileTap={{ scale: 0.9 }}>
            <MicOff className="w-3 h-3 text-[#4caf50]" />
          </motion.div>
        )}
      </motion.button>

      {/* Live transcript */}
      <AnimatePresence>
        {isListening && transcript && (
          <motion.div
            className="px-3 py-1 rounded-full text-[10px] max-w-[250px] text-center truncate"
            style={{ background: 'rgba(76,175,80,0.1)', color: '#4caf50', border: '1px solid rgba(76,175,80,0.3)' }}
            initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
          >
            "{transcript}"
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <motion.p className="text-[10px] text-center px-4" style={{ color: '#ff6b35' }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          ⚠️ {error}
        </motion.p>
      )}
    </div>
  )
}

// ─── SOS Button ───────────────────────────────────────────────────────────────
function SOSButton({ onSOSSent }: { onSOSSent?: () => void }) {
  const [countdown, setCountdown] = useState<number | null>(null)
  const [sosSent, setSosSent] = useState(false)
  const [showCallModal, setShowCallModal] = useState(false)
  const [sentVia, setSentVia] = useState('')
  const [isVoiceTriggered, setIsVoiceTriggered] = useState(false)
  const { t } = useLanguage()
  const { colors } = useTheme()

  const triggerSOS = useCallback(async (fromVoice = false) => {
    if (countdown !== null || sosSent) return // already running
    if (fromVoice) setIsVoiceTriggered(true)

    let count = fromVoice ? 3 : 5 // Voice = 3 sec, Button = 5 sec
    setCountdown(count)

    await sendSOS((via) => {
      setSentVia(via)
      setSosSent(true)
      onSOSSent?.()
    })

    const interval = setInterval(() => {
      count--
      if (count <= 0) {
        clearInterval(interval)
        setCountdown(null)
        setShowCallModal(true)
        setIsVoiceTriggered(false)
      } else {
        setCountdown(count)
      }
    }, 1000)
  }, [countdown, sosSent, onSOSSent])

  const handleVoiceTriggered = useCallback(() => {
    triggerSOS(true)
  }, [triggerSOS])

  return (
    <>
      <div className="relative flex flex-col items-center justify-center py-8">
        {[1, 2, 3].map((ring) => (
          <motion.div key={ring} className="absolute rounded-full border-2"
            style={{ width: 140 + ring * 40, height: 140 + ring * 40, borderColor: `${colors.accent}30` }}
            animate={sosSent
              ? { scale: [1, 1.5, 2], opacity: [0.5, 0.3, 0] }
              : { scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
            transition={{ duration: sosSent ? 1 : 2, repeat: sosSent ? 0 : Infinity, delay: ring * 0.2 }}
          />
        ))}

        {/* Voice triggered pulse overlay */}
        <AnimatePresence>
          {isVoiceTriggered && (
            <motion.div className="absolute inset-0 flex items-center justify-center z-20"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {[1, 2, 3, 4].map(r => (
                <motion.div key={r} className="absolute rounded-full border-2 border-[#4caf50]"
                  style={{ width: 100 + r * 50, height: 100 + r * 50 }}
                  animate={{ scale: [1, 1.5], opacity: [0.8, 0] }}
                  transition={{ duration: 1, repeat: Infinity, delay: r * 0.2 }} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          className="relative z-10 w-36 h-36 rounded-full flex flex-col items-center justify-center overflow-hidden"
          style={{
            background: sosSent
              ? "radial-gradient(circle, #4caf50 0%, #2e7d32 100%)"
              : isVoiceTriggered
              ? "radial-gradient(circle, #ff6b35 0%, #e65100 100%)"
              : "radial-gradient(circle, #b5836a 0%, #8b6a5c 100%)",
            boxShadow: isVoiceTriggered
              ? "0 0 60px rgba(255,107,53,0.7), inset 0 0 30px rgba(0,0,0,0.1)"
              : "0 0 40px rgba(181,131,106,0.5), inset 0 0 30px rgba(0,0,0,0.1)",
          }}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          animate={{ scale: [1, 1.03, 1] }} transition={{ duration: 3, repeat: Infinity }}
          onClick={() => triggerSOS(false)}
        >
          <svg className="absolute inset-0 w-full h-full opacity-30" viewBox="0 0 100 100">
            {Array.from({ length: 8 }).map((_, i) => (
              <g key={i} transform={`rotate(${i * 45} 50 50)`}>
                <path d="M 50 50 L 50 20 Q 55 35 60 40 L 50 50" fill="#c9933a" fillOpacity={0.5} />
              </g>
            ))}
            <circle cx={50} cy={50} r={15} fill="none" stroke="#c9933a" strokeWidth={1} />
          </svg>

          <AnimatePresence mode="wait">
            {sosSent ? (
              <motion.div key="sent" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex flex-col items-center">
                <span className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-cinzel)' }}>✓ SENT</span>
                <span className="text-[9px] text-white/80 mt-1 text-center px-2">{sentVia}</span>
              </motion.div>
            ) : countdown !== null ? (
              <motion.div key="countdown" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex flex-col items-center">
                {isVoiceTriggered && <span className="text-xs text-white/80 mb-1">🎙️ Voice SOS</span>}
                <span className="text-4xl font-bold text-white" style={{ fontFamily: 'var(--font-cinzel)' }}>{countdown}</span>
                <span className="text-xs text-white/80 mt-1">{t('sending')}</span>
              </motion.div>
            ) : (
              <motion.div key="sos" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex flex-col items-center">
                <span className="text-3xl font-bold text-[#4a2c2a] tracking-wider" style={{ fontFamily: 'var(--font-cinzel)' }}>SOS</span>
                <span className="text-[10px] text-[#4a2c2a]/80 mt-1 text-center leading-tight">{t('sosTagline')}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        {/* WhatsApp + SMS badges */}
        <motion.div className="mt-3 flex items-center gap-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: 'rgba(76,175,80,0.15)', border: '1px solid rgba(76,175,80,0.4)' }}>
            <span className="text-[10px] text-[#4caf50]">📱 WhatsApp</span>
          </div>
          <span className="text-[10px]" style={{ color: colors.foregroundMuted }}>+</span>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: `${colors.accent}15`, border: `1px solid ${colors.accent}40` }}>
            <span className="text-[10px]" style={{ color: colors.accent }}>💬 SMS</span>
          </div>
        </motion.div>

        {/* Voice Badge */}
        <motion.div className="mt-3" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <VoiceBadge onVoiceTriggered={handleVoiceTriggered} />
        </motion.div>
      </div>

      {/* 112 Modal */}
      <AnimatePresence>
        {showCallModal && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.7)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="mx-6 rounded-2xl p-6 text-center" style={{ background: colors.card, border: `1px solid ${colors.cardBorder}` }}
              initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
              <div className="text-5xl mb-3">🚨</div>
              <h3 className="text-xl font-bold mb-2" style={{ color: colors.foreground, fontFamily: 'var(--font-playfair)' }}>
                {isVoiceTriggered ? '🎙️ Voice SOS Bheja!' : 'Alert Bheja Gaya!'}
              </h3>
              {sentVia && (
                <div className="mb-3 px-3 py-2 rounded-xl text-xs font-medium" style={{ background: 'rgba(76,175,80,0.1)', color: '#4caf50', border: '1px solid rgba(76,175,80,0.3)' }}>
                  ✅ {sentVia} se bheja gaya
                </div>
              )}
              <p className="text-sm mb-4" style={{ color: colors.foregroundMuted }}>Contacts notify ho gaye. Kya police ko call karein?</p>
              <motion.a href="tel:112" className="w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 mb-2"
                style={{ background: 'linear-gradient(135deg, #d32f2f, #b71c1c)', display: 'flex' }} whileTap={{ scale: 0.97 }}>
                <Phone className="w-5 h-5" /><span>📞 112 Call</span>
              </motion.a>
              <motion.a href="sms:112?body=Emergency%20help%20needed"
                className="w-full py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 mb-3"
                style={{ background: `${colors.accent}20`, border: `1px solid ${colors.accent}50`, display: 'flex', color: colors.foreground }}
                whileTap={{ scale: 0.97 }}>
                <span>💬 112 SMS</span>
              </motion.a>
              <button onClick={() => { setShowCallModal(false); setSosSent(false); setSentVia('') }}
                className="text-sm underline" style={{ color: colors.foregroundMuted }}>
                Baad mein karenge
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

// ─── Fake Call ────────────────────────────────────────────────────────────────
function FakeCallOverlay({ onClose }: { onClose: () => void }) {
  const [callState, setCallState] = useState<'ringing' | 'answered' | 'ended'>('ringing')
  const { t } = useLanguage()
  const { colors } = useTheme()
  return (
    <motion.div className="fixed inset-0 z-50 flex flex-col items-center justify-between py-16 px-8"
      style={{ background: colors.background }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="flex flex-col items-center">
        <div className="relative">
          {[1, 2, 3].map((ring) => (
            <motion.div key={ring} className="absolute rounded-full border"
              style={{ width: 120 + ring * 30, height: 120 + ring * 30, left: `calc(50% - ${(120 + ring * 30) / 2}px)`, top: `calc(50% - ${(120 + ring * 30) / 2}px)`, borderColor: `${colors.accent}40` }}
              animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 2, repeat: Infinity, delay: ring * 0.3 }} />
          ))}
          <motion.div className="w-28 h-28 rounded-full flex items-center justify-center text-4xl"
            style={{ background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.secondary} 100%)`, boxShadow: `0 0 30px ${colors.accent}50` }}
            animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, repeat: Infinity }}>
            <span>👨</span>
          </motion.div>
        </div>
        <motion.h2 className="mt-6 text-3xl" style={{ color: colors.foreground, fontFamily: 'var(--font-playfair)' }}>Papa 💛</motion.h2>
        <motion.p className="mt-2 text-lg" style={{ color: callState === 'ringing' ? '#4caf50' : colors.foreground }}>
          {callState === 'ringing' ? t('incomingCall') : callState === 'answered' ? t('connected') : t('callEnded')}
        </motion.p>
      </div>
      {callState === 'ringing' && (
        <>
          <motion.div className="my-8" animate={{ rotate: [-5, 5, -5] }} transition={{ duration: 0.2, repeat: Infinity }}>
            <Phone className="w-12 h-12 text-[#4caf50]" />
          </motion.div>
          <div className="flex items-center gap-12">
            <motion.button className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)" }}
              whileTap={{ scale: 0.95 }} onClick={() => { setCallState('ended'); setTimeout(onClose, 500) }}>
              <PhoneOff className="w-7 h-7 text-white" />
            </motion.button>
            <motion.button className="w-16 h-16 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)" }}
              whileTap={{ scale: 0.95 }} animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1, repeat: Infinity }}
              onClick={() => setCallState('answered')}>
              <Phone className="w-7 h-7 text-white" />
            </motion.button>
          </div>
        </>
      )}
      {callState === 'answered' && (
        <motion.button className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)" }}
          initial={{ scale: 0 }} animate={{ scale: 1 }} whileTap={{ scale: 0.95 }}
          onClick={() => { setCallState('ended'); setTimeout(onClose, 500) }}>
          <PhoneOff className="w-7 h-7 text-white" />
        </motion.button>
      )}
    </motion.div>
  )
}

// ─── ORS helpers ──────────────────────────────────────────────────────────────
async function geocodeAddress(address: string): Promise<[number, number] | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_ORS_API_KEY
    const res = await fetch(`https://api.openrouteservice.org/geocode/search?api_key=${apiKey}&text=${encodeURIComponent(address)}&size=1`)
    const data = await res.json()
    if (data.features?.length > 0) { const [lng, lat] = data.features[0].geometry.coordinates; return [lng, lat] }
    return null
  } catch { return null }
}

async function getORSRoute(origin: [number, number], dest: [number, number], profile: string) {
  const apiKey = process.env.NEXT_PUBLIC_ORS_API_KEY
  const res = await fetch(`https://api.openrouteservice.org/v2/directions/${profile}?api_key=${apiKey}&start=${origin[0]},${origin[1]}&end=${dest[0]},${dest[1]}`)
  return res.json()
}

// ─── Route Finder ─────────────────────────────────────────────────────────────
function RouteFinderCard({ onRouteSelect }: { onRouteSelect?: (origin: string, destination: string) => void }) {
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [searching, setSearching] = useState(false)
  const [routes, setRoutes] = useState<any[]>([])
  const [error, setError] = useState('')
  const [selectedRoute, setSelectedRoute] = useState<number | null>(null)
  const { t } = useLanguage()
  const { colors } = useTheme()

  const fmt = (s: number) => { const m = Math.round(s / 60); return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m` }
  const fmtDist = (m: number) => m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)}km`

  const handleSearch = async () => {
    if (!origin || !destination) return
    setSearching(true); setError(''); setRoutes([]); setSelectedRoute(null)
    try {
      const [oCoords, dCoords] = await Promise.all([geocodeAddress(origin), geocodeAddress(destination)])
      if (!oCoords || !dCoords) { setError('Address nahi mila!'); setSearching(false); return }
      const [walk, cycle, drive] = await Promise.all([
        getORSRoute(oCoords, dCoords, 'foot-walking'),
        getORSRoute(oCoords, dCoords, 'cycling-regular'),
        getORSRoute(oCoords, dCoords, 'driving-car'),
      ])
      const configs = [
        { data: walk, name: "Surakshit Raasta", color: "#4caf50", score: 94, badge: "🛡️ SAFEST" },
        { data: cycle, name: "Tez Raasta", color: colors.accent, score: 78, badge: "⚡ FASTEST" },
        { data: drive, name: "Prakashit Raasta", color: "#9c27b0", score: 86, badge: "💡 WELL LIT" },
      ]
      const newRoutes = configs.filter(c => c.data.features?.[0]).map(c => {
        const seg = c.data.features[0].properties.segments[0]
        return { ...c, duration: fmt(seg.duration), distance: fmtDist(seg.distance) }
      })
      if (newRoutes.length === 0) setError('Route nahi mila!')
      else { setRoutes(newRoutes); setSelectedRoute(0) }
    } catch { setError('Kuch gadbad hui!') }
    setSearching(false)
  }

  return (
    <motion.div className="relative rounded-xl p-4 mx-4"
      style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, boxShadow: `0 4px 20px ${colors.shadow}` }}
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
      <MandalaCorner className="absolute top-0 left-0 w-10 h-10" />
      <MandalaCorner className="absolute top-0 right-0 w-10 h-10 rotate-90" />
      <MandalaCorner className="absolute bottom-0 right-0 w-10 h-10 rotate-180" />
      <MandalaCorner className="absolute bottom-0 left-0 w-10 h-10 -rotate-90" />
      <h3 className="text-lg font-serif mb-4 flex items-center gap-2" style={{ color: colors.accent, fontFamily: 'var(--font-playfair)' }}>
        <MapPin className="w-5 h-5" />{t('safeRoute')}
      </h3>
      <div className="space-y-3">
        {[{ val: origin, set: setOrigin, ph: t('startingPoint'), c: colors.accent }, { val: destination, set: setDestination, ph: t('destination'), c: colors.secondary }].map((inp, i) => (
          <div key={i} className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill={inp.c}><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
            </div>
            <input type="text" placeholder={inp.ph} value={inp.val} onChange={e => inp.set(e.target.value)}
              className="w-full rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none"
              style={{ background: colors.backgroundSecondary, border: `1px solid ${colors.cardBorder}`, color: colors.foreground }} />
          </div>
        ))}
        {error && <p className="text-xs text-center" style={{ color: '#ff6b35' }}>{error}</p>}
        <motion.button className="w-full py-3 rounded-lg font-medium text-white flex items-center justify-center gap-2"
          style={{ background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)` }}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={handleSearch} disabled={searching || !origin || !destination}>
          {searching
            ? <><motion.div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} /><span>Routes dhundh rahe hain...</span></>
            : <><Navigation className="w-4 h-4" /><span>{t('findRoute')}</span><ChevronRight className="w-4 h-4" /></>}
        </motion.button>
      </div>
      <AnimatePresence>
        {routes.length > 0 && (
          <motion.div className="mt-4 space-y-2" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
            <div className="h-px my-3" style={{ background: `linear-gradient(to right, transparent, ${colors.accent}50, transparent)` }} />
            {routes.map((route, index) => (
              <motion.button key={route.name}
                className="w-full flex items-center justify-between p-3 rounded-xl border-2"
                style={{ background: selectedRoute === index ? `${route.color}15` : colors.backgroundSecondary, borderColor: selectedRoute === index ? route.color : colors.cardBorder }}
                onClick={() => { setSelectedRoute(index); onRouteSelect?.(origin, destination) }}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }}
                whileTap={{ scale: 0.98 }}>
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: route.color }} />
                  <div className="text-left">
                    <p className="text-sm font-medium" style={{ color: colors.foreground }}>{route.name}</p>
                    <p className="text-xs" style={{ color: colors.foregroundMuted }}>{route.duration} • {route.distance}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${route.color}20`, color: route.color }}>{route.badge}</span>
                  <span className="text-xs font-bold" style={{ color: route.color }}>🛡️ {route.score}%</span>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function QuickCards({ onNavigate }: { onNavigate?: (tab: TabType) => void }) {
  const { t } = useLanguage()
  const { colors } = useTheme()
  return (
    <div className="grid grid-cols-2 gap-3 px-4 mt-4">
      {[
        { title: t('rakshakShare'), icon: Share2, desc: t('shareLiveLocation'), color: colors.accent, tab: 'track' as TabType },
        { title: t('surakshaScore'), icon: Shield, desc: t('areaSafetyRating'), color: colors.secondary, tab: 'safety' as TabType },
      ].map((card, i) => (
        <motion.button key={card.title}
          className="rounded-xl p-4 text-left"
          style={{ background: colors.card, border: `1px solid ${colors.cardBorder}`, boxShadow: `0 2px 10px ${colors.shadow}` }}
          onClick={() => onNavigate?.(card.tab)}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 + i * 0.1 }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <card.icon className="w-6 h-6 mb-2" style={{ color: card.color }} />
          <h4 className="font-medium text-sm" style={{ color: colors.foreground }}>{card.title}</h4>
          <p className="text-xs mt-1" style={{ color: colors.foregroundMuted }}>{card.desc}</p>
        </motion.button>
      ))}
    </div>
  )
}

function FakeCallButton({ onPress }: { onPress: () => void }) {
  const { t } = useLanguage()
  return (
    <motion.button className="w-full py-4 rounded-xl font-medium text-white flex items-center justify-center gap-3"
      style={{ background: "linear-gradient(135deg, #4caf50 0%, #2e7d32 100%)", boxShadow: "0 4px 20px rgba(76,175,80,0.3)" }}
      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={onPress}>
      <Phone className="w-5 h-5" /><span>{t('fakeCall')}</span>
    </motion.button>
  )
}

function GoldDivider() {
  const { colors } = useTheme()
  return (
    <div className="flex items-center gap-2 px-4 my-3">
      <div className="flex-1 h-px" style={{ background: `linear-gradient(to right, transparent, ${colors.accent}50)` }} />
      <div className="w-2 h-2 rotate-45" style={{ background: colors.accent }} />
      <div className="flex-1 h-px" style={{ background: `linear-gradient(to left, transparent, ${colors.accent}50)` }} />
    </div>
  )
}

// ─── Real Recent Activity ─────────────────────────────────────────────────────
function RecentActivity({ refresh }: { refresh: number }) {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const { colors } = useTheme()

  const timeAgo = (d: string) => {
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000)
    if (diff < 60) return 'Abhi abhi'
    if (diff < 3600) return `${Math.floor(diff / 60)} min pehle`
    if (diff < 86400) return `${Math.floor(diff / 3600)} ghante pehle`
    if (diff < 172800) return 'Kal'
    return `${Math.floor(diff / 86400)} din pehle`
  }

  useEffect(() => {
    const loadActivity = async () => {
      setLoading(true)
      const user = await getUser()
      if (!user) { setLoading(false); return }
      const items: ActivityItem[] = []

      const { data: sos } = await supabase.from('sos_alerts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3)
      sos?.forEach(s => items.push({ id: s.id, type: 'sos', text: '🚨 SOS Alert bheja gaya', time: timeAgo(s.created_at), icon: '🚨', color: '#d32f2f' }))

      const { data: inc } = await supabase.from('incidents').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3)
      const labels: Record<string, string> = { harassment: 'Chheda-khani report ki', poor_lighting: 'Andhera report kiya', no_cctv: 'CCTV nahi report kiya', unsafe_crowd: 'Unsafe crowd report ki' }
      inc?.forEach(i => items.push({ id: i.id, type: 'incident', text: `⚠️ ${labels[i.type] || i.type}`, time: timeAgo(i.created_at), icon: '⚠️', color: '#ff6b35' }))

      const { data: loc } = await supabase.from('locations').select('*').eq('user_id', user.id).order('updated_at', { ascending: false }).limit(2)
      loc?.forEach((l, idx) => items.push({ id: `loc-${idx}`, type: 'location', text: l.is_tracking ? '📍 Live tracking shuru ki' : '✅ Surakshit pahunch gayi', time: timeAgo(l.updated_at), icon: l.is_tracking ? '📍' : '✅', color: '#4caf50' }))

      setActivities(items.slice(0, 5))
      setLoading(false)
    }
    loadActivity()
  }, [refresh])

  return (
    <motion.div className="px-4 pb-24" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-serif" style={{ color: colors.accent, fontFamily: 'var(--font-playfair)' }}>Haal ki Gatividhiyan</h3>
        {loading && <motion.div className="w-4 h-4 border-2 border-t-transparent rounded-full" style={{ borderColor: colors.accent }} animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} />}
      </div>
      {!loading && activities.length === 0 && (
        <motion.div className="text-center py-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="text-3xl mb-2">🌸</div>
          <p className="text-sm" style={{ color: colors.foregroundMuted }}>Abhi tak koi activity nahi</p>
          <p className="text-xs mt-1" style={{ color: `${colors.foregroundMuted}80` }}>SOS ya route use karo — yahan dikhega</p>
        </motion.div>
      )}
      <div className="space-y-0">
        {activities.map((act, i) => (
          <div key={act.id}>
            {i > 0 && <GoldDivider />}
            <motion.div className="flex items-center gap-3 py-1"
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: `${act.color}15`, border: `1px solid ${act.color}30` }}>
                <span className="text-sm">{act.icon}</span>
              </div>
              <div className="flex-1">
                <p className="text-sm" style={{ color: colors.foreground }}>{act.text}</p>
                <p className="text-xs flex items-center gap-1 mt-0.5" style={{ color: colors.foregroundMuted }}>
                  <Clock className="w-3 h-3" />{act.time}
                </p>
              </div>
            </motion.div>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ─── Main HomeScreen ──────────────────────────────────────────────────────────
export function HomeScreen({ onLogout, onNavigate, onRouteSelect }: HomeScreenProps) {
  const [showFakeCall, setShowFakeCall] = useState(false)
  const [showLanguageSwitcher, setShowLanguageSwitcher] = useState(false)
  const [activityRefresh, setActivityRefresh] = useState(0)
  const { t } = useLanguage()
  const { colors } = useTheme()

  return (
    <div className="relative min-h-screen pb-20" style={{ background: colors.background }}>
      <MandalaBackground variant="home" opacity={0.15} />

      {/* Header */}
      <motion.div className="flex items-center justify-between px-4 py-4" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-serif flex-shrink-0" style={{ color: colors.accent, fontFamily: 'var(--font-playfair)' }}>Abhaya</h1>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <motion.button onClick={() => setShowLanguageSwitcher(true)} className="p-2 rounded-full border flex-shrink-0"
            style={{ borderColor: `${colors.accent}40` }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Globe className="w-4 h-4" style={{ color: colors.accent }} />
          </motion.button>
          <div className="flex-shrink-0"><ThemeSwitcher /></div>
          {onLogout && (
            <motion.button onClick={onLogout} className="p-2 rounded-full border flex-shrink-0"
              style={{ borderColor: `${colors.secondary}40` }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <LogOut className="w-4 h-4" style={{ color: colors.secondary }} />
            </motion.button>
          )}
          <div className="px-2 py-1 rounded-full border flex-shrink-0"
            style={{ backgroundColor: `${colors.accent}20`, borderColor: `${colors.accent}40` }}>
            <span className="text-xs font-medium" style={{ color: colors.accent }}>{t('safe')}</span>
          </div>
        </div>
      </motion.div>

      <SOSButton onSOSSent={() => setActivityRefresh(r => r + 1)} />
      <RouteFinderCard onRouteSelect={onRouteSelect} />
      <QuickCards onNavigate={onNavigate} />
      <div className="mt-4 px-4"><FakeCallButton onPress={() => setShowFakeCall(true)} /></div>
      <div className="mt-4"><RecentActivity refresh={activityRefresh} /></div>

      <AnimatePresence>
        {showFakeCall && <FakeCallOverlay onClose={() => setShowFakeCall(false)} />}
      </AnimatePresence>
      <LanguageSwitcher isOpen={showLanguageSwitcher} onClose={() => setShowLanguageSwitcher(false)} />
    </div>
  )
}