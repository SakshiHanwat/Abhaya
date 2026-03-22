'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme, THEMES, ThemeId } from './theme-context'

export function ThemeSwitcher() {
  const { themeId, setTheme, theme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Trigger Button — small, clean, just emoji + name */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-medium"
        style={{
          background: `${theme.colors.accent}20`,
          border: `1px solid ${theme.colors.accent}50`,
          color: theme.colors.accent,
          whiteSpace: 'nowrap',
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span>{theme.emoji}</span>
        <span className="hidden sm:inline">{theme.nameHindi}</span>
      </motion.button>

      {/* Theme Picker Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 z-50"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Modal */}
            <motion.div
              className="fixed bottom-24 left-4 right-4 z-50 rounded-2xl overflow-hidden"
              style={{
                background: theme.colors.card,
                border: `1px solid ${theme.colors.cardBorder}`,
                boxShadow: `0 20px 60px ${theme.colors.shadow}`,
              }}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            >
              {/* Header */}
              <div className="px-5 pt-5 pb-3">
                <h3 className="text-base font-bold" style={{ color: theme.colors.accent, fontFamily: 'var(--font-playfair)' }}>
                  🎨 Theme Chunein
                </h3>
                <p className="text-xs mt-0.5" style={{ color: theme.colors.foregroundMuted }}>
                  Apni pasand ka look select karein
                </p>
              </div>

              {/* Theme Cards */}
              <div className="px-4 pb-5 space-y-3">
                {(Object.values(THEMES) as typeof THEMES[ThemeId][]).map((t) => (
                  <motion.button
                    key={t.id}
                    onClick={() => { setTheme(t.id); setIsOpen(false) }}
                    className="w-full flex items-center gap-4 p-4 rounded-xl relative overflow-hidden"
                    style={{
                      background: themeId === t.id
                        ? `linear-gradient(135deg, ${t.colors.accent}25, ${t.colors.secondary}15)`
                        : `${t.colors.background}`,
                      border: `2px solid ${themeId === t.id ? t.colors.accent : t.colors.cardBorder}`,
                      boxShadow: themeId === t.id ? `0 4px 20px ${t.colors.accent}30` : 'none',
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {/* Preview swatch */}
                    <div className="w-14 h-14 rounded-xl flex-shrink-0 overflow-hidden relative"
                      style={{ background: t.colors.background, border: `1px solid ${t.colors.cardBorder}` }}>
                      {/* Mini mandala preview */}
                      <svg viewBox="0 0 56 56" className="absolute inset-0 w-full h-full opacity-60">
                        <circle cx={28} cy={28} r={20} fill="none" stroke={t.colors.accent} strokeWidth={1} strokeOpacity={0.5} />
                        <circle cx={28} cy={28} r={12} fill="none" stroke={t.colors.secondary} strokeWidth={1} strokeOpacity={0.4} />
                        {Array.from({ length: 8 }).map((_, i) => {
                          const a = (i * 45) * (Math.PI / 180)
                          return (
                            <g key={i} transform={`rotate(${i * 45} 28 28)`}>
                              <path d={`M 28 28 L 28 10 Q 31 19 34 22 L 28 28`} fill={t.colors.accent} fillOpacity={0.4} />
                            </g>
                          )
                        })}
                        <circle cx={28} cy={28} r={5} fill={t.colors.accent} fillOpacity={0.7} />
                      </svg>
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-left">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{t.emoji}</span>
                        <span className="font-bold text-sm" style={{ color: t.colors.foreground === '#f5e6d0' || t.colors.foreground === '#f0e6ff' ? theme.colors.foreground : t.colors.foreground }}>
                          {t.name}
                        </span>
                      </div>
                      <p className="text-xs mt-0.5" style={{ color: theme.colors.foregroundMuted }}>{t.nameHindi}</p>

                      {/* Color dots preview */}
                      <div className="flex gap-1.5 mt-2">
                        {[t.colors.background, t.colors.accent, t.colors.secondary, t.colors.foreground].map((c, i) => (
                          <div key={i} className="w-3 h-3 rounded-full border"
                            style={{ backgroundColor: c, borderColor: `${c}80` }} />
                        ))}
                      </div>
                    </div>

                    {/* Selected checkmark */}
                    {themeId === t.id && (
                      <motion.div
                        className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{ background: t.colors.accent }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', damping: 15 }}
                      >
                        <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </motion.div>
                    )}

                    {/* Description tag */}
                    <div className="absolute top-2 right-2">
                      {t.id === 'light' && <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: '#fff8e1', color: '#f9a825' }}>Default</span>}
                      {t.id === 'dark' && <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: '#1a1210', color: '#e8b84b' }}>Night</span>}
                      {t.id === 'luxe' && <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: '#2d1b69', color: '#d4a843' }}>✨ Royal</span>}
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}