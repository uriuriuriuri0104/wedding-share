'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { ArchWindow, FloralOrnament, GoldRule, OrnamentalDivider, CornerOrnament } from '@/components/Ornaments'

interface Photo {
  id: string
  filename: string
  original_name: string
  uploader_name: string
  message: string
  created_at: string
}

export default function GalleryPage() {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Photo | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)

  const fetchPhotos = useCallback(async () => {
    const res = await fetch('/api/photos')
    if (res.ok) setPhotos(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchPhotos()
    const id = setInterval(fetchPhotos, 30_000)
    return () => clearInterval(id)
  }, [fetchPhotos])

  const openPhoto = (photo: Photo, index: number) => {
    setSelected(photo)
    setSelectedIndex(index)
  }

  const prevPhoto = () => {
    const i = (selectedIndex - 1 + photos.length) % photos.length
    setSelected(photos[i])
    setSelectedIndex(i)
  }

  const nextPhoto = () => {
    const i = (selectedIndex + 1) % photos.length
    setSelected(photos[i])
    setSelectedIndex(i)
  }

  useEffect(() => {
    if (!selected) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelected(null)
      if (e.key === 'ArrowLeft') prevPhoto()
      if (e.key === 'ArrowRight') nextPhoto()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selected, selectedIndex]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="min-h-screen marble-bg">

      {/* ═══ HERO HEADER ═══════════════════════════════ */}
      <header className="relative overflow-hidden navy-texture text-center">
        {/* Top border */}
        <div className="absolute top-0 inset-x-0 h-[1px]" style={{ background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.6), transparent)' }} />

        {/* Arch windows — decorative background */}
        <div className="absolute left-4 bottom-0 hidden sm:block">
          <ArchWindow width={140} height={220} opacity={0.1} />
        </div>
        <div className="absolute right-4 bottom-0 hidden sm:block">
          <ArchWindow width={140} height={220} opacity={0.1} />
        </div>
        <div className="absolute inset-x-0 -bottom-4 flex justify-center pointer-events-none">
          <ArchWindow width={320} height={400} opacity={0.07} />
        </div>

        {/* Navigation strip */}
        <div className="relative z-10 flex justify-end px-6 pt-4">
          <Link href="/admin/login" className="text-gold/40 hover:text-gold/70 text-xs tracking-widest uppercase transition-colors" style={{ fontFamily: 'var(--font-lato)' }}>
            Admin
          </Link>
        </div>

        {/* Main title block */}
        <div className="relative z-10 max-w-xl mx-auto px-6 pb-16 pt-8">
          <p className="text-gold/70 text-[10px] tracking-[0.6em] uppercase mb-6" style={{ fontFamily: 'var(--font-lato)' }}>
            Mediterranean Resort Wedding
          </p>

          <GoldRule />
          <div className="py-8">
            <h1
              className="text-6xl md:text-7xl text-cream-light font-light leading-tight"
              style={{ fontFamily: 'var(--font-cormorant)', letterSpacing: '0.08em' }}
            >
              Wedding
            </h1>
            <h1
              className="text-6xl md:text-7xl text-cream-light font-light italic"
              style={{ fontFamily: 'var(--font-cormorant)', letterSpacing: '0.06em' }}
            >
              Photos
            </h1>
            <p className="text-gold/60 mt-4 text-lg italic" style={{ fontFamily: 'var(--font-cormorant)' }}>
              Sharing beautiful memories together
            </p>
          </div>
          <GoldRule />

          <div className="mt-8 flex justify-center">
            <FloralOrnament />
          </div>

          <div className="mt-8">
            <Link href="/upload" className="btn-gold-outline">
              Share Your Photos
            </Link>
          </div>
        </div>

        {/* Bottom border */}
        <div className="absolute bottom-0 inset-x-0 h-[1px]" style={{ background: 'linear-gradient(to right, transparent, rgba(201,168,76,0.5), transparent)' }} />
      </header>

      {/* ═══ GALLERY ════════════════════════════════════ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 py-20">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-5">
            <div className="spinner" />
            <p className="text-stone text-xs tracking-[0.4em] uppercase" style={{ fontFamily: 'var(--font-lato)' }}>Loading</p>
          </div>

        ) : photos.length === 0 ? (
          <div className="text-center py-32">
            <p className="text-3xl text-stone/70 mb-2" style={{ fontFamily: 'var(--font-cormorant)' }}>No photographs yet</p>
            <p className="text-stone/50 text-xs tracking-[0.35em] uppercase mb-10" style={{ fontFamily: 'var(--font-lato)' }}>Be the first to share a memory</p>
            <Link href="/upload" className="btn-navy">Upload Photos</Link>
          </div>

        ) : (
          <>
            {/* Section label */}
            <div className="flex flex-col items-center gap-4 mb-16">
              <OrnamentalDivider />
              <p className="text-stone/60 text-[11px] tracking-[0.45em] uppercase" style={{ fontFamily: 'var(--font-lato)' }}>
                {photos.length} photograph{photos.length !== 1 ? 's' : ''}
              </p>
              <OrnamentalDivider />
            </div>

            {/* Masonry grid */}
            <div className="columns-2 sm:columns-3 lg:columns-4 gap-5 space-y-5">
              {photos.map((photo, i) => (
                <div
                  key={photo.id}
                  className="break-inside-avoid cursor-pointer group"
                  onClick={() => openPhoto(photo, i)}
                >
                  <div className="photo-frame relative overflow-hidden">
                    {/* Inner inset frame on hover */}
                    <div className="absolute inset-[6px] z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ border: '1px solid rgba(201,168,76,0.45)' }} />

                    <img
                      src={`/uploads/${photo.filename}`}
                      alt={photo.original_name}
                      className="w-full h-auto block transition-transform duration-700 group-hover:scale-[1.04]"
                      loading="lazy"
                    />

                    {/* Caption overlay */}
                    <div
                      className="absolute inset-0 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      style={{ background: 'linear-gradient(to top, rgba(18,32,62,0.88) 0%, rgba(18,32,62,0.3) 50%, transparent 100%)' }}
                    >
                      <div className="p-4">
                        <p className="text-cream-light text-base" style={{ fontFamily: 'var(--font-cormorant)' }}>
                          {photo.uploader_name}
                        </p>
                        {photo.message && (
                          <p className="text-gold/70 text-xs mt-0.5 line-clamp-2" style={{ fontFamily: 'var(--font-lato)' }}>
                            {photo.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      {/* ═══ FOOTER ════════════════════════════════════ */}
      <footer className="py-12 text-center border-t border-gold/15">
        <FloralOrnament className="mx-auto mb-5" />
        <p className="text-stone/50 text-[10px] tracking-[0.5em] uppercase" style={{ fontFamily: 'var(--font-lato)' }}>
          With Love &amp; Joy
        </p>
      </footer>

      {/* ═══ LIGHTBOX ═══════════════════════════════════ */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 lightbox-enter"
          style={{ backgroundColor: 'rgba(10,16,36,0.97)' }}
          onClick={() => setSelected(null)}
        >
          {/* Prev */}
          <button
            onClick={(e) => { e.stopPropagation(); prevPhoto() }}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gold/60 hover:text-gold text-2xl transition-colors z-10 px-2"
          >
            ‹
          </button>

          <div
            className="relative max-w-4xl w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <div className="absolute -top-10 right-0 flex items-center gap-6">
              <span className="text-gold/40 text-xs tracking-widest" style={{ fontFamily: 'var(--font-lato)' }}>
                {selectedIndex + 1} / {photos.length}
              </span>
              <button
                onClick={() => setSelected(null)}
                className="text-gold/50 hover:text-gold text-xs tracking-widest uppercase transition-colors"
                style={{ fontFamily: 'var(--font-lato)' }}
              >
                Close ✕
              </button>
            </div>

            {/* Frame */}
            <div style={{ border: '1px solid rgba(201,168,76,0.35)', boxShadow: '0 0 80px rgba(0,0,0,0.6)' }}>
              {/* Corner ornaments */}
              <CornerOrnament className="absolute top-0 left-0" />
              <CornerOrnament className="absolute top-0 right-0 scale-x-[-1]" />
              <CornerOrnament className="absolute bottom-0 left-0 scale-y-[-1]" />
              <CornerOrnament className="absolute bottom-0 right-0 scale-[-1]" />

              <img
                src={`/uploads/${selected.filename}`}
                alt={selected.original_name}
                className="w-full max-h-[68vh] object-contain block"
                style={{ backgroundColor: '#080f1e' }}
              />

              {/* Caption bar */}
              <div
                className="px-6 py-4"
                style={{
                  backgroundColor: '#12203E',
                  borderTop: '1px solid rgba(201,168,76,0.2)',
                }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-cream-light text-xl" style={{ fontFamily: 'var(--font-cormorant)' }}>
                      {selected.uploader_name}
                    </p>
                    {selected.message && (
                      <p className="text-gold/70 text-sm mt-1 italic" style={{ fontFamily: 'var(--font-cormorant)' }}>
                        "{selected.message}"
                      </p>
                    )}
                  </div>
                  <p className="text-white/25 text-xs shrink-0 mt-1" style={{ fontFamily: 'var(--font-lato)' }}>
                    {new Date(selected.created_at).toLocaleDateString('ja-JP')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Next */}
          <button
            onClick={(e) => { e.stopPropagation(); nextPhoto() }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gold/60 hover:text-gold text-2xl transition-colors z-10 px-2"
          >
            ›
          </button>
        </div>
      )}
    </div>
  )
}
