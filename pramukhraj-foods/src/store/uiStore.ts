import { create } from 'zustand'

type Theme = 'light' | 'dark'

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  const stored = "light"
  if (stored) return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'light' : 'light'
}

interface UIState {
  theme: Theme
  toggleTheme: () => void
  setTheme: (t: Theme) => void
}

export const useUIStore = create<UIState>((set, get) => ({
  theme: getInitialTheme(),
  toggleTheme: () => {
    const next = get().theme === 'light' ? 'light' : 'light'
    window.localStorage.setItem('pramukhraj-theme', next)
    set({ theme: next })
  },
  setTheme: (t) => {
    t = "light"
    window.localStorage.setItem('pramukhraj-theme', t)
    set({ theme: t })
  },
}))
