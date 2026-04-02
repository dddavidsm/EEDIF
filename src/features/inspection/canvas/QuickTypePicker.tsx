import { useRef, useEffect } from 'react'
import { MapPin, X } from 'lucide-react'
import { LESION_TYPES } from '@/types'
import type { LesionTypeCode } from '@/types'

interface Props {
  x: number
  y: number
  onSelect: (code: LesionTypeCode) => void
  onCancel: () => void
}

const W = 360
const H = 420

export function QuickTypePicker({ x, y, onSelect, onCancel }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onCancel])

  const left = Math.max(12, Math.min(x - W / 2, window.innerWidth - W - 16))
  const top = Math.max(12, Math.min(y + 16, window.innerHeight - H - 16))

  return (
    <div className="absolute inset-0 z-50" onClick={onCancel}>
      <div
        ref={ref}
        className="absolute animate-fade-in rounded-2xl border border-slate-700/70 bg-slate-900/95 p-5 shadow-2xl backdrop-blur-md"
        style={{ left, top, width: W }}
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
              <MapPin className="h-3.5 w-3.5" strokeWidth={2.3} />
              Nueva lesion
            </div>
            <div className="mt-2 text-sm font-semibold text-white">
              Selecciona el tipo de lesion
            </div>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/70 text-slate-300 transition hover:border-slate-500 hover:text-white"
            aria-label="Cerrar selector"
          >
            <X className="h-4 w-4" strokeWidth={2.4} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {LESION_TYPES.map(lt => (
            <button
              key={lt.code}
              onClick={() => onSelect(lt.code)}
              className="flex min-h-11 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-medium text-slate-100 transition-all hover:-translate-y-0.5"
              style={{
                borderColor: `${lt.color}99`,
                background: `linear-gradient(180deg, ${lt.color}28, rgba(15,23,42,0.68))`,
                boxShadow: `0 8px 18px ${lt.color}30`,
              }}
            >
              <span
                className="h-3.5 w-3.5 rounded-full shrink-0"
                style={{ background: lt.color, boxShadow: `0 0 0 3px ${lt.color}40` }}
              />
              <span className="truncate">{lt.name}</span>
              <span className="ml-auto rounded-md bg-black/20 px-2 py-0.5 font-mono text-[11px] text-white/90">{lt.code}</span>
            </button>
          ))}
        </div>

        <div className="mt-4 text-center text-[11px] text-slate-400">
          Clic fuera para cancelar
        </div>
      </div>
    </div>
  )
}
