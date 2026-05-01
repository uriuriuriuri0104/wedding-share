'use client'

import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { GoldRule, FloralOrnament, ArchWindow, OrnamentalDivider } from '@/components/Ornaments'

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [uploaderName, setUploaderName] = useState('')
  const [message, setMessage] = useState('')
  const [uploading, setUploading] = useState(false)
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback((newFiles: File[]) => {
    const imgs = newFiles.filter((f) => f.type.startsWith('image/'))
    setFiles((p) => [...p, ...imgs])
    imgs.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (e) => setPreviews((p) => [...p, e.target?.result as string])
      reader.readAsDataURL(file)
    })
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files))
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    addFiles(Array.from(e.dataTransfer.files))
  }

  const removeFile = (i: number) => {
    setFiles((p) => p.filter((_, j) => j !== i))
    setPreviews((p) => p.filter((_, j) => j !== i))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (files.length === 0) return
    setUploading(true)
    setResult(null)

    const fd = new FormData()
    files.forEach((f) => fd.append('photos', f))
    fd.append('uploaderName', uploaderName || 'ゲスト')
    fd.append('message', message)

    try {
      const res = await fetch('/api/photos/upload', { method: 'POST', body: fd })
      const data = await res.json()
      setResult(res.ok ? { success: true } : { error: data.error })
      if (res.ok) { setFiles([]); setPreviews([]); setMessage('') }
    } catch {
      setResult({ error: 'ネットワークエラーが発生しました' })
    } finally {
      setUploading(false)
    }
  }

  /* ── Success screen ───────────────────────── */
  if (result?.success) {
    return (
      <div className="min-h-screen marble-bg flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center">
          <div style={{ border: '1px solid rgba(201,168,76,0.4)', padding: '3rem 2rem', background: '#FAF7F0' }}>
            <FloralOrnament className="mx-auto mb-6" />
            <h2 className="text-4xl text-navy mb-2" style={{ fontFamily: 'var(--font-cormorant)' }}>
              Thank You
            </h2>
            <p className="text-stone text-sm mb-1" style={{ fontFamily: 'var(--font-lato)' }}>写真を受け付けました。</p>
            <p className="text-stone/60 text-xs mb-8" style={{ fontFamily: 'var(--font-lato)' }}>管理者の承認後、ギャラリーに掲載されます。</p>
            <GoldRule />
            <div className="flex gap-3 justify-center mt-6">
              <button onClick={() => setResult(null)} className="btn-navy">
                続けて投稿
              </button>
              <Link href="/" className="btn-gold-outline">
                ギャラリーへ
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  /* ── Upload form ──────────────────────────── */
  return (
    <div className="min-h-screen marble-bg">

      {/* Header */}
      <header className="relative overflow-hidden navy-texture text-center py-14 px-6">
        <div className="absolute top-0 inset-x-0 h-[1px]" style={{ background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.5), transparent)' }} />
        <div className="absolute bottom-0 inset-x-0 flex justify-center pointer-events-none opacity-10">
          <ArchWindow width={220} height={200} opacity={1} />
        </div>

        <div className="relative z-10 flex items-center justify-between max-w-xl mx-auto mb-6">
          <Link href="/" className="text-gold/50 hover:text-gold transition-colors text-sm tracking-widest" style={{ fontFamily: 'var(--font-lato)' }}>
            ← Gallery
          </Link>
        </div>

        <div className="relative z-10 max-w-xl mx-auto">
          <p className="text-gold/60 text-[10px] tracking-[0.5em] uppercase mb-4" style={{ fontFamily: 'var(--font-lato)' }}>
            Photo Sharing
          </p>
          <h1 className="text-5xl text-cream-light font-light" style={{ fontFamily: 'var(--font-cormorant)', letterSpacing: '0.06em' }}>
            Share a Memory
          </h1>
          <p className="text-gold/50 mt-3 text-base italic" style={{ fontFamily: 'var(--font-cormorant)' }}>
            大切な瞬間を皆さんと共有しましょう
          </p>
        </div>
        <div className="absolute bottom-0 inset-x-0 h-[1px]" style={{ background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.4), transparent)' }} />
      </header>

      <main className="max-w-xl mx-auto px-5 py-14">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Drop zone */}
          <div>
            <OrnamentalDivider>
              <span className="text-gold/70 text-[10px] tracking-[0.4em] uppercase px-3" style={{ fontFamily: 'var(--font-lato)' }}>
                Select Photos
              </span>
            </OrnamentalDivider>

            <div
              className="mt-5 cursor-pointer transition-colors duration-300 text-center py-12 px-6"
              style={{
                border: dragOver
                  ? '1.5px dashed rgba(201,168,76,0.8)'
                  : '1.5px dashed rgba(201,168,76,0.35)',
                background: dragOver ? 'rgba(201,168,76,0.06)' : 'rgba(250,247,240,0.7)',
              }}
              onClick={() => inputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFileChange}
              />
              <p className="text-stone text-base mb-1" style={{ fontFamily: 'var(--font-cormorant)', fontSize: '1.2rem' }}>
                タップして写真を選択
              </p>
              <p className="text-stone/50 text-xs tracking-wider uppercase mt-1" style={{ fontFamily: 'var(--font-lato)' }}>
                or drag &amp; drop · max 20MB · multiple OK
              </p>
            </div>
          </div>

          {/* Previews */}
          {previews.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {previews.map((src, i) => (
                <div key={i} className="relative aspect-square">
                  <img src={src} alt="" className="w-full h-full object-cover" style={{ border: '1px solid rgba(201,168,76,0.3)' }} />
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center text-[10px] text-cream-light transition-colors"
                    style={{ background: '#1C2E5A', border: '1px solid rgba(201,168,76,0.3)' }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Name & message */}
          <div>
            <OrnamentalDivider>
              <span className="text-gold/70 text-[10px] tracking-[0.4em] uppercase px-3" style={{ fontFamily: 'var(--font-lato)' }}>
                Your Message
              </span>
            </OrnamentalDivider>

            <div className="mt-5 space-y-4" style={{ background: 'rgba(250,247,240,0.7)', border: '1px solid rgba(201,168,76,0.25)', padding: '1.5rem' }}>
              <div>
                <label className="block text-[10px] text-stone/70 tracking-[0.35em] uppercase mb-2" style={{ fontFamily: 'var(--font-lato)' }}>
                  お名前（任意）
                </label>
                <input
                  type="text"
                  value={uploaderName}
                  onChange={(e) => setUploaderName(e.target.value)}
                  placeholder="例：田中 太郎"
                  maxLength={50}
                  className="field-input"
                />
              </div>
              <div>
                <label className="block text-[10px] text-stone/70 tracking-[0.35em] uppercase mb-2" style={{ fontFamily: 'var(--font-lato)' }}>
                  メッセージ（任意）
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="お二人へのメッセージや写真についてなど..."
                  maxLength={200}
                  rows={3}
                  className="field-input resize-none"
                />
              </div>
            </div>
          </div>

          {result?.error && (
            <p className="text-terracotta text-xs tracking-wide text-center py-3 px-4"
              style={{ border: '1px solid rgba(184,98,63,0.3)', background: 'rgba(184,98,63,0.05)', fontFamily: 'var(--font-lato)' }}>
              {result.error}
            </p>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={files.length === 0 || uploading}
              className="btn-terracotta w-full"
            >
              {uploading
                ? '送信中...'
                : files.length > 0
                ? `${files.length}枚の写真を投稿する`
                : '写真を選択してください'}
            </button>
          </div>

        </form>
      </main>
    </div>
  )
}
