import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'
import { jsPDF } from 'jspdf'
import { exportProjectData } from '@/db/db'
import { LESION_TYPES, SITUATIONS, ORIENTATIONS, URGENCY_LEVELS } from '@/types'
import type { Project, Zone, Lesion } from '@/types'

// ─── Helpers ────────────────────────────────────────────────────────────────

function safeName(s: string): string {
  return s.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s_-]/g, '_').trim()
}

function typeName(code: string): string {
  return LESION_TYPES.find(t => t.code === code)?.name ?? code
}
function sitName(code: string): string {
  return SITUATIONS.find(s => s.code === code)?.name ?? code
}
function oriName(code: string | null): string {
  if (!code) return '—'
  return ORIENTATIONS.find(o => o.code === code)?.name ?? code
}
function urgName(code: string): string {
  return URGENCY_LEVELS.find(u => u.code === code)?.name ?? code
}

// ─── XLSX Export ────────────────────────────────────────────────────────────

export async function exportXLSX(projectId: string): Promise<void> {
  const data = await exportProjectData(projectId)
  if (!data.project) return

  const p = data.project
  const wb = XLSX.utils.book_new()

  // Sheet 1: Resumen
  const summary = [
    ['Codigo Obra', 'Proyecto', 'Direccion', 'Inspector', 'Fecha'],
    [p.workCode, p.name, p.address, p.inspector, p.inspectionDate],
  ]
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summary), 'Resumen')

  // Sheet 2: All lesions
  const hdr = [
    'Codigo', 'Tipo', 'Nombre Tipo', 'Zona', 'Planta', 'Piso',
    'Situacion', 'Orientacion', 'Urgencia', 'Fotos', 'Observaciones',
  ]
  const rows = data.zones.flatMap(z =>
    data.lesions
      .filter(l => l.zoneId === z.id)
      .map(l => [
        l.code, l.tipus, typeName(l.tipus), z.name, z.floor, z.unit,
        sitName(l.sit), oriName(l.ori), urgName(l.urgency),
        l.photoIds.length, l.obs,
      ]),
  )
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([hdr, ...rows]), 'Lesiones')

  // Sheet per zone
  data.zones.forEach(z => {
    const zLesions = data.lesions.filter(l => l.zoneId === z.id)
    if (zLesions.length === 0) return
    const zRows = zLesions.map(l => [
      l.code, l.tipus, typeName(l.tipus), sitName(l.sit),
      oriName(l.ori), urgName(l.urgency), l.photoIds.length, l.obs,
    ])
    const zHdr = ['Codigo', 'Tipo', 'Nombre', 'Situacion', 'Orientacion', 'Urgencia', 'Fotos', 'Observaciones']
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([zHdr, ...zRows]), z.name.slice(0, 28))
  })

  XLSX.writeFile(wb, `${safeName(p.name)}_${p.workCode || 'export'}.xlsx`)
}

// ─── CSV Export ─────────────────────────────────────────────────────────────

