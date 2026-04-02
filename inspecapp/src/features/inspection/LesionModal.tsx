import { useState, useEffect, useMemo } from 'react'
import { Modal } from '@/components/Modal'
import { Button } from '@/components/Button'
import { Toggle } from '@/components/Toggle'
import { Textarea } from '@/components/Input'
import { PhotoManager } from '@/features/inspection/PhotoManager'
import { useProjectStore } from '@/store/useProjectStore'
import {
  LESION_TYPES, SITUATIONS, ORIENTATIONS, URGENCY_LEVELS,
} from '@/types'
import type {
  LesionTypeCode, SituationCode, OrientationCode, UrgencyCode, Lesion, Photo,
} from '@/types'
import { generateLesionCode, getLesionColor, newId } from '@/utils/codeGenerator'

interface Props {
  open: boolean
  onClose: () => void
  /** Lesion to edit, or null for new. For new, x/y must be provided. */
  lesion?: Lesion | null
  /** Canvas coordinates for new lesion (ignored when editing) */
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

  // Photos from store for this lesion (edit mode)
  const allPhotos = useProjectStore(s => {
    if (!lesion) return [] as Photo[]
    // Photos are not stored in the lesions array; we need to fetch them.
    // For now we use a simple approach: photos are in the store
    return [] as Photo[]
  })

  const isNew = !lesion

  const [form, setForm] = useState<FormState>({
    tipus: 'E',
    sit: 'P',
    ori: 'H',
    urgency: 'L',
    obs: '',
  })

  // Reset form when opening
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
    } else {
      setForm({ tipus: 'E', sit: 'P', ori: 'H', urgency: 'L', obs: '' })
    }
  }, [open, lesion])

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm(prev => ({ ...prev, [key]: val }))

  const lesionType = LESION_TYPES.find(t => t.code === form.tipus)!
  const hasOri = lesionType.hasOrientation

  // Auto-generated code preview
  const code = useMemo(() => {
    const ori = hasOri ? form.ori : null
    // For edit mode, exclude self from count
    const others = lesion
      ? lesions.filter(l => l.id !== lesion.id)
      : lesions
    return generateLesionCode(form.tipus, form.sit, ori, others)
  }, [form.tipus, form.sit, form.ori, hasOri, lesions, lesion])

  const color = getLesionColor(form.tipus)

  const handleSubmit = async () => {
    if (!zoneId) return

    if (isNew) {
      await createLesion({
        id: newId(),
        zoneId,
        code,
        tipus: form.tipus,
        sit: form.sit,
        ori: hasOri ? form.ori : null,
        urgency: form.urgency,
        obs: form.obs.trim(),
        x: newPos?.x ?? 300,
        y: newPos?.y ?? 200,
        photoIds: [],
      })
    } else {
      await updateLesion(lesion.id, {
        code,
        tipus: form.tipus,
        sit: form.sit,
        ori: hasOri ? form.ori : null,
        urgency: form.urgency,
        obs: form.obs.trim(),
      })
    }
    onClose()
  }

  const handleDelete = async () => {
    if (!lesion) return
    await deleteLesion(lesion.id)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isNew ? 'Agregar nueva lesion' : 'Editar lesion'}
      maxWidth={520}
      footer={
        <div className="flex w-full items-center">
          {!isNew && (
            <Button variant="danger" onClick={handleDelete}>
              Eliminar
            </Button>
          )}
          <div className="flex-1" />
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button variant="accent" onClick={handleSubmit}>
              {isNew ? 'Agregar lesion' : 'Guardar cambios'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {/* ── Code preview ──────────────────────────────────── */}
        <div className="flex items-center gap-3">
          <span
            className="font-mono text-[18px] font-bold px-3 py-1 rounded-[var(--radius)]"
            style={{ color, background: color + '18' }}
          >
            {code}
          </span>
          <span className="text-[11px] text-t3">codigo autogenerado</span>
        </div>

        {/* ── Type selector (grid 5 cols) ───────────────────── */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-t2 tracking-wider uppercase">
            Tipo de lesion
          </label>
          <div className="grid grid-cols-5 gap-1.5">
            {LESION_TYPES.map(lt => (
              <button
                key={lt.code}
                type="button"
                onClick={() => set('tipus', lt.code)}
                className={`
                  flex flex-col items-center gap-0.5 py-2 px-1 rounded-[var(--radius)]
                  text-[10px] font-semibold cursor-pointer transition-all duration-100 border
                  ${form.tipus === lt.code
                    ? 'border-current'
                    : 'border-border bg-s2 hover:bg-s3'}
                `}
                style={form.tipus === lt.code
                  ? { borderColor: lt.color, background: lt.color + '18', color: lt.color }
                  : { color: 'var(--color-t2)' }}
              >
                <span className="font-mono text-[11px] font-bold">{lt.code}</span>
                <span className="text-[8px] leading-tight text-center truncate w-full">{lt.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Situation ─────────────────────────────────────── */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-t2 tracking-wider uppercase">
            Situacion
          </label>
          <Toggle options={SITUATIONS} value={form.sit} onChange={v => set('sit', v)} />
        </div>

        {/* ── Orientation (conditional) ──────────────────────── */}
        {hasOri && (
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold text-t2 tracking-wider uppercase">
              Orientacion
            </label>
            <Toggle options={ORIENTATIONS} value={form.ori} onChange={v => set('ori', v)} />
          </div>
        )}

        {/* ── Urgency ───────────────────────────────────────── */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-t2 tracking-wider uppercase">
            Urgencia
          </label>
          <Toggle options={URGENCY_LEVELS} value={form.urgency} onChange={v => set('urgency', v)} />
        </div>

        {/* ── Observations ──────────────────────────────────── */}
        <Textarea
          label="Observaciones"
          value={form.obs}
          onChange={e => set('obs', e.target.value)}
          placeholder="Descripcion detallada de la lesion, dimensiones estimadas, posible causa..."
        />

        {/* ── Photos (only in edit mode) ────────────────────── */}
        {!isNew && lesion && (
          <PhotoManager lesionId={lesion.id} photos={allPhotos} />
        )}
      </div>
    </Modal>
  )
}
