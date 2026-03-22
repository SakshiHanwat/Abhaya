'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Square, Clock, Shield, ChevronDown, Navigation, X, Share2 } from 'lucide-react'
import { useLanguage } from '@/components/language-context'
import { updateLocation, getContacts } from '@/lib/auth'

declare global {
  interface Window { google: any }
}

export interface RouteData {
  origin: string
  destination: string
}

interface RouteInfo {
  index: number
  label: string
  color: string
  safetyScore: number
  geometry: any // ORS GeoJSON geometry
  duration: string
  distance: string
}

interface PoliceStation {
  name: string
  vicinity: string
  distance?: string
  location: { lat: number; lng: number }
}

const ROUTE_CONFIGS = [
  { label: 'Safest', color: '#4caf50', safetyScore: 92, profile: 'foot-walking' },
  { label: 'Fastest', color: '#c9933a', safetyScore: 74, profile: 'driving-car' },
  { label: 'Well-lit', color: '#9c27b0', safetyScore: 81, profile: 'cycling-regular' },
]

// ─── ORS Helpers ────────────────────────────────────────────────────────────

async function geocodeAddress(address: string): Promise<[number, number] | null> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_ORS_API_KEY
    const res = await fetch(
      `https://api.openrouteservice.org/geocode/search?api_key=${apiKey}&text=${encodeURIComponent(address)}&size=1`
    )
    const data = await res.json()
    if (data.features?.length > 0) {
      const [lng, lat] = data.features[0].geometry.coordinates
      return [lng, lat]
    }
    return null
  } catch {
    return null
  }
}

async function getORSRoute(
  origin: [number, number],
  dest: [number, number],
  profile: string
): Promise<any> {
  try {
    const apiKey = process.env.NEXT_PUBLIC_ORS_API_KEY
    const res = await fetch(
      `https://api.openrouteservice.org/v2/directions/${profile}?api_key=${apiKey}&start=${origin[0]},${origin[1]}&end=${dest[0]},${dest[1]}`
    )
    return res.json()
  } catch {
    return null
  }
}

