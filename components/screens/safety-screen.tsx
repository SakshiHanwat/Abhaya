"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { AlertTriangle, Camera, Users, Lightbulb, CheckCircle, RefreshCw, MapPin, Route, Navigation } from "lucide-react"
import { MandalaBackground } from "@/components/mandala-background"
import { saveIncident } from "@/lib/auth"

// ─── Types ────────────────────────────────────────────────────────────────────

interface SafetyScores {
  overall: number
  roshni: number
  police: number
  cctv: number
  bheed: number
  hospital: number
  meta: {
    lampCount: number
    policeCount: number
    cctvCount: number
    activityCount: number
    hospitalCount: number
    isNight: boolean
    radius: number
    areaType: 'urban' | 'suburban' | 'highway' | 'rural'
    isHighway: boolean
  }
}

interface RoutePoint {
  lat: number
  lng: number
  name: string
  isHighway?: boolean
  areaType?: 'urban' | 'suburban' | 'highway' | 'rural'
}

export interface SafetyRouteData {
  origin: string
  destination: string
}

// ─── Overpass API ─────────────────────────────────────────────────────────────

const OVERPASS_SERVERS = [
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]

async function overpassQuery(query: string): Promise<any> {
  for (const server of OVERPASS_SERVERS) {
    try {
      const res = await fetch(`${server}?data=${encodeURIComponent(query)}`, {
        signal: AbortSignal.timeout(12000),
      })
      if (!res.ok) continue
      return await res.json()
    } catch { continue }
  }
  return null
}

async function getRealSafetyData(lat: number, lng: number, radiusM: number = 5000) {
  const q = `
    [out:json][timeout:40];
    (
      node["highway"="street_lamp"](around:${radiusM},${lat},${lng});
      node["amenity"="police"](around:${radiusM},${lat},${lng});
      way["amenity"="police"](around:${radiusM},${lat},${lng});
      node["man_made"="surveillance"](around:${radiusM},${lat},${lng});
      node["surveillance"="camera"](around:${radiusM},${lat},${lng});
      node["amenity"="hospital"](around:${radiusM},${lat},${lng});
      node["amenity"="clinic"](around:${radiusM},${lat},${lng});
      node["amenity"="pharmacy"](around:2000,${lat},${lng});
      node["shop"](around:2000,${lat},${lng});
      node["amenity"="restaurant"](around:2000,${lat},${lng});
      node["amenity"="cafe"](around:2000,${lat},${lng});
      node["amenity"="bank"](around:2000,${lat},${lng});
      node["amenity"="atm"](around:2000,${lat},${lng});
    );
    out body;
  `
  const allData = await overpassQuery(q)
  return { allData, radius: radiusM }
}

function detectAreaType(name: string, elements: any[]): 'urban' | 'suburban' | 'highway' | 'rural' {
  const n = name.toLowerCase()
  if (n.includes('nh') || n.includes('sh') || n.includes('highway') || n.includes('expressway') ||
    n.includes('एक्सप्रेस') || n.includes('राजमार्ग') || /^nh\s*\d/.test(n) || /^sh\s*\d/.test(n)) return 'highway'
  const urban = ['nagar', 'colony', 'vihar', 'ganj', 'chowk', 'bazaar', 'market', 'city', 'town', 'ward', 'sector', 'road', 'street', 'marg', 'नगर', 'बाज़ार']
  if (urban.some(k => n.includes(k)) || elements.length > 20) return 'urban'
  if (elements.length > 5) return 'suburban'
  return 'rural'
}

