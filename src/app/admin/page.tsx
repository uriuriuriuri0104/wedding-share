'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { GoldRule, OrnamentalDivider } from '@/components/Ornaments'
import { VOTE_CHOICES, CORRECT_CHOICE_ID } from '@/lib/vote-choices'

interface Photo {
  id: string
  filename: string
  original_name: string
  uploader_name: string
  message: string
  status: 'pending' | 'approved'
  file_size: number
  created_at: string
}

type Filter = 'pending' | 'approved' | 'all'
type Section = 'photos' | 'vote'

interface VoteStats {
  answerRevealed: boolean
  total: number
}

interface VoteResults {
  results: Record<number, number>
  total: number
  answerRevealed: boolean
}

export default function AdminPage() {
  const router = useRouter()

  // Photos state
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<Filter>('pending')
  const [qrData, setQrData] = useState<{ qr: string; url: string } | null>(null)
  const [showQr, setShowQr] = useState(false)

  // Section
  const [section, setSection] = useState<Section>('photos')

  // Vote state
  const [voteStats, setVoteStats] = useState<VoteStats | null>(null)
  const [voteResults, setVoteResults] = useState<VoteResults | null>(null)
  const [voteQrData, setVoteQrData] = useState<{ qr: string; url: string } | null>(null)
  const [showVoteQr, setShowVoteQr] = useState(false)
  const [voteActionLoading, setVoteActionLoading] = useState(false)

  /* ── Photos ───────────────────────────────── */
  const fetchPhotos = useCallback(async () => {
    const res = await fetch('/api/admin/photos')
    if (res.status === 401) { router.replace('/admin/login'); return }
    if (res.ok) setPhotos(await res.json())
    setLoading(false)
  }, [router])

  useEffect(() => { fetchPhotos() }, [fetchPhotos])

  const patch = async (id: string, action: string) => {
    await fetch(`/api/admin/photos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    setPhotos((p) => p.map((x) => x.id === id ? { ...x, status: action === 'approve' ? 'approved' : 'pending' } : x))
  }

  const del = async (id: string) => {
    if (!confirm('この写真を削除しますか？')) return
    await fetch(`/api/admin/photos/${id}`, { method: 'DELETE' })
    setPhotos((p) => p.filter((x) => x.id !== id))
  }

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.replace('/admin/login')
  }

  const loadQr = async () => {
    if (!qrData) {
      const res = await fetch('/api/qr')
      if (res.ok) setQrData(await res.json())
    }
    setShowQr(true)
  }

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

  useEffect(() => {
    if (section === 'vote') fetchVoteData()
  }, [section, fetchVoteData])

  // Auto-refresh vote results every 5s when in vote section
  useEffect(() => {
    if (section !== 'vote') return
    const id = setInterval(fetchVoteData, 5000)
    return () => clearInterval(id)
  }, [section, fetchVoteData])

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

  /* ── Derived ──────────────────────────────── */
  const pending = photos.filter((p) => p.status === 'pending').length
  const approved = photos.filter((p) => p.status === 'approved').length
  const filtered = photos.filter((p) => filter === 'all' || p.status === filter)
  const fmt = (b: number) => b < 1024 * 1024 ? `${(b / 1024).toFixed(0)}KB` : `${(b / 1024 / 1024).toFixed(1)}MB`
  const filterLabels: Record<Filter, string> = {
    pending: `承認待ち (${pending})`,
    approved: `承認済み (${approved})`,
    all: `すべて (${photos.length})`,
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
              {section === 'photos'
                ? `${pending} pending · ${approved} approved`
                : `vote · ${voteStats?.total ?? 0} votes cast`}
            </p>
          </div>
          <div className="flex gap-2 items-center">
            <button
              onClick={() => setSection(section === 'photos' ? 'vote' : 'photos')}
              className="btn-gold-outline"
              style={{ padding: '0.5rem 1.25rem' }}
            >
              {section === 'photos' ? 'Vote' : 'Photos'}
            </button>
            {section === 'photos' && (
              <button onClick={loadQr} className="btn-gold-outline" style={{ padding: '0.5rem 1.25rem' }}>
                QR Code
              </button>
            )}
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-10">

        {/* ── Photos section ─────────────────────────── */}
        {section === 'photos' && (
          <>
            <div className="flex gap-1.5 mb-10">
              {(['pending', 'approved', 'all'] as Filter[]).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="text-[10px] tracking-[0.3em] uppercase px-4 py-2 transition-colors"
                  style={{
                    fontFamily: 'var(--font-lato)',
                    background: filter === f ? '#1C2E5A' : 'rgba(250,247,240,0.7)',
                    color: filter === f ? '#C9A84C' : '#8C7D6E',
                    border: '1px solid ' + (filter === f ? 'rgba(201,168,76,0.4)' : 'rgba(201,168,76,0.2)'),
                  }}
                >
                  {filterLabels[f]}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-48 gap-4">
                <div className="spinner" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-24">
                <p className="text-stone/60 text-2xl" style={{ fontFamily: 'var(--font-cormorant)' }}>
                  {filter === 'pending' ? '承認待ちの写真はありません' : '写真がありません'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {filtered.map((photo) => (
                  <div
                    key={photo.id}
                    style={{
                      background: '#FAF7F0',
                      border: '1px solid rgba(201,168,76,0.25)',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                    }}
                  >
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={photo.filename.startsWith('http') ? photo.filename : `/uploads/${photo.filename}`}
                        alt={photo.original_name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div
                        className="absolute top-2 left-2 text-[9px] tracking-[0.2em] uppercase px-2 py-0.5"
                        style={{
                          fontFamily: 'var(--font-lato)',
                          background: photo.status === 'approved' ? 'rgba(18,32,62,0.9)' : 'rgba(184,98,63,0.9)',
                          color: '#C9A84C',
                          border: '1px solid rgba(201,168,76,0.4)',
                        }}
                      >
                        {photo.status === 'approved' ? 'Live' : 'Pending'}
                      </div>
                    </div>
                    <div className="p-3">
                      <p className="text-navy text-base leading-tight" style={{ fontFamily: 'var(--font-cormorant)' }}>
                        {photo.uploader_name}
                      </p>
                      {photo.message && (
                        <p className="text-stone/60 text-xs mt-0.5 line-clamp-2" style={{ fontFamily: 'var(--font-lato)' }}>
                          {photo.message}
                        </p>
                      )}
                      <p className="text-stone/40 text-[10px] mt-1" style={{ fontFamily: 'var(--font-lato)' }}>
                        {new Date(photo.created_at).toLocaleDateString('ja-JP')} · {fmt(photo.file_size)}
                      </p>
                      <div className="flex gap-1.5 mt-3">
                        {photo.status === 'pending' ? (
                          <button
                            onClick={() => patch(photo.id, 'approve')}
                            className="flex-1 py-1.5 text-[9px] tracking-[0.2em] uppercase transition-colors"
                            style={{ fontFamily: 'var(--font-lato)', background: '#1C2E5A', color: '#C9A84C', border: '1px solid rgba(201,168,76,0.3)' }}
                          >
                            Approve
                          </button>
                        ) : (
                          <button
                            onClick={() => patch(photo.id, 'reject')}
                            className="flex-1 py-1.5 text-[9px] tracking-[0.2em] uppercase transition-colors"
                            style={{ fontFamily: 'var(--font-lato)', background: '#EDE4CF', color: '#8C7D6E', border: '1px solid rgba(140,125,110,0.3)' }}
                          >
                            Unpublish
                          </button>
                        )}
                        <button
                          onClick={() => del(photo.id)}
                          className="flex-1 py-1.5 text-[9px] tracking-[0.2em] uppercase transition-colors"
                          style={{ fontFamily: 'var(--font-lato)', background: 'rgba(184,98,63,0.08)', color: '#B8623F', border: '1px solid rgba(184,98,63,0.3)' }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── Vote section ───────────────────────────── */}
        {section === 'vote' && (
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
          </div>
        )}
      </main>

      {/* ── Photo QR Modal ─────────────────────────── */}
      {showQr && qrData && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6 lightbox-enter"
          style={{ backgroundColor: 'rgba(10,16,36,0.92)' }}
          onClick={() => setShowQr(false)}
        >
          <div
            className="w-full max-w-xs text-center"
            style={{ background: '#F5EFE0', border: '1px solid rgba(201,168,76,0.5)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-[3px]" style={{ background: 'linear-gradient(to right, #A88830, #DFC070, #A88830)' }} />
            <div className="px-8 py-8">
              <h2 className="text-2xl text-navy mb-1" style={{ fontFamily: 'var(--font-cormorant)' }}>Guest QR Code</h2>
              <p className="text-stone/60 text-[10px] tracking-[0.3em] uppercase mb-5" style={{ fontFamily: 'var(--font-lato)' }}>
                スキャンして写真を投稿
              </p>
              <GoldRule />
              <img src={qrData.qr} alt="QR Code" className="w-44 h-44 mx-auto my-6" />
              <GoldRule />
              <p className="text-stone/50 text-[10px] break-all mt-4 mb-6" style={{ fontFamily: 'var(--font-lato)' }}>
                {qrData.url}
              </p>
              <button onClick={() => setShowQr(false)} className="btn-navy" style={{ width: '100%', justifyContent: 'center' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

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
