import { createContext, useContext, useMemo } from 'react'
import useDominantColor from '../hooks/useDominantColor'
import { usePlayerStore } from '../store/playerStore'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const coverUrl = usePlayerStore((s) => s.currentSong?.coverUrl)
  const dominantColor = useDominantColor(coverUrl)

  const value = useMemo(() => {
    const { r, g, b, hex, isDark } = dominantColor

    return {
      dominantColor,
      bgGradient: `linear-gradient(135deg, rgba(${r},${g},${b},0.35) 0%, rgba(${r},${g},${b},0.08) 60%, transparent 100%)`,
      accentHex: hex,
      textOnAccent: isDark ? '#ffffff' : '#1a1a2e',
    }
  }, [dominantColor])

  return (
    <ThemeContext.Provider value={value}>
      {/* CSS custom properties for smooth transitions across the app */}
      <div
        style={{
          '--theme-r': dominantColor.r,
          '--theme-g': dominantColor.g,
          '--theme-b': dominantColor.b,
          '--theme-accent': dominantColor.hex,
          '--theme-accent-88': dominantColor.hex + '88',
          '--theme-text-on-accent': value.textOnAccent,
          '--theme-bg-gradient': value.bgGradient,
          transition: 'color 600ms ease, background 600ms ease',
        }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within a <ThemeProvider>')
  }
  return ctx
}

export default ThemeContext
