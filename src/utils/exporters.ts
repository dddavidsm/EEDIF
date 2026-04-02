import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'
import { jsPDF } from 'jspdf'
import { exportProjectData } from '@/db/db'
import { LESION_TYPES, SITUATIONS, ORIENTATIONS, URGENCY_LEVELS } from '@/types'

// ─── Helpers ────────────────────────────────────────────────────────────────

function safeName(s: string): string {
  return s.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ\s_-]/g, '_').trim()
}

function typeName(code: string): string {
  return LESION_TYPES.find(t => t.code === code)?.name ?? code
}
function typeColor(code: string): string {
  return LESION_TYPES.find(t => t.code === code)?.color ?? '#888'
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
function urgColor(code: string): string {
  return URGENCY_LEVELS.find(u => u.code === code)?.color ?? '#888'
}

/** Hex color (#RRGGBB) → [r, g, b] */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16)
  const g = parseInt(h.slice(2, 4), 16)
  const b = parseInt(h.slice(4, 6), 16)
  return [r, g, b]
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

  const exportData = {
    ...data,
    photos: data.photos.map(p => ({ ...p, dataUrl: '[OMITTED — use ZIP export for photos]' })),
  }
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  saveAs(blob, `inspecapp_${data.project.workCode || data.project.id}.json`)
}

// ─── PDF Report ─────────────────────────────────────────────────────────────
// Genera portada + listado + UNA FICHA POR LESIÓN con foto si la hay