function calcSafetyScores(allData: any, hour: number, radius: number, areaType?: 'urban' | 'suburban' | 'highway' | 'rural'): SafetyScores {
  const elements: any[] = allData?.elements || []
  const detectedType = areaType || detectAreaType('', elements)
  const isHighway = detectedType === 'highway'
  const isNight = hour >= 20 || hour <= 5
  const isEvening = hour >= 17 && hour < 20
  const timeFactor = isNight ? 0.7 : isEvening ? 0.85 : 1.0

  const lampCount = elements.filter(e => e.tags?.highway === 'street_lamp').length
  const policeCount = elements.filter(e => e.tags?.amenity === 'police').length
  const cctvCount = elements.filter(e => e.tags?.man_made === 'surveillance' || e.tags?.surveillance === 'camera').length
  const hospitalCount = elements.filter(e => e.tags?.amenity === 'hospital' || e.tags?.amenity === 'clinic' || e.tags?.amenity === 'pharmacy').length
  const activityCount = elements.filter(e => e.tags?.shop || e.tags?.amenity === 'restaurant' || e.tags?.amenity === 'cafe' || e.tags?.amenity === 'bank' || e.tags?.amenity === 'atm').length

  let roshniScore: number, policeScore: number, cctvScore: number, bheedScore: number, hospitalScore: number

  if (isHighway) {
    roshniScore = Math.max(35, Math.round((lampCount / 10) * 100))
    policeScore = policeCount >= 1 ? 65 : 45
    cctvScore = Math.max(30, Math.round((cctvCount / 3) * 100))
    bheedScore = 25
    hospitalScore = hospitalCount >= 1 ? 70 : 40
  } else if (detectedType === 'urban') {
    roshniScore = Math.max(20, Math.round((lampCount / 50) * 100))
    policeScore = policeCount >= 3 ? 95 : policeCount >= 1 ? 75 : 40
    cctvScore = Math.min(95, Math.max(20, Math.round((cctvCount / 10) * 100)))
    bheedScore = Math.min(90, Math.max(30, Math.round((activityCount / 30) * 100)))
    hospitalScore = hospitalCount >= 2 ? 90 : hospitalCount === 1 ? 75 : 45
  } else if (detectedType === 'suburban') {
    roshniScore = Math.max(25, Math.round((lampCount / 30) * 100))
    policeScore = policeCount >= 2 ? 85 : policeCount >= 1 ? 65 : 40
    cctvScore = Math.min(85, Math.max(20, Math.round((cctvCount / 6) * 100)))
    bheedScore = Math.min(80, Math.max(30, Math.round((activityCount / 20) * 100)))
    hospitalScore = hospitalCount >= 1 ? 80 : 45
  } else {
    roshniScore = Math.max(15, Math.round((lampCount / 10) * 100))
    policeScore = policeCount >= 1 ? 60 : 30
    cctvScore = Math.max(15, cctvCount > 0 ? 50 : 15)
    bheedScore = Math.max(20, Math.round((activityCount / 10) * 100))
    hospitalScore = hospitalCount >= 1 ? 65 : 30
  }

  const roshniAdj = Math.max(15, Math.round(roshniScore * timeFactor))
  const bheedAdj = isNight ? Math.round(bheedScore * 0.6) : bheedScore
  const highwayBonus = isHighway && !isNight ? 10 : 0
  const overall = Math.round(roshniAdj * 0.25 + policeScore * 0.25 + cctvScore * 0.20 + bheedAdj * 0.15 + hospitalScore * 0.15) + highwayBonus

  return {
    overall: Math.min(98, Math.max(15, overall)),
    roshni: Math.min(98, roshniAdj),
    police: Math.min(98, policeScore),
    cctv: Math.min(98, cctvScore),
    bheed: Math.min(98, bheedAdj),
    hospital: Math.min(98, hospitalScore),
    meta: { lampCount, policeCount, cctvCount, activityCount, hospitalCount, isNight, radius, areaType: detectedType, isHighway },
  }
}

async function getRouteWaypoints(origin: string, destination: string): Promise<RoutePoint[]> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_ORS_API_KEY
    const geocode = async (address: string): Promise<[number, number] | null> => {
      const res = await fetch(`https://api.openrouteservice.org/geocode/search?api_key=${apiKey}&text=${encodeURIComponent(address)}&size=1`)
      const data = await res.json()
      if (data.features?.length > 0) { const [lng, lat] = data.features[0].geometry.coordinates; return [lng, lat] }
      return null
    }
    const [oCoords, dCoords] = await Promise.all([geocode(origin), geocode(destination)])
    if (!oCoords || !dCoords) return []
    const res = await fetch(`https://api.openrouteservice.org/v2/directions/driving-car?api_key=${apiKey}&start=${oCoords[0]},${oCoords[1]}&end=${dCoords[0]},${dCoords[1]}`)
    const routeData = await res.json()
    const coords: [number, number][] = routeData?.features?.[0]?.geometry?.coordinates || []
    const step = Math.max(1, Math.floor(coords.length / 6))
    const sampled = coords.filter((_, i) => i % step === 0 || i === coords.length - 1)

    const points: RoutePoint[] = await Promise.all(
      sampled.map(async ([lng, lat], i) => {
        try {
          const gRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, { headers: { 'Accept-Language': 'hi,en' } })
          const gData = await gRes.json()
          const addr = gData?.address || {}
          const name = addr.suburb || addr.neighbourhood || addr.village || addr.town || addr.road || addr.city_district || addr.city || `Point ${i + 1}`
          const roadName = (addr.road || '').toLowerCase()
          const isHighway = roadName.includes('nh') || roadName.includes('sh') || roadName.includes('highway') || roadName.includes('expressway') || /^nh\s*\d/.test(roadName) || /^sh\s*\d/.test(roadName) || name.toLowerCase().includes('nh') || name.toLowerCase().includes('expressway')
          const hasLocality = !!(addr.suburb || addr.neighbourhood || addr.village || addr.town)
          const areaType: RoutePoint['areaType'] = isHighway ? 'highway' : hasLocality ? 'urban' : addr.city_district ? 'suburban' : 'rural'
          return { lat, lng, name, isHighway, areaType }
        } catch {
          return { lat, lng, name: `Point ${i + 1}`, isHighway: false, areaType: 'suburban' as const }
        }
      })
    )
    return points
  } catch { return [] }
}