function fmtDuration(s: number) {
  const m = Math.round(s / 60)
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}m`
}
function fmtDistance(m: number) {
  return m < 1000 ? `${Math.round(m)}m` : `${(m / 1000).toFixed(1)}km`
}

// ─── Google Maps loader (only for map display, NOT directions) ──────────────

function useGoogleMaps() {
  const [isLoaded, setIsLoaded] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.google) { setIsLoaded(true); return }
    const existing = document.querySelector('script[src*="maps.googleapis"]')
    if (existing) { existing.addEventListener('load', () => setIsLoaded(true)); return }
    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    script.async = true
    script.onload = () => setIsLoaded(true)
    document.head.appendChild(script)
  }, [])
  return isLoaded
}

// ─── Full Screen Map (uses Google Maps ONLY for display + polylines) ─────────

function FullScreenMap({
  userLocation,
  policeStations,
  onStationSelect,
  routes,
  activeRouteIndex,
}: {
  userLocation: { lat: number; lng: number } | null
  policeStations: PoliceStation[]
  onStationSelect: (s: PoliceStation) => void
  routes: RouteInfo[]
  activeRouteIndex: number
}) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const userMarkerRef = useRef<any>(null)
  const stationMarkersRef = useRef<any[]>([])
  const polylinesRef = useRef<any[]>([])
  const isLoaded = useGoogleMaps()

  // Init map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return
    const defaultLoc = userLocation || { lat: 22.7196, lng: 75.8577 }
    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center: defaultLoc,
      zoom: 13,
      disableDefaultUI: true,
      zoomControl: true,
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#faf5f0' }] },
        { elementType: 'labels.text.fill', stylers: [{ color: '#4a2c2a' }] },
        { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#e5d8cc' }] },
        { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ color: '#d4c4b0' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9e8f5' }] },
        { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#d4edda' }] },
        { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
      ],
    })
  }, [isLoaded])

  // Draw ORS routes as polylines (NO Google DirectionsService!)
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google || routes.length === 0) return

    // Clear old polylines
    polylinesRef.current.forEach(p => p.setMap(null))
    polylinesRef.current = []

    routes.forEach((route, i) => {
      if (!route.geometry?.coordinates) return

      // ORS returns [lng, lat] — convert to Google {lat, lng}
      const path = route.geometry.coordinates.map(
        ([lng, lat]: [number, number]) => ({ lat, lng })
      )

      const polyline = new window.google.maps.Polyline({
        path,
        strokeColor: route.color,
        strokeWeight: i === activeRouteIndex ? 6 : 3,
        strokeOpacity: i === activeRouteIndex ? 1 : 0.4,
        map: mapInstanceRef.current,
        zIndex: i === activeRouteIndex ? 10 : 1,
      })
      polylinesRef.current.push(polyline)
    })

    // Fit map to active route
    if (routes[activeRouteIndex]?.geometry?.coordinates?.length > 0) {
      const bounds = new window.google.maps.LatLngBounds()
      routes[activeRouteIndex].geometry.coordinates.forEach(([lng, lat]: [number, number]) => {
        bounds.extend({ lat, lng })
      })
      mapInstanceRef.current.fitBounds(bounds, { top: 80, bottom: 100, left: 20, right: 20 })
    }
  }, [routes, activeRouteIndex])

  // User location marker
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation || !window.google) return
    if (userMarkerRef.current) userMarkerRef.current.setMap(null)
    userMarkerRef.current = new window.google.maps.Marker({
      position: userLocation,
      map: mapInstanceRef.current,
      zIndex: 999,
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#c9933a',
        fillOpacity: 1,
        strokeColor: '#4a2c2a',
        strokeWeight: 3,
      },
      title: 'Aap yahan hain',
    })
    mapInstanceRef.current.panTo(userLocation)
  }, [userLocation])

  // Police station markers
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google) return
    stationMarkersRef.current.forEach(m => m.setMap(null))
    stationMarkersRef.current = []
    policeStations.forEach((station) => {
      const marker = new window.google.maps.Marker({
        position: station.location,
        map: mapInstanceRef.current,
        icon: {
          path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: '#1565c0',
          fillOpacity: 0.9,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        title: station.name,
      })
      marker.addListener('click', () => onStationSelect(station))
      stationMarkersRef.current.push(marker)
    })
  }, [policeStations])

  return (
    <div ref={mapRef} className="absolute inset-0 w-full h-full">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#faf5f0]">
          <div className="flex flex-col items-center gap-3">
            <motion.div
              className="w-10 h-10 border-4 border-[#c9933a] border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <p className="text-[#4a2c2a] text-sm">Map load ho raha hai...</p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── UI Components (unchanged) ───────────────────────────────────────────────

function TopBar({ isTracking, onToggle, routeData }: {
  isTracking: boolean; onToggle: () => void; routeData: RouteData | null
}) {
  return (
    <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
      <div
        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl"
        style={{
          background: 'rgba(250, 245, 240, 0.92)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(201, 147, 58, 0.4)',
          boxShadow: '0 4px 20px rgba(74,44,42,0.15)',
        }}
      >
        <motion.div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: isTracking ? '#4caf50' : '#c9933a' }}
          animate={isTracking ? { opacity: [1, 0.3, 1] } : {}}
          transition={{ duration: 1, repeat: Infinity }}
        />
        <h1
          className="text-sm font-serif text-[#4a2c2a] truncate max-w-[160px]"
          style={{ fontFamily: 'var(--font-playfair)' }}
        >
          {routeData ? `${routeData.origin} → ${routeData.destination}` : 'Rakshak Drishti'}
        </h1>
      </div>
      <motion.button
        onClick={onToggle}
        className="flex items-center gap-2 px-4 py-2.5 rounded-2xl"
        style={
          isTracking
            ? { background: 'rgba(181, 131, 106, 0.92)', backdropFilter: 'blur(12px)', boxShadow: '0 4px 20px rgba(181,131,106,0.4)' }
            : { background: 'rgba(74, 44, 42, 0.92)', backdropFilter: 'blur(12px)', boxShadow: '0 4px 20px rgba(74,44,42,0.4)' }
        }
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.95 }}
      >
        {isTracking
          ? <><Square className="w-4 h-4 text-white" /><span className="text-white text-sm font-medium">Band Karo</span></>
          : <><Play className="w-4 h-4 text-white" /><span className="text-white text-sm font-medium">Shuru Karo</span></>
        }
      </motion.button>
    </div>
  )
}

function RouteTabs({ routes, activeIndex, onSelect }: {
  routes: RouteInfo[]; activeIndex: number; onSelect: (i: number) => void
}) {
  if (routes.length === 0) return null
  return (
    <motion.div
      className="absolute top-16 left-4 right-4 z-20"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex gap-2">
        {routes.map((route, i) => (
          <motion.button
            key={i}
            onClick={() => onSelect(i)}
            className="flex-1 py-2 px-2 rounded-xl text-xs font-semibold flex flex-col items-center gap-0.5"
            style={
              i === activeIndex
                ? { background: route.color, color: 'white', boxShadow: `0 4px 15px ${route.color}60` }
                : { background: 'rgba(250, 245, 240, 0.92)', color: route.color, border: `1px solid ${route.color}40`, backdropFilter: 'blur(10px)' }
            }
            whileTap={{ scale: 0.95 }}
          >
            <span>Route {i + 1}</span>
            <span style={{ color: i === activeIndex ? 'rgba(255,255,255,0.8)' : route.color }}>{route.label}</span>
            <span className="font-bold">🛡️ {route.safetyScore}%</span>
            {route.duration && (
              <span style={{ color: i === activeIndex ? 'rgba(255,255,255,0.7)' : '#7a5c5a', fontSize: '10px' }}>
                {route.duration} • {route.distance}
              </span>
            )}
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}

function LiveBadge({ isTracking, location, onShare }: {
  isTracking: boolean; location: { lat: number; lng: number } | null; onShare: () => void
}) {
  if (!isTracking || !location) return null
  return (
    <motion.div
      className="absolute top-36 left-4 right-4 z-20 px-3 py-2 rounded-xl flex items-center gap-2"
      style={{
        background: 'rgba(76, 175, 80, 0.12)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(76, 175, 80, 0.4)',
      }}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <motion.div
        className="w-2 h-2 rounded-full bg-[#4caf50]"
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      />
      <span className="text-xs text-[#4caf50] font-medium">Live ON</span>
      <span className="text-xs text-[#4caf50]/60">{location.lat.toFixed(3)}, {location.lng.toFixed(3)}</span>
      <motion.button
        onClick={onShare}
        className="ml-auto flex items-center gap-1 px-2 py-1 rounded-full"
        style={{ background: 'rgba(76, 175, 80, 0.2)', border: '1px solid rgba(76, 175, 80, 0.4)' }}
        whileTap={{ scale: 0.95 }}
      >
        <Share2 className="w-3 h-3 text-[#4caf50]" />
        <span className="text-xs text-[#4caf50]">Share</span>
      </motion.button>
    </motion.div>
  )
}

function TimerButton() {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedTime, setSelectedTime] = useState<number | null>(null)
  const times = [15, 30, 60]
  return (
    <div className="absolute bottom-32 right-4 z-20">
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full flex items-center justify-center"
        style={{
          background: 'rgba(74, 44, 42, 0.9)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(201, 147, 58, 0.4)',
          boxShadow: '0 4px 15px rgba(74,44,42,0.3)',
        }}
        whileTap={{ scale: 0.95 }}
      >
        <Clock className="w-5 h-5 text-[#c9933a]" />
      </motion.button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            className="absolute bottom-14 right-0 p-3 rounded-2xl"
            style={{
              background: 'rgba(250, 245, 240, 0.96)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(201, 147, 58, 0.3)',
              minWidth: '160px',
              boxShadow: '0 8px 30px rgba(74,44,42,0.2)',
            }}
          >
            <p className="text-xs text-[#4a2c2a]/60 mb-2 font-medium">Yatra Timer</p>
            <div className="flex gap-2">
              {times.map((t) => (
                <motion.button
                  key={t}
                  onClick={() => { setSelectedTime(t); setIsOpen(false) }}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold"
                  style={selectedTime === t ? { background: '#c9933a', color: 'white' } : { background: 'rgba(201, 147, 58, 0.12)', color: '#c9933a' }}
                  whileTap={{ scale: 0.95 }}
                >
                  {t}m
                </motion.button>
              ))}
            </div>
            {selectedTime && <p className="text-xs text-[#4caf50] mt-2 text-center font-medium">✓ {selectedTime} min set!</p>}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function PolicePanel({ stations, isOpen, onToggle, onSelect, isLoading }: {
  stations: PoliceStation[]; isOpen: boolean; onToggle: () => void; onSelect: (s: PoliceStation) => void; isLoading: boolean
}) {
  return (
    <motion.div className="absolute bottom-20 left-0 right-0 z-20 flex flex-col items-center">
      <motion.button
        onClick={onToggle}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full mb-2"
        style={{ background: 'rgba(21, 101, 192, 0.9)', backdropFilter: 'blur(12px)', boxShadow: '0 4px 20px rgba(21,101,192,0.4)' }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.95 }}
      >
        <Shield className="w-4 h-4 text-white" />
        <span className="text-white text-sm font-medium">Nazdeeki Police Station</span>
        {isLoading ? (
          <motion.div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} />
        ) : (
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.3 }}>
            <ChevronDown className="w-4 h-4 text-white/80" />
          </motion.div>
        )}
        {stations.length > 0 && (
          <span className="bg-white text-[#1565c0] text-xs px-2 py-0.5 rounded-full font-bold">{stations.length}</span>
        )}
      </motion.button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="mx-4 w-[calc(100%-32px)] rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(250, 245, 240, 0.97)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(21, 101, 192, 0.2)',
              boxShadow: '0 8px 30px rgba(74,44,42,0.2)',
            }}
          >
            {isLoading ? (
              <div className="p-5 text-center">
                <motion.div className="w-8 h-8 border-2 border-[#1565c0] border-t-transparent rounded-full mx-auto mb-2" animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }} />
                <p className="text-[#4a2c2a]/50 text-sm">Police stations dhundh rahe hain...</p>
              </div>
            ) : stations.length === 0 ? (
              <div className="p-5 text-center">
                <Shield className="w-8 h-8 text-[#4a2c2a]/20 mx-auto mb-2" />
                <p className="text-[#4a2c2a]/50 text-sm">Aas paas koi police station nahi mila</p>
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto divide-y divide-[#c9933a]/10">
                {stations.map((station, i) => (
                  <motion.button
                    key={i}
                    className="w-full p-3.5 text-left hover:bg-[#c9933a]/5 transition-colors"
                    onClick={() => onSelect(station)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-[#1565c0]/10 flex items-center justify-center flex-shrink-0">
                          <Shield className="w-4 h-4 text-[#1565c0]" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#4a2c2a] truncate">{station.name}</p>
                          <p className="text-xs text-[#4a2c2a]/50 truncate mt-0.5">{station.vicinity}</p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        {station.distance && <span className="text-xs font-bold text-[#1565c0]">{station.distance}</span>}
                        <div className="flex items-center gap-1 bg-[#1565c0]/10 px-2 py-0.5 rounded-full">
                          <Navigation className="w-3 h-3 text-[#1565c0]" />
                          <span className="text-xs text-[#1565c0]">Jao</span>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function StationInfoCard({ station, onClose }: { station: PoliceStation; onClose: () => void }) {
  return (
    <motion.div
      className="absolute top-56 left-4 right-4 z-30 p-4 rounded-2xl"
      style={{
        background: 'rgba(250, 245, 240, 0.97)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(21, 101, 192, 0.3)',
        boxShadow: '0 8px 30px rgba(74,44,42,0.2)',
      }}
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1">
          <div className="w-10 h-10 rounded-full bg-[#1565c0]/10 flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-[#1565c0]" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-[#4a2c2a]">{station.name}</p>
            <p className="text-xs text-[#4a2c2a]/60 mt-0.5">{station.vicinity}</p>
            {station.distance && <p className="text-xs text-[#1565c0] font-medium mt-1">📍 {station.distance} door</p>}
          </div>
        </div>
        <div className="flex gap-2">
          <motion.button
            className="w-9 h-9 rounded-full bg-[#1565c0]/10 flex items-center justify-center"
            whileTap={{ scale: 0.9 }}
            onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${station.location.lat},${station.location.lng}`, '_blank')}
          >
            <Navigation className="w-4 h-4 text-[#1565c0]" />
          </motion.button>
          <motion.button
            className="w-9 h-9 rounded-full bg-[#4a2c2a]/10 flex items-center justify-center"
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
          >
            <X className="w-4 h-4 text-[#4a2c2a]" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main TrackScreen ────────────────────────────────────────────────────────

