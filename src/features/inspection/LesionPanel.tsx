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

  useEffect(() => {
    if (selectedId) loadPhotos(selectedId)
  }, [selectedId, loadPhotos])

  const filtered = useMemo(
    () => filter === 'all' ? lesions : lesions.filter(l => l.urgency === filter),
    [lesions, filter],
  )

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

  return (
    <div className="h-full flex flex-col overflow-hidden border-t lg:border-t-0 lg:border-l border-border bg-s1">
      <div className="px-4 py-3.5 flex justify-between items-center shrink-0 border-b border-border">
        <span className="text-[12px] font-bold uppercase tracking-wider text-t2">
          Lesiones <span className="text-text font-mono">({lesions.length})</span>
        </span>
        <button onClick={onAddLesion} className="app-btn app-btn-accent !min-h-[36px] !px-3.5 !py-1.5 !text-[12px]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Agregar
        </button>
      </div>

      {lesions.length > 0 && (
        <div className="flex gap-1.5 px-3 py-2.5 shrink-0 border-b border-border overflow-x-auto">
          {([
            { code: 'all' as const, label: 'Todas' },
            ...URGENCY_LEVELS.map(u => ({ code: u.code as UrgencyCode, label: u.name })),
          ]).map(f => (
            <button
              key={f.code}
              onClick={() => setFilter(f.code)}
              className={`
                px-3 py-1.5 rounded-[var(--radius-sm)] text-[12px] font-semibold cursor-pointer
                transition-all border whitespace-nowrap
                ${filter === f.code
                  ? 'bg-accent-d text-accent border-accent/50'
                  : 'bg-transparent text-t2 border-transparent hover:text-text hover:bg-s2'}
              `}
            >
              {f.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto py-2 px-2">
        {filtered.length === 0 ? (
          <div className="py-10 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-s2 border border-border mx-auto mb-3 flex items-center justify-center text-t2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-6-5.6-6-11a6 6 0 0 1 12 0c0 5.4-6 11-6 11z"/><circle cx="12" cy="10" r="2"/></svg>
            </div>
            <div className="text-[14px] text-t2 mb-1.5">
              {lesions.length === 0 ? 'Sin lesiones en esta zona' : 'Sin lesiones con este filtro'}
            </div>
            {lesions.length === 0 && (
              <span className="text-[12px] text-t2">
                Selecciona herramienta "Lesion" y toca el plano.
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
    <div onClick={onClick} className={`lesion-item ${isSelected ? 'selected' : ''}`}>
      <div className="w-3 h-3 rounded-full shrink-0 mt-[4px]" style={{ background: color }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-[13px] font-bold" style={{ color }}>{l.code}</span>
          <UrgencyBadge code={l.urgency} />
        </div>
        <div className="text-[13px] text-t2 truncate leading-snug">{l.obs || typeName}</div>
      </div>
      {l.photoIds.length > 0 && (
        <span className="text-[11px] text-t3 shrink-0 flex items-center gap-1 mt-0.5">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          {l.photoIds.length}
        </span>
      )}
    </div>
  )
}

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
    <div className="h-full flex flex-col overflow-hidden border-t lg:border-t-0 lg:border-l border-border bg-s1">
      <div className="px-4 pt-4 pb-3.5 shrink-0 border-b border-border">
        <div className="flex items-start justify-between mb-2.5">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="font-mono text-[22px] font-bold" style={{ color }}>{lesion.code}</span>
              <UrgencyBadge code={lesion.urgency} />
            </div>
            <div className="text-[14px] text-t2">{typeName}</div>
          </div>
          <button onClick={onBack} className="app-btn app-btn-ghost !min-h-[34px] !px-2.5 !py-1.5" title="Cerrar detalle">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2.5">
            <InfoCard label="Situacion" value={sitName} />
            <InfoCard label="Orientacion" value={oriName} />
            <InfoCard label="Planta" value={zone?.floor || '—'} />
            <InfoCard label="Piso / Zona" value={zone?.unit || '—'} />
          </div>

          {lesion.obs && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-t2 mb-2">Observaciones</div>
              <div className="text-[14px] text-text leading-relaxed bg-s2 rounded-[var(--radius)] p-3 border border-border">{lesion.obs}</div>
            </div>
          )}

          <PhotoManager lesionId={lesion.id} photos={photos} />
        </div>
      </div>

      <div className="px-3.5 py-3 border-t border-border shrink-0 flex gap-2">
        <button onClick={onEdit} className="app-btn app-btn-ghost flex-1 !text-[13px]">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Editar
        </button>
        <button onClick={onBack} className="app-btn app-btn-accent flex-1 !text-[13px]">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-6-5.6-6-11a6 6 0 0 1 12 0c0 5.4-6 11-6 11z"/><circle cx="12" cy="10" r="2"/></svg>
          Localizar
        </button>
      </div>
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-s2 rounded-[var(--radius)] px-3 py-2.5 border border-border">
      <div className="text-[10px] font-bold uppercase tracking-wider text-t3 mb-1">{label}</div>
      <div className="text-[14px] text-text font-semibold">{value}</div>
    </div>
  )
}
