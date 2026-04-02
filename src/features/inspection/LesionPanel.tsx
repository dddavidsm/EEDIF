import { useState, useEffect, useMemo } from 'react'
import { useProjectStore, selectActiveZone } from '@/store/useProjectStore'
import { UrgencyBadge } from '@/components/Chips'
import { PhotoManager } from '@/features/inspection/PhotoManager'
import { LESION_TYPES, SITUATIONS, ORIENTATIONS, URGENCY_LEVELS } from '@/types'
import type { Lesion, UrgencyCode, Photo } from '@/types'
import { getLesionColor } from '@/utils/codeGenerator'
import { Camera, ChevronLeft, LocateFixed, MapPin, MapPinPlus, PencilLine } from 'lucide-react'

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
    <div className="h-full flex flex-col overflow-hidden border-t lg:border-t-0 lg:border-l border-border bg-s2/45">
      <div className="shrink-0 border-b border-border bg-white/90 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-medium text-t3">Panel de zona</div>
            <div className="mt-0.5 text-base font-semibold text-text">
              Lesiones <span className="font-mono text-t2">({lesions.length})</span>
            </div>
          </div>
          <button
            onClick={onAddLesion}
            className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-accent px-3 text-xs font-medium text-white transition hover:bg-accent-h"
          >
            <MapPinPlus className="h-4 w-4" strokeWidth={2.4} />
            Nueva lesion
          </button>
        </div>
      </div>

      {lesions.length > 0 && (
        <div className="shrink-0 border-b border-border bg-white/80 px-4 py-3 backdrop-blur-sm">
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {([
            { code: 'all' as const, label: 'Todas' },
            ...URGENCY_LEVELS.map(u => ({ code: u.code as UrgencyCode, label: u.name })),
          ]).map(f => (
            <button
              key={f.code}
              onClick={() => setFilter(f.code)}
              className={`
                inline-flex h-10 items-center rounded-full px-4 text-sm font-semibold cursor-pointer
                transition-all border whitespace-nowrap
                ${filter === f.code
                  ? 'bg-accent text-white border-accent shadow-sm shadow-blue-600/25'
                  : 'bg-white text-t2 border-border hover:text-text hover:border-accent/35'}
              `}
            >
              {f.label}
            </button>
          ))}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 py-5">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-white px-6 py-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-s2 text-t2">
              <MapPin className="h-6 w-6" strokeWidth={2.1} />
            </div>
            <div className="text-base font-semibold text-text mb-1.5">
              {lesions.length === 0 ? 'Sin lesiones en esta zona' : 'Sin lesiones con este filtro'}
            </div>
            {lesions.length === 0 && (
              <span className="text-sm text-t2">
                Selecciona la herramienta Agregar lesion y toca el plano.
              </span>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(l => (
              <LesionListItem
                key={l.id}
                lesion={l}
                isSelected={selectedId === l.id}
                onClick={() => onSelect(l.id)}
              />
            ))}
          </div>
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
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-lg border bg-white p-3 text-left transition hover:shadow-sm ${
        isSelected
          ? 'border-accent ring-1 ring-accent/20'
          : 'border-border hover:border-accent/35'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ background: color }} />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-sm font-semibold" style={{ color }}>{l.code}</span>
              <UrgencyBadge code={l.urgency} />
            </div>
            <div className="mt-1 truncate text-sm text-t2">{l.obs || typeName}</div>
          </div>
        </div>

        <div className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border bg-s2 px-2.5 text-xs font-semibold text-t2">
          <Camera className="h-3.5 w-3.5" strokeWidth={2.2} />
          {l.photoIds.length}
        </div>
      </div>
    </button>
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
    <div className="h-full flex flex-col overflow-hidden border-t lg:border-t-0 lg:border-l border-border bg-s2/45">
      <div className="shrink-0 border-b border-border bg-white/90 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-start justify-between mb-2 gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-base font-bold" style={{ color }}>{lesion.code}</span>
              <UrgencyBadge code={lesion.urgency} />
            </div>
            <div className="text-[14px] text-t2">{typeName}</div>
          </div>
          <button
            onClick={onBack}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-white text-t2 shadow-sm transition hover:border-accent/35 hover:text-accent"
            title="Cerrar detalle"
          >
            <ChevronLeft className="h-5 w-5" strokeWidth={2.3} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5">
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-3">
            <InfoCard label="Situacion" value={sitName} />
            <InfoCard label="Orientacion" value={oriName} />
            <InfoCard label="Planta" value={zone?.floor || '—'} />
            <InfoCard label="Piso / Zona" value={zone?.unit || '—'} />
          </div>

          {lesion.obs && (
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-t2 mb-2">Observaciones</div>
              <div className="text-[14px] text-text leading-relaxed bg-white rounded-xl p-4 border border-border shadow-sm">{lesion.obs}</div>
            </div>
          )}

          <PhotoManager lesionId={lesion.id} photos={photos} />
        </div>
      </div>

      <div className="px-4 py-4 border-t border-border shrink-0 flex gap-3 bg-white/90">
        <button onClick={onEdit} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-text shadow-sm transition hover:border-accent/35 hover:text-accent flex-1">
          <PencilLine className="h-4 w-4" strokeWidth={2.3} />
          Editar
        </button>
        <button onClick={onBack} className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition hover:bg-accent-h flex-1">
          <LocateFixed className="h-4 w-4" strokeWidth={2.3} />
          Localizar
        </button>
      </div>
    </div>
  )
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl px-4 py-3 border border-border shadow-sm">
      <div className="text-[10px] font-bold uppercase tracking-wider text-t3 mb-1">{label}</div>
      <div className="text-[14px] text-text font-semibold">{value}</div>
    </div>
  )
}
