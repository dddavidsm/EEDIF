import { useEffect } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { formatDate } from '@/utils/codeGenerator'
import { URGENCY_LEVELS } from '@/types'

interface DashboardProps {
  onOpenProject: (id: string) => void
  onCreateNew: () => void
}

export function Dashboard({ onOpenProject, onCreateNew }: DashboardProps) {
  const projects = useProjectStore(s => s.projects)
  const loading = useProjectStore(s => s.loading)
  const loadProjects = useProjectStore(s => s.loadProjects)

  useEffect(() => {
    loadProjects()
  }, [loadProjects])

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header corporativo SOCOTEC */}
      <header className="px-6 py-[18px] bg-s1 border-b border-border shrink-0">
        <div className="max-w-[1100px] mx-auto w-full flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <div className="flex items-center gap-2">
                <div className="w-[34px] h-[34px] bg-accent rounded-lg flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/>
                    <path d="M9 9v.01"/><path d="M9 12v.01"/><path d="M9 15v.01"/><path d="M9 18v.01"/>
                  </svg>
                </div>
                <div>
                  <h1 className="font-title text-lg font-extrabold tracking-tight leading-tight">InspecApp</h1>
                  <div className="text-[10px] text-t3 font-semibold tracking-wider uppercase leading-none">SOCOTEC Engineering</div>
                </div>
              </div>
              <span className="inline-flex items-center px-[7px] py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-accent-d text-accent">
                BETA
              </span>
            </div>
            <p className="text-[13px] text-t2">
              Gestion de inspecciones de edificios &middot; Nomenclatura, croquis y exportacion
            </p>
          </div>
          <button
            onClick={onCreateNew}
            className="inline-flex items-center gap-1.5 rounded-[var(--radius)] font-semibold transition-all duration-150 whitespace-nowrap cursor-pointer bg-accent text-white hover:bg-accent-h px-[18px] py-2.5 text-sm"
          >
            + Nuevo proyecto
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6 max-w-[1100px] mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center h-full text-t3 text-sm">
            Cargando proyectos...
          </div>
        ) : projects.length === 0 ? (
          <EmptyState onCreate={onCreateNew} />
        ) : (
          <>
            <div className="text-[10px] font-bold uppercase tracking-[.1em] text-t3 mb-3.5">
              Proyectos recientes ({projects.length})
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(270px,1fr))] gap-3.5">
              {projects.map(p => (
                <ProjectCard key={p.id} project={p} onClick={() => onOpenProject(p.id)} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="max-w-[400px] mx-auto mt-20 text-center">
      <div className="text-[60px] mb-3.5">🏢</div>
      <h2 className="font-title text-xl mb-2">Comienza la primera inspeccion</h2>
      <p className="text-t2 mb-5 text-sm">
        Crea un proyecto para cada edificio. Agrega zonas, croquis, marca las lesiones y exporta el informe.
      </p>
      <button
        onClick={onCreate}
        className="inline-flex items-center gap-1.5 rounded-[var(--radius)] font-semibold transition-all duration-150 cursor-pointer bg-accent text-white hover:bg-accent-h px-[22px] py-2.5 text-sm"
      >
        Crear primer proyecto
      </button>
    </div>
  )
}

interface ProjectCardProps {
  project: {
    id: string
    name: string
    workCode: string
    address: string
    inspector: string
    inspectionDate: string
  }
  onClick: () => void
}

function ProjectCard({ project: p, onClick }: ProjectCardProps) {
  // En Fase 2 no tenemos las lesiones cargadas por proyecto para la tarjeta,
  // usaremos un componente async en futuras fases. Por ahora mostramos datos base.
  return (
    <div
      onClick={onClick}
      className="
        bg-s1 border border-border rounded-[var(--radius-md)] p-5 cursor-pointer
        transition-all duration-200 relative overflow-hidden group
        hover:border-accent hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,.4)]
      "
    >
      {/* Acento superior */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-accent opacity-0 transition-opacity group-hover:opacity-100" />

      {/* Cabecera */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1 min-w-0">
          <h2 className="font-title text-sm font-bold mb-0.5 truncate">{p.name}</h2>
          <div className="text-[11px] text-t2 truncate">{p.address}</div>
        </div>
        <span className="font-mono text-[10px] text-t3 ml-2 shrink-0">{p.workCode}</span>
      </div>

      {/* Info */}
      <div className="flex justify-between items-center text-[11px] text-t3 mt-3">
        <span>📅 {p.inspectionDate ? formatDate(p.inspectionDate) : '—'}</span>
        <span>👤 {p.inspector || '—'}</span>
      </div>
    </div>
  )
}
