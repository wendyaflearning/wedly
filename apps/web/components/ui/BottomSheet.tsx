'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

interface BottomSheetProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export function BottomSheet({ isOpen, onClose, title, children }: BottomSheetProps) {
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const touchStartY = useRef(0)
  const dragActive = useRef(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      setDragY(0)
      setIsDragging(false)
    }
  }, [isOpen])

  function onTouchStart(e: React.TouchEvent) {
    const touch = e.touches[0]
    touchStartY.current = touch.clientY
    if (panelRef.current) {
      const rect = panelRef.current.getBoundingClientRect()
      dragActive.current = touch.clientY - rect.top < 64
    }
  }

  function onTouchMove(e: React.TouchEvent) {
    if (!dragActive.current) return
    const delta = e.touches[0].clientY - touchStartY.current
    if (delta > 0) {
      setIsDragging(true)
      setDragY(delta)
    }
  }

  function onTouchEnd() {
    if (!dragActive.current) return
    dragActive.current = false
    setIsDragging(false)
    if (dragY > 80) {
      onClose()
    } else {
      setDragY(0)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] bg-black/40">
      <div className="absolute inset-0" onClick={onClose} />

      <div
        ref={panelRef}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className="modal-enter fixed inset-x-0 bottom-0 z-10 bg-creme rounded-t-2xl flex flex-col"
        style={{
          maxHeight: '92vh',
          transform: dragY > 0 ? `translateY(${dragY}px)` : undefined,
          transition: isDragging ? 'none' : dragY > 0 ? 'transform 0.3s cubic-bezier(0.32,0.72,0,1)' : undefined,
        }}
      >
        {/* Drag handle */}
        <div className="pt-3 pb-0 flex justify-center shrink-0 cursor-grab active:cursor-grabbing">
          <div className="w-9 h-1 rounded-full bg-bordeaux/20" />
        </div>

        {/* Header optionnel */}
        {title !== undefined && (
          <div className="flex items-center justify-between px-5 pt-4 pb-3 shrink-0">
            <span
              className="font-cormorant italic text-[22px] font-light text-texte"
            >
              {title}
            </span>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full border border-bordeaux/15 flex items-center justify-center text-texte/60 hover:text-texte transition-colors text-xl leading-none"
              aria-label="Fermer"
            >
              ×
            </button>
          </div>
        )}

        {/* Contenu scrollable */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}
