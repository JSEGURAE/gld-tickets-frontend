import { Sun, Moon } from 'lucide-react'
import useThemeStore from '../store/themeStore'

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore()

  const isDark =
    theme === 'dark' ||
    (theme === null &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches)

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
      className="relative inline-flex items-center h-6 w-11 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 flex-shrink-0"
      style={{
        backgroundColor: isDark ? 'rgba(109,40,217,0.45)' : 'rgba(203,213,225,1)',
        '--tw-ring-offset-color': 'var(--bg-base)',
      }}
    >
      <span
        className={`absolute flex items-center justify-center w-5 h-5 rounded-full shadow-sm transition-all duration-300 ${
          isDark
            ? 'translate-x-[22px] bg-violet-400'
            : 'translate-x-0.5 bg-white'
        }`}
      >
        {isDark
          ? <Moon className="w-3 h-3 text-white" />
          : <Sun className="w-3 h-3 text-amber-500" />
        }
      </span>
    </button>
  )
}
