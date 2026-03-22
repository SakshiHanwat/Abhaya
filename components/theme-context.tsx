'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

// ─── Theme Definitions ────────────────────────────────────────────────────────

export type ThemeId = 'light' | 'dark' | 'luxe'

export interface Theme {
  id: ThemeId
  name: string
  nameHindi: string
  emoji: string
  colors: {
    background: string
    backgroundSecondary: string
    foreground: string
    foregroundMuted: string
    card: string
    cardBorder: string
    primary: string
    secondary: string
    accent: string
    gold: string
    danger: string
    success: string
    shadow: string
  }
  css: Record<string, string>
}

export const THEMES: Record<ThemeId, Theme> = {
  // ── Theme 1: Light Mandala (default warm cream) ───────────────────────────
  light: {
    id: 'light',
    name: 'Light Mandala',
    nameHindi: 'उजला मंडल',
    emoji: '🌸',
    colors: {
      background: '#faf5f0',
      backgroundSecondary: '#f5ede4',
      foreground: '#4a2c2a',
      foregroundMuted: '#7a5c5a',
      card: '#ffffff',
      cardBorder: 'rgba(201, 147, 58, 0.2)',
      primary: '#4a2c2a',
      secondary: '#b5836a',
      accent: '#c9933a',
      gold: '#c9933a',
      danger: '#d32f2f',
      success: '#4caf50',
      shadow: 'rgba(74, 44, 42, 0.15)',
    },
    css: {
      '--bg': '#faf5f0',
      '--bg2': '#f5ede4',
      '--fg': '#4a2c2a',
      '--fg-muted': '#7a5c5a',
      '--card': '#ffffff',
      '--card-border': 'rgba(201, 147, 58, 0.2)',
      '--primary': '#4a2c2a',
      '--secondary': '#b5836a',
      '--accent': '#c9933a',
      '--gold': '#c9933a',
      '--input-bg': '#faf5f0',
      '--mandala-opacity': '0.15',
      '--nav-bg': 'rgba(255, 255, 255, 0.95)',
    },
  },

  // ── Theme 2: Dark Mandala (deep dark with gold accents) ───────────────────
  dark: {
    id: 'dark',
    name: 'Dark Mandala',
    nameHindi: 'श्याम मंडल',
    emoji: '🌑',
    colors: {
      background: '#0d0a08',
      backgroundSecondary: '#1a1210',
      foreground: '#f5e6d0',
      foregroundMuted: '#a08060',
      card: '#1e1510',
      cardBorder: 'rgba(201, 147, 58, 0.3)',
      primary: '#f5e6d0',
      secondary: '#c9933a',
      accent: '#e8b84b',
      gold: '#e8b84b',
      danger: '#ef5350',
      success: '#66bb6a',
      shadow: 'rgba(0, 0, 0, 0.5)',
    },
    css: {
      '--bg': '#0d0a08',
      '--bg2': '#1a1210',
      '--fg': '#f5e6d0',
      '--fg-muted': '#a08060',
      '--card': '#1e1510',
      '--card-border': 'rgba(201, 147, 58, 0.3)',
      '--primary': '#f5e6d0',
      '--secondary': '#c9933a',
      '--accent': '#e8b84b',
      '--gold': '#e8b84b',
      '--input-bg': '#160f0a',
      '--mandala-opacity': '0.25',
      '--nav-bg': 'rgba(13, 10, 8, 0.97)',
    },
  },

  // ── Theme 3: Luxe Mandala (royal deep plum + gold — luxurious medium) ─────
  luxe: {
    id: 'luxe',
    name: 'Luxe Mandala',
    nameHindi: 'राजसी मंडल',
    emoji: '👑',
    colors: {
      background: '#1a0f2e',
      backgroundSecondary: '#241444',
      foreground: '#f0e6ff',
      foregroundMuted: '#9b7fc7',
      card: '#231040',
      cardBorder: 'rgba(180, 130, 255, 0.25)',
      primary: '#f0e6ff',
      secondary: '#b482ff',
      accent: '#d4a843',
      gold: '#d4a843',
      danger: '#ff6b6b',
      success: '#69db7c',
      shadow: 'rgba(0, 0, 0, 0.4)',
    },
    css: {
      '--bg': '#1a0f2e',
      '--bg2': '#241444',
      '--fg': '#f0e6ff',
      '--fg-muted': '#9b7fc7',
      '--card': '#231040',
      '--card-border': 'rgba(180, 130, 255, 0.25)',
      '--primary': '#f0e6ff',
      '--secondary': '#b482ff',
      '--accent': '#d4a843',
      '--gold': '#d4a843',
      '--input-bg': '#1e1238',
      '--mandala-opacity': '0.2',
      '--nav-bg': 'rgba(26, 15, 46, 0.97)',
    },
  },
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface ThemeContextType {
  themeId: ThemeId
  theme: Theme
  colors: Theme['colors']
  setTheme: (id: ThemeId) => void
}

const ThemeContext = createContext<ThemeContextType>({
  themeId: 'light',
  theme: THEMES.light,
  colors: THEMES.light.colors,
  setTheme: () => {},
})

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>('light')

  // Load saved theme
  useEffect(() => {
    const saved = localStorage.getItem('Abhaya-theme') as ThemeId
    if (saved && THEMES[saved]) setThemeId(saved)
  }, [])

  // Apply CSS variables to :root
  useEffect(() => {
    const theme = THEMES[themeId]
    const root = document.documentElement
    Object.entries(theme.css).forEach(([key, val]) => {
      root.style.setProperty(key, val)
    })
    // Set data-theme for potential CSS selectors
    root.setAttribute('data-theme', themeId)
    // Update body background
    document.body.style.backgroundColor = theme.colors.background
    document.body.style.color = theme.colors.foreground
    localStorage.setItem('Abhaya-theme', themeId)
  }, [themeId])

  const theme = THEMES[themeId]

  return (
    <ThemeContext.Provider value={{ themeId, theme, colors: theme.colors, setTheme: setThemeId }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}