import { useState, useEffect, useMemo } from 'react'
import { useProjectStore, selectActiveZone } from '@/store/useProjectStore'
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
    return (
      <LesionDetail
        lesion={selectedLesion}
        zone={activeZone}
        photos={photos}
        onBack={() => onSelect(null)}
        onEdit={() => onEditLesion(selectedLesion)}
      />
    )
  }

  // ─── List view ────────────────────────────────────────────────

  return (
    <div className="flex-1 flex flex-col overflow-hidden border-l border-border bg-s1">
      {/* Header */}
      <div className="px-4 py-3 flex justify-between items-center shrink-0 border-b border-border">
        <span className="text-[11px] font-bold uppercase tracking-wider text-t3">
          Lista de lesiones&ensp;<span className="text-text font-mono">{lesions.length}</span>
        </span>
        <button
          onClick={onAddLesion}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius)] bg-accent text-white text-[12px] font-semibold hover:bg-accent-h transition-all"
        >
          + Agregar
        </button>
      </div>

      {/* Filter bar */}
      {lesions.length > 0 && (
        <div className="flex gap-1.5 px-3 py-2.5 shrink-0 border-b border-border">
          {([
            { code: 'all' as const, label: 'Todas' },
            ...URGENCY_LEVELS.map(u => ({ code: u.code as UrgencyCode, label: u.name })),
          ]).map(f => (
            <button
              key={f.code}
              onClick={() => setFilter(f.code)}
              className={`
                px-2.5 py-1 rounded-[var(--radius-sm)] text-[11px] font-semibold cursor-pointer
                transition-all border
                ${filter === f.code
                  ? 'bg-accent-d text-accent border-accent/50'
                  : 'bg-transparent text-t3 border-transparent hover:text-t2 hover:bg-s2'}
              `}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      {/* Lesion list */}
      <div className="flex-1 overflow-y-auto py-2 px-2">
        {filtered.length === 0 ? (
          <div className="py-10 px-4 text-center">
            <div className="text-3xl mb-3">📍</div>
            <div className="text-[13px] text-t2 mb-1.5">
              {lesions.length === 0 ? 'Sin lesiones en esta zona' : 'Sin lesiones con este filtro'}
            </div>
            {lesions.length === 0 && (
              <span
                className="text-[12px] text-accent cursor-pointer hover:underline"
                onClick={onAddLesion}
              >
                Usa la herramienta 📍 para agregar
              </span>
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
      className={`lesion-item ${isSelected ? 'selected' : ''}`}
    >
      <div
        className="w-2.5 h-2.5 rounded-full shrink-0 mt-[3px]"
        style={{ background: color }}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-[12px] font-bold" style={{ color }}>{l.code}</span>
          <UrgencyBadge code={l.urgency} />
        </div>
        <div className="text-[12px] text-t2 truncate leading-snug">
          {l.obs || typeName}
        </div>
      </div>
      {l.photoIds.length > 0 && (
        <span className="text-[11px] text-t3 shrink-0 flex items-center gap-0.5 mt-0.5">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          {l.photoIds.length}
        </span>
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
      <div className="px-4 pt-4 pb-3.5 shrink-0 border-b border-border">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span
                className="font-mono text-xl font-bold"
                style={{ color }}
              >
                {lesion.code}
              </span>
              <UrgencyBadge code={lesion.urgency} />
            </div>
            <div className="text-[13px] text-t2">{typeName}</div>
          </div>
          <button
            onClick={onBack}
            className="text-t3 hover:text-text cursor-pointer p-1 rounded hover:bg-s2 transition-colors"
            title="Cerrar detalle"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>

      {/* Detail content */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-4">
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
              <div className="text-[10px] font-bold uppercase tracking-wider text-t3 mb-2">
                Observaciones
              </div>
              <div className="text-[13px] text-text leading-relaxed bg-s2 rounded-[var(--radius)] p-3 border border-border">
                {lesion.obs}
              </div>
            </div>
          )}

          {/* Photos */}
          <PhotoManager lesionId={lesion.id} photos={photos} />
        </div>
      </div>

      {/* Actions */}
      <div className="px-3.5 py-3 border-t border-border shrink-0 flex gap-2">
        <button
          onClick={onEdit}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[var(--radius)] border border-border text-[12px] font-semibold text-t2 hover:bg-s2 hover:text-text transition-all"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Editar
        </button>
        <button
          onClick={onBack}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-[var(--radius)] bg-accent text-white text-[12px] font-semibold hover:bg-accent-h transition-all"
        >
          📍 Localizar
        </button>
      </div>
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-s2 rounded-[var(--radius)] px-3 py-2.5 border border-border">
      <div className="text-[9px] font-bold uppercase tracking-wider text-t3 mb-1">{label}</div>
      <div className="text-[13px] text-text font-semibold">{value}</div>
    </div>
  )
}
