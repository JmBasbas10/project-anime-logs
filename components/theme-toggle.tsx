'use client'

import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.dataset.bsTheme = theme
  root.classList.toggle('dark', theme === 'dark')
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark')

  useEffect(() => {
    const savedTheme = localStorage.getItem('dashboard-theme')
    const initialTheme = savedTheme === 'light' ? 'light' : 'dark'
    applyTheme(initialTheme)
    const frame = requestAnimationFrame(() => setTheme(initialTheme))
    return () => cancelAnimationFrame(frame)
  }, [])

  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    localStorage.setItem('dashboard-theme', nextTheme)
    applyTheme(nextTheme)
    setTheme(nextTheme)
  }

  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
      <span className="d-none d-sm-inline">{isDark ? 'Light mode' : 'Dark mode'}</span>
    </button>
  )
}
