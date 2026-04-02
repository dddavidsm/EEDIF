import { useState } from 'react'
import { useProjectStore, selectActiveProject } from '@/store/useProjectStore'
import { NewZoneModal } from '@/features/inspection/NewZoneModal'
import { LesionModal } from '@/features/inspection/LesionModal'
import { LesionPanel } from '@/features/inspection/LesionPanel'
import { StatsPanel } from '@/features/inspection/StatsPanel'
import { ExportModal } from '@/features/inspection/ExportModal'
import { SketchCanvas, type CanvasTool } from '@/features/inspection/canvas/SketchCanvas'
import type { Lesion } from '@/types'

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
  const [lesionModal, setLesionModal] = useState<{ open: boolean; lesion?: Lesion | null }>({ open: false })
  const [showExport, setShowExport] = useState(false)

  const activeZone = zones.find(z => z.id === activeZoneId) ?? null
  const urgentCount = lesions.filter(l => l.urgency === 'U').length

  if (!project) return null

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ── Top bar corporativa ─────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-3 bg-s1 border-b border-border shrink-0">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-[var(--radius)] text-[12px] font-semibold text-t2 border border-border hover:bg-s2 hover:text-text hover:border-border2 transition-all shrink-0"
        >
          ← Inicio
        </button>
        <div className="w-px h-6 bg-border shrink-0" />

        {/* Info proyecto */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-8 h-8 bg-accent rounded-[var(--radius)] flex items-center justify-center shrink-0">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/>
            </svg>
          </div>
          <div className="min-w-0">
            <div className="font-title text-[15px] font-extrabold leading-tight truncate">{project.name}</div>
            <div className="text-[11px] text-t2 truncate">
              {project.address} &middot; <span className="font-mono text-t3">{project.workCode}</span>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2 shrink-0">
          {urgentCount > 0 && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold tracking-wide uppercase bg-danger/[.15] text-danger border border-danger/20">
              ⚠ {urgentCount} urgentes
            </span>
          )}
          <div className="flex bg-s2 border border-border rounded-[var(--radius)] p-0.5 gap-0.5">
            <button
              onClick={() => setView('croquis')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-semibold transition-all ${view === 'croquis' ? 'bg-accent text-white' : 'text-t2 hover:text-text'}`}
            >
              🗺 Croquis
            </button>
            <button
              onClick={() => setView('stats')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-[12px] font-semibold transition-all ${view === 'stats' ? 'bg-accent text-white' : 'text-t2 hover:text-text'}`}
            >
              📊 Stats
            </button>
          </div>
          <button
            onClick={() => setShowExport(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-[var(--radius)] text-[12px] font-semibold text-t2 border border-border hover:bg-s2 hover:text-text hover:border-border2 transition-all"
          >
            📤 Exportar
          </button>
        </div>
      </div>

      {view === 'stats' ? (
        <StatsPanel />
      ) : (
        <>
          {/* ── Pestanas de zonas ──────────────────────────────────── */}
          <div className="flex gap-0.5 overflow-x-auto px-3 pt-2 bg-s1 border-b border-border shrink-0 scrollbar-none">
            {zones.map(z => {
              const urgZ = lesions.filter(l => l.zoneId === z.id && l.urgency === 'U').length
              return (
                <button
                  key={z.id}
                  onClick={() => setActiveZone(z.id)}
                  className={`zone-tab ${z.id === activeZoneId ? 'active' : ''}`}
                >
                  {z.name}
                  {urgZ > 0 && (
                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-danger text-white text-[8px] font-bold leading-none">
                      {urgZ}
                    </span>
                  )}
                </button>
              )
            })}
            <button onClick={() => setShowNewZone(true)} className="zone-tab-add">＋</button>
          </div>

          {/* ── Contenido de la zona ───────────────────────────────── */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeZone ? (
              <ZoneContent
                tool={tool}
                setTool={setTool}
                selectedLesionId={selectedLesionId}
                onSelectLesion={setSelectedLesionId}
                onEditLesion={(l) => setLesionModal({ open: true, lesion: l })}
                onAddLesion={() => setTool('lesion')}
              />
            ) : (
              <div className="flex-1 flex items-center justify-center flex-col gap-4 text-t3">
                <div className="w-16 h-16 bg-s2 border border-border rounded-[var(--radius-lg)] flex items-center justify-center">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/>
                  </svg>
                </div>
                <div className="text-center">
                  <div className="text-[15px] font-semibold text-t2 mb-1">Ninguna zona creada</div>
                  <div className="text-[12px] text-t3">Agrega zonas para organizar la inspeccion</div>
                </div>
                <button
                  onClick={() => setShowNewZone(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--radius)] bg-accent text-white text-sm font-semibold hover:bg-accent-h transition-all"
                >
                  + Agregar primera zona
                </button>
              </div>
            )}
          </div>
        </>
      )}

      <NewZoneModal open={showNewZone} onClose={() => setShowNewZone(false)} />
      <LesionModal
        open={lesionModal.open}
        onClose={() => setLesionModal({ open: false })}
        lesion={lesionModal.lesion}
      />
      <ExportModal open={showExport} onClose={() => setShowExport(false)} />
    </div>
  )
}

// ─── Zone content ─────────────────────────────────────────────────────────────

function ZoneContent({
  tool,
  setTool,
  selectedLesionId,
  onSelectLesion,
  onEditLesion,
  onAddLesion,
}: {
  tool: CanvasTool
  setTool: (t: CanvasTool) => void
  selectedLesionId: string | null
  onSelectLesion: (id: string | null) => void
  onEditLesion: (l: Lesion) => void
  onAddLesion: () => void
}) {
  const lesions = useProjectStore(s => s.lesions)
  const canvasElements = useProjectStore(s => s.canvasElements)

  const tools: { key: CanvasTool; icon: string; label: string }[] = [
    { key: 'select', icon: '↖', label: 'Seleccionar' },
    { key: 'rect',   icon: '⬜', label: 'Dibujar' },
    { key: 'lesion', icon: '📍', label: 'Lesion' },
  ]

  const urgentCount = lesions.filter(l => l.urgency === 'U').length

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Panel izquierdo: Canvas */}
      <div className="flex flex-col flex-[0_0_62%] overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-s1 border-b border-border shrink-0">
          <div className="flex gap-1.5">
            {tools.map(tb => (
              <button
                key={tb.key}
                onClick={() => setTool(tb.key)}
                className={`tool-btn ${tool === tb.key ? 'active' : ''}`}
              >
                <span className="tool-icon">{tb.icon}</span>
                {tb.label}
              </button>
            ))}
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="flex items-center gap-3 text-[11px] font-mono">
            <span className="text-t3">{canvasElements.length} elem.</span>
            <span className="text-t3">{lesions.length} lesiones</span>
            {urgentCount > 0 && <span className="text-danger font-bold">{urgentCount}U</span>}
          </div>
          <div className="text-[10px] text-t3 ml-auto hidden lg:block">
            {tool === 'select' && 'Arrastra · Scroll para zoom'}
            {tool === 'rect' && 'Arrastra para dibujar'}
            {tool === 'lesion' && 'Clic para colocar lesion'}
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
      </div>

      {/* Panel derecho: Lesiones */}
      <LesionPanel
        selectedId={selectedLesionId}
        onSelect={onSelectLesion}
        onEditLesion={onEditLesion}
        onAddLesion={onAddLesion}
      />
    </div>
  )
}


interface ProjectViewProps {
  onBack: () => void
}