export function TrackScreen({ routeData }: { routeData?: RouteData | null }) {
  const [isTracking, setIsTracking] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [policeStations, setPoliceStations] = useState<PoliceStation[]>([])
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const [selectedStation, setSelectedStation] = useState<PoliceStation | null>(null)
  const [isLoadingStations, setIsLoadingStations] = useState(false)
  const [shareToast, setShareToast] = useState('')
  const [routes, setRoutes] = useState<RouteInfo[]>([])
  const [activeRouteIndex, setActiveRouteIndex] = useState(0)
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false)
  const hasAutoStarted = useRef(false)

  // ✅ Fetch routes using ORS — NO Google DirectionsService!
  useEffect(() => {
    if (!routeData) return
    setIsLoadingRoutes(true)
    setRoutes([])

    const fetchAllRoutes = async () => {
      const [oCoords, dCoords] = await Promise.all([
        geocodeAddress(routeData.origin),
        geocodeAddress(routeData.destination),
      ])

      if (!oCoords || !dCoords) {
        setIsLoadingRoutes(false)
        return
      }

      const results = await Promise.all(
        ROUTE_CONFIGS.map(async (cfg, i) => {
          const data = await getORSRoute(oCoords, dCoords, cfg.profile)
          if (!data?.features?.[0]) return null
          const seg = data.features[0].properties.segments[0]
          return {
            index: i,
            label: cfg.label,
            color: cfg.color,
            safetyScore: cfg.safetyScore,
            geometry: data.features[0].geometry, // GeoJSON
            duration: fmtDuration(seg.duration),
            distance: fmtDistance(seg.distance),
          } as RouteInfo
        })
      )

      const validRoutes = results.filter((r): r is RouteInfo => r !== null)
      setRoutes(validRoutes)
      setActiveRouteIndex(0)
      setIsLoadingRoutes(false)
    }

    fetchAllRoutes()
  }, [routeData])

  // Auto-start tracking when routeData arrives
  useEffect(() => {
    if (routeData && !hasAutoStarted.current) {
      hasAutoStarted.current = true
      startTracking()
    }
  }, [routeData])

  const startTracking = () => {
    setIsTracking(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(loc)
        updateLocation(loc.lat, loc.lng, true)
        setTimeout(() => fetchPoliceStations(loc.lat, loc.lng), 1000)
      },
      (err) => console.error('Location error:', err),
      { enableHighAccuracy: true }
    )
    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude }
        setUserLocation(loc)
        await updateLocation(loc.lat, loc.lng, true)
      },
      (err) => console.error(err),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 5000 }
    )
    localStorage.setItem('watchId', String(watchId))
  }

  const handleShareLocation = async () => {
    if (!userLocation) {
      setShareToast('Pehle location ON karo!')
      setTimeout(() => setShareToast(''), 3000)
      return
    }
    try {
      const contacts = await getContacts()
      const mapsLink = `https://maps.google.com/?q=${userLocation.lat},${userLocation.lng}`
      const msg = encodeURIComponent(`🚨 Meri live location:\n${mapsLink}\n\n- Abhaya Safety App`)
      if (contacts.length > 0) {
        contacts.forEach((contact: any, i: number) => {
          const phone = contact.phone.replace(/\D/g, '')
          setTimeout(() => {
            window.open(`https://wa.me/${phone}?text=${msg}`, '_blank')
          }, i * 500)
        })
        setShareToast(`${contacts.length} contacts ko bheja! ✓`)
      } else {
        navigator.clipboard.writeText(mapsLink)
        setShareToast('Link copy ho gaya! ✓')
      }
    } catch {
      setShareToast('Share nahi ho saka')
    }
    setTimeout(() => setShareToast(''), 3000)
  }

  const fetchPoliceStations = useCallback((lat: number, lng: number) => {
    setIsLoadingStations(true)
    const query = `[out:json][timeout:25];node["amenity"="police"](around:10000,${lat},${lng});out body;`
    const servers = [
      'https://overpass-api.de/api/interpreter',
      'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter',
    ]
    const tryServer = (index: number) => {
      if (index >= servers.length) { setIsLoadingStations(false); return }
      fetch(`${servers[index]}?data=${encodeURIComponent(query)}`)
        .then(res => { if (!res.ok) throw new Error('failed'); return res.json() })
        .then(data => {
          const stations: PoliceStation[] = data.elements.slice(0, 6).map((el: any) => {
            const dist = Math.sqrt(Math.pow(el.lat - lat, 2) + Math.pow(el.lon - lng, 2)) * 111
            return {
              name: el.tags?.name || 'Police Station',
              vicinity: el.tags?.['addr:full'] || el.tags?.['addr:street'] || el.tags?.['addr:city'] || 'Nazdeek',
              distance: `${dist.toFixed(1)} km`,
              location: { lat: el.lat, lng: el.lon },
            }
          })
          stations.sort((a, b) => parseFloat(a.distance!) - parseFloat(b.distance!))
          setPoliceStations(stations)
          setIsLoadingStations(false)
          if (stations.length > 0) setIsPanelOpen(true)
        })
        .catch(() => tryServer(index + 1))
    }
    tryServer(0)
  }, [])

  const handleToggle = async () => {
    if (!isTracking) {
      startTracking()
    } else {
      const watchId = localStorage.getItem('watchId')
      if (watchId) {
        navigator.geolocation.clearWatch(Number(watchId))
        localStorage.removeItem('watchId')
      }
      await updateLocation(0, 0, false)
      setIsTracking(false)
      setUserLocation(null)
      setPoliceStations([])
      setIsPanelOpen(false)
      setSelectedStation(null)
      setIsLoadingStations(false)
      hasAutoStarted.current = false
    }
  }

  useEffect(() => {
    return () => {
      const watchId = localStorage.getItem('watchId')
      if (watchId) {
        navigator.geolocation.clearWatch(Number(watchId))
        localStorage.removeItem('watchId')
      }
    }
  }, [])

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <FullScreenMap
        userLocation={userLocation}
        policeStations={policeStations}
        onStationSelect={setSelectedStation}
        routes={routes}
        activeRouteIndex={activeRouteIndex}
      />

      <TopBar isTracking={isTracking} onToggle={handleToggle} routeData={routeData || null} />

      {/* Route Tabs */}
      {routes.length > 0 && (
        <RouteTabs routes={routes} activeIndex={activeRouteIndex} onSelect={setActiveRouteIndex} />
      )}

      {/* Loading routes indicator */}
      {isLoadingRoutes && (
        <motion.div
          className="absolute top-16 left-4 right-4 z-20 px-3 py-2 rounded-xl flex items-center gap-2"
          style={{
            background: 'rgba(250, 245, 240, 0.92)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(201, 147, 58, 0.3)',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="w-4 h-4 border-2 border-[#c9933a] border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity }}
          />
          <span className="text-xs text-[#4a2c2a]">Routes dhundh rahe hain (ORS)...</span>
        </motion.div>
      )}

      <LiveBadge isTracking={isTracking} location={userLocation} onShare={handleShareLocation} />

      <AnimatePresence>
        {selectedStation && (
          <StationInfoCard station={selectedStation} onClose={() => setSelectedStation(null)} />
        )}
      </AnimatePresence>

      <TimerButton />

      <PolicePanel
        stations={policeStations}
        isOpen={isPanelOpen}
        onToggle={() => setIsPanelOpen(!isPanelOpen)}
        onSelect={(s) => { setSelectedStation(s); setIsPanelOpen(false) }}
        isLoading={isLoadingStations}
      />

      <AnimatePresence>
        {shareToast && (
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-medium whitespace-nowrap"
            style={{ background: 'rgba(74, 44, 42, 0.95)', color: '#faf5f0', backdropFilter: 'blur(10px)' }}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            {shareToast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}