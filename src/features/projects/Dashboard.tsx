import { useEffect } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { formatDate } from '@/utils/codeGenerator'
import type { Project } from '@/types'
import { Building2, CalendarDays, FilePenLine, FolderOpen, MapPin, Plus, UserRound } from 'lucide-react'

interface DashboardProps {
  onOpenProject: (id: string) => void
  onCreateNew: () => void
  onEditProject: (project: Project) => void
}

export function Dashboard({ onOpenProject, onCreateNew, onEditProject }: DashboardProps) {
  const projects = useProjectStore(s => s.projects)
  const loading = useProjectStore(s => s.loading)
  const loadProjects = useProjectStore(s => s.loadProjects)

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-5 lg:px-6 lg:py-6">
        <section className="rounded-xl border border-border/60 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-1 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent">
                <Building2 className="h-3.5 w-3.5" strokeWidth={2} />
                Panel de proyectos
              </div>
              <h2 className="text-lg font-semibold text-text">
                Proyectos recientes
              </h2>
              <p className="mt-1 text-sm text-t2">
                Selecciona un proyecto para inspeccionar o editar su ficha.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-lg border border-border bg-s2 px-3 py-2 text-center">
                <div className="text-xs text-t3">Proyectos</div>
                <div className="text-lg font-semibold text-text">{projects.length}</div>
              </div>
              <button
                type="button"
                onClick={onCreateNew}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-white transition hover:bg-accent-h"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
                Crear proyecto
              </button>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-text">Cartera de inspecciones</h3>
            <span className="rounded-full border border-border bg-white px-3 py-1 text-xs font-medium text-t2">
              {projects.length} proyecto{projects.length === 1 ? '' : 's'}
            </span>
          </div>

          {loading ? (
            <div className="flex h-32 items-center justify-center rounded-xl border border-dashed border-border bg-white/70 text-sm text-t3">
              Cargando proyectos...
            </div>
          ) : projects.length === 0 ? (
            <EmptyState onCreate={onCreateNew} />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {projects.map(p => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  onOpen={() => onOpenProject(p.id)}
                  onEdit={() => onEditProject(p)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-white/80 px-6 py-10 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-s2 text-t2">
        <Building2 className="h-6 w-6" strokeWidth={1.8} />
      </div>
      <h2 className="text-base font-semibold text-text">Crea el primer proyecto de inspeccion</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-t2">
        Crea un proyecto para cada edificio. Agrega zonas, dibuja croquis, marca las lesiones y exporta el informe PDF.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-5 inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-white transition hover:bg-accent-h"
      >
        <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
        Crear primer proyecto
      </button>
    </div>
  )
}

interface ProjectCardProps {
  project: Project
  onOpen: () => void
  onEdit: () => void
}

function ProjectCard({ project: p, onOpen, onEdit }: ProjectCardProps) {
  return (
    <article className="flex flex-col gap-4 rounded-xl border border-border bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <Building2 className="h-4 w-4" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0">
              <h4 className="text-sm font-semibold leading-snug text-text">{p.name}</h4>
            </div>
            <span className="inline-flex items-center rounded-md border border-border bg-s2 px-2 py-0.5 text-xs font-medium text-t2">
              {p.workCode || 'Sin codigo'}
            </span>
          </div>
          <div className="mt-2 flex items-start gap-2 text-sm text-t2">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-t3" strokeWidth={2} />
            <span className="line-clamp-2">{p.address}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-3 rounded-lg border border-border/60 bg-s2/50 p-3 sm:grid-cols-2">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-3.5 w-3.5 shrink-0 text-t3" strokeWidth={2} />
          <div>
            <div className="text-xs font-medium text-text">{p.inspectionDate ? formatDate(p.inspectionDate) : 'Pendiente'}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <UserRound className="h-3.5 w-3.5 shrink-0 text-t3" strokeWidth={2} />
          <div>
            <div className="text-xs font-medium text-text">{p.inspector || 'Sin asignar'}</div>
          </div>
        </div>
      </div>

      <div className="mt-auto flex gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-white text-xs font-medium text-text transition hover:border-accent/30 hover:text-accent"
        >
          <FilePenLine className="h-3.5 w-3.5" strokeWidth={2} />
          Editar
        </button>
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-lg bg-accent text-xs font-medium text-white transition hover:bg-accent-h"
        >
          <FolderOpen className="h-3.5 w-3.5" strokeWidth={2} />
          Abrir
        </button>
      </div>
    </article>
  )
}