// ─── Safety Score Ring ────────────────────────────────────────────────────────

function SafetyScoreRing({ score, loading, label }: { score: number; loading: boolean; label?: string }) {
  const [animatedScore, setAnimatedScore] = useState(0)
  const circumference = 2 * Math.PI * 85
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference

  useEffect(() => {
    if (loading) { setAnimatedScore(0); return }
    const t = setTimeout(() => setAnimatedScore(score), 300)
    return () => clearTimeout(t)
  }, [score, loading])

  const color = score >= 80 ? "#4caf50" : score >= 60 ? "#ff6b35" : "#b5836a"
  const scoreLabel = score >= 80 ? "Surakshit" : score >= 60 ? "Saadharan" : "Savdhan"

  return (
    <motion.div className="relative flex items-center justify-center py-6" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
      <svg viewBox="0 0 200 200" className="w-52 h-52">
        <circle cx={100} cy={100} r={95} fill="none" stroke="#c9933a" strokeWidth={1} strokeOpacity={0.3} />
        {Array.from({ length: 36 }).map((_, i) => {
          const angle = (i * 10) * (Math.PI / 180)
          return <line key={i} x1={100 + 90 * Math.cos(angle)} y1={100 + 90 * Math.sin(angle)} x2={100 + 98 * Math.cos(angle)} y2={100 + 98 * Math.sin(angle)} stroke="#c9933a" strokeWidth={i % 2 === 0 ? 2 : 1} strokeOpacity={0.4} />
        })}
        <circle cx={100} cy={100} r={85} fill="none" stroke="#faf5f0" strokeWidth={12} />
        <motion.circle cx={100} cy={100} r={85} fill="none"
          stroke={loading ? "#c9933a" : color} strokeWidth={12} strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: loading ? circumference * 0.7 : strokeDashoffset }}
          transition={{ duration: loading ? 1 : 1.5, ease: loading ? "linear" : "easeOut", delay: 0.5, repeat: loading ? Infinity : 0 }}
          transform="rotate(-90 100 100)"
          style={{ filter: `drop-shadow(0 0 10px ${loading ? "#c9933a" : color})` }}
        />
        {[0, 25, 50, 75, 100].map((seg, i) => {
          const a = ((seg / 100) * 360 - 90) * (Math.PI / 180)
          return <g key={i} transform={`translate(${100 + 85 * Math.cos(a)}, ${100 + 85 * Math.sin(a)}) rotate(45)`}><rect x={-4} y={-4} width={8} height={8} fill="#c9933a" fillOpacity={0.8} /></g>
        })}
        <circle cx={100} cy={100} r={65} fill="none" stroke="#c9933a" strokeWidth={1} strokeOpacity={0.2} strokeDasharray="4 4" />
      </svg>
      <div className="absolute flex flex-col items-center">
        {loading ? (
          <motion.div className="w-8 h-8 rounded-full border-t-transparent" style={{ borderWidth: 3, borderColor: '#c9933a', borderStyle: 'solid' }} animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
        ) : (
          <>
            <motion.span className="text-5xl font-bold" style={{ color, fontFamily: 'var(--font-cinzel)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}>{animatedScore}</motion.span>
            <motion.span className="text-sm mt-1" style={{ color }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}>{scoreLabel}</motion.span>
            <motion.span className="text-xs mt-1 text-[#7a5c5a]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}>{label || 'Aapka area'}</motion.span>
          </>
        )}
      </div>
    </motion.div>
  )
}

// ─── Safety Factor Bar ────────────────────────────────────────────────────────