export async function exportPDF(projectId: string): Promise<void> {
  const data = await exportProjectData(projectId)
  if (!data.project) return

  const p = data.project
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const W = doc.internal.pageSize.getWidth()   // 210
  const H = doc.internal.pageSize.getHeight()  // 297

  // ── Palette (dark, matching the app) ──
  const BG: [number, number, number]   = [9, 11, 17]
  const S1: [number, number, number]   = [15, 21, 32]
  const S2: [number, number, number]   = [21, 30, 46]
  const BD: [number, number, number]   = [31, 48, 80]
  const ACC: [number, number, number]  = [37, 99, 235]
  const TX: [number, number, number]   = [221, 225, 236]
  const T2: [number, number, number]   = [123, 144, 181]
  const T3: [number, number, number]   = [63, 80, 112]

  const fillBg = () => { doc.setFillColor(...BG); doc.rect(0, 0, W, H, 'F') }

  // ── Helper: add header stripe on every page ──
  const addPageHeader = (title: string) => {
    doc.setFillColor(...ACC)
    doc.rect(0, 0, W, 8, 'F')
    doc.setTextColor(...TX)
    doc.setFontSize(7.5)
    doc.text('SOCOTEC InspecApp', 7, 5.5)
    doc.text(title, W - 7, 5.5, { align: 'right' })
  }

  // ── PORTADA ──────────────────────────────────────────────────

  fillBg()
  addPageHeader('Informe de Inspeccion')

  // Big brand bar
  doc.setFillColor(...ACC)
  doc.rect(0, 20, 6, 60, 'F')

  doc.setTextColor(...TX)
  doc.setFontSize(22)
  doc.text('Informe de Inspeccion', 14, 42)

  doc.setFontSize(14)
  doc.setTextColor(...T2)
  doc.text(p.name, 14, 54)

  // Info grid
  doc.setFillColor(...S1)
  doc.rect(14, 65, W - 28, 52, 'F')
  doc.setDrawColor(...BD)
  doc.setLineWidth(0.3)
  doc.rect(14, 65, W - 28, 52)

  const infoItems = [
    ['Codigo de obra', p.workCode],
    ['Direccion', p.address],
    ['Inspector', p.inspector],
    ['Fecha de inspeccion', p.inspectionDate],
    ['Zonas inspeccionadas', String(data.zones.length)],
    ['Total de lesiones', String(data.lesions.length)],
    ['Lesiones urgentes', String(data.lesions.filter(l => l.urgency === 'U').length)],
    ['Fotografias adjuntas', String(data.photos.length)],
  ]
  infoItems.forEach(([label, value], i) => {
    const row = Math.floor(i / 2)
    const col = i % 2
    const x = 20 + col * (W / 2 - 14)
    const y = 74 + row * 10
    doc.setFontSize(8)
    doc.setTextColor(...T3)
    doc.text(label, x, y)
    doc.setFontSize(9.5)
    doc.setTextColor(...TX)
    doc.text(value || '—', x, y + 5)
  })

  // Building description
  if (p.description) {
    doc.setFillColor(...S2)
    doc.rect(14, 125, W - 28, 35, 'F')
    doc.setFontSize(7.5)
    doc.setTextColor(...T3)
    doc.text('DESCRIPCION DEL EDIFICIO', 18, 133)
    doc.setFontSize(9)
    doc.setTextColor(...T2)
    const lines = doc.splitTextToSize(p.description, W - 36)
    doc.text(lines.slice(0, 3), 18, 140)
  }

  // Footer
  doc.setFontSize(7)
  doc.setTextColor(...T3)
  doc.text(`Generado ${new Date().toLocaleDateString('es-ES')} — SOCOTEC InspecApp`, W / 2, H - 10, { align: 'center' })

  // ── RESUMEN POR ZONA ─────────────────────────────────────────

  if (data.zones.length > 0) {
    doc.addPage()
    fillBg()
    addPageHeader('Resumen por zona')

    doc.setTextColor(...TX)
    doc.setFontSize(14)
    doc.text('Resumen por zona', 14, 22)

    let y = 32
    data.zones.forEach(z => {
      const zLesions = data.lesions.filter(l => l.zoneId === z.id)
      const urgZ = zLesions.filter(l => l.urgency === 'U').length

      if (y > H - 30) {
        doc.addPage(); fillBg(); addPageHeader('Resumen por zona')
        y = 20
      }

      // Zone header
      doc.setFillColor(...S1)
      doc.rect(14, y, W - 28, 10, 'F')
      doc.setFontSize(9)
      doc.setTextColor(...TX)
      doc.text(z.name, 18, y + 6.5)
      doc.setFontSize(8)
      doc.setTextColor(...T2)
      doc.text(`${zLesions.length} lesiones`, W - 18, y + 6.5, { align: 'right' })
      y += 12

      if (urgZ > 0) {
        doc.setFontSize(7.5)
        doc.setTextColor(239, 68, 68)
        doc.text(`${urgZ} urgentes`, 18, y)
        y += 5
      }

      // Lesion mini-rows
      zLesions.forEach(l => {
        if (y > H - 12) {
          doc.addPage(); fillBg(); addPageHeader('Resumen por zona')
          y = 20
        }
        const uc = urgColor(l.urgency)
        const tc = typeColor(l.tipus)
        const [tr, tg, tb] = hexToRgb(tc)
        doc.setFillColor(tr, tg, tb, 0.15 as number)
        doc.rect(18, y - 2, 3, 3, 'F')
        doc.setFontSize(7.5)
        doc.setTextColor(...TX)
        doc.text(l.code, 24, y + 0.5)
        doc.setTextColor(...T2)
        const obs = (l.obs || typeName(l.tipus)).slice(0, 65)
        doc.text(obs, 45, y + 0.5)
        const [ur, ug, ub] = hexToRgb(uc)
        doc.setTextColor(ur, ug, ub)
        doc.text(urgName(l.urgency), W - 18, y + 0.5, { align: 'right' })
        y += 6
      })
      y += 4
    })
  }

  // ── FICHAS POR LESIÓN ────────────────────────────────────────
  // Una página A4 por lesión con todos los datos + foto si existe

  for (const z of data.zones) {
    const zLesions = data.lesions.filter(l => l.zoneId === z.id)

    for (const l of zLesions) {
      doc.addPage()
      fillBg()
      addPageHeader(`Ficha de lesion · ${l.code}`)

      const tc = typeColor(l.tipus)
      const uc = urgColor(l.urgency)
      const [tcR, tcG, tcB] = hexToRgb(tc)
      const [ucR, ucG, ucB] = hexToRgb(uc)

      // ─ Franja de color del tipo en la izquierda ─
      doc.setFillColor(tcR, tcG, tcB)
      doc.rect(0, 8, 5, H - 8, 'F')

      // ─ Cabecera de la ficha ─
      doc.setFillColor(...S1)
      doc.rect(8, 12, W - 16, 24, 'F')
      doc.setDrawColor(tcR, tcG, tcB)
      doc.setLineWidth(0.4)
      doc.rect(8, 12, W - 16, 24)

      doc.setFontSize(20)
      doc.setTextColor(tcR, tcG, tcB)
      doc.text(l.code, 14, 26)

      doc.setFontSize(10)
      doc.setTextColor(...T2)
      doc.text(typeName(l.tipus), 14, 32)

      // Urgency badge
      doc.setFillColor(ucR, ucG, ucB)
      doc.roundedRect(W - 45, 15, 35, 8, 1.5, 1.5, 'F')
      doc.setFontSize(8)
      doc.setTextColor(255, 255, 255)
      doc.text(urgName(l.urgency).toUpperCase(), W - 27.5, 20.5, { align: 'center' })

      // ─ Grid de datos ─
      const dataItems = [
        ['Zona', z.name],
        ['Planta', z.floor || '—'],
        ['Piso / Unidad', z.unit || '—'],
        ['Situacion', sitName(l.sit)],
        ['Orientacion', oriName(l.ori)],
        ['Tipo', typeName(l.tipus)],
        ['Codigo', l.code],
        ['Fotos adjuntas', String(l.photoIds.length)],
      ]

      // Two-column grid
      const gridTop = 44
      const cellW = (W - 16) / 2 - 2
      const cellH = 13

      dataItems.forEach((item, i) => {
        const col = i % 2
        const row = Math.floor(i / 2)
        const x = 8 + col * (cellW + 4)
        const y = gridTop + row * (cellH + 2)

        doc.setFillColor(...S2)
        doc.rect(x, y, cellW, cellH, 'F')
        doc.setDrawColor(...BD)
        doc.setLineWidth(0.2)
        doc.rect(x, y, cellW, cellH)

        doc.setFontSize(6.5)
        doc.setTextColor(...T3)
        doc.text(item[0].toUpperCase(), x + 3, y + 4.5)
        doc.setFontSize(9)
        doc.setTextColor(...TX)
        doc.text(item[1], x + 3, y + 10)
      })

      // ─ Observaciones ─
      const obsTop = gridTop + 4 * (cellH + 2) + 4

      doc.setFillColor(...S1)
      const obsLines = doc.splitTextToSize(l.obs || 'Sin observaciones registradas.', W - 28)
      const obsH = Math.max(20, obsLines.length * 5 + 12)
      doc.rect(8, obsTop, W - 16, obsH, 'F')
      doc.setDrawColor(...BD)
      doc.setLineWidth(0.2)
      doc.rect(8, obsTop, W - 16, obsH)

      doc.setFontSize(7)
      doc.setTextColor(...T3)
      doc.text('OBSERVACIONES', 12, obsTop + 6)
      doc.setFontSize(9.5)
      doc.setTextColor(...T2)
      doc.text(obsLines, 12, obsTop + 12)

      // ─ Foto adjunta (si existe) ─
      const photoTop = obsTop + obsH + 6
      const lesionPhotos = data.photos.filter(ph => ph.lesionId === l.id)

      if (lesionPhotos.length > 0) {
        doc.setFontSize(7)
        doc.setTextColor(...T3)
        doc.text('FOTOGRAFIAS ADJUNTAS', 12, photoTop)

        let photoX = 8
        const photoY = photoTop + 3
        const maxPhotoW = (W - 16 - (Math.min(lesionPhotos.length, 3) - 1) * 3) / Math.min(lesionPhotos.length, 3)
        const maxPhotoH = Math.min(H - photoY - 16, 70)

        for (const ph of lesionPhotos.slice(0, 3)) {
          try {
            // dataUrl is "data:image/jpeg;base64,..."
            const match = ph.dataUrl.match(/^data:([^;]+);base64,(.+)$/)
            if (match) {
              const format = match[1].split('/')[1]?.toUpperCase() ?? 'JPEG'
              const supportedFormats = ['JPEG', 'JPG', 'PNG', 'WEBP']
              const safeFormat = supportedFormats.includes(format) ? format : 'JPEG'
              doc.addImage(ph.dataUrl, safeFormat as 'JPEG' | 'PNG', photoX, photoY, maxPhotoW, maxPhotoH, undefined, 'MEDIUM')
            }
          } catch {
            // Skip photo if it can't be embedded
          }
          photoX += maxPhotoW + 3
        }
      }

      // ─ Footer de ficha ─
      doc.setFontSize(6.5)
      doc.setTextColor(...T3)
      doc.text(
        `${p.name} · ${p.workCode}  |  ${z.name}  |  Ficha ${l.code}`,
        W / 2, H - 8, { align: 'center' },
      )
    }
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
