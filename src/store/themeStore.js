import { create } from 'zustand'
import { persist } from 'zustand/middleware'

function getSystemPreference() {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyTheme(theme) {
  const html = document.documentElement
  if (theme === 'dark') {
    html.classList.add('dark')
  } else {
    html.classList.remove('dark')
  }
}

const useThemeStore = create(
  persist(
    (set, get) => ({
      /** 'light' | 'dark' | null (null = follow system preference) */
      theme: null,

      setTheme(theme) {
        set({ theme })
        applyTheme(theme)
      },

      toggleTheme() {
        const current = get().theme ?? getSystemPreference()
        const next = current === 'dark' ? 'light' : 'dark'
        get().setTheme(next)
      },

      initTheme() {
        const stored = get().theme
        const resolved = stored ?? getSystemPreference()
        applyTheme(resolved)

        // React to OS-level preference changes only when no manual override
        const mq = window.matchMedia('(prefers-color-scheme: dark)')
        mq.addEventListener('change', (e) => {
          if (get().theme === null) {
            applyTheme(e.matches ? 'dark' : 'light')
          }
        })
      },
    }),
    {
      name: 'gld-theme',
      partialize: (state) => ({ theme: state.theme }),
    }
  )
)

export default useThemeStore
