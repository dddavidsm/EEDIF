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
  LesionTypeCode, SituationCode, OrientationCode, UrgencyCode, Lesion,
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
  const loadPhotos = useProjectStore(s => s.loadPhotos)

  // Photos from store for this lesion (edit mode)
  const photos = useProjectStore(s => s.photos)

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
      loadPhotos(lesion.id)
    } else {
      setForm({ tipus: 'E', sit: 'P', ori: 'H', urgency: 'L', obs: '' })
    }
  }, [open, lesion, loadPhotos])

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
      maxWidth={540}
      footer={
        <div className="flex w-full items-center">
          {!isNew && (
            <Button variant="danger" size="md" onClick={handleDelete}>
              Eliminar
            </Button>
          )}
          <div className="flex-1" />
          <div className="flex gap-2">
            <Button variant="ghost" size="md" onClick={onClose}>Cancelar</Button>
            <Button variant="accent" size="md" onClick={handleSubmit}>
              {isNew ? 'Agregar lesion' : 'Guardar cambios'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        {/* ── Code preview ──────────────────────────────────── */}
        <div className="flex items-center gap-3 p-3.5 bg-s2 rounded-[var(--radius)] border border-border">
          <span
            className="font-mono text-[20px] font-bold px-3.5 py-1.5 rounded-[var(--radius)] border"
            style={{ color, background: color + '18', borderColor: color + '44' }}
          >
            {code}
          </span>
          <div>
            <div className="text-[12px] font-semibold text-text">{lesionType.name}</div>
            <div className="text-[11px] text-t3 mt-0.5">codigo autogenerado</div>
          </div>
        </div>

        {/* ── Type selector (grid 5 cols) ───────────────────── */}
        <div className="flex flex-col gap-2">
          <label className="field-label">Tipo de lesion</label>
          <div className="grid grid-cols-5 gap-1.5">
            {LESION_TYPES.map(lt => (
              <button
                key={lt.code}
                type="button"
                onClick={() => set('tipus', lt.code)}
                className="flex flex-col items-center gap-1 py-2.5 px-1 rounded-[var(--radius)] text-[10px] font-semibold cursor-pointer transition-all duration-100 border"
                style={form.tipus === lt.code
                  ? { borderColor: lt.color, background: lt.color + '1A', color: lt.color }
                  : { borderColor: 'var(--color-border)', background: 'var(--color-s2)', color: 'var(--color-t2)' }}
              >
                <span className="font-mono text-[12px] font-bold">{lt.code}</span>
                <span className="text-[8px] leading-tight text-center line-clamp-2 px-1">
                  {lt.name.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Situation + Orientation (side by side when possible) ─── */}
        <div className={`grid gap-4 ${hasOri ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <div className="flex flex-col gap-2">
            <label className="field-label">Situacion</label>
            <Toggle options={SITUATIONS} value={form.sit} onChange={v => set('sit', v)} />
          </div>
          {hasOri && (
            <div className="flex flex-col gap-2">
              <label className="field-label">Orientacion</label>
              <Toggle options={ORIENTATIONS} value={form.ori} onChange={v => set('ori', v)} />
            </div>
          )}
        </div>

        {/* ── Urgency ───────────────────────────────────────── */}
        <div className="flex flex-col gap-2">
          <label className="field-label">Urgencia</label>
          <Toggle options={URGENCY_LEVELS} value={form.urgency} onChange={v => set('urgency', v)} />
        </div>

        {/* ── Observations ──────────────────────────────────── */}
        <Textarea
          label="Observaciones"
          value={form.obs}
          onChange={e => set('obs', e.target.value)}
          placeholder="Descripcion detallada, dimensiones estimadas, posible causa..."
          rows={3}
        />

        {/* ── Photos (only in edit mode) ────────────────────── */}
        {!isNew && lesion && (
          <PhotoManager lesionId={lesion.id} photos={photos} />
        )}
      </div>
    </Modal>
  )
}
