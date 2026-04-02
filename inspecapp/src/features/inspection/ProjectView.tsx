import { useState } from 'react'
import { useProjectStore, selectActiveProject } from '@/store/useProjectStore'
import { NewZoneModal } from '@/features/inspection/NewZoneModal'
import { SketchCanvas, type CanvasTool } from '@/features/inspection/canvas/SketchCanvas'
import { Button } from '@/components/Button'

interface ProjectViewProps {
  onBack: () => void
}

export function ProjectView({ onBack }: ProjectViewProps) {
  const project = useProjectStore(selectActiveProject)
  const zones = useProjectStore(s => s.zones)
  const activeZoneId = useProjectStore(s => s.activeZoneId)
  const setActiveZone = useProjectStore(s => s.setActiveZone)
  const lesions = useProjectStore(s => s.lesions)

  const [showNewZone, setShowNewZone] = useState(false)
  const [view, setView] = useState<'croquis' | 'stats'>('croquis')
  const [tool, setTool] = useState<CanvasTool>('select')
  const [selectedLesionId, setSelectedLesionId] = useState<string | null>(null)

  const activeZone = zones.find(z => z.id === activeZoneId) ?? null
  const urgentCount = lesions.filter(l => l.urgency === 'U').length

  if (!project) return null

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ── Top bar corporativa ─────────────────────────────────── */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 bg-s1 border-b border-border shrink-0">
        <Button variant="ghost" size="sm" onClick={onBack}>← Inicio</Button>
        <div className="w-px h-5 bg-border" />

        {/* Logo + Info proyecto */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-7 h-7 bg-accent rounded-md flex items-center justify-center shrink-0">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/>
            </svg>
          </div>
          <div className="min-w-0">
            <div className="font-title text-[15px] font-extrabold leading-tight truncate">
              {project.name}
            </div>
            <div className="text-[11px] text-t2 truncate">
              {project.address} &middot; <span className="font-mono">{project.workCode}</span>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-1.5 shrink-0">
          {urgentCount > 0 && (
            <span className="inline-flex items-center px-[7px] py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-danger/[.15] text-danger">
              ⚠ {urgentCount} urgentes
            </span>
          )}
          <Button
            variant={view === 'croquis' ? 'accent' : 'ghost'}
            size="sm"
            onClick={() => setView('croquis')}
          >
            🗺 Croquis
          </Button>
          <Button
            variant={view === 'stats' ? 'accent' : 'ghost'}
            size="sm"
            onClick={() => setView('stats')}
          >
            📊 Stats
          </Button>
          <Button variant="ghost" size="sm">
            📤 Exportar
          </Button>
        </div>
      </div>

      {view === 'stats' ? (
        <StatsPlaceholder project={project} />
      ) : (
        <>
          {/* ── Pestanas de zonas ──────────────────────────────────── */}
          <ZoneTabs
            zones={zones}
            activeZoneId={activeZoneId}
            onSelect={setActiveZone}
            onAdd={() => setShowNewZone(true)}
          />

          {/* ── Contenido de la zona ───────────────────────────────── */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeZone ? (
              <ZoneContent
                zone={activeZone}
                tool={tool}
                setTool={setTool}
                selectedLesionId={selectedLesionId}
                onSelectLesion={setSelectedLesionId}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center flex-col gap-3 text-t3">
                <span className="text-5xl">🗺</span>
                <div className="text-[15px] font-semibold text-t2">Ninguna zona creada</div>
                <Button variant="accent" onClick={() => setShowNewZone(true)}>
                  + Agregar primera zona
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      <NewZoneModal open={showNewZone} onClose={() => setShowNewZone(false)} />
    </div>
  )
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function ZoneTabs({
  zones,
  activeZoneId,
  onSelect,
  onAdd,
}: {
  zones: { id: string; name: string; }[]
  activeZoneId: string | null
  onSelect: (id: string) => Promise<void>
  onAdd: () => void
}) {
  return (
    <div className="flex gap-0.5 overflow-x-auto px-3 pt-2 bg-s1 border-b border-border shrink-0 scrollbar-none">
      {zones.map(z => (
        <button
          key={z.id}
          onClick={() => onSelect(z.id)}
          className={`
            px-3.5 py-2 pb-[9px] rounded-t-md text-xs font-semibold cursor-pointer
            border border-b-0 whitespace-nowrap transition-all duration-150 relative top-px select-none
            ${z.id === activeZoneId
              ? 'bg-bg text-text border-border'
              : 'bg-s2 text-t2 border-border hover:bg-s3 hover:text-text'}
          `}
        >
          {z.name}
        </button>
      ))}
      <button
        onClick={onAdd}
        className="px-2.5 py-2 rounded-t-md text-base cursor-pointer border border-dashed border-b-0 border-border bg-transparent text-t3 relative top-px transition-all duration-150 hover:text-accent hover:border-accent hover:bg-accent-d leading-none"
      >
        ＋
      </button>
    </div>
  )
}

function ZoneContent({
  zone,
  tool,
  setTool,
  selectedLesionId,
  onSelectLesion,
}: {
  zone: { id: string; name: string; floor: string; unit: string; type: string }
  tool: CanvasTool
  setTool: (t: CanvasTool) => void
  selectedLesionId: string | null
  onSelectLesion: (id: string | null) => void
}) {
  const lesions = useProjectStore(s => s.lesions)
  const canvasElements = useProjectStore(s => s.canvasElements)

  const tools: { key: CanvasTool; icon: string; label: string }[] = [
    { key: 'select', icon: '↖', label: 'Seleccionar' },
    { key: 'rect',   icon: '⬜', label: 'Dibujar' },
    { key: 'lesion', icon: '📍', label: 'Lesion' },
  ]

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Panel izquierdo: Canvas */}
      <div className="flex flex-col flex-[0_0_62%] overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2.5 px-3.5 py-2 bg-s1 border-b border-border shrink-0">
          <div className="flex gap-1">
            {tools.map(tb => (
              <button
                key={tb.key}
                onClick={() => setTool(tb.key)}
                className={`
                  flex flex-col items-center gap-0.5 py-[6px] px-2.5 rounded-[var(--radius)]
                  cursor-pointer text-[10px] font-bold tracking-wider transition-all min-w-[52px] border
                  ${tool === tb.key
                    ? 'bg-accent-d text-accent border-accent'
                    : 'bg-transparent text-t2 border-border hover:bg-s3 hover:border-border2 hover:text-text'}
                `}
              >
                <span className="text-base leading-none">{tb.icon}</span>
                {tb.label}
              </button>
            ))}
          </div>
          <div className="w-px h-7 bg-border" />
          <div className="ml-auto flex items-center gap-3 text-[10px] text-t3 font-mono">
            <span>{canvasElements.length} elementos</span>
            <span>{lesions.length} lesiones</span>
          </div>
        </div>

        {/* Canvas Konva */}
        <div className="flex-1 relative overflow-hidden">
          <SketchCanvas
            tool={tool}
            selectedLesionId={selectedLesionId}
            onSelectLesion={onSelectLesion}
          />
        </div>

        {/* Barra inferior */}
        <div className="px-3 py-1.5 bg-s1 border-t border-border text-[10px] text-t3 shrink-0">
          {tool === 'select' && 'Arrastra para mover el croquis · Scroll para zoom · Clic en un pin para seleccionar'}
          {tool === 'rect' && 'Arrastra para dibujar un rectangulo · Suelta para definir la etiqueta'}
          {tool === 'lesion' && 'Haz clic en el croquis para colocar una nueva lesion'}
        </div>
      </div>

      {/* Panel derecho: Lista de lesiones (stub) */}
      <div className="flex-1 flex flex-col overflow-hidden border-l border-border bg-s1">
        <div className="px-3 py-2.5 flex justify-between items-center shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-t3">
            Lista de lesiones
          </span>
          <Button variant="accent" size="sm">+ Agregar</Button>
        </div>
        <div className="flex-1 overflow-y-auto p-[7px]">
          {lesions.length === 0 ? (
            <div className="py-7 px-3.5 text-center text-t3 text-xs">
              Ninguna lesion registrada en esta zona.<br />
              <span className="text-accent cursor-pointer">Usa 📍 para agregar una.</span>
            </div>
          ) : (
            lesions.map(l => (
              <div
                key={l.id}
                className="flex items-start gap-2 px-2.5 py-2 rounded-[var(--radius)] cursor-pointer border border-transparent transition-all hover:bg-s2 hover:border-border"
              >
                <div
                  className="w-[9px] h-[9px] rounded-full shrink-0 mt-[3px]"
                  style={{ background: '#F97316' }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="font-mono text-[11px] font-bold text-accent">{l.code}</span>
                  </div>
                  <div className="text-[11px] text-t2 truncate">{l.obs || 'Sin observaciones'}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function StatsPlaceholder({ project }: { project: { name: string } }) {
  return (
    <div className="flex-1 flex items-center justify-center text-t3">
      <div className="text-center">
        <span className="text-5xl block mb-3">📊</span>
        <div className="text-sm font-semibold text-t2 mb-1">Panel de estadisticas</div>
        <div className="text-xs text-t3">Se completara en la Fase 5 con datos reales</div>
      </div>
    </div>
  )
}
