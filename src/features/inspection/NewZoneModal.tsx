import { useState } from 'react'
import { Modal } from '@/components/Modal'
import { Input } from '@/components/Input'
import { Button } from '@/components/Button'
import { useProjectStore } from '@/store/useProjectStore'
import { ZONE_TYPES } from '@/types'

interface NewZoneModalProps {
  open: boolean
  onClose: () => void
}

export function NewZoneModal({ open, onClose }: NewZoneModalProps) {
  const activeProjectId = useProjectStore(s => s.activeProjectId)
  const zones = useProjectStore(s => s.zones)
  const createZone = useProjectStore(s => s.createZone)
  const setActiveZone = useProjectStore(s => s.setActiveZone)
  const [form, setForm] = useState({
    name: '',
    type: 'HA' as typeof ZONE_TYPES[number]['code'],
    floor: '',
    unit: '',
  })

  const set = (key: keyof typeof form, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const handleTypeSelect = (zt: typeof ZONE_TYPES[number]) => {
    set('type', zt.code)
    set('name', zt.name)
  }

  const canSubmit = form.name.trim() !== ''

  const handleSubmit = async () => {
    if (!canSubmit || !activeProjectId) return
    const zone = await createZone({
      name: form.name.trim(),
      type: form.type,
      floor: form.floor.trim(),
      unit: form.unit.trim(),
      projectId: activeProjectId,
      order: zones.length,
    })
    await setActiveZone(zone.id)
    onClose()
    setForm({ name: '', type: 'HA', floor: '', unit: '' })
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nueva zona / anexo"
      maxWidth={440}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="accent" disabled={!canSubmit} onClick={handleSubmit}>
            Crear zona
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3.5">
        {/* Tipo */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-semibold text-t2 tracking-wider uppercase">
            Tipo
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {ZONE_TYPES.map(zt => (
              <button
                key={zt.code}
                onClick={() => handleTypeSelect(zt)}
                className={`
                  flex flex-col items-center gap-1.5 py-3 px-2 rounded-[var(--radius)] text-[12px] font-semibold
                  cursor-pointer transition-all duration-150 border
                  ${form.type === zt.code
                    ? 'bg-accent-d text-accent border-accent'
                    : 'bg-s2 text-t2 border-border hover:bg-s3 hover:text-text'}
                `}
              >
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-s1 border border-border font-mono text-[11px]">
                  {zt.code}
                </span>
                <span className="leading-tight text-center">{zt.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Nombre */}
        <Input
          label="Nombre de la zona *"
          value={form.name}
          onChange={e => set('name', e.target.value)}
          placeholder="ej: Fachada Anterior, Piso 2o 1a..."
        />

        {/* Planta + Piso */}
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              label="Planta"
              value={form.floor}
              onChange={e => set('floor', e.target.value)}
              placeholder="ej: Principal"
            />
          </div>
          <div className="flex-1">
            <Input
              label="Piso / Zona"
              value={form.unit}
              onChange={e => set('unit', e.target.value)}
              placeholder="ej: 1a, —"
            />
          </div>
        </div>
      </div>
    </Modal>
  )
}
