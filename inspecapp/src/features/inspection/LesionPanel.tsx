import { useState, useEffect, useMemo } from 'react'
import { useProjectStore, selectActiveZone } from '@/store/useProjectStore'
import { Button } from '@/components/Button'
import { UrgencyBadge } from '@/components/Chips'
import { PhotoManager } from '@/features/inspection/PhotoManager'
import { LESION_TYPES, SITUATIONS, ORIENTATIONS, URGENCY_LEVELS } from '@/types'
import type { Lesion, UrgencyCode, Photo } from '@/types'
import { getLesionColor } from '@/utils/codeGenerator'

type Filter = 'all' | UrgencyCode

interface Props {
  selectedId: string | null
  onSelect: (id: string | null) => void
  onEditLesion: (l: Lesion) => void
  onAddLesion: () => void
}

export function LesionPanel({ selectedId, onSelect, onEditLesion, onAddLesion }: Props) {
  const lesions = useProjectStore(s => s.lesions)
  const photos = useProjectStore(s => s.photos)
  const loadPhotos = useProjectStore(s => s.loadPhotos)
  const activeZone = useProjectStore(selectActiveZone)

  const [filter, setFilter] = useState<Filter>('all')

  const selectedLesion = lesions.find(l => l.id === selectedId) ?? null

  // Load photos when a lesion is selected
  useEffect(() => {
    if (selectedId) loadPhotos(selectedId)
  }, [selectedId, loadPhotos])

  const filtered = useMemo(
    () => filter === 'all' ? lesions : lesions.filter(l => l.urgency === filter),
    [lesions, filter],
  )

  // ─── Detail view ──────────────────────────────────────────────

  if (selectedLesion) {
    return <LesionDetail lesion={selectedLesion} zone={activeZone} photos={photos} onBack={() => onSelect(null)} onEdit={() => onEditLesion(selectedLesion)} />
  }

  // ─── List view ────────────────────────────────────────────────

  return (
    <div className="flex-1 flex flex-col overflow-hidden border-l border-border bg-s1">
      {/* Header */}
      <div className="px-3 py-2.5 flex justify-between items-center shrink-0 border-b border-border">
        <span className="text-[10px] font-bold uppercase tracking-wider text-t3">
          Lesiones ({lesions.length})
        </span>
        <Button variant="accent" size="sm" onClick={onAddLesion}>+ Agregar</Button>
      </div>

      {/* Filter bar */}
      {lesions.length > 0 && (
        <div className="flex gap-1 px-2.5 py-2 shrink-0">
          {([
            { code: 'all' as const, label: 'Todas' },
            ...URGENCY_LEVELS.map(u => ({ code: u.code, label: u.name })),
          ]).map(f => (
            <button
              key={f.code}
              onClick={() => setFilter(f.code)}
              className={`
                px-2 py-1 rounded-[var(--radius-sm)] text-[10px] font-semibold cursor-pointer
                transition-all border
                ${filter === f.code
                  ? 'bg-accent-d text-accent border-accent'
                  : 'bg-transparent text-t3 border-transparent hover:text-t2'}
              `}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Lesion list */}
      <div className="flex-1 overflow-y-auto px-1.5 pb-2">
        {filtered.length === 0 ? (
          <div className="py-7 px-3.5 text-center text-t3 text-xs">
            {lesions.length === 0 ? (
              <>
                Ninguna lesion registrada en esta zona.<br />
                <span className="text-accent cursor-pointer" onClick={onAddLesion}>
                  Usa 📍 para agregar una.
                </span>
              </>
            ) : (
              'Ninguna lesion con este filtro.'
            )}
          </div>
        ) : (
          filtered.map(l => (
            <LesionListItem
              key={l.id}
              lesion={l}
              isSelected={selectedId === l.id}
              onClick={() => onSelect(l.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ─── List Item ──────────────────────────────────────────────────────────────

function LesionListItem({
  lesion: l,
  isSelected,
  onClick,
}: {
  lesion: Lesion
  isSelected: boolean
  onClick: () => void
}) {
  const color = getLesionColor(l.tipus)
  const typeName = LESION_TYPES.find(lt => lt.code === l.tipus)?.name ?? ''

  return (
    <div
      onClick={onClick}
      className={`
        flex items-start gap-2 px-2.5 py-2 rounded-[var(--radius)] cursor-pointer
        border transition-all duration-100
        ${isSelected
          ? 'bg-accent-d border-accent/30'
          : 'border-transparent hover:bg-s2 hover:border-border'}
      `}
    >
      <div
        className="w-[9px] h-[9px] rounded-full shrink-0 mt-[4px]"
        style={{ background: color }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="font-mono text-[11px] font-bold" style={{ color }}>{l.code}</span>
          <UrgencyBadge code={l.urgency} />
        </div>
        <div className="text-[11px] text-t2 truncate">
          {l.obs || typeName}
        </div>
      </div>
      {l.photoIds.length > 0 && (
        <span className="text-[10px] text-t3 shrink-0 mt-0.5">📷{l.photoIds.length}</span>
      )}
    </div>
  )
}

// ─── Detail View ────────────────────────────────────────────────────────────

function LesionDetail({
  lesion,
  zone,
  photos,
  onBack,
  onEdit,
}: {
  lesion: Lesion
  zone?: { floor: string; unit: string } | null
  photos: Photo[]
  onBack: () => void
  onEdit: () => void
}) {
  const color = getLesionColor(lesion.tipus)
  const typeName = LESION_TYPES.find(lt => lt.code === lesion.tipus)?.name ?? ''
  const sitName = SITUATIONS.find(s => s.code === lesion.sit)?.name ?? '—'
  const oriName = lesion.ori ? (ORIENTATIONS.find(o => o.code === lesion.ori)?.name ?? '—') : '—'

  return (
    <div className="flex-1 flex flex-col overflow-hidden border-l border-border bg-s1">
      {/* Header */}
      <div className="px-3.5 py-3 shrink-0 border-b border-border">
        <div className="flex items-start justify-between mb-2">
          <div>
            <span
              className="font-mono text-[18px] font-bold"
              style={{ color }}
            >
              {lesion.code}
            </span>
            <span className="ml-2"><UrgencyBadge code={lesion.urgency} /></span>
          </div>
          <button
            onClick={onBack}
            className="text-t3 hover:text-text cursor-pointer text-sm p-1"
          >
            ✕
          </button>
        </div>
        <div className="text-[13px] text-t2">{typeName}</div>
      </div>

      {/* Detail content */}
      <div className="flex-1 overflow-y-auto p-3.5">
        <div className="flex flex-col gap-3.5">
          {/* Data grid */}
          <div className="grid grid-cols-2 gap-2">
            <InfoCard label="Situacion" value={sitName} />
            <InfoCard label="Orientacion" value={oriName} />
            <InfoCard label="Planta" value={zone?.floor || '—'} />
            <InfoCard label="Piso / Zona" value={zone?.unit || '—'} />
          </div>

          {/* Observations */}
          {lesion.obs && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-t3 mb-1">
                Observaciones
              </div>
              <div className="text-[12px] text-t2 leading-relaxed bg-s2 rounded-[var(--radius)] p-2.5 border border-border">
                {lesion.obs}
              </div>
            </div>
          )}

          {/* Photos */}
          <PhotoManager lesionId={lesion.id} photos={photos} />
        </div>
      </div>

      {/* Actions */}
      <div className="px-3 py-2.5 border-t border-border shrink-0 flex gap-2">
        <Button variant="ghost" size="sm" className="flex-1" onClick={onEdit}>
          ✏️ Editar
        </Button>
        <Button variant="accent" size="sm" className="flex-1" onClick={onBack}>
          📍 Localizar
        </Button>
      </div>
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-s2 rounded-[var(--radius)] px-2.5 py-2 border border-border">
      <div className="text-[9px] font-bold uppercase tracking-wider text-t3 mb-0.5">{label}</div>
      <div className="text-[13px] text-text font-semibold">{value}</div>
    </div>
  )
}
