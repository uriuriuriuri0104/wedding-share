'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { GoldRule, OrnamentalDivider } from '@/components/Ornaments'
import { VOTE_CHOICES, CORRECT_CHOICE_ID } from '@/lib/vote-choices'

interface SiteStats {
  totalViews: number
  todayViews: number
  totalVotes: number
}

interface VoteStats {
  answerRevealed: boolean
  total: number
}

interface VoteResults {
  results: Record<number, number>
  voterNames: Record<number, string[]>
  total: number
  answerRevealed: boolean
}

export default function AdminPage() {
  const router = useRouter()

  const [siteStats, setSiteStats] = useState<SiteStats | null>(null)

  // Vote state
  const [voteStats, setVoteStats] = useState<VoteStats | null>(null)
  const [voteResults, setVoteResults] = useState<VoteResults | null>(null)
  const [voteQrData, setVoteQrData] = useState<{ qr: string; url: string } | null>(null)
  const [showVoteQr, setShowVoteQr] = useState(false)
  const [voteActionLoading, setVoteActionLoading] = useState(false)

  useEffect(() => {
    const fetchStats = async () => {
      const res = await fetch('/api/admin/stats')
      if (res.status === 401) { router.replace('/admin/login'); return }
      if (res.ok) setSiteStats(await res.json())
    }
    fetchStats()
    const id = setInterval(fetchStats, 30_000)
    return () => clearInterval(id)
  }, [router])

  /* ── Vote ─────────────────────────────────── */
  const fetchVoteData = useCallback(async () => {
    const [statsRes, resultsRes] = await Promise.all([
      fetch('/api/admin/vote'),
      fetch('/api/vote/results'),
    ])
    if (statsRes.status === 401) { router.replace('/admin/login'); return }
    if (statsRes.ok) setVoteStats(await statsRes.json())
    if (resultsRes.ok) setVoteResults(await resultsRes.json())
  }, [router])

  useEffect(() => { fetchVoteData() }, [fetchVoteData])

  useEffect(() => {
    const id = setInterval(fetchVoteData, 5000)
    return () => clearInterval(id)
  }, [fetchVoteData])

  const voteAction = async (action: 'reveal' | 'hide' | 'reset') => {
    if (action === 'reset' && !confirm('投票をリセットしますか？この操作は元に戻せません。')) return
    setVoteActionLoading(true)
    await fetch('/api/admin/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    await fetchVoteData()
    setVoteActionLoading(false)
  }

  const loadVoteQr = async () => {
    if (!voteQrData) {
      const res = await fetch('/api/admin/vote/qr')
      if (res.ok) setVoteQrData(await res.json())
    }
    setShowVoteQr(true)
  }

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.replace('/admin/login')
  }

  const voteMax = voteResults ? Math.max(...Object.values(voteResults.results), 1) : 1

  return (
    <div className="min-h-screen" style={{ background: '#EDE4CF' }}>

      {/* ── Header ───────────────────────────────────── */}
      <header className="navy-texture sticky top-0 z-20 shadow-lg">
        <div className="absolute bottom-0 inset-x-0 h-[1px]" style={{ background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.5), transparent)' }} />
        <div className="max-w-7xl mx-auto px-5 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-gold text-2xl font-light" style={{ fontFamily: 'var(--font-cormorant)', letterSpacing: '0.06em' }}>
              Administration
            </h1>
            <p className="text-gold/40 text-[10px] tracking-[0.35em] uppercase mt-0.5" style={{ fontFamily: 'var(--font-lato)' }}>
              Dress Quiz · {voteStats?.total ?? 0} votes cast
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={loadVoteQr}
              className="btn-gold-outline"
              style={{ padding: '0.5rem 1.25rem' }}
            >
              QR Code
            </button>
            <button
              onClick={logout}
              className="text-gold/50 hover:text-gold/80 text-xs tracking-widest uppercase transition-colors px-3"
              style={{ fontFamily: 'var(--font-lato)' }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10">

        {/* ── Stats cards ────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3 mb-10">
          {[
            { label: '総アクセス数', value: siteStats?.totalViews },
            { label: '本日のアクセス', value: siteStats?.todayViews },
            { label: '総投票数', value: siteStats?.totalVotes },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                background: '#FAF7F0',
                border: '1px solid rgba(201,168,76,0.25)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              }}
              className="px-4 py-4"
            >
              <p
                className="text-[9px] tracking-[0.3em] uppercase mb-2"
                style={{ fontFamily: 'var(--font-lato)', color: '#A88830' }}
              >
                {label}
              </p>
              {value === undefined ? (
                <div className="h-8 flex items-center">
                  <div className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '1.5px' }} />
                </div>
              ) : (
                <p
                  className="text-navy text-3xl font-light leading-none"
                  style={{ fontFamily: 'var(--font-cormorant)' }}
                >
                  {value.toLocaleString()}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* ── Vote section ───────────────────────────── */}
        <div className="max-w-2xl mx-auto">

          {/* Stats + Actions */}
          <div
            className="p-6 mb-8"
            style={{ background: '#FAF7F0', border: '1px solid rgba(201,168,76,0.3)', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}
          >
            <div className="flex items-start justify-between mb-5">
              <div>
                <p className="text-gold/60 text-[10px] tracking-[0.4em] uppercase mb-1" style={{ fontFamily: 'var(--font-lato)' }}>
                  総投票数
                </p>
                <p className="text-navy text-5xl font-light" style={{ fontFamily: 'var(--font-cormorant)' }}>
                  {voteStats?.total ?? 0}
                </p>
              </div>
              <div className="text-right">
                <p className="text-gold/60 text-[10px] tracking-[0.4em] uppercase mb-1" style={{ fontFamily: 'var(--font-lato)' }}>
                  正解表示
                </p>
                <span
                  className="text-sm tracking-widest"
                  style={{
                    fontFamily: 'var(--font-lato)',
                    color: voteStats?.answerRevealed ? '#A88830' : '#8C7D6E',
                  }}
                >
                  {voteStats?.answerRevealed ? '● 公開中' : '○ 非公開'}
                </span>
              </div>
            </div>

            <GoldRule />

            <div className="flex flex-wrap gap-2 mt-5">
              <button
                onClick={() => voteAction(voteStats?.answerRevealed ? 'hide' : 'reveal')}
                disabled={voteActionLoading}
                className="btn-navy"
                style={{ padding: '0.6rem 1.25rem', fontSize: '0.7rem' }}
              >
                {voteStats?.answerRevealed ? '正解を非公開にする' : '正解を発表する'}
              </button>
              <button
                onClick={loadVoteQr}
                className="btn-gold-outline"
                style={{ padding: '0.6rem 1.25rem', fontSize: '0.7rem' }}
              >
                投票QRコード
              </button>
              <button
                onClick={() => voteAction('reset')}
                disabled={voteActionLoading}
                className="text-[11px] tracking-widest uppercase px-4 py-2.5 transition-colors"
                style={{
                  fontFamily: 'var(--font-lato)',
                  background: 'rgba(184,98,63,0.08)',
                  color: '#B8623F',
                  border: '1px solid rgba(184,98,63,0.3)',
                }}
              >
                投票リセット
              </button>
            </div>
          </div>

          {/* Results chart */}
          <OrnamentalDivider>
            <span className="text-gold/70 text-[10px] tracking-[0.4em] uppercase px-3" style={{ fontFamily: 'var(--font-lato)' }}>
              投票結果
            </span>
          </OrnamentalDivider>

          {!voteResults ? (
            <div className="flex items-center justify-center h-32">
              <div className="spinner" />
            </div>
          ) : (
            <div className="mt-6 space-y-2.5">
              {VOTE_CHOICES.map((choice) => {
                const count = voteResults.results[choice.id] ?? 0
                const pct = voteResults.total > 0 ? Math.round((count / voteResults.total) * 100) : 0
                const isCorrect = choice.id === CORRECT_CHOICE_ID

                return (
                  <div
                    key={choice.id}
                    className="px-4 py-3"
                    style={{
                      background: isCorrect ? 'rgba(201,168,76,0.08)' : 'rgba(250,247,240,0.8)',
                      border: isCorrect ? '1.5px solid rgba(201,168,76,0.4)' : '1px solid rgba(201,168,76,0.15)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        {isCorrect && <span className="text-gold text-xs">★</span>}
                        <span
                          className="text-sm"
                          style={{
                            fontFamily: 'var(--font-cormorant)',
                            fontSize: '1rem',
                            color: isCorrect ? '#A88830' : '#1C2E5A',
                            fontWeight: isCorrect ? 600 : 400,
                          }}
                        >
                          {choice.label}
                        </span>
                      </div>
                      <span
                        className="text-xs ml-3 flex-shrink-0"
                        style={{ fontFamily: 'var(--font-lato)', color: isCorrect ? '#A88830' : '#8C7D6E' }}
                      >
                        {count}票 ({pct}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden" style={{ background: 'rgba(201,168,76,0.12)' }}>
                      <div
                        className="h-full transition-all duration-700"
                        style={{
                          width: `${voteMax > 0 ? (count / voteMax) * 100 : 0}%`,
                          background: isCorrect
                            ? 'linear-gradient(to right, #A88830, #DFC070)'
                            : 'rgba(201,168,76,0.45)',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <p className="text-center text-stone/30 text-[10px] tracking-wider mt-5" style={{ fontFamily: 'var(--font-lato)' }}>
            ★ 正解の選択肢 · 5秒ごとに自動更新
          </p>

          {/* ── 正解者一覧 ──────────────────────────── */}
          {voteResults?.answerRevealed && (() => {
            const correctNames = voteResults.voterNames?.[CORRECT_CHOICE_ID] ?? []
            const correctCount = correctNames.length
            const incorrectCount = voteResults.total - correctCount

            return (
              <div className="mt-10">
                <OrnamentalDivider>
                  <span className="text-gold/70 text-[10px] tracking-[0.4em] uppercase px-3" style={{ fontFamily: 'var(--font-lato)' }}>
                    正解者一覧
                  </span>
                </OrnamentalDivider>

                {/* 正解・不正解カウント */}
                <div className="grid grid-cols-2 gap-3 mt-6 mb-6">
                  <div
                    className="text-center py-5 px-4"
                    style={{
                      background: 'rgba(40,120,40,0.08)',
                      border: '1.5px solid rgba(40,160,40,0.35)',
                    }}
                  >
                    <p className="text-[9px] tracking-[0.35em] uppercase mb-2" style={{ fontFamily: 'var(--font-lato)', color: '#2a7a2a' }}>
                      正解者
                    </p>
                    <p className="font-light leading-none" style={{ fontFamily: 'var(--font-cormorant)', fontSize: '3.5rem', color: '#2a7a2a' }}>
                      {correctCount}
                    </p>
                    <p className="text-[10px] mt-1" style={{ fontFamily: 'var(--font-lato)', color: 'rgba(40,120,40,0.7)' }}>名</p>
                  </div>
                  <div
                    className="text-center py-5 px-4"
                    style={{
                      background: 'rgba(184,98,63,0.06)',
                      border: '1.5px solid rgba(184,98,63,0.25)',
                    }}
                  >
                    <p className="text-[9px] tracking-[0.35em] uppercase mb-2" style={{ fontFamily: 'var(--font-lato)', color: '#B8623F' }}>
                      不正解者
                    </p>
                    <p className="font-light leading-none" style={{ fontFamily: 'var(--font-cormorant)', fontSize: '3.5rem', color: '#B8623F' }}>
                      {incorrectCount}
                    </p>
                    <p className="text-[10px] mt-1" style={{ fontFamily: 'var(--font-lato)', color: 'rgba(184,98,63,0.7)' }}>名</p>
                  </div>
                </div>

                {/* 正解者名リスト */}
                <div
                  className="p-6"
                  style={{
                    background: '#FAF7F0',
                    border: '1px solid rgba(201,168,76,0.25)',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                  }}
                >
                  {correctCount === 0 ? (
                    <p
                      className="text-center py-4"
                      style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.4rem', color: '#8C7D6E' }}
                    >
                      正解者はいません
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {correctNames.map((name, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-3 py-2.5 px-4"
                          style={{
                            borderBottom: i < correctNames.length - 1 ? '1px solid rgba(201,168,76,0.15)' : 'none',
                          }}
                        >
                          <span
                            className="text-[10px] tracking-[0.2em] flex-shrink-0"
                            style={{ fontFamily: 'var(--font-lato)', color: 'rgba(168,136,48,0.6)', minWidth: '2rem' }}
                          >
                            {String(i + 1).padStart(2, '0')}
                          </span>
                          <span className="text-gold text-xs flex-shrink-0">★</span>
                          <span
                            style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.4rem', color: '#1C2E5A' }}
                          >
                            {name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            )
          })()}
        </div>
      </main>

      {/* ── Vote QR Modal ──────────────────────────── */}
      {showVoteQr && voteQrData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 lightbox-enter"
          style={{ backgroundColor: 'rgba(10,16,36,0.92)' }}
          onClick={() => setShowVoteQr(false)}
        >
          <div
            className="w-full max-w-xs text-center"
            style={{ background: '#F5EFE0', border: '1px solid rgba(201,168,76,0.5)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-[3px]" style={{ background: 'linear-gradient(to right, #A88830, #DFC070, #A88830)' }} />
            <div className="px-8 py-8">
              <h2 className="text-2xl text-navy mb-1" style={{ fontFamily: 'var(--font-cormorant)' }}>Dress Quiz QR</h2>
              <p className="text-stone/60 text-[10px] tracking-[0.3em] uppercase mb-5" style={{ fontFamily: 'var(--font-lato)' }}>
                スキャンして投票
              </p>
              <GoldRule />
              <img src={voteQrData.qr} alt="Vote QR Code" className="w-44 h-44 mx-auto my-6" />
              <GoldRule />
              <p className="text-stone/50 text-[10px] break-all mt-4 mb-6" style={{ fontFamily: 'var(--font-lato)' }}>
                {voteQrData.url}
              </p>
              <button onClick={() => setShowVoteQr(false)} className="btn-navy" style={{ width: '100%', justifyContent: 'center' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
