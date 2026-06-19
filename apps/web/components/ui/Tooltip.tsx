'use client'
import { useEffect, useRef, useState } from 'react'

export function Tooltip({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onOutside(e: MouseEvent | TouchEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    document.addEventListener('touchstart', onOutside)
    return () => {
      document.removeEventListener('mousedown', onOutside)
      document.removeEventListener('touchstart', onOutside)
    }
  }, [open])

  return (
    <div
      ref={ref}
      className="relative inline-flex items-center group"
      onMouseLeave={() => setOpen(false)}
    >
      {/* Cercle fin bordeaux/35 avec i Cormorant italic */}
      {/* Padding invisible pour agrandir la zone de tap mobile (min 44px recommandé) */}
      <button
        type="button"
        onClick={() => setOpen(prev => !prev)}
        aria-label="Plus d'informations"
        className="inline-flex items-center justify-center cursor-pointer"
        style={{ padding: 10, margin: -10, flexShrink: 0, background: 'transparent' }}
      >
        <span
          className="inline-flex items-center justify-center border border-bordeaux/35 rounded-full text-bordeaux/55"
          style={{
            width: 13,
            height: 13,
            fontFamily: 'var(--font-cormorant-var, Georgia, serif)',
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: 9,
            lineHeight: 1,
            pointerEvents: 'none',
          }}
        >
          i
        </span>
      </button>

      {/* Bulle parchemin — fond crème, bordure bordeaux/20, Cormorant italic 300 */}
      <div
        role="tooltip"
        className={[
          'absolute bottom-full left-1/2 -translate-x-1/2 mb-3',
          'w-40 rounded-xl px-4 py-3.5 z-10',
          'bg-creme border border-bordeaux/20',
          'pointer-events-none transition-opacity duration-200',
          open ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        ].join(' ')}
        style={{ boxShadow: '0 4px 16px rgba(78,26,50,0.08)' }}
      >
        <span
          className="font-cormorant text-bordeaux"
          style={{
            fontFamily: 'var(--font-cormorant-var, Georgia, serif)',
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: 13,
            lineHeight: 1.6,
            letterSpacing: '0.01em',
            display: 'block',
          }}
        >
          {text}
        </span>

        {/* Flèche pointant vers le bas (vers l'icône) */}
        <div
          className="absolute left-1/2 bg-creme"
          style={{
            bottom: -4,
            width: 8,
            height: 8,
            transform: 'translateX(-50%) rotate(45deg)',
            borderRight: '1px solid rgba(78,26,50,0.2)',
            borderBottom: '1px solid rgba(78,26,50,0.2)',
          }}
        />
      </div>
    </div>
  )
}