export async function exportCSV(projectId: string): Promise<void> {
  const data = await exportProjectData(projectId)
  if (!data.project) return

  const hdr = ['Zona', 'Planta', 'Piso', 'Codigo', 'Tipo', 'Situacion', 'Orientacion', 'Urgencia', 'Fotos', 'Observaciones']
  const rows = data.zones.flatMap(z =>
    data.lesions
      .filter(l => l.zoneId === z.id)
      .map(l => [
        z.name, z.floor, z.unit, l.code, typeName(l.tipus),
        sitName(l.sit), oriName(l.ori), urgName(l.urgency),
        String(l.photoIds.length), l.obs,
      ]),
  )

  const escape = (s: string) => `"${s.replace(/"/g, '""')}"`
  const csv = [hdr, ...rows].map(r => r.map(escape).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  saveAs(blob, `${safeName(data.project.name)}_${data.project.workCode || 'export'}.csv`)
}

// ─── JSON Export ────────────────────────────────────────────────────────────

export async function exportJSON(projectId: string): Promise<void> {
  const data = await exportProjectData(projectId)
  if (!data.project) return

  // Exclude large photo DataURLs from JSON to keep it manageable
  const exportData = {
    ...data,
    photos: data.photos.map(p => ({ ...p, dataUrl: '[OMITTED — use ZIP export for photos]' })),
  }
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  saveAs(blob, `inspecapp_${data.project.workCode || data.project.id}.json`)
}

// ─── PDF Report ─────────────────────────────────────────────────────────────

export async function exportPDF(projectId: string): Promise<void> {
  const data = await exportProjectData(projectId)
  if (!data.project) return

  const p = data.project
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })

  const W = doc.internal.pageSize.getWidth()
  const H = doc.internal.pageSize.getHeight()

  // ── Cover page ──
  doc.setFillColor(10, 22, 40) // #0A1628
  doc.rect(0, 0, W, H, 'F')

  // Brand bar
  doc.setFillColor(37, 99, 235) // #2563EB
  doc.rect(0, 0, W, 8, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(10)
  doc.text('SOCOTEC Engineering Solutions', 15, 25)

  doc.setFontSize(28)
  doc.text('Informe de Inspeccion', 15, 50)

  doc.setFontSize(14)
  doc.setTextColor(139, 163, 199) // #8BA3C7
  doc.text(p.name, 15, 65)

  doc.setFontSize(11)
  const info = [
    `Codigo de obra: ${p.workCode}`,
    `Direccion: ${p.address}`,
    `Inspector: ${p.inspector}`,
    `Fecha: ${p.inspectionDate}`,
    `Zonas: ${data.zones.length}`,
    `Lesiones: ${data.lesions.length}`,
    `Fotos: ${data.photos.length}`,
  ]
  info.forEach((line, i) => {
    doc.text(line, 15, 85 + i * 8)
  })

  // ── Lesion table pages ──
  if (data.lesions.length > 0) {
    doc.addPage()
    doc.setFillColor(10, 22, 40)
    doc.rect(0, 0, W, H, 'F')
    doc.setFillColor(37, 99, 235)
    doc.rect(0, 0, W, 6, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.text('Listado de Lesiones', 15, 20)

    const cols = ['Codigo', 'Tipo', 'Zona', 'Sit.', 'Ori.', 'Urg.', 'Observaciones']
    const colX = [15, 40, 80, 140, 165, 190, 215]
    const colW = [25, 40, 55, 25, 25, 25, W - 230]

    let y = 32

    // Header
    doc.setFontSize(8)
    doc.setTextColor(139, 163, 199)
    cols.forEach((c, i) => doc.text(c, colX[i], y))
    y += 5
    doc.setDrawColor(30, 58, 95)
    doc.line(15, y, W - 15, y)
    y += 4

    doc.setTextColor(232, 237, 245) // #E8EDF5
    doc.setFontSize(8)

    data.zones.forEach(z => {
      const zLesions = data.lesions.filter(l => l.zoneId === z.id)
      zLesions.forEach(l => {
        if (y > H - 15) {
          doc.addPage()
          doc.setFillColor(10, 22, 40)
          doc.rect(0, 0, W, H, 'F')
          doc.setFillColor(37, 99, 235)
          doc.rect(0, 0, W, 6, 'F')
          y = 18
          doc.setTextColor(139, 163, 199)
          cols.forEach((c, i) => doc.text(c, colX[i], y))
          y += 5
          doc.setDrawColor(30, 58, 95)
          doc.line(15, y, W - 15, y)
          y += 4
          doc.setTextColor(232, 237, 245)
        }

        const row = [
          l.code,
          typeName(l.tipus),
          z.name.slice(0, 20),
          sitName(l.sit),
          oriName(l.ori),
          urgName(l.urgency),
          (l.obs || '').slice(0, 50),
        ]
        row.forEach((v, i) => {
          doc.text(v, colX[i], y, { maxWidth: colW[i] })
        })
        y += 6
      })
    })
  }

  doc.save(`${safeName(p.name)}_${p.workCode || 'informe'}.pdf`)
}

// ─── ZIP Export (full project backup) ───────────────────────────────────────

export async function exportZIP(projectId: string): Promise<void> {
  const data = await exportProjectData(projectId)
  if (!data.project) return

  const zip = new JSZip()
  const p = data.project

  // Project JSON (without photo data)
  const jsonData = {
    ...data,
    photos: data.photos.map(ph => ({ ...ph, dataUrl: undefined })),
  }
  zip.file('project.json', JSON.stringify(jsonData, null, 2))

  // Photos folder
  if (data.photos.length > 0) {
    const photosFolder = zip.folder('fotos')!
    data.photos.forEach(ph => {
      const match = ph.dataUrl.match(/^data:([^;]+);base64,(.+)$/)
      if (match) {
        const ext = match[1].split('/')[1] || 'jpg'
        photosFolder.file(`${ph.id}.${ext}`, match[2], { base64: true })
      }
    })
  }

  // XLSX inside ZIP
  const wb = XLSX.utils.book_new()
  const hdr = ['Codigo', 'Tipo', 'Zona', 'Planta', 'Piso', 'Situacion', 'Orientacion', 'Urgencia', 'Fotos', 'Observaciones']
  const rows = data.zones.flatMap(z =>
    data.lesions.filter(l => l.zoneId === z.id).map(l => [
      l.code, typeName(l.tipus), z.name, z.floor, z.unit,
      sitName(l.sit), oriName(l.ori), urgName(l.urgency),
      l.photoIds.length, l.obs,
    ]),
  )
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([hdr, ...rows]), 'Lesiones')
  const xlsxBuf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' })
  zip.file('lesiones.xlsx', xlsxBuf)

  const blob = await zip.generateAsync({ type: 'blob' })
  saveAs(blob, `${safeName(p.name)}_${p.workCode || 'backup'}.zip`)
}
