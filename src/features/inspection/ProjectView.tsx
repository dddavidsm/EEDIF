import { useState, type ReactNode } from 'react'
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
    <div className="h-full flex flex-col overflow-hidden bg-bg">
      <header className="px-4 lg:px-6 py-3.5 bg-s1 border-b border-border shrink-0">
        <div className="max-w-[1400px] mx-auto w-full flex flex-wrap lg:flex-nowrap items-center gap-3">
          <button
            onClick={onBack}
            className="app-btn app-btn-ghost shrink-0"
            aria-label="Volver al inicio"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
            Inicio
          </button>

          <div className="flex items-center gap-2.5 min-w-0 flex-1 order-3 lg:order-none w-full lg:w-auto">
            <div className="w-10 h-10 rounded-[var(--radius)] bg-accent flex items-center justify-center shrink-0 text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/></svg>
            </div>
            <div className="min-w-0">
              <div className="font-title text-[17px] lg:text-[20px] leading-tight truncate">{project.name}</div>
              <div className="text-[12px] lg:text-[13px] text-t2 truncate">
                {project.address} <span className="mx-1">•</span>
                <span className="font-mono text-t3">{project.workCode}</span>
              </div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2 w-full lg:w-auto justify-end">
            {urgentCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius)] text-[11px] lg:text-[12px] font-bold bg-danger/15 text-danger border border-danger/25">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                {urgentCount} urgentes
              </span>
            )}

            <div className="inline-flex bg-s2 border border-border rounded-[var(--radius)] p-1 gap-1">
              <button
                onClick={() => setView('croquis')}
                className={`px-3 lg:px-4 py-2 rounded-[var(--radius-sm)] text-[12px] lg:text-[13px] font-semibold transition-all ${view === 'croquis' ? 'bg-accent text-white' : 'text-t2 hover:text-text hover:bg-s3'}`}
              >
                Croquis
              </button>
              <button
                onClick={() => setView('stats')}
                className={`px-3 lg:px-4 py-2 rounded-[var(--radius-sm)] text-[12px] lg:text-[13px] font-semibold transition-all ${view === 'stats' ? 'bg-accent text-white' : 'text-t2 hover:text-text hover:bg-s3'}`}
              >
                Estadisticas
              </button>
            </div>

            <button onClick={() => setShowExport(true)} className="app-btn app-btn-ghost">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Exportar
            </button>
          </div>
        </div>
      </header>

      {view === 'stats' ? (
        <StatsPanel />
      ) : (
        <>
          <div className="flex gap-1 overflow-x-auto px-3 lg:px-5 pt-2 bg-s1 border-b border-border shrink-0 scrollbar-none">
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
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-danger text-white text-[10px] font-bold leading-none">
                      {urgZ}
                    </span>
                  )}
                </button>
              )
            })}
            <button onClick={() => setShowNewZone(true)} className="zone-tab-add" aria-label="Agregar zona">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
          </div>

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
              <div className="flex-1 flex items-center justify-center px-6">
                <div className="max-w-[420px] text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-[var(--radius-lg)] bg-s2 border border-border flex items-center justify-center text-t2">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/></svg>
                  </div>
                  <h3 className="font-title text-[20px] mb-2">Ninguna zona creada</h3>
                  <p className="text-[14px] text-t2 mb-5">Crea una zona para empezar a dibujar el plano y registrar lesiones.</p>
                  <button onClick={() => setShowNewZone(true)} className="app-btn app-btn-accent mx-auto">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    Agregar primera zona
                  </button>
                </div>
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

  const tools: { key: CanvasTool; label: string; icon: ReactNode }[] = [
    {
      key: 'select',
      label: 'Seleccionar',
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3l7 18 2-8 8-2z"/></svg>,
    },
    {
      key: 'rect',
      label: 'Dibujar',
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>,
    },
    {
      key: 'lesion',
      label: 'Lesion',
      icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 21s-6-5.6-6-11a6 6 0 0 1 12 0c0 5.4-6 11-6 11z"/><circle cx="12" cy="10" r="2"/></svg>,
    },
  ]

  return (
    <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
      <section className="flex flex-col lg:flex-[0_0_67%] min-h-0 border-b lg:border-b-0 lg:border-r border-border bg-s1">
        <div className="flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2.5 bg-s1 border-b border-border shrink-0 overflow-x-auto">
          <div className="flex gap-2">
            {tools.map(tb => (
              <button
                key={tb.key}
                onClick={() => setTool(tb.key)}
                className={`tool-btn ${tool === tb.key ? 'active' : ''}`}
                aria-pressed={tool === tb.key}
              >
                <span className="tool-icon">{tb.icon}</span>
                <span>{tb.label}</span>
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2 lg:gap-3 text-[11px] lg:text-[12px]">
            <span className="px-2.5 py-1 rounded-[var(--radius-sm)] bg-s2 border border-border text-t2">
              {canvasElements.length} areas
            </span>
            <span className="px-2.5 py-1 rounded-[var(--radius-sm)] bg-s2 border border-border text-t2">
              {lesions.length} lesiones
            </span>
          </div>
        </div>

        <div className="relative flex-1 min-h-[44vh] lg:min-h-0">
          <SketchCanvas
            tool={tool}
            selectedLesionId={selectedLesionId}
            onSelectLesion={onSelectLesion}
          />
        </div>
      </section>

      <section className="flex-1 lg:flex-[0_0_33%] min-h-0">
        <LesionPanel
          selectedId={selectedLesionId}
          onSelect={onSelectLesion}
          onEditLesion={onEditLesion}
          onAddLesion={onAddLesion}
        />
      </section>
    </div>
  )
}
