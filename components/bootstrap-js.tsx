'use client'

import { useEffect } from 'react'

export function BootstrapJs() {
  useEffect(() => {
    // Dynamically load Bootstrap bundle (includes Popper) — client-side only
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('bootstrap/dist/js/bootstrap.bundle.min.js')
  }, [])
  return null
}
