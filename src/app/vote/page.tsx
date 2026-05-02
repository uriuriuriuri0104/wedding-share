'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { GoldRule, FloralOrnament, ArchWindow, OrnamentalDivider } from '@/components/Ornaments'
import { VOTE_CHOICES } from '@/lib/vote-choices'

export default function VotePage() {
  const router = useRouter()
  const [selected, setSelected] = useState<number | null>(null)
  const [name, setName] = useState('')
  const [status, setStatus] = useState<'loading' | 'ready' | 'voted' | 'submitting' | 'error'>('loading')
  const [alreadyChoiceId, setAlreadyChoiceId] = useState<number | null>(null)
  const [alreadyName, setAlreadyName] = useState('')
  const [isChanging, setIsChanging] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    fetch('/api/vote')
      .then((r) => r.json())
      .then((data) => {
        if (data.voted) {
          setAlreadyChoiceId(data.choiceId)
          setAlreadyName(data.voterName || '')
          setStatus('voted')
        } else {
          setStatus('ready')
        }
      })
      .catch(() => setStatus('ready'))
  }, [])

  const handleSubmit = async () => {
    if (!selected || !name.trim()) return
    setStatus('submitting')

    if (isChanging) {
      const res = await fetch('/api/vote', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ choiceId: selected }),
      })
      if (res.ok) {
        router.push('/vote/result')
      } else {
        const data = await res.json()
        setErrorMsg(data.error || 'エラーが発生しました')
        setStatus('error')
      }
    } else {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ choiceId: selected, voterName: name.trim() }),
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
  }

  const handleChangeVote = () => {
    setSelected(alreadyChoiceId)
    setName(alreadyName)
    setIsChanging(true)
    setStatus('ready')
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
            {alreadyName && (
              <p className="text-stone text-sm mt-4" style={{ fontFamily: 'var(--font-lato)' }}>
                {alreadyName} さんの回答
              </p>
            )}
            {choice && (
              <p className="text-stone text-sm mb-1 mt-2" style={{ fontFamily: 'var(--font-lato)' }}>
                <span className="text-navy font-medium" style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.1rem' }}>
                  {choice.label}
                </span>
              </p>
            )}
            <p className="text-stone/50 text-xs mt-3" style={{ fontFamily: 'var(--font-lato)' }}>
              投票を変更することもできます。
            </p>
            <GoldRule />
            <div className="mt-6 space-y-3">
              <button
                onClick={handleChangeVote}
                className="w-full py-3 text-xs tracking-widest transition-colors"
                style={{
                  border: '1px solid rgba(201,168,76,0.4)',
                  color: '#8C7D6E',
                  background: 'transparent',
                  fontFamily: 'var(--font-lato)',
                  cursor: 'pointer',
                }}
                onMouseOver={(e) => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.7)'; e.currentTarget.style.color = '#6B5E4E' }}
                onMouseOut={(e) => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.4)'; e.currentTarget.style.color = '#8C7D6E' }}
              >
                投票を変更する
              </button>
              <Link href="/vote/result" className="btn-navy block" style={{ justifyContent: 'center' }}>
                結果を見る
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const canSubmit = !!selected && name.trim().length > 0 && status !== 'submitting'

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
            オリジナルカラードレス当てクイズ
          </h1>
          <p className="text-gold/50 mt-3 text-base italic" style={{ fontFamily: 'var(--font-cormorant)' }}>
            {isChanging ? '投票を変更します' : '新婦は2着のカラードレスを着用します。その着順と種類を当ててください。'}
          </p>
        </div>
        <div className="absolute bottom-0 inset-x-0 h-[1px]" style={{ background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.4), transparent)' }} />
      </header>

      <main className="max-w-2xl mx-auto px-5 py-10">

        {/* Name input */}
        <div className="mb-8">
          <OrnamentalDivider>
            <span className="text-gold/70 text-[10px] tracking-[0.4em] uppercase px-3" style={{ fontFamily: 'var(--font-lato)' }}>
              お名前
            </span>
          </OrnamentalDivider>
          <div className="mt-5">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例：田中 花子"
              disabled={isChanging || status === 'submitting'}
              className="w-full px-4 py-3 text-navy text-base outline-none transition-all"
              style={{
                fontFamily: 'var(--font-cormorant)',
                fontSize: '1.1rem',
                background: 'rgba(250,247,240,0.9)',
                border: '1px solid rgba(201,168,76,0.35)',
                borderBottom: '1.5px solid rgba(201,168,76,0.6)',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.7)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.35)'; e.currentTarget.style.borderBottomColor = 'rgba(201,168,76,0.6)' }}
            />
            {isChanging && (
              <p className="text-stone/50 text-[10px] tracking-wider mt-2" style={{ fontFamily: 'var(--font-lato)' }}>
                投票変更時はお名前は変更できません
              </p>
            )}
          </div>
        </div>

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
            disabled={!canSubmit}
            className="btn-terracotta w-full"
            style={{ justifyContent: 'center' }}
          >
            {status === 'submitting'
              ? '送信中...'
              : !name.trim()
              ? 'お名前を入力してください'
              : !selected
              ? '選択肢を選んでください'
              : isChanging
              ? '投票を変更する'
              : '投票する'}
          </button>
        </div>

        {isChanging && (
          <div className="mt-4 text-center">
            <button
              onClick={() => { setIsChanging(false); setStatus('voted') }}
              className="text-stone/40 text-[10px] tracking-widest hover:text-stone/60 transition-colors"
              style={{ fontFamily: 'var(--font-lato)' }}
            >
              キャンセル
            </button>
          </div>
        )}

        <p
          className="text-center text-stone/40 text-[10px] tracking-widest mt-4"
          style={{ fontFamily: 'var(--font-lato)' }}
        >
          ※ 1端末につき1票のみ投票できます（変更可）
        </p>
      </main>
    </div>
  )
}
