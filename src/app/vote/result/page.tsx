'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { GoldRule, FloralOrnament, ArchWindow, OrnamentalDivider } from '@/components/Ornaments'
import { VOTE_CHOICES, CORRECT_CHOICE_ID } from '@/lib/vote-choices'

interface Results {
  results: Record<number, number>
  total: number
  answerRevealed: boolean
}

export default function VoteResultPage() {
  const [data, setData] = useState<Results | null>(null)
  const [votedChoiceId, setVotedChoiceId] = useState<number | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchResults = useCallback(async () => {
    const res = await fetch('/api/vote/results')
    if (res.ok) {
      setData(await res.json())
      setLastUpdated(new Date())
    }
  }, [])

  useEffect(() => {
    fetch('/api/vote').then((r) => r.json()).then((d) => {
      if (d.voted) setVotedChoiceId(d.choiceId)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    fetchResults()
    const id = setInterval(fetchResults, 3000)
    return () => clearInterval(id)
  }, [fetchResults])

  const maxVotes = data ? Math.max(...Object.values(data.results), 1) : 1

  return (
    <div className="min-h-screen marble-bg">

      {/* Header */}
      <header className="relative overflow-hidden navy-texture text-center py-12 px-6">
        <div className="absolute top-0 inset-x-0 h-[1px]" style={{ background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.5), transparent)' }} />
        <div className="absolute bottom-0 inset-x-0 flex justify-center pointer-events-none opacity-10">
          <ArchWindow width={220} height={200} opacity={1} />
        </div>
        <div className="relative z-10 flex items-center justify-between max-w-2xl mx-auto mb-6">
          <Link href="/vote" className="text-gold/50 hover:text-gold transition-colors text-sm tracking-widest" style={{ fontFamily: 'var(--font-lato)' }}>
            ← 投票に戻る
          </Link>
          <Link href="/" className="text-gold/50 hover:text-gold transition-colors text-sm tracking-widest" style={{ fontFamily: 'var(--font-lato)' }}>
            Gallery →
          </Link>
        </div>
        <div className="relative z-10 max-w-2xl mx-auto">
          <p className="text-gold/60 text-[10px] tracking-[0.5em] uppercase mb-4" style={{ fontFamily: 'var(--font-lato)' }}>
            Live Results
          </p>
          <h1 className="text-5xl text-cream-light font-light" style={{ fontFamily: 'var(--font-cormorant)', letterSpacing: '0.06em' }}>
            投票結果
          </h1>
          {data && (
            <p className="text-gold/50 mt-3 text-base italic" style={{ fontFamily: 'var(--font-cormorant)' }}>
              現在 {data.total} 票
            </p>
          )}
        </div>
        <div className="absolute bottom-0 inset-x-0 h-[1px]" style={{ background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.4), transparent)' }} />
      </header>

      <main className="max-w-2xl mx-auto px-5 py-12">

        {!data ? (
          <div className="flex items-center justify-center h-48">
            <div className="spinner" />
          </div>
        ) : (
          <>
            {/* Correct answer banner */}
            {data.answerRevealed && (
              <div
                className="mb-8 text-center py-5 px-6"
                style={{
                  background: 'linear-gradient(135deg, #1C2E5A 0%, #12203E 100%)',
                  border: '1.5px solid rgba(201,168,76,0.6)',
                  boxShadow: '0 4px 24px rgba(28,46,90,0.25)',
                }}
              >
                <FloralOrnament className="mx-auto mb-3" />
                <p className="text-gold/60 text-[10px] tracking-[0.5em] uppercase mb-2" style={{ fontFamily: 'var(--font-lato)' }}>
                  正解発表
                </p>
                <p className="text-gold text-2xl" style={{ fontFamily: 'var(--font-cormorant)', letterSpacing: '0.05em' }}>
                  {VOTE_CHOICES.find((c) => c.id === CORRECT_CHOICE_ID)?.label}
                </p>
              </div>
            )}

            <OrnamentalDivider>
              <span className="text-gold/70 text-[10px] tracking-[0.4em] uppercase px-3" style={{ fontFamily: 'var(--font-lato)' }}>
                投票結果
              </span>
            </OrnamentalDivider>

            <div className="mt-6 space-y-3">
              {VOTE_CHOICES.map((choice) => {
                const count = data.results[choice.id] ?? 0
                const pct = data.total > 0 ? Math.round((count / data.total) * 100) : 0
                const isCorrect = data.answerRevealed && choice.id === CORRECT_CHOICE_ID
                const isMyVote = choice.id === votedChoiceId

                return (
                  <div
                    key={choice.id}
                    className="px-4 py-3 transition-all duration-300"
                    style={{
                      background: isCorrect
                        ? 'rgba(201,168,76,0.08)'
                        : isMyVote
                        ? 'rgba(28,46,90,0.05)'
                        : 'rgba(250,247,240,0.8)',
                      border: isCorrect
                        ? '1.5px solid rgba(201,168,76,0.5)'
                        : isMyVote
                        ? '1px solid rgba(28,46,90,0.2)'
                        : '1px solid rgba(201,168,76,0.15)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        {isCorrect && (
                          <span className="text-gold text-xs">★</span>
                        )}
                        {isMyVote && !isCorrect && (
                          <span className="text-[10px] tracking-wider" style={{ color: '#1C2E5A', fontFamily: 'var(--font-lato)' }}>✓</span>
                        )}
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
                        style={{
                          fontFamily: 'var(--font-lato)',
                          color: isCorrect ? '#A88830' : '#8C7D6E',
                          letterSpacing: '0.05em',
                        }}
                      >
                        {count}票 ({pct}%)
                      </span>
                    </div>

                    {/* Bar */}
                    <div
                      className="h-1.5 w-full overflow-hidden"
                      style={{ background: 'rgba(201,168,76,0.12)' }}
                    >
                      <div
                        className="h-full transition-all duration-700"
                        style={{
                          width: `${maxVotes > 0 ? (count / maxVotes) * 100 : 0}%`,
                          background: isCorrect
                            ? 'linear-gradient(to right, #A88830, #DFC070)'
                            : isMyVote
                            ? 'linear-gradient(to right, #1C2E5A, #2E4878)'
                            : 'rgba(201,168,76,0.4)',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <GoldRule />

            {/* Footer info */}
            <div className="mt-5 text-center space-y-2">
              <p className="text-stone/40 text-[10px] tracking-widest" style={{ fontFamily: 'var(--font-lato)' }}>
                ★ 正解　✓ あなたの回答
              </p>
              {lastUpdated && (
                <p className="text-stone/30 text-[10px] tracking-wider" style={{ fontFamily: 'var(--font-lato)' }}>
                  3秒ごとに自動更新 · 最終更新: {lastUpdated.toLocaleTimeString('ja-JP')}
                </p>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
