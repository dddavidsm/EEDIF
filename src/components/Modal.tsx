import { type ReactNode, useEffect, useRef } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  maxWidth?: number
}

export function Modal({ open, onClose, title, children, footer, maxWidth = 560 }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-950/45 backdrop-blur-sm p-3 lg:p-5"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={ref}
        className="animate-fade-in bg-s1 border border-border rounded-[var(--radius-md)] p-5 lg:p-6 max-h-[92vh] overflow-y-auto shadow-[0_20px_60px_rgba(16,35,62,.18)]"
        style={{ width: `min(${maxWidth}px, 98vw)` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-title text-[20px] leading-tight font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center p-2.5 aspect-square rounded-[var(--radius)] bg-transparent text-t2 border border-border hover:bg-s2 hover:text-text cursor-pointer"
            aria-label="Cerrar"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Body */}
        {children}

        {/* Footer */}
        {footer && (
          <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
