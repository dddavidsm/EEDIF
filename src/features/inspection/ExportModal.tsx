import { useState } from 'react'
import {
  Archive,
  FileCode2,
  FileSpreadsheet,
  FileText,
  LoaderCircle,
  Package,
  Table,
} from 'lucide-react'
import { Modal } from '@/components/Modal'
import {
  exportCSV,
  exportJSON,
  exportPDF,
  exportXLSX,
  exportZIP,
} from '@/utils/exporters'
import { useProjectStore, selectActiveProject } from '@/store/useProjectStore'

interface Props {
  open: boolean
  onClose: () => void
}

type Format = 'xlsx' | 'csv' | 'json' | 'pdf' | 'zip'

const FORMATS: Array<{
  key: Format
  title: string
  description: string
  icon: typeof FileText
  accent: string
}> = [
  {
    key: 'pdf',
    title: 'Informe PDF corporativo',
    description: 'Portada, estadisticas, desglose por zonas, croquis y anexo fotografico.',
    icon: FileText,
    accent: 'bg-blue-600/10 text-blue-700 border-blue-200',
  },
  {
    key: 'zip',
    title: 'Backup ZIP completo',
    description: 'project_data.json + carpeta fotos para respaldo y migracion.',
    icon: Archive,
    accent: 'bg-sky-600/10 text-sky-700 border-sky-200',
  },
  {
    key: 'xlsx',
    title: 'Excel XLSX',
    description: 'Resumen tabular por zonas y lesiones para analisis.',
    icon: FileSpreadsheet,
    accent: 'bg-emerald-600/10 text-emerald-700 border-emerald-200',
  },
  {
    key: 'csv',
    title: 'CSV profesional',
    description: 'Datos tabulados compatibles con sistemas externos.',
    icon: Table,
    accent: 'bg-indigo-600/10 text-indigo-700 border-indigo-200',
  },
  {
    key: 'json',
    title: 'JSON estructurado',
    description: 'Intercambio tecnico con plataformas de integracion.',
    icon: FileCode2,
    accent: 'bg-slate-600/10 text-slate-700 border-slate-200',
  },
]

export function ExportModal({ open, onClose }: Props) {
  const project = useProjectStore(selectActiveProject)
  const lesions = useProjectStore(s => s.lesions)
  const zones = useProjectStore(s => s.zones)

  const [exporting, setExporting] = useState<Format | null>(null)
  const [progressMessage, setProgressMessage] = useState('Preparando exportacion...')

  if (!project) return null

  const handleExport = async (format: Format) => {
    if (exporting) return

    setExporting(format)
    setProgressMessage('Inicializando exportacion...')

    try {
      if (format === 'pdf') {
        setProgressMessage('Generando informe PDF corporativo, por favor espera...')
        await exportPDF(project.id, { onProgress: setProgressMessage })
        return
      }

      if (format === 'zip') {
        setProgressMessage('Generando backup ZIP completo, por favor espera...')
        await exportZIP(project.id, { onProgress: setProgressMessage })
        return
      }

      if (format === 'xlsx') {
        setProgressMessage('Generando archivo Excel...')
        await exportXLSX(project.id)
        return
      }

      if (format === 'csv') {
        setProgressMessage('Generando archivo CSV...')
        await exportCSV(project.id)
        return
      }

      setProgressMessage('Generando archivo JSON...')
      await exportJSON(project.id)
    } finally {
      setExporting(null)
      setProgressMessage('Preparando exportacion...')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Exportaciones profesionales" maxWidth={620}>
      <div className="relative flex flex-col gap-5">
        <div className="rounded-lg border border-border bg-s2 px-3 py-3">
          <div className="flex flex-wrap items-center gap-2 text-sm text-t2">
            <span className="font-semibold text-text">{project.name}</span>
            <span>·</span>
            <span>{zones.length} zonas</span>
            <span>·</span>
            <span>{lesions.length} lesiones</span>
          </div>
        </div>

        <div className="grid gap-3">
          {FORMATS.map(option => {
            const Icon = option.icon
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => handleExport(option.key)}
                disabled={exporting !== null}
                className="flex items-start gap-3 rounded-lg border border-border bg-white px-3 py-3 text-left transition hover:border-accent/35 disabled:cursor-wait disabled:opacity-60"
              >
                <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${option.accent}`}>
                  <Icon className="h-4 w-4" strokeWidth={2} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-text">{option.title}</span>
                  <span className="mt-1 block text-xs leading-5 text-t2">{option.description}</span>
                </span>
                {exporting === option.key && (
                  <LoaderCircle className="h-5 w-5 animate-spin text-accent" strokeWidth={2.4} />
                )}
              </button>
            )
          })}
        </div>

        {exporting && (
          <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900/95 px-6 py-6 shadow-xl">
              <div className="flex items-center gap-3 text-slate-100">
                <LoaderCircle className="h-5 w-5 animate-spin text-blue-400" strokeWidth={2.3} />
                <span className="text-sm font-semibold">Proceso de exportacion en curso</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">{progressMessage}</p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300">
                <Package className="h-3.5 w-3.5" strokeWidth={2.2} />
                No cierres este cuadro hasta que termine.
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