function SafetyFactorBar({ label, labelHindi, value, delay, count, countLabel, loading }: {
  label: string; labelHindi: string; value: number; delay: number
  count?: number; countLabel?: string; loading?: boolean
}) {
  const [animatedWidth, setAnimatedWidth] = useState(0)
  useEffect(() => {
    if (loading) return
    const t = setTimeout(() => setAnimatedWidth(value), delay * 1000 + 500)
    return () => clearTimeout(t)
  }, [value, delay, loading])

  const color = value >= 80 ? "#4caf50" : value >= 60 ? "#ff6b35" : "#b5836a"
  return (
    <motion.div className="mb-4" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay }}>
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-[#4a2c2a]">{labelHindi}</span>
          <span className="text-xs text-[#4a2c2a]/50">({label})</span>
          {!loading && count !== undefined && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: `${color}20`, color }}>{count} {countLabel}</span>
          )}
        </div>
        {loading ? <motion.div className="w-3 h-3 border border-[#c9933a] border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} />
          : <span className="text-sm font-medium" style={{ color }}>{value}%</span>}
      </div>
      <div className="relative h-2 bg-[#faf5f0] rounded-full overflow-hidden border border-[#e5d8cc]">
        <motion.div className="absolute inset-y-0 left-0 rounded-full" style={{ backgroundColor: loading ? "#c9933a40" : color }}
          initial={{ width: 0 }} animate={{ width: loading ? '30%' : `${animatedWidth}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
        <div className="absolute inset-0 flex items-center justify-between px-1">
          {Array.from({ length: 10 }).map((_, i) => <div key={i} className="w-1 h-1 rounded-full bg-[#4a2c2a]/20" />)}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Route Safety Section ─────────────────────────────────────────────────────

function RouteSafetySection({
  prefilledOrigin,
  prefilledDestination,
}: {
  prefilledOrigin?: string
  prefilledDestination?: string
}) {
  const [origin, setOrigin] = useState(prefilledOrigin || '')
  const [destination, setDestination] = useState(prefilledDestination || '')
  const [loading, setLoading] = useState(false)
  const [waypoints, setWaypoints] = useState<(RoutePoint & { scores: SafetyScores })[]>([])
  const [overallRouteScore, setOverallRouteScore] = useState<number | null>(null)
  const [error, setError] = useState('')
  const autoCheckedRef = useRef(false)

  const handleCheck = useCallback(async (originVal?: string, destVal?: string) => {
    const o = originVal || origin
    const d = destVal || destination
    if (!o || !d) return
    setLoading(true); setError(''); setWaypoints([]); setOverallRouteScore(null)
    try {
      const points = await getRouteWaypoints(o, d)
      if (points.length === 0) { setError('Route nahi mila — addresses check karo'); setLoading(false); return }
      const hour = new Date().getHours()
      const results = await Promise.all(
        points.map(async (pt) => {
          const smartRadius = pt.areaType === 'highway' ? 10000 : pt.areaType === 'urban' ? 2000 : pt.areaType === 'suburban' ? 5000 : 8000
          const { allData, radius } = await getRealSafetyData(pt.lat, pt.lng, smartRadius)
          const scores = calcSafetyScores(allData, hour, radius, pt.areaType)
          return { ...pt, scores }
        })
      )
      const avgScore = Math.round(results.reduce((sum, r) => sum + r.scores.overall, 0) / results.length)
      setWaypoints(results)
      setOverallRouteScore(avgScore)
    } catch { setError('Kuch gadbad hui — dobara try karo') }
    setLoading(false)
  }, [origin, destination])

  // Auto-check when prefilled data arrives
  useEffect(() => {
    if (prefilledOrigin && prefilledDestination && !autoCheckedRef.current) {
      autoCheckedRef.current = true
      setOrigin(prefilledOrigin)
      setDestination(prefilledDestination)
      handleCheck(prefilledOrigin, prefilledDestination)
    }
  }, [prefilledOrigin, prefilledDestination, handleCheck])

  const getColor = (score: number) => score >= 80 ? "#4caf50" : score >= 60 ? "#ff6b35" : "#b5836a"
  const getEmoji = (score: number) => score >= 80 ? "✅" : score >= 60 ? "⚠️" : "🚨"

  return (
    <motion.div className="mx-4 mt-4 card-mandala rounded-xl p-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
      <h3 className="text-lg font-serif text-[#c9933a] mb-1 flex items-center gap-2" style={{ fontFamily: 'var(--font-playfair)' }}>
        <Route className="w-5 h-5" /> Route Safety Check
      </h3>
      <p className="text-xs text-[#7a5c5a] mb-4">Route ke har area ki real safety check karo (OSM data)</p>

      {/* Pre-filled banner */}
      {prefilledOrigin && prefilledDestination && (
        <motion.div className="mb-3 p-2.5 rounded-xl flex items-center gap-2" style={{ background: 'rgba(201, 147, 58, 0.1)', border: '1px solid rgba(201, 147, 58, 0.3)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <span className="text-sm">🗺️</span>
          <p className="text-xs text-[#c9933a] font-medium">Track Screen ka route load hua: <span className="font-bold">{prefilledOrigin} → {prefilledDestination}</span></p>
        </motion.div>
      )}

      <div className="space-y-3">
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c9933a]">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
          </div>
          <input type="text" placeholder="Kahan se? (e.g. Vijay Nagar, Indore)" value={origin} onChange={e => setOrigin(e.target.value)}
            className="w-full bg-[#faf5f0] border border-[#c9933a]/30 rounded-lg py-2.5 pl-10 pr-4 text-[#4a2c2a] placeholder-[#4a2c2a]/40 focus:border-[#c9933a] focus:outline-none text-sm" />
        </div>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#b5836a]"><Navigation className="w-4 h-4" /></div>
          <input type="text" placeholder="Kahan jaana hai? (e.g. Rajwada, Indore)" value={destination} onChange={e => setDestination(e.target.value)}
            className="w-full bg-[#faf5f0] border border-[#c9933a]/30 rounded-lg py-2.5 pl-10 pr-4 text-[#4a2c2a] placeholder-[#4a2c2a]/40 focus:border-[#c9933a] focus:outline-none text-sm" />
        </div>
        {error && <p className="text-xs text-[#b5836a] text-center">{error}</p>}
        <motion.button className="w-full py-3 rounded-lg font-medium text-[#faf5f0] flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #4a2c2a 0%, #b5836a 100%)" }}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          onClick={() => handleCheck()} disabled={loading || !origin || !destination}
        >
          {loading
            ? <><motion.div className="w-5 h-5 border-2 border-[#faf5f0] border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} /><span>Route safety check ho rahi hai...</span></>
            : <><Route className="w-4 h-4" /><span>Route Safety Check Karo</span></>}
        </motion.button>
      </div>

      <AnimatePresence>
        {overallRouteScore !== null && (
          <motion.div className="mt-4 p-4 rounded-xl text-center"
            style={{ background: `${getColor(overallRouteScore)}15`, border: `2px solid ${getColor(overallRouteScore)}40` }}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-xs text-[#7a5c5a] mb-1">Poore Route ka Safety Score</p>
            <p className="text-4xl font-bold" style={{ color: getColor(overallRouteScore), fontFamily: 'var(--font-cinzel)' }}>{overallRouteScore}</p>
            <p className="text-sm mt-1" style={{ color: getColor(overallRouteScore) }}>
              {overallRouteScore >= 80 ? "✅ Yeh route surakshit hai!" : overallRouteScore >= 60 ? "⚠️ Thodi savdhaani rakhein" : "🚨 Savdhan — unsafe route!"}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {waypoints.length > 0 && (
          <motion.div className="mt-4 space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-xs font-medium text-[#7a5c5a] mb-2">📍 Route ke {waypoints.length} areas ki safety:</p>
            {waypoints.map((wp, i) => (
              <motion.div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: `${getColor(wp.scores.overall)}08`, border: `1px solid ${getColor(wp.scores.overall)}30` }}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold"
                  style={{ background: `${getColor(wp.scores.overall)}20`, color: getColor(wp.scores.overall) }}>{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <p className="text-xs font-semibold text-[#4a2c2a] truncate">{wp.name}</p>
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0" style={{
                      background: wp.areaType === 'highway' ? 'rgba(255,152,0,0.15)' : wp.areaType === 'urban' ? 'rgba(76,175,80,0.15)' : wp.areaType === 'suburban' ? 'rgba(33,150,243,0.15)' : 'rgba(158,158,158,0.15)',
                      color: wp.areaType === 'highway' ? '#ff9800' : wp.areaType === 'urban' ? '#4caf50' : wp.areaType === 'suburban' ? '#2196f3' : '#9e9e9e'
                    }}>
                      {wp.areaType === 'highway' ? '🛣️ Highway' : wp.areaType === 'urban' ? '🏙️ Urban' : wp.areaType === 'suburban' ? '🏘️ Suburban' : '🌾 Rural'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[10px] text-[#7a5c5a]">💡{wp.scores.meta.lampCount}</span>
                    <span className="text-[10px] text-[#7a5c5a]">👮{wp.scores.meta.policeCount}</span>
                    <span className="text-[10px] text-[#7a5c5a]">📹{wp.scores.meta.cctvCount}</span>
                    <span className="text-[10px] text-[#7a5c5a]">🏪{wp.scores.meta.activityCount}</span>
                    {wp.isHighway && <span className="text-[9px] text-[#ff9800]">⚠️ OSM data limited</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-xl font-bold" style={{ color: getColor(wp.scores.overall) }}>{wp.scores.overall}</span>
                  <span className="text-sm">{getEmoji(wp.scores.overall)}</span>
                </div>
              </motion.div>
            ))}
            {waypoints.filter(w => w.scores.overall < 60).length > 0 && (
              <motion.div className="mt-3 p-3 rounded-xl" style={{ background: 'rgba(181, 131, 106, 0.1)', border: '1px solid rgba(181, 131, 106, 0.3)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <p className="text-xs font-bold text-[#b5836a] mb-1">🚨 Unsafe Areas on Route:</p>
                {waypoints.filter(w => w.scores.overall < 60).map((w, i) => (
                  <p key={i} className="text-[10px] text-[#7a5c5a]">• {w.name} (score: {w.scores.overall})</p>
                ))}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Heatmap Card ─────────────────────────────────────────────────────────────

function HeatmapCard({ meta }: { meta: any }) {
  const isNight = meta?.isNight
  return (
    <motion.div className="mx-4 mt-4 card-mandala rounded-xl p-4 overflow-hidden" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
      <h3 className="text-lg font-serif text-[#c9933a] mb-1" style={{ fontFamily: 'var(--font-playfair)' }}>Area Heatmap</h3>
      <p className="text-xs text-[#7a5c5a] mb-3">{isNight ? '🌙 Raat ka waqt — safety score kam hai' : '☀️ Din ka waqt — area zyada surakshit hai'}</p>
      <div className="relative h-32 rounded-lg bg-[#faf5f0] overflow-hidden border border-[#c9933a]/20">
        <svg className="absolute inset-0 w-full h-full opacity-20">
          {Array.from({ length: 8 }).map((_, i) => (
            <g key={i}>
              <line x1={`${i * 12.5}%`} y1="0" x2={`${i * 12.5}%`} y2="100%" stroke="#c9933a" strokeWidth={0.5} />
              <line x1="0" y1={`${i * 12.5}%`} x2="100%" y2={`${i * 12.5}%`} stroke="#c9933a" strokeWidth={0.5} />
            </g>
          ))}
        </svg>
        <div className="absolute inset-0">
          {(meta?.lampCount || 0) > 5 && <div className="absolute w-14 h-14 rounded-full opacity-40" style={{ backgroundColor: "#4caf50", left: "20%", top: "25%", filter: "blur(8px)" }} />}
          {(meta?.lampCount || 0) > 15 && <div className="absolute w-10 h-10 rounded-full opacity-35" style={{ backgroundColor: "#4caf50", right: "20%", top: "30%", filter: "blur(8px)" }} />}
          {(meta?.policeCount || 0) > 0 && <div className="absolute w-12 h-12 rounded-full opacity-40" style={{ backgroundColor: "#1565c0", right: "15%", bottom: "25%", filter: "blur(10px)" }} />}
          {(meta?.activityCount || 0) < 10 && <div className="absolute w-10 h-10 rounded-full opacity-35" style={{ backgroundColor: isNight ? "#b5836a" : "#ff6b35", left: "40%", bottom: "20%", filter: "blur(8px)" }} />}
          {(meta?.cctvCount || 0) > 0 && <div className="absolute w-8 h-8 rounded-full opacity-30" style={{ backgroundColor: "#9c27b0", left: "60%", top: "20%", filter: "blur(6px)" }} />}
        </div>
        <motion.div className="absolute w-3 h-3 rounded-full bg-[#c9933a]" style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }} animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
        <div className="absolute bottom-2 right-2 text-[9px] text-[#4a2c2a]/40">OSM • {meta?.radius ? `${(meta.radius / 1000).toFixed(0)}km` : '5km'} radius</div>
      </div>
      <div className="flex items-center justify-center gap-4 mt-3">
        {[{ color: "#4caf50", label: "Safe" }, { color: "#ff6b35", label: "Caution" }, { color: "#b5836a", label: "Danger" }].map(item => (
          <div key={item.label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-[#4a2c2a]/60">{item.label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ─── Report Incident ──────────────────────────────────────────────────────────

function ReportIncident() {
  const [submitting, setSubmitting] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const incidents = [
    { icon: AlertTriangle, label: "Harassment", labelHindi: "Chheda-khani", color: "#b5836a", type: "harassment" },
    { icon: Lightbulb, label: "Poor Lighting", labelHindi: "Andhera", color: "#ff6b35", type: "poor_lighting" },
    { icon: Camera, label: "No CCTV", labelHindi: "CCTV Nahi", color: "#9c27b0", type: "no_cctv" },
    { icon: Users, label: "Unsafe Crowd", labelHindi: "Ashurakshit Bheed", color: "#c9933a", type: "unsafe_crowd" },
  ]

  const handleReport = async (incident: typeof incidents[0]) => {
    setSubmitting(incident.type); setError(null)
    try {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            await saveIncident(incident.type, pos.coords.latitude, pos.coords.longitude, incident.label)
            setSubmitted(incident.type); setSubmitting(null)
            setTimeout(() => setSubmitted(null), 3000)
          },
          async () => {
            await saveIncident(incident.type, 0, 0, incident.label)
            setSubmitted(incident.type); setSubmitting(null)
            setTimeout(() => setSubmitted(null), 3000)
          }
        )
      }
    } catch { setError('Report submit nahi ho paya.'); setSubmitting(null) }
  }

  return (
    <motion.div className="mx-4 mt-4 mb-24 card-mandala rounded-xl p-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
      <h3 className="text-lg font-serif text-[#c9933a] mb-1" style={{ fontFamily: 'var(--font-playfair)' }}>📢 Incident Report Karein</h3>
      <p className="text-xs text-[#7a5c5a] mb-4">Apne aas-paas ki unsafe cheezein report karein — community ko madad milegi!</p>
      {error && <motion.div className="mb-3 p-3 rounded-xl text-sm text-center" style={{ background: 'rgba(181, 131, 106, 0.1)', color: '#b5836a', border: '1px solid rgba(181, 131, 106, 0.3)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{error}</motion.div>}
      <div className="grid grid-cols-2 gap-3">
        {incidents.map((incident, index) => (
          <motion.button key={incident.type}
            className="p-4 rounded-xl bg-[#faf5f0] border flex flex-col items-center gap-2 relative overflow-hidden"
            style={{ borderColor: submitted === incident.type ? '#4caf50' : submitting === incident.type ? incident.color : 'rgba(201, 147, 58, 0.2)' }}
            whileHover={{ scale: 1.02, boxShadow: `0 0 20px ${incident.color}40` }} whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 + index * 0.1 }}
            onClick={() => handleReport(incident)} disabled={submitting !== null}
          >
            {submitted === incident.type && (
              <motion.div className="absolute inset-0 flex items-center justify-center rounded-xl" style={{ background: 'rgba(76, 175, 80, 0.15)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <CheckCircle className="w-8 h-8 text-[#4caf50]" />
              </motion.div>
            )}
            {submitting === incident.type
              ? <motion.div className="w-6 h-6 border-2 border-t-transparent rounded-full" style={{ borderColor: incident.color }} animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} />
              : <incident.icon className="w-6 h-6" style={{ color: incident.color }} />}
            <span className="text-xs font-medium text-[#4a2c2a]">{incident.labelHindi}</span>
            <span className="text-[10px] text-[#7a5c5a]">({incident.label})</span>
          </motion.button>
        ))}
      </div>
      {submitted && (
        <motion.div className="mt-3 p-3 rounded-xl text-sm text-center" style={{ background: 'rgba(76, 175, 80, 0.1)', color: '#4caf50', border: '1px solid rgba(76, 175, 80, 0.3)' }} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          ✓ Report submit ho gayi! Shukriya 🙏
        </motion.div>
      )}
    </motion.div>
  )
}

// ─── Tab Switcher ─────────────────────────────────────────────────────────────

function TabSwitcher({ active, onChange, hasRoute }: { active: 'area' | 'route'; onChange: (t: 'area' | 'route') => void; hasRoute?: boolean }) {
  return (
    <div className="mx-4 mb-4 flex rounded-xl overflow-hidden border border-[#c9933a]/30" style={{ background: '#faf5f0' }}>
      {(['area', 'route'] as const).map((tab) => (
        <motion.button key={tab} className="flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-2 relative"
          style={active === tab ? { background: 'linear-gradient(135deg, #4a2c2a, #b5836a)', color: '#faf5f0' } : { color: '#7a5c5a' }}
          onClick={() => onChange(tab)} whileTap={{ scale: 0.97 }}>
          {tab === 'area' ? <><MapPin className="w-4 h-4" />Area Safety</> : <><Route className="w-4 h-4" />Route Safety</>}
          {/* Badge when route data is available */}
          {tab === 'route' && hasRoute && active !== 'route' && (
            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-[#c9933a]" />
          )}
        </motion.button>
      ))}
    </div>
  )
}

// ─── Main SafetyScreen ────────────────────────────────────────────────────────

export function SafetyScreen({ routeData }: { routeData?: { origin: string; destination: string } | null }) {
  const [activeTab, setActiveTab] = useState<'area' | 'route'>('area')
  const [scores, setScores] = useState<SafetyScores | null>(null)
  const [loading, setLoading] = useState(true)
  const [locationName, setLocationName] = useState('Aapka area')
  const [error, setError] = useState('')
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Auto switch to Route Safety tab when routeData arrives
  useEffect(() => {
    if (routeData?.origin && routeData?.destination) {
      setActiveTab('route')
    }
  }, [routeData])

  const fetchData = useCallback(async () => {
    setLoading(true); setError('')
    const getLocation = (): Promise<{ lat: number; lng: number }> =>
      new Promise((resolve) => {
        if (!navigator.geolocation) { resolve({ lat: 22.7196, lng: 75.8577 }); return }
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve({ lat: 22.7196, lng: 75.8577 }),
          { enableHighAccuracy: true, timeout: 8000 }
        )
      })

    try {
      const { lat, lng } = await getLocation()
      try {
        const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`, { headers: { 'Accept-Language': 'hi,en' } })
        const geoData = await geoRes.json()
        const name = geoData?.address?.suburb || geoData?.address?.neighbourhood || geoData?.address?.city_district || geoData?.address?.city || 'Aapka area'
        setLocationName(name)
      } catch { }
      const { allData, radius } = await getRealSafetyData(lat, lng, 5000)
      const hour = new Date().getHours()
      const result = calcSafetyScores(allData, hour, radius, 'urban')
      setScores(result)
      setLastUpdated(new Date())
    } catch { setError('Location access chahiye — please allow karo') }
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const factors = scores ? [
    { label: "Street Lights", labelHindi: "Roshni", value: scores.roshni, count: scores.meta.lampCount, countLabel: "lamps" },
    { label: "Crowd/Activity", labelHindi: "Bheed / Gatividi", value: scores.bheed, count: scores.meta.activityCount, countLabel: "shops" },
    { label: "CCTV", labelHindi: "CCTV", value: scores.cctv, count: scores.meta.cctvCount, countLabel: "cameras" },
    { label: "Police", labelHindi: "Police", value: scores.police, count: scores.meta.policeCount, countLabel: "stations" },
    { label: "Hospital", labelHindi: "Aspatal", value: scores.hospital, count: scores.meta.hospitalCount, countLabel: "nearby" },
  ] : []

  return (
    <div className="relative min-h-screen pb-20">
      <MandalaBackground variant="safety" opacity={0.15} />

      <motion.div className="px-4 py-4 flex items-center justify-between" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex-1 text-center">
          <h1 className="text-2xl font-serif text-[#c9933a]" style={{ fontFamily: 'var(--font-playfair)' }}>Kshetra Suraksha</h1>
          <p className="text-xs text-[#4a2c2a]/50 mt-1">(Area Safety)</p>
        </div>
        <motion.button onClick={fetchData} className="p-2 rounded-full border" style={{ borderColor: 'rgba(201, 147, 58, 0.3)' }} whileTap={{ scale: 0.9 }}>
          <motion.div animate={loading ? { rotate: 360 } : {}} transition={loading ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}>
            <RefreshCw className="w-4 h-4 text-[#c9933a]" />
          </motion.div>
        </motion.button>
      </motion.div>

      <TabSwitcher active={activeTab} onChange={setActiveTab} hasRoute={!!(routeData?.origin && routeData?.destination)} />

      {/* ── AREA SAFETY TAB ── */}
      {activeTab === 'area' && (
        <>
          <SafetyScoreRing score={scores?.overall || 0} loading={loading} label={locationName} />
          {error && (
            <motion.div className="mx-4 mb-3 p-3 rounded-xl text-sm text-center" style={{ background: 'rgba(181, 131, 106, 0.1)', color: '#b5836a', border: '1px solid rgba(181, 131, 106, 0.3)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              ⚠️ {error}
            </motion.div>
          )}
          {!loading && scores && (
            <motion.div className="mx-4 mb-3 p-3 rounded-xl flex items-start gap-2" style={{ background: 'rgba(76, 175, 80, 0.08)', border: '1px solid rgba(76, 175, 80, 0.25)' }} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <MapPin className="w-4 h-4 text-[#4caf50] flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-medium text-[#4caf50]">✅ Real-time OpenStreetMap data (5km radius)</p>
                <p className="text-[10px] text-[#7a5c5a] mt-0.5">{locationName} • {scores.meta.isNight ? '🌙 Raat' : '☀️ Din'}</p>
                <p className="text-[10px] text-[#7a5c5a]">💡{scores.meta.lampCount} lamps • 👮{scores.meta.policeCount} police • 📹{scores.meta.cctvCount} CCTV • 🏪{scores.meta.activityCount} shops</p>
              </div>
            </motion.div>
          )}
          <motion.div className="mx-4 card-mandala rounded-xl p-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-serif text-[#c9933a]" style={{ fontFamily: 'var(--font-playfair)' }}>Safety Factors</h3>
              {lastUpdated && !loading && <span className="text-[10px] text-[#7a5c5a]">{lastUpdated.toLocaleTimeString('hi-IN', { hour: '2-digit', minute: '2-digit' })}</span>}
            </div>
            {factors.map((factor, index) => (
              <SafetyFactorBar key={factor.label} label={factor.label} labelHindi={factor.labelHindi} value={factor.value} delay={0.4 + index * 0.1} count={factor.count} countLabel={factor.countLabel} loading={loading} />
            ))}
            {!loading && scores?.meta.isNight && (
              <motion.div className="mt-3 p-3 rounded-xl flex items-center gap-2" style={{ background: 'rgba(181, 131, 106, 0.1)', border: '1px solid rgba(181, 131, 106, 0.3)' }} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <span className="text-lg">🌙</span>
                <div>
                  <p className="text-xs font-medium text-[#b5836a]">Raat ka waqt — Savdhaan rahein</p>
                  <p className="text-[10px] text-[#7a5c5a]">Safety score raat mein automatically kam hota hai</p>
                </div>
              </motion.div>
            )}
          </motion.div>
          <HeatmapCard meta={scores?.meta} />
          <ReportIncident />
        </>
      )}

      {/* ── ROUTE SAFETY TAB ── */}
      {activeTab === 'route' && (
        <>
          <RouteSafetySection
            prefilledOrigin={routeData?.origin}
            prefilledDestination={routeData?.destination}
          />
          <ReportIncident />
        </>
      )}
    </div>
  )
}