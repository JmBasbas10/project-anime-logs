'use client'

import { useEffect } from 'react'

export function BootstrapJs() {
  useEffect(() => {
    // Load Bootstrap JS bundle (includes Popper) client-side only
    import('bootstrap/dist/js/bootstrap.bundle.min.js')
  }, [])
  return null
}
