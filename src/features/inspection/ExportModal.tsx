import { useState } from 'react'
import { Modal } from '@/components/Modal'
import { Button } from '@/components/Button'
import { exportXLSX, exportCSV, exportJSON, exportPDF, exportZIP } from '@/utils/exporters'
import { useProjectStore, selectActiveProject } from '@/store/useProjectStore'

interface Props {
  open: boolean
  onClose: () => void
}

type Format = 'xlsx' | 'csv' | 'json' | 'pdf' | 'zip'

const FORMATS: { key: Format; icon: string; name: string; desc: string }[] = [
  { key: 'xlsx', icon: '📊', name: 'Excel (XLSX)',   desc: 'Hoja de calculo con resumen y lesiones por zona' },
  { key: 'pdf',  icon: '📄', name: 'Informe PDF',    desc: 'Informe corporativo con portada y listado' },
  { key: 'csv',  icon: '📋', name: 'CSV',             desc: 'Datos tabulados compatibles con cualquier programa' },
  { key: 'zip',  icon: '📦', name: 'Backup ZIP',      desc: 'Proyecto completo: datos JSON, XLSX y fotos' },
  { key: 'json', icon: '🗂', name: 'JSON',            desc: 'Datos estructurados para integracion con otros sistemas' },
]

export function ExportModal({ open, onClose }: Props) {
  const project = useProjectStore(selectActiveProject)
  const lesions = useProjectStore(s => s.lesions)
  const zones = useProjectStore(s => s.zones)
  const [exporting, setExporting] = useState<Format | null>(null)

  if (!project) return null

  const handleExport = async (format: Format) => {
    setExporting(format)
    try {
      const fn = { xlsx: exportXLSX, csv: exportCSV, json: exportJSON, pdf: exportPDF, zip: exportZIP }[format]
      await fn(project.id)
    } finally {
      setExporting(null)
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Exportar proyecto" maxWidth={480}>
      <div className="flex flex-col gap-3">
        {/* Summary */}
        <div className="bg-s2 rounded-[var(--radius)] border border-border px-3 py-2.5 text-[12px] text-t2">
          <strong className="text-text">{project.name}</strong>
          {' · '}
          {lesions.length} lesiones · {zones.length} zonas
        </div>

        {/* Format options */}
        <div className="flex flex-col gap-1.5">
          {FORMATS.map(f => (
            <button
              key={f.key}
              onClick={() => handleExport(f.key)}
              disabled={exporting !== null}
              className="flex items-center gap-3 px-3.5 py-3 rounded-[var(--radius)] border border-border
                bg-s2 cursor-pointer transition-all hover:bg-s3 hover:border-border2 text-left
                disabled:opacity-50 disabled:cursor-wait"
            >
              <span className="text-xl">{f.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-text">
                  {f.name}
                  {exporting === f.key && (
                    <span className="ml-2 text-accent text-[11px] font-normal">Exportando...</span>
                  )}
                </div>
                <div className="text-[11px] text-t3">{f.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </Modal>
  )
}
