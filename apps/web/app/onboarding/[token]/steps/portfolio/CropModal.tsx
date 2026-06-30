'use client'

import { useEffect, useRef, useState } from 'react'

interface CropModalProps {
  file:        File
  aspectRatio: '16:9' | '1:1'
  onConfirm:   (croppedFile: File) => void
  onCancel:    () => void
}

export default function CropModal({ file, aspectRatio, onConfirm, onCancel }: CropModalProps) {
  const OUT_W      = aspectRatio === '16:9' ? 1280 : 1080
  const OUT_H      = aspectRatio === '16:9' ? 720  : 1080
  const ratioLabel = aspectRatio === '16:9' ? '16 : 9' : '1 : 1'

  const [zoom, setZoom]             = useState(1)
  const [pan, setPan]               = useState({ x: 0, y: 0 })
  const [confirming, setConfirming] = useState(false)
  const [ready, setReady]           = useState(false)
  const [maxZoom, setMaxZoom]       = useState(3)
  const [isMobile, setIsMobile]     = useState(false)
  const [slideIn, setSlideIn]       = useState(false)
  // Dimensions naturelles de l'image — en state pour éviter les ref-reads pendant le render
  const [imgW, setImgW]             = useState(0)
  const [imgH, setImgH]             = useState(0)
  const [containScale, setContainScale] = useState(1)

  const canvasRef    = useRef<HTMLCanvasElement>(null)
  const imgRef       = useRef<HTMLImageElement | null>(null)
  const dragRef      = useRef<{ sx: number; sy: number; px: number; py: number } | null>(null)

  // ── Détection mobile + animation slide-up ──
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    // Déclenche la transition après le premier rendu
    requestAnimationFrame(() => setSlideIn(true))
  }, [])

  // ── Chargement image ──
  useEffect(() => {
    const url = URL.createObjectURL(file)
      const img = new window.Image()
      img.onload = () => {
        imgRef.current = img
        const cs   = Math.min(OUT_W / img.naturalWidth, OUT_H / img.naturalHeight)
        const cv   = Math.max(OUT_W / img.naturalWidth, OUT_H / img.naturalHeight)
        setImgW(img.naturalWidth)
        setImgH(img.naturalHeight)
        setContainScale(cs)
        setMaxZoom(Math.max((cv / cs) * 2, 3))
        setReady(true)
      }
    img.src = url
    return () => URL.revokeObjectURL(url)
  }, [file, OUT_W, OUT_H])

  // ── Dessin canvas ──
  useEffect(() => {
    const canvas = canvasRef.current
    const img    = imgRef.current
    if (!canvas || !img || !ready) return
    const ctx = canvas.getContext('2d')!
    const ts  = containScale * zoom
    const dw  = img.naturalWidth  * ts
    const dh  = img.naturalHeight * ts
    const dx  = (OUT_W - dw) / 2 + pan.x
    const dy  = (OUT_H - dh) / 2 + pan.y
    ctx.fillStyle = '#291A10'
    ctx.fillRect(0, 0, OUT_W, OUT_H)
    ctx.drawImage(img, dx, dy, dw, dh)
  }, [zoom, pan, ready, OUT_W, OUT_H, containScale])

  function clamp(px: number, py: number) {
    return {
      x: Math.max(-OUT_W * 0.9, Math.min(OUT_W * 0.9, px)),
      y: Math.max(-OUT_H * 0.9, Math.min(OUT_H * 0.9, py)),
    }
  }

  function coversCanvas(z: number, p: { x: number; y: number }, naturalWidth: number, naturalHeight: number, scale: number) {
    const ts = scale * z
    const dw = naturalWidth  * ts
    const dh = naturalHeight * ts
    const dx = (OUT_W - dw) / 2 + p.x
    const dy = (OUT_H - dh) / 2 + p.y
    return dx <= 0.5 && dy <= 0.5 && dx + dw >= OUT_W - 0.5 && dy + dh >= OUT_H - 0.5
  }

  function cssToCanvas() {
    const c = canvasRef.current
    return c ? OUT_W / c.getBoundingClientRect().width : 1
  }

  // ── Drag souris ──
  function onMouseDown(e: React.MouseEvent) {
    e.preventDefault()
    dragRef.current = { sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y }
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragRef.current) return
    const r = cssToCanvas()
    setPan(clamp(dragRef.current.px + (e.clientX - dragRef.current.sx) * r,
                 dragRef.current.py + (e.clientY - dragRef.current.sy) * r))
  }
  function onMouseUp() { dragRef.current = null }

  // ── Drag tactile ──
  function onTouchStart(e: React.TouchEvent) {
    if (e.touches.length !== 1) return
    const t = e.touches[0]
    dragRef.current = { sx: t.clientX, sy: t.clientY, px: pan.x, py: pan.y }
  }
  function onTouchMove(e: React.TouchEvent) {
    if (!dragRef.current || e.touches.length !== 1) return
    const t = e.touches[0]
    const r = cssToCanvas()
    setPan(clamp(dragRef.current.px + (t.clientX - dragRef.current.sx) * r,
                 dragRef.current.py + (t.clientY - dragRef.current.sy) * r))
  }
  function onTouchEnd() { dragRef.current = null }

  // ── Zoom ──
  function handleZoom(z: number) {
    const cz = Math.max(1, Math.min(maxZoom, z))
    setZoom(cz)
    setPan(prev => clamp(prev.x, prev.y))
  }

  // ── Confirmer ──
  async function handleConfirm() {
    const canvas = canvasRef.current
    if (!canvas || confirming) return
    setConfirming(true)
    try {
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(b => (b ? resolve(b) : reject(new Error('crop_failed'))), 'image/jpeg', 0.92)
      )
      onConfirm(new File([blob], file.name, { type: 'image/jpeg' }))
    } catch {
      setConfirming(false)
    }
  }

  const covers     = ready && imgW > 0 && imgH > 0 && coversCanvas(zoom, pan, imgW, imgH, containScale)
  const canConfirm = covers && !confirming

  // ── Valeurs responsive ──
  const hPad       = isMobile ? '0 14px' : '0 26px'
  const headerPad  = isMobile ? '16px 16px 14px' : '24px 26px 18px'
  const footerPad  = isMobile ? '14px 16px 20px' : '22px 26px 24px'
  const titleSize  = isMobile ? 22 : 27

  // ── Contenu partagé ──
  const content = (
    <>
      {/* ── Handle (mobile uniquement) ── */}
      {isMobile && (
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, paddingBottom: 2 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(78,26,50,0.18)' }} />
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ padding: headerPad, position: 'relative' }}>
        {!isMobile && (
          <button
            onClick={onCancel}
            aria-label="Fermer"
            style={{
              position: 'absolute', top: 20, right: 20,
              width: 30, height: 30, borderRadius: '50%',
              border: '1px solid rgba(78,26,50,0.16)',
              background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="#4E1A32" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
        <h2 style={{
          fontFamily: 'var(--font-cormorant-var)', fontWeight: 400, fontSize: titleSize,
          color: '#4E1A32', letterSpacing: '-0.01em', lineHeight: 1.1, margin: 0,
        }}>
          Cadrez votre{' '}
          <span style={{ fontStyle: 'italic', fontWeight: 300, color: '#9D4F1E' }}>photo.</span>
        </h2>
        <p style={{
          fontFamily: 'var(--font-manrope-var)', fontSize: 13, fontWeight: 400,
          color: 'rgba(41,26,16,0.52)', marginTop: 7, lineHeight: 1.5, maxWidth: '88%',
        }}>
          Déplacez et zoomez pour choisir ce que verront les couples.
        </p>
      </div>

      {/* ── Zone canvas ── */}
      <div style={{ padding: hPad }}>
        <div style={{ position: 'relative', width: '100%', borderRadius: 10, overflow: 'hidden', background: '#291A10' }}>
          <canvas
            ref={canvasRef}
            width={OUT_W}
            height={OUT_H}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            style={{ width: '100%', display: 'block', borderRadius: 10, cursor: 'grab', touchAction: 'none' }}
          />
          {/* Overlay grille + coins + label */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <div style={{ position: 'absolute', top: '33.3%',  left: 0,    right: 0,  height: 1, background: 'rgba(255,246,237,0.3)' }} />
            <div style={{ position: 'absolute', top: '66.6%',  left: 0,    right: 0,  height: 1, background: 'rgba(255,246,237,0.3)' }} />
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: '33.3%', width: 1, background: 'rgba(255,246,237,0.3)' }} />
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: '66.6%', width: 1, background: 'rgba(255,246,237,0.3)' }} />
            <div style={{ position: 'absolute', inset: 0, border: '1px solid rgba(255,246,237,0.6)', borderRadius: 10 }} />
            <span style={{ position: 'absolute', top: -1,   left: -1,  width: 16, height: 16, borderTop:    '2.5px solid #FFF6ED', borderLeft:  '2.5px solid #FFF6ED' }} />
            <span style={{ position: 'absolute', top: -1,   right: -1, width: 16, height: 16, borderTop:    '2.5px solid #FFF6ED', borderRight: '2.5px solid #FFF6ED' }} />
            <span style={{ position: 'absolute', bottom: -1, left: -1,  width: 16, height: 16, borderBottom: '2.5px solid #FFF6ED', borderLeft:  '2.5px solid #FFF6ED' }} />
            <span style={{ position: 'absolute', bottom: -1, right: -1, width: 16, height: 16, borderBottom: '2.5px solid #FFF6ED', borderRight: '2.5px solid #FFF6ED' }} />
            <span style={{
              position: 'absolute', top: 8, left: 10,
              fontFamily: 'var(--font-manrope-var)', fontSize: 9,
              fontWeight: 600, letterSpacing: '0.12em', color: 'rgba(255,246,237,0.85)',
            }}>
              {ratioLabel}
            </span>
          </div>
        </div>

        {/* Zoom */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 20 }}>
          <span style={{
            fontFamily: 'var(--font-manrope-var)', fontSize: 10,
            fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase',
            color: 'rgba(41,26,16,0.52)',
          }}>
            Zoom
          </span>
          <button onClick={() => handleZoom(+(zoom - 0.05).toFixed(3))} aria-label="Dézoomer"
            style={{ width: 30, height: 30, flexShrink: 0, borderRadius: '50%', border: '1px solid rgba(78,26,50,0.16)', background: '#FFF6ED', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M3 8h10" stroke="#9D4F1E" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
          <input type="range" min={1} max={maxZoom} step={0.01} value={zoom}
            onChange={e => handleZoom(Number(e.target.value))}
            style={{ flex: '1 1 0%', accentColor: '#9D4F1E' }} />
          <button onClick={() => handleZoom(+(zoom + 0.05).toFixed(3))} aria-label="Zoomer"
            style={{ width: 30, height: 30, flexShrink: 0, borderRadius: '50%', border: '1px solid rgba(78,26,50,0.16)', background: '#FFF6ED', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="#9D4F1E" strokeWidth="1.6" strokeLinecap="round" /></svg>
          </button>
        </div>

        {ready && !covers && (
          <p style={{ fontFamily: 'var(--font-manrope-var)', fontSize: 11, fontWeight: 500, color: '#9D4F1E', textAlign: 'center', marginTop: 10 }}>
            Zoomez et repositionnez pour remplir le cadre.
          </p>
        )}
      </div>

      {/* ── Footer ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, padding: footerPad, marginTop: 6 }}>
        <button onClick={onCancel}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '13px 18px', fontFamily: 'var(--font-manrope-var)', fontSize: 12, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9D4F1E' }}>
          Annuler
        </button>
        <button onClick={handleConfirm} disabled={!canConfirm}
          style={{ background: canConfirm ? '#9D4F1E' : 'rgba(157,79,30,0.35)', border: 'none', cursor: canConfirm ? 'pointer' : 'default', padding: '14px 24px', borderRadius: 11, fontFamily: 'var(--font-manrope-var)', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#FFF6ED', display: 'flex', alignItems: 'center', gap: 9, transition: 'background 0.2s' }}>
          {confirming ? (
            <svg className="animate-spin" width="14" height="14" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="11" stroke="rgba(255,246,237,0.3)" strokeWidth="2" />
              <path d="M14 3a11 11 0 0 1 11 11" stroke="#FFF6ED" strokeWidth="2" strokeLinecap="round" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M3 8l4 4 6-7" stroke="#FFF6ED" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
          Confirmer le cadrage
        </button>
      </div>
    </>
  )

  // ── Backdrop commun ──
  const backdrop = (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(41,26,16,0.72)' }}
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
    />
  )

  if (isMobile) {
    return (
      <>
        {backdrop}
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1001,
          background: '#FFF6ED',
          borderRadius: '20px 20px 0 0',
          boxShadow: 'rgba(41,26,16,0.4) 0px -8px 40px',
          maxHeight: '90dvh', overflowY: 'auto',
          transform: slideIn ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.32s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}>
          {content}
        </div>
      </>
    )
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(41,26,16,0.72)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
    >
      <div style={{
        width: '100%', maxWidth: 464,
        background: '#FFF6ED', borderRadius: 20,
        boxShadow: 'rgba(41,26,16,0.4) 0px 30px 80px',
        overflow: 'hidden',
      }}>
        {content}
      </div>
    </div>
  )
}
