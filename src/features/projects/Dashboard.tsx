import { useEffect } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { formatDate } from '@/utils/codeGenerator'

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
      <header className="px-6 py-5 bg-s1 border-b border-border shrink-0">
        <div className="max-w-[1100px] mx-auto w-full flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/>
                  <path d="M9 9v.01"/><path d="M9 12v.01"/><path d="M9 15v.01"/><path d="M9 18v.01"/>
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h1 className="font-title text-xl font-extrabold tracking-tight leading-tight">InspecApp</h1>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-accent-d text-accent border border-accent/30">BETA</span>
                </div>
                <div className="text-[11px] text-t3 font-semibold tracking-widest uppercase leading-none mt-0.5">SOCOTEC Engineering</div>
              </div>
            </div>
            <p className="text-[13px] text-t2">
              Gestion de inspecciones de edificios &middot; Nomenclatura, croquis y exportacion integrados
            </p>
          </div>
          <button
            onClick={onCreateNew}
            className="inline-flex items-center gap-2 rounded-[var(--radius)] font-semibold transition-all duration-150 whitespace-nowrap cursor-pointer bg-accent text-white hover:bg-accent-h active:brightness-90 px-5 py-2.5 text-sm"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Nuevo proyecto
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-[1100px] mx-auto w-full">
          {loading ? (
            <div className="flex items-center justify-center h-40 text-t3 text-sm">
              Cargando proyectos...
            </div>
          ) : projects.length === 0 ? (
            <EmptyState onCreate={onCreateNew} />
          ) : (
            <>
              <div className="text-[10px] font-bold uppercase tracking-[.1em] text-t3 mb-4">
                Proyectos recientes ({projects.length})
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(290px,1fr))] gap-4">
                {projects.map(p => (
                  <ProjectCard key={p.id} project={p} onClick={() => onOpenProject(p.id)} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="max-w-[420px] mx-auto mt-24 text-center animate-fade-in">
      <div className="w-20 h-20 bg-s2 border border-border rounded-[var(--radius-lg)] flex items-center justify-center mx-auto mb-5">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-t3">
          <path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/>
        </svg>
      </div>
      <h2 className="font-title text-xl mb-3">Comienza la primera inspeccion</h2>
      <p className="text-t2 mb-6 text-[14px] leading-relaxed">
        Crea un proyecto para cada edificio. Agrega zonas, dibuja croquis, marca las lesiones y exporta el informe PDF.
      </p>
      <button
        onClick={onCreate}
        className="inline-flex items-center gap-2 rounded-[var(--radius)] font-semibold transition-all cursor-pointer bg-accent text-white hover:bg-accent-h px-6 py-3 text-sm"
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
  return (
    <div onClick={onClick} className="proj-card animate-fade-in group">
      {/* Cabecera */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0 pr-3">
          <h2 className="font-title text-[15px] font-bold leading-tight mb-1 truncate">{p.name}</h2>
          <div className="text-[12px] text-t2 truncate">{p.address}</div>
        </div>
        <span className="font-mono text-[10px] text-t3 bg-s3 border border-border px-2 py-0.5 rounded shrink-0">{p.workCode}</span>
      </div>

      {/* Separador */}
      <div className="h-px bg-border mb-3" />

      {/* Metadata */}
      <div className="flex justify-between items-center text-[11px] text-t3">
        <span className="flex items-center gap-1.5">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          {p.inspectionDate ? formatDate(p.inspectionDate) : '—'}
        </span>
        <span className="flex items-center gap-1.5">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          {p.inspector || '—'}
        </span>
      </div>

      {/* Open hint */}
      <div className="mt-3 text-[11px] text-accent opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
        Abrir proyecto →
      </div>
    </div>
  )
}
