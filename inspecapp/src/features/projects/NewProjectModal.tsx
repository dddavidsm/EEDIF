import { useState } from 'react'
import { Modal } from '@/components/Modal'
import { Input, Textarea } from '@/components/Input'
import { Button } from '@/components/Button'
import { useProjectStore } from '@/store/useProjectStore'

interface NewProjectModalProps {
  open: boolean
  onClose: () => void
  onCreated: (id: string) => void
}

export function NewProjectModal({ open, onClose, onCreated }: NewProjectModalProps) {
  const createProject = useProjectStore(s => s.createProject)
  const [form, setForm] = useState({
    name: '',
    workCode: '',
    address: '',
    inspector: '',
    inspectionDate: new Date().toISOString().split('T')[0],
    description: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const set = (key: keyof typeof form, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const canSubmit = form.name.trim() !== '' && form.address.trim() !== ''

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return
    setSubmitting(true)
    try {
      const project = await createProject({
        name: form.name.trim(),
        workCode: form.workCode.trim(),
        address: form.address.trim(),
        inspector: form.inspector.trim(),
        inspectionDate: form.inspectionDate,
        description: form.description.trim(),
      })
      onCreated(project.id)
      onClose()
      setForm({ name: '', workCode: '', address: '', inspector: '', inspectionDate: new Date().toISOString().split('T')[0], description: '' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo proyecto de inspeccion"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="accent" disabled={!canSubmit || submitting} onClick={handleSubmit}>
            {submitting ? 'Creando...' : 'Crear proyecto'}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3.5">
        {/* Fila 1: nombre + codigo */}
        <div className="flex gap-3">
          <div className="flex-[2]">
            <Input
              label="Nombre del proyecto *"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="ej: Ramon Turro 157"
              autoFocus
            />
          </div>
          <div className="flex-1">
            <Input
              label="Codigo de obra"
              value={form.workCode}
              onChange={e => set('workCode', e.target.value)}
              placeholder="ej: 15350"
            />
          </div>
        </div>

        {/* Direccion */}
        <Input
          label="Direccion del edificio *"
          value={form.address}
          onChange={e => set('address', e.target.value)}
          placeholder="ej: C/ Ramon Turro, 157, Barcelona"
        />

        {/* Fila 2: inspector + fecha */}
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              label="Inspector"
              value={form.inspector}
              onChange={e => set('inspector', e.target.value)}
              placeholder="Nombre del inspector"
            />
          </div>
          <div className="flex-1">
            <Input
              label="Fecha de inspeccion"
              type="date"
              value={form.inspectionDate}
              onChange={e => set('inspectionDate', e.target.value)}
            />
          </div>
        </div>

        {/* Descripcion */}
        <Textarea
          label="Descripcion del edificio"
          value={form.description}
          onChange={e => set('description', e.target.value)}
          placeholder="Tipologia, n.o de plantas, estructura, acabados..."
        />
      </div>
    </Modal>
  )
}
