import { create } from 'zustand'

type Theme = 'light' | 'dark'

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  const stored = window.localStorage.getItem('pramukhraj-theme') as Theme | null
  if (stored) return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

interface UIState {
  theme: Theme
  toggleTheme: () => void
  setTheme: (t: Theme) => void
}

export const useUIStore = create<UIState>((set, get) => ({
  theme: getInitialTheme(),
  toggleTheme: () => {
    const next = get().theme === 'light' ? 'dark' : 'light'
    window.localStorage.setItem('pramukhraj-theme', next)
    set({ theme: next })
  },
  setTheme: (t) => {
    window.localStorage.setItem('pramukhraj-theme', t)
    set({ theme: t })
  },
}))
