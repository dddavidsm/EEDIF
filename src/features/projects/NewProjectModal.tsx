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
      className="fixed inset-0 z-[220] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm sm:p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget && !submitting) {
          onClose()
        }
      }}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-slate-200/20 bg-[linear-gradient(180deg,_rgba(255,255,255,0.94),_rgba(247,250,255,0.92))] shadow-xl shadow-black/30">
        <header className="flex items-start justify-between gap-4 border-b border-border/80 px-6 py-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-t3">Ficha de proyecto</p>
            <h2 className="mt-2 font-title text-3xl leading-tight text-text">
              {isEditing ? 'Editar proyecto de inspeccion' : 'Nuevo proyecto de inspeccion'}
            </h2>
            <p className="mt-2 text-sm leading-6 text-t2">
              Completa los datos clave del edificio para iniciar o actualizar el expediente tecnico.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-border bg-white text-t2 shadow-sm transition hover:border-accent/40 hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Cerrar modal"
          >
            <X className="h-5 w-5" strokeWidth={2.4} />
          </button>
        </header>

        <div className="space-y-6 px-6 py-6">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-t2">
                Nombre del proyecto *
              </label>
              <input
                value={form.name}
                onChange={event => set('name', event.target.value)}
                placeholder="Ejemplo: Ramon Turro 157"
                autoFocus
                className="h-12 w-full rounded-xl border border-border bg-s2 px-4 text-[15px] text-text shadow-sm outline-none transition focus:border-accent"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-t2">
                Codigo de obra
              </label>
              <input
                value={form.workCode}
                onChange={event => set('workCode', event.target.value)}
                placeholder="Ejemplo: 15350"
                className="h-12 w-full rounded-xl border border-border bg-s2 px-4 text-[15px] text-text shadow-sm outline-none transition focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-t2">
              Direccion del edificio *
            </label>
            <input
              value={form.address}
              onChange={event => set('address', event.target.value)}
              placeholder="Ejemplo: C/ Ramon Turro, 157, Barcelona"
              className="h-12 w-full rounded-xl border border-border bg-s2 px-4 text-[15px] text-text shadow-sm outline-none transition focus:border-accent"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-t2">
                Inspector
              </label>
              <input
                value={form.inspector}
                onChange={event => set('inspector', event.target.value)}
                placeholder="Nombre del inspector"
                className="h-12 w-full rounded-xl border border-border bg-s2 px-4 text-[15px] text-text shadow-sm outline-none transition focus:border-accent"
              />
            </div>
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-t2">
                Fecha de inspeccion
              </label>
              <input
                type="date"
                value={form.inspectionDate}
                onChange={event => set('inspectionDate', event.target.value)}
                className="h-12 w-full rounded-xl border border-border bg-s2 px-4 text-[15px] text-text shadow-sm outline-none transition focus:border-accent"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-t2">
              Descripcion del edificio
            </label>
            <textarea
              value={form.description}
              onChange={event => set('description', event.target.value)}
              placeholder="Tipologia, numero de plantas, estructura y acabados"
              className="min-h-36 w-full rounded-xl border border-border bg-s2 px-4 py-3 text-[15px] text-text shadow-sm outline-none transition focus:border-accent"
            />
          </div>
        </div>

        <footer className="border-t border-border/80 px-6 py-6">
          <div className="flex flex-col items-stretch justify-center gap-4 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="inline-flex h-12 min-w-44 items-center justify-center gap-2 rounded-xl border border-border bg-white px-6 text-sm font-semibold text-text shadow-sm transition hover:border-accent/35 hover:text-accent disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="h-4 w-4" strokeWidth={2.4} />
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
              className="inline-flex h-12 min-w-56 items-center justify-center gap-2 rounded-xl bg-accent px-6 text-sm font-semibold text-white shadow-md shadow-blue-600/30 transition hover:bg-accent-h disabled:cursor-not-allowed disabled:opacity-55"
            >
              {isEditing ? <Save className="h-4 w-4" strokeWidth={2.4} /> : <FolderPlus className="h-4 w-4" strokeWidth={2.4} />}
              {submitting
                ? (isEditing ? 'Guardando cambios...' : 'Creando proyecto...')
                : (isEditing ? 'Guardar cambios' : 'Crear proyecto')}
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}
