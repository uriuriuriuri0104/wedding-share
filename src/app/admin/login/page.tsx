'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GoldRule, ArchWindow, FloralOrnament } from '@/components/Ornaments'

export default function AdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      if (res.ok) {
        router.replace('/admin')
      } else {
        const d = await res.json()
        setError(d.error || 'ログインに失敗しました')
      }
    } catch {
      setError('ネットワークエラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{
        background: 'linear-gradient(160deg, #0e1728 0%, #1C2E5A 50%, #14204A 100%)',
      }}
    >
      {/* Background arch decorations */}
      <div className="absolute left-0 bottom-0 opacity-[0.07] pointer-events-none">
        <ArchWindow width={300} height={420} opacity={1} />
      </div>
      <div className="absolute right-0 bottom-0 opacity-[0.07] pointer-events-none">
        <ArchWindow width={300} height={420} opacity={1} />
      </div>
      <div className="absolute inset-x-0 top-0 h-[1px]" style={{ background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.4), transparent)' }} />
      <div className="absolute inset-x-0 bottom-0 h-[1px]" style={{ background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.4), transparent)' }} />

      {/* Card */}
      <div
        className="relative w-full max-w-sm z-10"
        style={{
          background: '#F5EFE0',
          border: '1px solid rgba(201,168,76,0.5)',
          boxShadow: '0 20px 80px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.5)',
        }}
      >
        {/* Top gold stripe */}
        <div className="h-[3px]" style={{ background: 'linear-gradient(to right, #A88830, #DFC070, #A88830)' }} />

        <div className="px-8 py-10">
          {/* Header */}
          <div className="text-center mb-8">
            <FloralOrnament className="mx-auto mb-5" />
            <h1 className="text-3xl text-navy" style={{ fontFamily: 'var(--font-cormorant)', letterSpacing: '0.06em' }}>
              Administration
            </h1>
            <p className="text-stone/60 text-[10px] tracking-[0.45em] uppercase mt-1" style={{ fontFamily: 'var(--font-lato)' }}>
              Wedding Photo Share
            </p>
            <GoldRule />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] text-stone/70 tracking-[0.35em] uppercase mb-2" style={{ fontFamily: 'var(--font-lato)' }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="field-input"
              />
            </div>

            <div>
              <label className="block text-[10px] text-stone/70 tracking-[0.35em] uppercase mb-2" style={{ fontFamily: 'var(--font-lato)' }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="field-input"
              />
            </div>

            {error && (
              <p className="text-terracotta text-xs text-center py-2" style={{ fontFamily: 'var(--font-lato)' }}>
                {error}
              </p>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="btn-navy w-full justify-center"
                style={{ width: '100%' }}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </div>
          </form>
        </div>

        {/* Bottom gold stripe */}
        <div className="h-[1px]" style={{ background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.6), transparent)' }} />
      </div>
    </div>
  )
}
