'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { GoldRule, FloralOrnament, ArchWindow, OrnamentalDivider } from '@/components/Ornaments'
import { VOTE_CHOICES, PRINCESS_NAMES } from '@/lib/vote-choices'

function PrincessImage({ princess, size = 100 }: { princess: string; size?: number }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        style={{
          position: 'relative',
          width: size,
          height: size,
          borderRadius: 6,
          background: '#fff',
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        <Image
          src={`/${princess}.png`}
          alt={PRINCESS_NAMES[princess]}
          fill
          className="object-contain"
          sizes={`${size}px`}
        />
      </div>
      <span
        className="text-[11px] tracking-[0.12em]"
        style={{ fontFamily: 'var(--font-lato)', color: 'inherit' }}
      >
        {PRINCESS_NAMES[princess]}
      </span>
    </div>
  )
}

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
    fetch('/api/pageview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ page: '/vote' }),
    }).catch(() => {})
  }, [])

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
              <div
                className="flex items-center justify-center gap-4 mt-6 mb-2"
                style={{ color: '#8C7D6E' }}
              >
                <PrincessImage princess={choice.first} size={80} />
                <span className="text-2xl text-gold/50 pb-6" style={{ fontFamily: 'var(--font-cormorant)' }}>→</span>
                <PrincessImage princess={choice.second} size={80} />
              </div>
            )}
            <p className="text-stone/50 text-xs mt-4" style={{ fontFamily: 'var(--font-lato)' }}>
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

      {/* ── Header ─────────────────────────────── */}
      <header className="relative overflow-hidden navy-texture text-center py-10 px-6">
        <div className="absolute top-0 inset-x-0 h-[1px]" style={{ background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.5), transparent)' }} />
        <div className="absolute bottom-0 inset-x-0 flex justify-center pointer-events-none opacity-10">
          <ArchWindow width={220} height={200} opacity={1} />
        </div>

        <div className="relative z-10 flex items-center justify-end max-w-xl mx-auto mb-5">
          <Link
            href="/vote/result"
            className="text-gold/50 hover:text-gold transition-colors text-xs tracking-widest uppercase"
            style={{ fontFamily: 'var(--font-lato)' }}
          >
            結果を見る →
          </Link>
        </div>

        <div className="relative z-10 max-w-xl mx-auto">
          <p className="text-gold/60 text-[10px] tracking-[0.5em] uppercase mb-3" style={{ fontFamily: 'var(--font-lato)' }}>
            Dress Quiz
          </p>
          <h1
            className="text-4xl sm:text-5xl text-cream-light font-light"
            style={{ fontFamily: 'var(--font-cormorant)', letterSpacing: '0.06em' }}
          >
            ドレス当てクイズ
          </h1>
          <p className="text-gold/50 mt-3 text-sm italic" style={{ fontFamily: 'var(--font-cormorant)' }}>
            {isChanging
              ? '投票を変更します'
              : '新婦は2着のカラードレスを着用します。その着順と種類を当ててください。'}
          </p>
        </div>

        <div className="absolute bottom-0 inset-x-0 h-[1px]" style={{ background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.4), transparent)' }} />
      </header>

      <main className="max-w-xl mx-auto px-4 py-10">

        {/* ── Name input ─────────────────────────── */}
        <div className="mb-10">
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
              className="w-full px-4 py-3 text-navy outline-none transition-all"
              style={{
                fontFamily: 'var(--font-cormorant)',
                fontSize: '1.15rem',
                background: 'rgba(250,247,240,0.9)',
                border: '1px solid rgba(201,168,76,0.3)',
                borderBottom: '2px solid rgba(201,168,76,0.55)',
              }}
              onFocus={(e) => { e.currentTarget.style.borderBottomColor = 'rgba(201,168,76,0.85)' }}
              onBlur={(e) => { e.currentTarget.style.borderBottomColor = 'rgba(201,168,76,0.55)' }}
            />
            {isChanging && (
              <p className="text-stone/50 text-[10px] tracking-wider mt-2" style={{ fontFamily: 'var(--font-lato)' }}>
                投票変更時はお名前は変更できません
              </p>
            )}
          </div>
        </div>

        {/* ── Choice label ───────────────────────── */}
        <OrnamentalDivider>
          <span className="text-gold/70 text-[10px] tracking-[0.4em] uppercase px-3" style={{ fontFamily: 'var(--font-lato)' }}>
            着順を選んでください
          </span>
        </OrnamentalDivider>

        {/* ── Choice list ────────────────────────── */}
        <div className="mt-6 flex flex-col gap-3">
          {VOTE_CHOICES.map((choice) => {
            const isSelected = selected === choice.id
            return (
              <button
                key={choice.id}
                onClick={() => setSelected(choice.id)}
                disabled={status === 'submitting'}
                className="w-full text-left transition-all duration-200"
                style={{
                  background: isSelected ? '#1C2E5A' : '#FAF7F0',
                  border: isSelected
                    ? '2px solid rgba(201,168,76,0.65)'
                    : '1px solid rgba(201,168,76,0.22)',
                  boxShadow: isSelected
                    ? '0 6px 24px rgba(28,46,90,0.18)'
                    : '0 1px 6px rgba(0,0,0,0.05)',
                  padding: '1rem 1.25rem',
                }}
              >
                {/* Top row: No. + selected badge */}
                <div className="flex items-center justify-between mb-4">
                  <span
                    className="text-[9px] tracking-[0.35em] uppercase"
                    style={{
                      fontFamily: 'var(--font-lato)',
                      color: isSelected ? 'rgba(201,168,76,0.65)' : 'rgba(140,125,110,0.6)',
                    }}
                  >
                    No. {choice.id}
                  </span>
                  {isSelected && (
                    <span
                      className="text-[9px] tracking-[0.3em] uppercase"
                      style={{ fontFamily: 'var(--font-lato)', color: 'rgba(201,168,76,0.8)' }}
                    >
                      ✦ 選択中
                    </span>
                  )}
                </div>

                {/* Princess images row */}
                <div className="flex items-center justify-center gap-4">

                  {/* 1着目 */}
                  <div className="flex flex-col items-center gap-2 flex-1">
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: 150,
                        borderRadius: 6,
                        background: '#fff',
                        overflow: 'hidden',
                        border: isSelected
                          ? '1px solid rgba(201,168,76,0.5)'
                          : '1px solid rgba(201,168,76,0.2)',
                      }}
                    >
                      <Image
                        src={`/${choice.first}.png`}
                        alt={PRINCESS_NAMES[choice.first]}
                        fill
                        className="object-contain"
                        sizes="(max-width: 640px) 40vw, 200px"
                      />
                    </div>
                    <span
                      className="text-[11px] tracking-[0.15em]"
                      style={{
                        fontFamily: 'var(--font-lato)',
                        color: isSelected ? 'rgba(201,168,76,0.8)' : '#8C7D6E',
                      }}
                    >
                      {PRINCESS_NAMES[choice.first]}
                    </span>
                  </div>

                  {/* Arrow */}
                  <div className="flex-shrink-0 pb-7">
                    <span
                      className="text-2xl"
                      style={{ color: isSelected ? 'rgba(201,168,76,0.6)' : 'rgba(201,168,76,0.35)' }}
                    >
                      →
                    </span>
                  </div>

                  {/* 2着目 */}
                  <div className="flex flex-col items-center gap-2 flex-1">
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: 150,
                        borderRadius: 6,
                        background: '#fff',
                        overflow: 'hidden',
                        border: isSelected
                          ? '1px solid rgba(201,168,76,0.5)'
                          : '1px solid rgba(201,168,76,0.2)',
                      }}
                    >
                      <Image
                        src={`/${choice.second}.png`}
                        alt={PRINCESS_NAMES[choice.second]}
                        fill
                        className="object-contain"
                        sizes="(max-width: 640px) 40vw, 200px"
                      />
                    </div>
                    <span
                      className="text-[11px] tracking-[0.15em]"
                      style={{
                        fontFamily: 'var(--font-lato)',
                        color: isSelected ? 'rgba(201,168,76,0.8)' : '#8C7D6E',
                      }}
                    >
                      {PRINCESS_NAMES[choice.second]}
                    </span>
                  </div>

                </div>
              </button>
            )
          })}
        </div>

        {/* ── Error ──────────────────────────────── */}
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

        {/* ── Submit ─────────────────────────────── */}
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
          className="text-center text-stone/35 text-[10px] tracking-widest mt-5 mb-10"
          style={{ fontFamily: 'var(--font-lato)' }}
        >
          ※ 1端末につき1票のみ投票できます（変更可）
        </p>
      </main>
    </div>
  )
}
