import { useEffect, useMemo, useState } from 'react'
import { Camera, Save, Trash2, UploadCloud, X } from 'lucide-react'
import { PhotoManager } from '@/features/inspection/PhotoManager'
import { useProjectStore } from '@/store/useProjectStore'
import {
  LESION_TYPES,
  ORIENTATIONS,
  SITUATIONS,
  URGENCY_LEVELS,
} from '@/types'
import type {
  Lesion,
  LesionTypeCode,
  OrientationCode,
  SituationCode,
  UrgencyCode,
} from '@/types'
import { generateLesionCode, getLesionColor, newId } from '@/utils/codeGenerator'

interface Props {
  open: boolean
  onClose: () => void
  lesion?: Lesion | null
  newPos?: { x: number; y: number }
}

interface FormState {
  tipus: LesionTypeCode
  sit: SituationCode
  ori: OrientationCode
  urgency: UrgencyCode
  obs: string
}

export function LesionModal({ open, onClose, lesion, newPos }: Props) {
  const zoneId = useProjectStore(s => s.activeZoneId)
  const lesions = useProjectStore(s => s.lesions)
  const createLesion = useProjectStore(s => s.createLesion)
  const updateLesion = useProjectStore(s => s.updateLesion)
  const deleteLesion = useProjectStore(s => s.deleteLesion)
  const loadPhotos = useProjectStore(s => s.loadPhotos)
  const photos = useProjectStore(s => s.photos)

  const [form, setForm] = useState<FormState>({
    tipus: 'E',
    sit: 'P',
    ori: 'H',
    urgency: 'L',
    obs: '',
  })
  const [saving, setSaving] = useState(false)

  const isNew = !lesion

  useEffect(() => {
    if (!open) return

    if (lesion) {
      setForm({
        tipus: lesion.tipus,
        sit: lesion.sit,
        ori: lesion.ori ?? 'H',
        urgency: lesion.urgency,
        obs: lesion.obs,
      })
      void loadPhotos(lesion.id)
      return
    }

    setForm({ tipus: 'E', sit: 'P', ori: 'H', urgency: 'L', obs: '' })
  }, [open, lesion, loadPhotos])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !saving) {
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose, saving])

  const lesionType = LESION_TYPES.find(t => t.code === form.tipus)!
  const hasOrientation = lesionType.hasOrientation
  const color = getLesionColor(form.tipus)

  const code = useMemo(() => {
    const ori = hasOrientation ? form.ori : null
    const others = lesion ? lesions.filter(l => l.id !== lesion.id) : lesions
    return generateLesionCode(form.tipus, form.sit, ori, others)
  }, [form.tipus, form.sit, form.ori, hasOrientation, lesions, lesion])

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async () => {
    if (!zoneId || saving) return

    setSaving(true)
    try {
      if (isNew) {
        await createLesion({
          id: newId(),
          zoneId,
          code,
          tipus: form.tipus,
          sit: form.sit,
          ori: hasOrientation ? form.ori : null,
          urgency: form.urgency,
          obs: form.obs.trim(),
          x: newPos?.x ?? 300,
          y: newPos?.y ?? 200,
          photoIds: [],
        })
      } else if (lesion) {
        await updateLesion(lesion.id, {
          code,
          tipus: form.tipus,
          sit: form.sit,
          ori: hasOrientation ? form.ori : null,
          urgency: form.urgency,
          obs: form.obs.trim(),
        })
      }

      onClose()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!lesion || saving) return
    setSaving(true)
    try {
      await deleteLesion(lesion.id)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[230] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm sm:p-6"
      onClick={event => {
        if (event.target === event.currentTarget && !saving) {
          onClose()
        }
      }}
    >
      <div className="w-full max-w-2xl max-h-[92vh] overflow-hidden rounded-2xl border border-slate-200/20 bg-[linear-gradient(180deg,_rgba(255,255,255,0.95),_rgba(247,250,255,0.94))] shadow-xl shadow-black/30">
        <header className="border-b border-border/80 px-6 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-t3">Ficha de lesion</p>
              <h2 className="mt-2 font-title text-3xl leading-tight text-text">
                {isNew ? 'Agregar nueva lesion' : 'Editar lesion'}
              </h2>
              <p className="mt-2 text-sm text-t2">
                Registra tipo, situacion y observaciones con controles amplios para trabajo en campo.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-white text-t2 shadow-sm transition hover:border-accent/35 hover:text-accent disabled:opacity-50"
              aria-label="Cerrar ficha de lesion"
            >
              <X className="h-5 w-5" strokeWidth={2.4} />
            </button>
          </div>
        </header>

        <div className="max-h-[calc(92vh-186px)] overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <span
                  className="inline-flex min-w-28 items-center justify-center rounded-xl border px-4 py-2 font-mono text-2xl font-bold"
                  style={{ color, background: `${color}18`, borderColor: `${color}50` }}
                >
                  {code}
                </span>
                <div>
                  <div className="text-sm font-semibold text-text">{lesionType.name}</div>
                  <div className="text-xs uppercase tracking-[0.18em] text-t3">Codigo autogenerado</div>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
              <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-t3">Tipo de lesion</div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                {LESION_TYPES.map(type => {
                  const active = form.tipus === type.code
                  return (
                    <button
                      key={type.code}
                      type="button"
                      onClick={() => setField('tipus', type.code)}
                      className={`flex h-14 flex-col items-center justify-center rounded-xl border px-2 text-center transition ${
                        active
                          ? 'shadow-sm'
                          : 'bg-s2 text-t2 hover:border-accent/30 hover:text-text'
                      }`}
                      style={active ? { borderColor: type.color, background: `${type.color}16`, color: type.color } : undefined}
                    >
                      <span className="font-mono text-sm font-bold">{type.code}</span>
                      <span className="mt-0.5 text-[11px] font-semibold leading-none">{type.name.split(' ')[0]}</span>
                    </button>
                  )
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
              <div className="grid gap-6 md:grid-cols-2">
                <ToggleGigante
                  label="Situacion"
                  value={form.sit}
                  options={SITUATIONS.map(item => ({ value: item.code, label: item.name }))}
                  onChange={value => setField('sit', value as SituationCode)}
                />

                {hasOrientation ? (
                  <ToggleGigante
                    label="Orientacion"
                    value={form.ori}
                    options={ORIENTATIONS.map(item => ({ value: item.code, label: item.name }))}
                    onChange={value => setField('ori', value as OrientationCode)}
                  />
                ) : (
                  <div className="rounded-xl border border-dashed border-border bg-s2 px-4 py-4 text-sm text-t2">
                    Este tipo de lesion no requiere orientacion.
                  </div>
                )}
              </div>

              <div className="mt-6">
                <ToggleGigante
                  label="Urgencia"
                  value={form.urgency}
                  options={URGENCY_LEVELS.map(item => ({ value: item.code, label: item.name }))}
                  onChange={value => setField('urgency', value as UrgencyCode)}
                />
              </div>
            </section>

            <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.2em] text-t3">
                Observaciones
              </label>
              <textarea
                value={form.obs}
                onChange={event => setField('obs', event.target.value)}
                placeholder="Describe dimensiones, posible causa y cualquier hallazgo relevante"
                className="min-h-32 w-full rounded-xl border border-border bg-s2 px-4 py-3 text-[15px] text-text outline-none transition focus:border-accent"
              />
            </section>

            <section className="rounded-2xl border border-border bg-white p-5 shadow-sm">
              {!isNew && lesion ? (
                <PhotoManager lesionId={lesion.id} photos={photos} enabled />
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-t3">
                    <Camera className="h-4 w-4" strokeWidth={2.3} />
                    Fotos de lesion
                  </div>
                  <div className="border-2 border-dashed border-slate-600 rounded-2xl p-8 flex flex-col items-center justify-center bg-slate-800/30 text-center">
                    <UploadCloud className="h-12 w-12 text-slate-400" strokeWidth={1.9} />
                    <p className="mt-3 text-base font-semibold text-slate-200">Toca para añadir fotos de la lesion</p>
                    <p className="mt-1 text-sm text-slate-300/80">
                      Guarda primero la ficha para habilitar la carga de imagenes.
                    </p>
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>

        <footer className="border-t border-border/80 bg-white/90 px-6 py-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {!isNew && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-danger/30 bg-danger/10 px-5 text-sm font-semibold text-danger transition hover:bg-danger/20 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" strokeWidth={2.2} />
                  Eliminar lesion
                </button>
              )}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="inline-flex h-12 min-w-40 items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 text-sm font-semibold text-text shadow-sm transition hover:border-accent/35 hover:text-accent disabled:opacity-50"
              >
                <X className="h-4 w-4" strokeWidth={2.3} />
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="inline-flex h-12 min-w-56 items-center justify-center gap-2 rounded-xl bg-accent px-6 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition hover:bg-accent-h disabled:opacity-50"
              >
                <Save className="h-4 w-4" strokeWidth={2.3} />
                {saving ? 'Guardando...' : isNew ? 'Agregar lesion' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

function ToggleGigante({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
}) {
  return (
    <div>
      <div className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-t3">{label}</div>
      <div className="flex gap-3">
        {options.map(option => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`flex h-12 flex-1 items-center justify-center rounded-xl border px-3 text-sm font-semibold transition ${
              value === option.value
                ? 'border-accent bg-accent text-white shadow-md shadow-blue-600/20'
                : 'border-border bg-s2 text-t2 hover:border-accent/30 hover:bg-s3 hover:text-text'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}
