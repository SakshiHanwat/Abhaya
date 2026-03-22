'use client'

import { useState, useCallback, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { LoadingScreen } from '@/components/loading-screen'
import { BottomNavigation } from '@/components/bottom-navigation'
import { HomeScreen } from '@/components/screens/home-screen'
import { TrackScreen } from '@/components/screens/track-screen'
import { SafetyScreen } from '@/components/screens/safety-screen'
import { CircleScreen } from '@/components/screens/circle-screen'
import { ProfileScreen } from '@/components/screens/profile-screen'
import { AuthScreen } from '@/components/screens/auth-screen'
import { LanguageProvider } from '@/components/language-context'
import { ThemeProvider, useTheme } from '@/components/theme-context'
import { DeviChatbot, DeviFloatingButton } from '@/components/devi-chatbot'
import { supabase } from '@/lib/supabase'
import type { RouteData } from '@/components/screens/track-screen'

type TabType = 'home' | 'track' | 'safety' | 'circle' | 'profile'

const screenAnimations = {
  home:    { initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 },  exit: { opacity: 0, scale: 0.95 } },
  track:   { initial: { opacity: 0, x: 100 },      animate: { opacity: 1, x: 0 },      exit: { opacity: 0, x: -100 } },
  safety:  { initial: { opacity: 0, x: -100 },     animate: { opacity: 1, x: 0 },      exit: { opacity: 0, x: 100 } },
  circle:  { initial: { opacity: 0, rotate: -10 }, animate: { opacity: 1, rotate: 0 }, exit: { opacity: 0, rotate: 10 } },
  profile: { initial: { opacity: 0, y: 100 },      animate: { opacity: 1, y: 0 },      exit: { opacity: 0, y: 100 } },
}

// Floating particles — color from theme
function FloatingParticles() {
  const { colors } = useTheme()
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {Array.from({ length: 15 }).map((_, i) => (
        <motion.div key={i}
          className="absolute w-1 h-1 rounded-full"
          style={{ backgroundColor: colors.accent, left: `${5 + i * 6.5}%`, bottom: '-5%' }}
          animate={{ y: [0, -1200], x: [0, i % 2 === 0 ? 15 : -15], opacity: [0, 0.6, 0.6, 0] }}
          transition={{ duration: 10 + (i % 5), repeat: Infinity, delay: i * 0.7, ease: 'linear' }}
        />
      ))}
    </div>
  )
}

// Inner app — MUST be inside ThemeProvider to use useTheme
function SafeHerApp() {
  const { colors } = useTheme() // ✅ theme se live colors

  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [activeTab, setActiveTab] = useState<TabType>('home')
  const [showChatbot, setShowChatbot] = useState(false)
  const [routeData, setRouteData] = useState<RouteData | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) setIsAuthenticated(true)
      setIsLoading(false)
    }
    checkAuth()
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setIsAuthenticated(!!session)
    })
    return () => subscription?.unsubscribe()
  }, [])

  const handleAuthSuccess = useCallback(() => {
    setIsAuthenticated(true)
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 2000)
  }, [])

  const handleLoadingComplete = useCallback(() => setIsLoading(false), [])

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut()
    setIsAuthenticated(false)
  }, [])

  const handleRouteSelect = useCallback((origin: string, destination: string) => {
    setRouteData({ origin, destination })
    setActiveTab('track')
  }, [])

  return (
    // ✅ Background + text color from live theme — changes instantly
    <main
      className="min-h-screen overflow-x-hidden transition-colors duration-500"
      style={{
        backgroundColor: colors.background,
        color: colors.foreground,
      }}
    >
      <AnimatePresence mode="wait">
        {!isAuthenticated ? (
          <AuthScreen key="auth" onAuthSuccess={handleAuthSuccess} />
        ) : isLoading ? (
          <LoadingScreen key="loading" onComplete={handleLoadingComplete} />
        ) : (
          <motion.div
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative pb-24 min-h-screen"
          >
            <FloatingParticles />

            <div className="relative z-10">
              <AnimatePresence mode="wait">

                {activeTab === 'home' && (
                  <motion.div key="home" {...screenAnimations.home} transition={{ duration: 0.4, ease: 'easeInOut' }}>
                    <HomeScreen onLogout={handleLogout} onNavigate={setActiveTab} onRouteSelect={handleRouteSelect} />
                  </motion.div>
                )}

                {activeTab === 'track' && (
                  <motion.div key="track" {...screenAnimations.track} transition={{ duration: 0.4, ease: 'easeInOut' }}>
                    <TrackScreen routeData={routeData} />
                  </motion.div>
                )}

                {activeTab === 'safety' && (
                  <motion.div key="safety" {...screenAnimations.safety} transition={{ duration: 0.4, ease: 'easeInOut' }}>
                    <SafetyScreen routeData={routeData} />
                  </motion.div>
                )}

                {activeTab === 'circle' && (
                  <motion.div key="circle" {...screenAnimations.circle} transition={{ duration: 0.4, ease: 'easeInOut' }}>
                    <CircleScreen />
                  </motion.div>
                )}

                {activeTab === 'profile' && (
                  <motion.div key="profile" {...screenAnimations.profile} transition={{ duration: 0.4, ease: 'easeInOut' }}>
                    <ProfileScreen onLogout={handleLogout} />
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            <DeviFloatingButton onClick={() => setShowChatbot(true)} />
            <DeviChatbot isOpen={showChatbot} onClose={() => setShowChatbot(false)} />
            <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}

// Root — ThemeProvider wraps everything
export default function Page() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <SafeHerApp />
      </LanguageProvider>
    </ThemeProvider>
  )
}