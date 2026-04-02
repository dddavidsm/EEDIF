import { useEffect, useState } from 'react'
import { FolderPlus, Save, X } from 'lucide-react'
import { useProjectStore } from '@/store/useProjectStore'
import type { Project } from '@/types'

interface NewProjectModalProps {
  open: boolean
  onClose: () => void
  onCreated?: (id: string) => void
  onUpdated?: (id: string) => void
  project?: Project | null
}

const getEmptyForm = () => ({
  name: '',
  workCode: '',
  address: '',
  inspector: '',
  inspectionDate: new Date().toISOString().split('T')[0],
  description: '',
})

export function NewProjectModal({ open, onClose, onCreated, onUpdated, project }: NewProjectModalProps) {
  const createProject = useProjectStore(s => s.createProject)
  const updateProject = useProjectStore(s => s.updateProject)
  const [form, setForm] = useState({
    ...getEmptyForm(),
  })
  const [submitting, setSubmitting] = useState(false)

  const isEditing = Boolean(project)

  useEffect(() => {
    if (!open) return

    if (project) {
      setForm({
        name: project.name,
        workCode: project.workCode,
        address: project.address,
        inspector: project.inspector,
        inspectionDate: project.inspectionDate || new Date().toISOString().split('T')[0],
        description: project.description,
      })
      return
    }

    setForm(getEmptyForm())
  }, [open, project])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !submitting) {
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose, submitting])

  const set = (key: keyof typeof form, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const canSubmit = form.name.trim() !== '' && form.address.trim() !== ''

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return
    setSubmitting(true)
    try {
      const payload = {
        name: form.name.trim(),
        workCode: form.workCode.trim(),
        address: form.address.trim(),
        inspector: form.inspector.trim(),
        inspectionDate: form.inspectionDate,
        description: form.description.trim(),
      }

      if (project) {
        await updateProject(project.id, payload)
        onUpdated?.(project.id)
      } else {
        const createdProject = await createProject(payload)
        onCreated?.(createdProject.id)
      }

      onClose()
      setForm(getEmptyForm())
    } finally {
      setSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget && !submitting) {
          onClose()
        }
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-xl border border-border/40 bg-white shadow-xl">
        <header className="flex items-center justify-between gap-3 border-b border-border/60 px-5 py-3.5">
          <div>
            <h2 className="text-base font-semibold text-text">
              {isEditing ? 'Editar proyecto' : 'Nuevo proyecto de inspeccion'}
            </h2>
            <p className="mt-0.5 text-xs text-t2">
              Completa los datos del edificio.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border text-t2 transition hover:border-accent/40 hover:text-accent disabled:opacity-50"
            aria-label="Cerrar modal"
          >
            <X className="h-3.5 w-3.5" strokeWidth={2.4} />
          </button>
        </header>

        <div className="space-y-4 px-5 py-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-t2">
                Nombre del proyecto *
              </label>
              <input
                value={form.name}
                onChange={event => set('name', event.target.value)}
                placeholder="Ejemplo: Ramon Turro 157"
                autoFocus
                className="h-9 w-full rounded-lg border border-border bg-s2 px-3 text-sm text-text outline-none transition focus:border-accent"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-t2">
                Codigo de obra
              </label>
              <input
                value={form.workCode}
                onChange={event => set('workCode', event.target.value)}
                placeholder="Ej: 15350"
                className="h-9 w-full rounded-lg border border-border bg-s2 px-3 text-sm text-text outline-none transition focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-t2">
              Direccion del edificio *
            </label>
            <input
              value={form.address}
              onChange={event => set('address', event.target.value)}
              placeholder="C/ Ramon Turro, 157, Barcelona"
              className="h-9 w-full rounded-lg border border-border bg-s2 px-3 text-sm text-text outline-none transition focus:border-accent"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-t2">
                Inspector
              </label>
              <input
                value={form.inspector}
                onChange={event => set('inspector', event.target.value)}
                placeholder="Nombre del inspector"
                className="h-9 w-full rounded-lg border border-border bg-s2 px-3 text-sm text-text outline-none transition focus:border-accent"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-t2">
                Fecha de inspeccion
              </label>
              <input
                type="date"
                value={form.inspectionDate}
                onChange={event => set('inspectionDate', event.target.value)}
                className="h-9 w-full rounded-lg border border-border bg-s2 px-3 text-sm text-text outline-none transition focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-t2">
              Descripcion del edificio
            </label>
            <textarea
              value={form.description}
              onChange={event => set('description', event.target.value)}
              placeholder="Tipologia, numero de plantas, estructura y acabados"
              className="min-h-24 w-full rounded-lg border border-border bg-s2 px-3 py-2 text-sm text-text outline-none transition focus:border-accent"
            />
          </div>
        </div>

        <footer className="border-t border-border/60 px-5 py-3.5">
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-border bg-white px-4 text-xs font-medium text-text transition hover:border-accent/35 hover:text-accent disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-accent px-4 text-xs font-medium text-white transition hover:bg-accent-h disabled:opacity-55"
            >
              {isEditing ? <Save className="h-3.5 w-3.5" strokeWidth={2} /> : <FolderPlus className="h-3.5 w-3.5" strokeWidth={2} />}
              {submitting
                ? (isEditing ? 'Guardando...' : 'Creando...')
                : (isEditing ? 'Guardar cambios' : 'Crear proyecto')}
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
