import { useRef, useEffect } from 'react'
import { LESION_TYPES } from '@/types'
import type { LesionTypeCode } from '@/types'

interface Props {
  x: number
  y: number
  onSelect: (code: LesionTypeCode) => void
  onCancel: () => void
}

const W = 220
const H = 260

export function QuickTypePicker({ x, y, onSelect, onCancel }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCancel])

  // Clamp position to stay within container
  const left = Math.max(8, Math.min(x - W / 2, window.innerWidth - W - 16))
  const top = Math.max(8, Math.min(y + 16, window.innerHeight - H - 16))

  return (
    /* Backdrop */
    <div className="absolute inset-0 z-50" onClick={onCancel}>
      <div
        ref={ref}
        className="absolute animate-fade-in bg-s1 border border-border rounded-[var(--radius-md)] p-3 shadow-xl shadow-black/40"
        style={{ left, top, width: W }}
        onClick={e => e.stopPropagation()}
      >
        <div className="text-[10px] font-bold uppercase tracking-wider text-t3 mb-2">
          Tipo de lesion
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {LESION_TYPES.map(lt => (
            <button
              key={lt.code}
              onClick={() => onSelect(lt.code)}
              className="flex items-center gap-2 px-2.5 py-2 rounded-[var(--radius)] text-[11px] font-semibold
                cursor-pointer transition-all duration-100 border border-border bg-s2
                hover:bg-s3 hover:border-border2 text-left"
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: lt.color }}
              />
              <span className="text-text truncate">{lt.name}</span>
              <span className="font-mono text-t3 ml-auto text-[9px]">{lt.code}</span>
            </button>
          ))}
        </div>
        <div className="text-[9px] text-t3 mt-2 text-center">
          Clic fuera para cancelar
        </div>
      </div>
    </div>
  )
}
