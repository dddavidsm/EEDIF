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
      <div className="mx-auto flex max-w-[1320px] flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <section className="rounded-2xl border border-white/80 bg-white/90 p-6 shadow-lg shadow-slate-200/70 backdrop-blur sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/15 bg-accent/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-accent">
                <Building2 className="h-4 w-4" strokeWidth={2.2} />
                Panel de proyectos
              </div>
              <h2 className="font-title text-3xl leading-tight text-text sm:text-4xl">
                Proyectos recientes con acceso directo a inspeccion y edicion
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-t2">
                Selecciona un proyecto para entrar al entorno de trabajo o abre su ficha para corregir nombre, codigo, direccion e informacion operativa.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-s2 px-5 py-4 shadow-sm">
                <div className="text-sm font-semibold text-t3">Proyectos cargados</div>
                <div className="mt-2 text-3xl font-title text-text">{projects.length}</div>
              </div>
              <button
                type="button"
                onClick={onCreateNew}
                className="inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-accent px-5 py-4 text-left text-white shadow-md shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-accent-h"
              >
                <Plus className="h-5 w-5 shrink-0" strokeWidth={2.4} />
                <span>
                  <span className="block text-sm font-semibold">Crear proyecto</span>
                  <span className="block text-xs text-white/80">Alta rapida de un nuevo edificio</span>
                </span>
              </button>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.22em] text-t3">Listado activo</div>
              <h3 className="mt-1 text-2xl font-title text-text">Cartera de inspecciones</h3>
            </div>
            <div className="rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-t2 shadow-sm">
              {projects.length} proyecto{projects.length === 1 ? '' : 's'}
            </div>
          </div>

          {loading ? (
            <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-border bg-white/70 text-base text-t3 shadow-sm">
              Cargando proyectos...
            </div>
          ) : projects.length === 0 ? (
            <EmptyState onCreate={onCreateNew} />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
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
    <div className="animate-fade-in rounded-2xl border border-dashed border-border bg-white/80 px-6 py-14 text-center shadow-sm sm:px-10">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-s2 text-t2 shadow-sm">
        <Building2 className="h-9 w-9" strokeWidth={1.8} />
      </div>
      <h2 className="font-title text-3xl leading-tight text-text">Crea el primer proyecto de inspeccion</h2>
      <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-t2">
        Crea un proyecto para cada edificio. Agrega zonas, dibuja croquis, marca las lesiones y exporta el informe PDF.
      </p>
      <button
        type="button"
        onClick={onCreate}
        className="mt-8 inline-flex min-h-14 items-center justify-center gap-3 rounded-2xl bg-accent px-6 py-4 text-base font-semibold text-white shadow-md shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-accent-h"
      >
        <Plus className="h-5 w-5" strokeWidth={2.4} />
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
    <article className="animate-fade-in flex flex-col gap-6 rounded-2xl border border-border bg-white p-6 shadow-md shadow-slate-200/70 transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-accent/10 text-accent">
          <Building2 className="h-6 w-6" strokeWidth={2.1} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="font-title text-2xl leading-tight text-text">{p.name}</h4>
              <p className="mt-2 text-sm font-medium uppercase tracking-[0.22em] text-t3">
                Proyecto de inspeccion
              </p>
            </div>
            <span className="inline-flex min-h-10 items-center rounded-full border border-border bg-s2 px-4 text-sm font-semibold text-t2 shadow-sm">
              {p.workCode || 'Sin codigo'}
            </span>
          </div>
          <div className="mt-4 flex items-start gap-3 text-base leading-6 text-t2">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-t3" strokeWidth={2} />
            <span className="line-clamp-2">{p.address}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 rounded-2xl border border-border bg-s2/70 p-4 sm:grid-cols-2">
        <div className="flex items-start gap-3">
          <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-t3" strokeWidth={2} />
          <div>
            <div className="text-sm font-semibold text-text">Fecha de inspeccion</div>
            <div className="mt-1 text-sm text-t2">{p.inspectionDate ? formatDate(p.inspectionDate) : 'Pendiente'}</div>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <UserRound className="mt-0.5 h-5 w-5 shrink-0 text-t3" strokeWidth={2} />
          <div>
            <div className="text-sm font-semibold text-text">Inspector</div>
            <div className="mt-1 text-sm text-t2">{p.inspector || 'Sin asignar'}</div>
          </div>
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-3 pt-1 sm:flex-row">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex min-h-12 flex-1 items-center justify-center gap-3 rounded-xl border border-border bg-white px-4 py-3 text-sm font-semibold text-text shadow-sm transition hover:-translate-y-0.5 hover:border-accent/30 hover:text-accent"
        >
          <FilePenLine className="h-4 w-4" strokeWidth={2.2} />
          Editar proyecto
        </button>
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex min-h-12 flex-1 items-center justify-center gap-3 rounded-xl bg-accent px-4 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition hover:-translate-y-0.5 hover:bg-accent-h"
        >
          <FolderOpen className="h-4 w-4" strokeWidth={2.2} />
          Abrir inspeccion
        </button>
      </div>
    </article>
  )
}
