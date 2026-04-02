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
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={ref}
        className="animate-fade-in bg-s1 border border-border rounded-[var(--radius-md)] p-6 max-h-[90vh] overflow-y-auto"
        style={{ width: `min(${maxWidth}px, 95vw)` }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-title text-base font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center p-[7px] aspect-square text-xs rounded-[var(--radius)] bg-transparent text-t2 border border-border hover:bg-s2 hover:text-text cursor-pointer"
          >
            ✕
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
