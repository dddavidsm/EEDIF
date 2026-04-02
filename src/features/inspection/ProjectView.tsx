import { useState, type ReactNode } from 'react'
import { useProjectStore, selectActiveProject } from '@/store/useProjectStore'
import { NewZoneModal } from '@/features/inspection/NewZoneModal'
import { LesionModal } from '@/features/inspection/LesionModal'
import { LesionPanel } from '@/features/inspection/LesionPanel'
import { StatsPanel } from '@/features/inspection/StatsPanel'
import { ExportModal } from '@/features/inspection/ExportModal'
import { SketchCanvas, type CanvasTool } from '@/features/inspection/canvas/SketchCanvas'
import type { Lesion } from '@/types'
import {
  ArrowLeft,
  Building2,
  ChartColumn,
  DraftingCompass,
  FileDown,
  MapPinPlus,
  MousePointer2,
  Plus,
  Square,
  TriangleAlert,
} from 'lucide-react'

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
            <ArrowLeft className="h-4 w-4" strokeWidth={2.3} />
            Inicio
          </button>

          <div className="flex items-center gap-2.5 min-w-0 flex-1 order-3 lg:order-none w-full lg:w-auto">
            <div className="w-10 h-10 rounded-[var(--radius)] bg-accent flex items-center justify-center shrink-0 text-white">
              <Building2 className="h-[18px] w-[18px]" strokeWidth={2.2} />
            </div>
            <div className="min-w-0">
              <div className="text-sm lg:text-base font-semibold leading-tight truncate">{project.name}</div>
              <div className="text-[12px] lg:text-[13px] text-t2 truncate">
                {project.address} <span className="mx-1">•</span>
                <span className="font-mono text-t3">{project.workCode}</span>
              </div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-2 w-full lg:w-auto justify-end">
            {urgentCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius)] text-[11px] lg:text-[12px] font-bold bg-danger/15 text-danger border border-danger/25">
                <TriangleAlert className="h-3.5 w-3.5" strokeWidth={2.3} />
                {urgentCount} urgentes
              </span>
            )}

            <div className="inline-flex bg-s2 border border-border rounded-[var(--radius)] p-1 gap-1">
              <button
                onClick={() => setView('croquis')}
                className={`px-3 lg:px-4 py-2 rounded-[var(--radius-sm)] text-[12px] lg:text-[13px] font-semibold transition-all ${view === 'croquis' ? 'bg-accent text-white' : 'text-t2 hover:text-text hover:bg-s3'}`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <DraftingCompass className="h-3.5 w-3.5" strokeWidth={2.2} />
                  Croquis
                </span>
              </button>
              <button
                onClick={() => setView('stats')}
                className={`px-3 lg:px-4 py-2 rounded-[var(--radius-sm)] text-[12px] lg:text-[13px] font-semibold transition-all ${view === 'stats' ? 'bg-accent text-white' : 'text-t2 hover:text-text hover:bg-s3'}`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <ChartColumn className="h-3.5 w-3.5" strokeWidth={2.2} />
                  Estadisticas
                </span>
              </button>
            </div>

            <button onClick={() => setShowExport(true)} className="app-btn app-btn-ghost">
              <FileDown className="h-4 w-4" strokeWidth={2.2} />
              Exportar
            </button>
          </div>
        </div>
      </header>

      {view === 'stats' ? (
        <StatsPanel />
      ) : (
        <>
          <div className="shrink-0 border-b border-border bg-white/85 px-4 py-4 shadow-sm backdrop-blur-md lg:px-6">
            <div className="mx-auto flex w-full max-w-[1400px] items-center gap-3 overflow-x-auto scrollbar-none">
              {zones.map(z => {
                const urgZ = lesions.filter(l => l.zoneId === z.id && l.urgency === 'U').length
                const isActive = z.id === activeZoneId
                return (
                  <button
                    key={z.id}
                    onClick={() => setActiveZone(z.id)}
                    className={`inline-flex h-12 items-center gap-2 rounded-full border px-6 text-sm font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? 'border-accent bg-accent text-white shadow-md shadow-blue-600/20'
                        : 'border-border bg-s2 text-t2 hover:border-accent/35 hover:bg-s3 hover:text-text'
                    }`}
                  >
                    <span>{z.name}</span>
                    {urgZ > 0 && (
                      <span className={`inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${isActive ? 'bg-white/20 text-white' : 'bg-danger text-white'}`}>
                        {urgZ}
                      </span>
                    )}
                  </button>
                )
              })}

              <button
                onClick={() => setShowNewZone(true)}
                className="inline-flex h-12 items-center gap-2 rounded-full border border-dashed border-accent/45 bg-accent/10 px-6 text-sm font-semibold text-accent transition hover:border-accent hover:bg-accent/15"
                aria-label="Nueva zona"
              >
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                Nueva zona
              </button>
            </div>
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
                    <Building2 className="h-7 w-7" strokeWidth={1.8} />
                  </div>
                  <h3 className="text-base font-semibold mb-2">Ninguna zona creada</h3>
                  <p className="text-[14px] text-t2 mb-5">Crea una zona para empezar a dibujar el plano y registrar lesiones.</p>
                  <button onClick={() => setShowNewZone(true)} className="app-btn app-btn-accent mx-auto">
                    <Plus className="h-4 w-4" strokeWidth={2.5} />
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
      icon: <MousePointer2 className="h-5 w-5" strokeWidth={2.2} />,
    },
    {
      key: 'rect',
      label: 'Dibujar area',
      icon: <Square className="h-5 w-5" strokeWidth={2.2} />,
    },
    {
      key: 'lesion',
      label: 'Agregar lesion',
      icon: <MapPinPlus className="h-5 w-5" strokeWidth={2.2} />,
    },
  ]

  return (
    <div className="flex flex-1 overflow-hidden flex-col lg:flex-row">
      <section className="flex flex-col lg:flex-[0_0_67%] min-h-0 border-b lg:border-b-0 lg:border-r border-border bg-s1">
        <div className="shrink-0 border-b border-border bg-white/85 px-4 py-4 backdrop-blur-sm lg:px-5">
          <div className="flex items-center gap-4 overflow-x-auto scrollbar-none">
            <div className="flex gap-3">
            {tools.map(tb => (
              <button
                key={tb.key}
                onClick={() => setTool(tb.key)}
                className={`inline-flex h-11 min-w-[120px] flex-col items-center justify-center gap-0.5 rounded-lg border px-3 text-center transition-all ${
                  tool === tb.key
                    ? 'border-accent bg-accent text-white shadow-md shadow-blue-600/25'
                    : 'border-border bg-s2 text-t2 hover:border-accent/30 hover:bg-s3 hover:text-text'
                }`}
                aria-pressed={tool === tb.key}
              >
                <span>{tb.icon}</span>
                <span className="text-xs font-semibold tracking-wide">{tb.label}</span>
              </button>
            ))}
          </div>

            <div className="ml-auto flex items-center gap-3 text-xs">
              <span className="inline-flex h-10 items-center rounded-xl border border-border bg-white px-4 font-semibold text-t2 shadow-sm">
                {canvasElements.length} areas
            </span>
              <span className="inline-flex h-10 items-center rounded-xl border border-border bg-white px-4 font-semibold text-t2 shadow-sm">
                {lesions.length} lesiones
            </span>
            </div>
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
