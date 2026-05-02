'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GoldRule, FloralOrnament, ArchWindow, OrnamentalDivider } from '@/components/Ornaments'
import { VOTE_CHOICES } from '@/lib/vote-choices'

export default function VotePage() {
  const router = useRouter()
  const [selected, setSelected] = useState<number | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'voted' | 'submitting' | 'error'>('loading')
  const [alreadyChoiceId, setAlreadyChoiceId] = useState<number | null>(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    fetch('/api/vote')
      .then((r) => r.json())
      .then((data) => {
        if (data.voted) {
          setAlreadyChoiceId(data.choiceId)
          setStatus('voted')
        } else {
          setStatus('ready')
        }
      })
      .catch(() => setStatus('ready'))
  }, [])

  const handleSubmit = async () => {
    if (!selected) return
    setStatus('submitting')
    const res = await fetch('/api/vote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ choiceId: selected }),
    })
    if (res.ok) {
      router.push('/vote/result')
    } else {
      const data = await res.json()
      if (res.status === 409) {
        setStatus('voted')
      } else {
        setErrorMsg(data.error || 'エラーが発生しました')
        setStatus('error')
      }
    }
  }

  /* ── Loading ──────────────────────────────── */
  if (status === 'loading') {
    return (
      <div className="min-h-screen marble-bg flex items-center justify-center">
        <div className="spinner" />
      </div>
    )
  }

  /* ── Already voted ────────────────────────── */
  if (status === 'voted') {
    const choice = VOTE_CHOICES.find((c) => c.id === alreadyChoiceId)
    return (
      <div className="min-h-screen marble-bg flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <div style={{ border: '1px solid rgba(201,168,76,0.4)', padding: '3rem 2rem', background: '#FAF7F0' }}>
            <FloralOrnament className="mx-auto mb-6" />
            <h2 className="text-4xl text-navy mb-2" style={{ fontFamily: 'var(--font-cormorant)' }}>
              投票済み
            </h2>
            {choice && (
              <p className="text-stone text-sm mb-1 mt-3" style={{ fontFamily: 'var(--font-lato)' }}>
                あなたの回答：<br />
                <span className="text-navy font-medium">{choice.label}</span>
              </p>
            )}
            <p className="text-stone/60 text-xs mb-8 mt-2" style={{ fontFamily: 'var(--font-lato)' }}>
              1端末1票まで投票できます。
            </p>
            <GoldRule />
            <div className="mt-6">
              <Link href="/vote/result" className="btn-navy" style={{ justifyContent: 'center' }}>
                結果を見る
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ── Vote form ────────────────────────────── */
  return (
    <div className="min-h-screen marble-bg">

      {/* Header */}
      <header className="relative overflow-hidden navy-texture text-center py-12 px-6">
        <div className="absolute top-0 inset-x-0 h-[1px]" style={{ background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.5), transparent)' }} />
        <div className="absolute bottom-0 inset-x-0 flex justify-center pointer-events-none opacity-10">
          <ArchWindow width={220} height={200} opacity={1} />
        </div>
        <div className="relative z-10 flex items-center justify-between max-w-2xl mx-auto mb-6">
          <Link href="/" className="text-gold/50 hover:text-gold transition-colors text-sm tracking-widest" style={{ fontFamily: 'var(--font-lato)' }}>
            ← Gallery
          </Link>
          <Link href="/vote/result" className="text-gold/50 hover:text-gold transition-colors text-sm tracking-widest" style={{ fontFamily: 'var(--font-lato)' }}>
            結果を見る →
          </Link>
        </div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <p className="text-gold/60 text-[10px] tracking-[0.5em] uppercase mb-4" style={{ fontFamily: 'var(--font-lato)' }}>
            Dress Quiz
          </p>
          <h1 className="text-5xl text-cream-light font-light" style={{ fontFamily: 'var(--font-cormorant)', letterSpacing: '0.06em' }}>
            ドレス当てクイズ
          </h1>
          <p className="text-gold/50 mt-3 text-base italic" style={{ fontFamily: 'var(--font-cormorant)' }}>
            2着のドレスの着用順番を当ててください
          </p>
        </div>
        <div className="absolute bottom-0 inset-x-0 h-[1px]" style={{ background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.4), transparent)' }} />
      </header>

      <main className="max-w-2xl mx-auto px-5 py-12">
        <OrnamentalDivider>
          <span className="text-gold/70 text-[10px] tracking-[0.4em] uppercase px-3" style={{ fontFamily: 'var(--font-lato)' }}>
            順番を選んでください
          </span>
        </OrnamentalDivider>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {VOTE_CHOICES.map((choice) => {
            const isSelected = selected === choice.id
            return (
              <button
                key={choice.id}
                onClick={() => setSelected(choice.id)}
                disabled={status === 'submitting'}
                className="text-left transition-all duration-200 px-5 py-4"
                style={{
                  background: isSelected ? '#1C2E5A' : 'rgba(250,247,240,0.9)',
                  border: isSelected
                    ? '1.5px solid rgba(201,168,76,0.7)'
                    : '1px solid rgba(201,168,76,0.25)',
                  boxShadow: isSelected
                    ? '0 4px 20px rgba(28,46,90,0.2)'
                    : '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center mt-0.5"
                    style={{
                      borderColor: isSelected ? '#C9A84C' : 'rgba(201,168,76,0.4)',
                      background: isSelected ? '#C9A84C' : 'transparent',
                    }}
                  >
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full" style={{ background: '#1C2E5A' }} />
                    )}
                  </span>
                  <div>
                    <span
                      className="text-[10px] tracking-[0.3em] uppercase block mb-1"
                      style={{
                        fontFamily: 'var(--font-lato)',
                        color: isSelected ? 'rgba(201,168,76,0.6)' : 'rgba(140,125,110,0.7)',
                      }}
                    >
                      No. {choice.id}
                    </span>
                    <span
                      className="text-base leading-snug"
                      style={{
                        fontFamily: 'var(--font-cormorant)',
                        color: isSelected ? '#C9A84C' : '#1C2E5A',
                        fontSize: '1.1rem',
                      }}
                    >
                      {choice.label}
                    </span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {status === 'error' && (
          <p
            className="mt-6 text-xs tracking-wide text-center py-3 px-4"
            style={{
              color: '#B8623F',
              border: '1px solid rgba(184,98,63,0.3)',
              background: 'rgba(184,98,63,0.05)',
              fontFamily: 'var(--font-lato)',
            }}
          >
            {errorMsg}
          </p>
        )}

        <div className="mt-8">
          <button
            onClick={handleSubmit}
            disabled={!selected || status === 'submitting'}
            className="btn-terracotta w-full"
            style={{ justifyContent: 'center' }}
          >
            {status === 'submitting' ? '送信中...' : selected ? '投票する' : '選択肢を選んでください'}
          </button>
        </div>

        <p
          className="text-center text-stone/40 text-[10px] tracking-widest mt-4"
          style={{ fontFamily: 'var(--font-lato)' }}
        >
          ※ 1端末につき1票のみ投票できます
        </p>
      </main>
    </div>
  )
}
