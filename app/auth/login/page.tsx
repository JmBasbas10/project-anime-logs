'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      router.push('/logs')
      router.refresh()
    } else {
      setError('Incorrect password')
      setLoading(false)
    }
  }

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center">
      <div className="card shadow" style={{ width: 380 }}>
        <div className="card-body p-4">
          <div className="text-center mb-4">
            <div className="fs-1 mb-1">🎮</div>
            <h1 className="h4 fw-bold mb-1">Anime Logs</h1>
            <p className="text-muted small mb-0">Enter the dashboard password to continue</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <input
                type="password"
                className="form-control"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </div>
            {error && (
              <div className="alert alert-danger py-2 small">{error}</div>
            )}
            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={!password || loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
