'use client'

import { motion } from 'framer-motion'
import { useTheme } from '@/components/theme-context'

type TabType = 'home' | 'track' | 'safety' | 'circle' | 'profile'

interface BottomNavigationProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

// Lotus icon for Home
function LotusIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6">
      {[0, 60, 120, 180, 240, 300].map((angle) => (
        <ellipse
          key={angle}
          cx={12}
          cy={6}
          rx={3}
          ry={5}
          fill={active ? 'currentColor' : 'currentColor'}
          fillOpacity={active ? 1 : 0.4}
          transform={`rotate(${angle} 12 12)`}
        />
      ))}
      <circle cx={12} cy={12} r={3} fill={active ? 'currentColor' : 'currentColor'} fillOpacity={active ? 1 : 0.3} />
    </svg>
  )
}

// Crystal ball / eye icon for Track
function CrystalIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6">
      <circle
        cx={12}
        cy={12}
        r={9}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeOpacity={active ? 1 : 0.4}
      />
      <circle
        cx={12}
        cy={12}
        r={6}
        fill="none"
        stroke="currentColor"
        strokeWidth={1}
        strokeOpacity={active ? 1 : 0.3}
      />
      <circle cx={12} cy={12} r={3} fill="currentColor" fillOpacity={active ? 1 : 0.3} />
      {active && (
        <>
          <line x1={12} y1={5} x2={12} y2={3} stroke="currentColor" strokeWidth={1.5} />
          <line x1={19} y1={12} x2={21} y2={12} stroke="currentColor" strokeWidth={1.5} />
        </>
      )}
    </svg>
  )
}

// Shield icon for Safety
function ShieldIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6">
      <path
        d="M12 2L4 6v5c0 5 8 8 8 8s8-3 8-8V6l-8-4z"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={1.5}
        strokeOpacity={active ? 1 : 0.4}
        fillOpacity={active ? 0.3 : 0}
      />
    </svg>
  )
}

// Crystal ball / circles icon for Circle
function CircleIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6">
      <circle cx={12} cy={12} r={8} fill="none" stroke="currentColor" strokeWidth={1.5} strokeOpacity={active ? 1 : 0.4} />
      <circle cx={12} cy={6} r={2} fill="currentColor" fillOpacity={active ? 1 : 0.3} />
      <circle cx={17} cy={14} r={2} fill="currentColor" fillOpacity={active ? 1 : 0.3} />
      <circle cx={7} cy={14} r={2} fill="currentColor" fillOpacity={active ? 1 : 0.3} />
      <circle cx={12} cy={12} r={1.5} fill="currentColor" fillOpacity={active ? 1 : 0.3} />
    </svg>
  )
}

// Profile icon
function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-6 h-6">
      <circle cx={12} cy={8} r={4} fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.5} strokeOpacity={active ? 1 : 0.4} fillOpacity={active ? 0.3 : 0} />
      <path
        d="M4 20c0-4 3-6 8-6s8 2 8 6"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={1.5}
        strokeOpacity={active ? 1 : 0.4}
        fillOpacity={active ? 0.3 : 0}
      />
    </svg>
  )
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  const { colors } = useTheme()

  const tabs: { id: TabType; icon: React.ReactNode; label: string }[] = [
    { id: 'home', icon: <LotusIcon active={activeTab === 'home'} />, label: 'Home' },
    { id: 'track', icon: <CrystalIcon active={activeTab === 'track'} />, label: 'Track' },
    { id: 'safety', icon: <ShieldIcon active={activeTab === 'safety'} />, label: 'Safety' },
    { id: 'circle', icon: <CircleIcon active={activeTab === 'circle'} />, label: 'Circle' },
    { id: 'profile', icon: <ProfileIcon active={activeTab === 'profile'} />, label: 'Profile' },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center items-end pb-4 px-4 pointer-events-none">
      <motion.nav
        className="flex gap-3 px-4 py-3 rounded-full backdrop-blur-xl border pointer-events-auto"
        style={{
          backgroundColor: `${colors.card}80`,
          borderColor: `${colors.primary}40`,
          boxShadow: `0 8px 32px ${colors.primary}15`,
        }}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {tabs.map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className="relative p-3 rounded-full transition-colors duration-300"
            style={{
              color: activeTab === tab.id ? colors.primary : colors.foreground,
            }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9, rotate: -5 }}
          >
            {/* Icon */}
            <div className="relative z-10">{tab.icon}</div>

            {/* Active indicator - lotus petal below */}
            {activeTab === tab.id && (
              <motion.div
                layoutId="active-indicator"
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
                style={{
                  backgroundColor: colors.primary,
                  boxShadow: `0 0 10px ${colors.primary}`,
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}

            {/* Glow effect on active */}
            {activeTab === tab.id && (
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  boxShadow: `0 0 15px ${colors.primary}40`,
                  backgroundColor: `${colors.primary}10`,
                }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </motion.button>
        ))}
      </motion.nav>
    </div>
  )
}
