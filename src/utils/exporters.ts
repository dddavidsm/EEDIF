import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'
import JSZip from 'jszip'
import { jsPDF } from 'jspdf'
import { exportProjectData } from '@/db/db'
import {
  LESION_TYPES,
  ORIENTATIONS,
  SITUATIONS,
  URGENCY_LEVELS,
} from '@/types'
import type { CanvasElement, Lesion, Project, Zone } from '@/types'

interface ExportOptions {
  onProgress?: (message: string) => void
}

function safeName(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s_-]/g, '_')
    .trim()
    .replace(/\s+/g, '_')
}

function tipoNombre(code: string): string {
  return LESION_TYPES.find(t => t.code === code)?.name ?? code
}

function tipoColor(code: string): string {
  return LESION_TYPES.find(t => t.code === code)?.color ?? '#64748B'
}

function situacionNombre(code: string): string {
  return SITUATIONS.find(s => s.code === code)?.name ?? code
}

function orientacionNombre(code: string | null): string {
  if (!code) return 'No aplica'
  return ORIENTATIONS.find(o => o.code === code)?.name ?? code
}

function urgenciaNombre(code: string): string {
  return URGENCY_LEVELS.find(u => u.code === code)?.name ?? code
}

function urgenciaColor(code: string): string {
  return URGENCY_LEVELS.find(u => u.code === code)?.color ?? '#64748B'
}

function hexToRgb(hex: string): [number, number, number] {
  const raw = hex.replace('#', '')
  const r = Number.parseInt(raw.slice(0, 2), 16)
  const g = Number.parseInt(raw.slice(2, 4), 16)
  const b = Number.parseInt(raw.slice(4, 6), 16)
  return [r, g, b]
}

function mimeToExtension(mimeType: string): string {
  if (mimeType.includes('png')) return 'png'
  if (mimeType.includes('webp')) return 'webp'
  return 'jpg'
}

async function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('No se pudo cargar la imagen'))
    image.src = src
  })
}

function formatDate(dateIso: string): string {
  if (!dateIso) return 'Sin fecha'
  const date = new Date(dateIso)
  if (Number.isNaN(date.getTime())) return dateIso
  return new Intl.DateTimeFormat('es-ES').format(date)
}

async function renderCroquisZona(
  zone: Zone,
  elements: CanvasElement[],
  lesions: Lesion[],
): Promise<string> {
  const width = 1600
  const height = 980

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  ctx.fillStyle = '#F4F8FF'
  ctx.fillRect(0, 0, width, height)

  if (zone.backgroundImage) {
    try {
      const image = await cargarImagen(zone.backgroundImage)
      ctx.save()
      ctx.globalAlpha = 0.34
      ctx.drawImage(image, 0, 0, width, height)
      ctx.restore()
    } catch {
      // Se continua sin imagen de fondo
    }
  }

  ctx.strokeStyle = 'rgba(37, 99, 235, 0.13)'
  ctx.lineWidth = 1
  for (let x = 0; x <= width; x += 50) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, height)
    ctx.stroke()
  }
  for (let y = 0; y <= height; y += 50) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(width, y)
    ctx.stroke()
  }

  for (const element of elements) {
    ctx.fillStyle = 'rgba(37, 99, 235, 0.13)'
    ctx.strokeStyle = 'rgba(30, 64, 175, 0.85)'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.roundRect(element.x, element.y, element.w, element.h, 8)
    ctx.fill()
    ctx.stroke()

    if (element.label) {
      ctx.fillStyle = '#1E3A5F'
      ctx.font = '600 26px Inter, sans-serif'
      ctx.fillText(element.label, element.x + 14, element.y + 34)
    }
  }

  for (const lesion of lesions) {
    const color = tipoColor(lesion.tipus)

    ctx.fillStyle = `${color}2E`
    ctx.beginPath()
    ctx.arc(lesion.x, lesion.y, 30, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#FFFFFF'
    ctx.strokeStyle = color
    ctx.lineWidth = 5
    ctx.beginPath()
    ctx.arc(lesion.x, lesion.y, 19, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = color
    ctx.font = '700 18px IBM Plex Mono, monospace'
    ctx.textAlign = 'center'
    ctx.fillText(lesion.code, lesion.x, lesion.y + 6)
    ctx.textAlign = 'start'
  }

  return canvas.toDataURL('image/jpeg', 0.92)
}

export async function exportXLSX(projectId: string): Promise<void> {
  const data = await exportProjectData(projectId)
  if (!data.project) return

  const workbook = XLSX.utils.book_new()

  const resumen = [
    ['Codigo obra', 'Proyecto', 'Direccion', 'Inspector', 'Fecha'],
    [
      data.project.workCode,
      data.project.name,
      data.project.address,
      data.project.inspector,
      data.project.inspectionDate,
    ],
  ]
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(resumen), 'Resumen')

  const cabecera = [
    'Codigo',
    'Tipo',
    'Zona',
    'Planta',
    'Unidad',
    'Situacion',
    'Orientacion',
    'Urgencia',
    'Fotos',
    'Observaciones',
  ]
  const rows = data.zones.flatMap(zone =>
    data.lesions
      .filter(lesion => lesion.zoneId === zone.id)
      .map(lesion => [
        lesion.code,
        tipoNombre(lesion.tipus),
        zone.name,
        zone.floor || '—',
        zone.unit || '—',
        situacionNombre(lesion.sit),
        orientacionNombre(lesion.ori),
        urgenciaNombre(lesion.urgency),
        lesion.photoIds.length,
        lesion.obs,
      ]),
  )

  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([cabecera, ...rows]), 'Lesiones')
  XLSX.writeFile(workbook, `${safeName(data.project.name)}_${data.project.workCode || 'exportacion'}.xlsx`)
}

export async function exportCSV(projectId: string): Promise<void> {
  const data = await exportProjectData(projectId)
  if (!data.project) return

  const cabecera = [
    'Zona',
    'Planta',
    'Unidad',
    'Codigo',
    'Tipo',
    'Situacion',
    'Orientacion',
    'Urgencia',
    'Fotos',
    'Observaciones',
  ]
  const rows = data.zones.flatMap(zone =>
    data.lesions
      .filter(lesion => lesion.zoneId === zone.id)
      .map(lesion => [
        zone.name,
        zone.floor,
        zone.unit,
        lesion.code,
        tipoNombre(lesion.tipus),
        situacionNombre(lesion.sit),
        orientacionNombre(lesion.ori),
        urgenciaNombre(lesion.urgency),
        String(lesion.photoIds.length),
        lesion.obs,
      ]),
  )

  const csv = [cabecera, ...rows]
    .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  saveAs(
    new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }),
    `${safeName(data.project.name)}_${data.project.workCode || 'exportacion'}.csv`,
  )
}

export async function exportJSON(projectId: string): Promise<void> {
  const data = await exportProjectData(projectId)
  if (!data.project) return

  const payload = {
    ...data,
    photos: data.photos.map(photo => ({ ...photo, dataUrl: '[Incluido en ZIP]' })),
  }

  saveAs(
    new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
    `inspecapp_${data.project.workCode || data.project.id}.json`,
  )
}

function drawHeader(doc: jsPDF, title: string, subtitle?: string): void {
  const width = doc.internal.pageSize.getWidth()

  doc.setFillColor(13, 45, 93)
  doc.rect(0, 0, width, 20, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(13)
  doc.text('SOCOTEC ENGINEERING', 12, 8)
  doc.setFontSize(8.5)
  doc.text('InspecApp · Informe Tecnico de Inspeccion', 12, 14)

  doc.setFontSize(12)
  doc.text(title, width - 12, 12.5, { align: 'right' })

  if (subtitle) {
    doc.setTextColor(82, 101, 130)
    doc.setFontSize(9)
    doc.text(subtitle, 12, 27)
  }
}

function drawFooter(doc: jsPDF, project: Project, page: number): void {
  const width = doc.internal.pageSize.getWidth()
  const height = doc.internal.pageSize.getHeight()

  doc.setDrawColor(219, 230, 245)
  doc.line(12, height - 12, width - 12, height - 12)

  doc.setTextColor(99, 119, 150)
  doc.setFontSize(8)
  doc.text(`${project.name} · ${project.workCode || 'Sin codigo'}`, 12, height - 7)
  doc.text(`Pagina ${page}`, width - 12, height - 7, { align: 'right' })
}

export async function exportPDF(projectId: string, options?: ExportOptions): Promise<void> {
  const data = await exportProjectData(projectId)
  if (!data.project) return

  const onProgress = options?.onProgress ?? (() => undefined)
  onProgress('Preparando datos del informe corporativo...')

  const project = data.project
  const zones = [...data.zones].sort((a, b) => a.order - b.order)

  const lesionsByZone = new Map<string, Lesion[]>()
  const elementsByZone = new Map<string, CanvasElement[]>()
  const photosByLesion = new Map<string, typeof data.photos>()

  zones.forEach(zone => {
    lesionsByZone.set(zone.id, data.lesions.filter(lesion => lesion.zoneId === zone.id))
    elementsByZone.set(zone.id, data.elements.filter(element => element.zoneId === zone.id))
  })
  data.lesions.forEach(lesion => {
    photosByLesion.set(lesion.id, data.photos.filter(photo => photo.lesionId === lesion.id))
  })

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let page = 1

  drawHeader(doc, 'Portada del proyecto')
  doc.setTextColor(15, 35, 64)
  doc.setFontSize(24)
  doc.text(project.name, 14, 45)

  doc.setDrawColor(31, 76, 145)
  doc.setLineWidth(1.1)
  doc.line(14, 49, pageWidth - 14, 49)

  doc.setFontSize(10)
  doc.setTextColor(63, 88, 124)
  const portadaRows = [
    ['Codigo de obra', project.workCode || 'Sin codigo'],
    ['Direccion', project.address || 'Sin direccion'],
    ['Inspector', project.inspector || 'Sin asignar'],
    ['Fecha de inspeccion', formatDate(project.inspectionDate)],
    ['Zonas analizadas', String(zones.length)],
    ['Lesiones registradas', String(data.lesions.length)],
  ]

  portadaRows.forEach((row, index) => {
    const y = 62 + index * 12
    doc.setFillColor(240, 245, 253)
    doc.roundedRect(14, y - 5.5, pageWidth - 28, 9, 1.2, 1.2, 'F')
    doc.setTextColor(79, 99, 129)
    doc.text(row[0], 18, y)
    doc.setTextColor(15, 35, 64)
    doc.text(row[1], pageWidth - 18, y, { align: 'right' })
  })

  if (project.description) {
    doc.setTextColor(79, 99, 129)
    doc.setFontSize(10)
    doc.text('Descripcion del edificio', 14, 145)
    doc.setTextColor(15, 35, 64)
    doc.setFontSize(9.5)
    const descLines = doc.splitTextToSize(project.description, pageWidth - 28)
    doc.text(descLines, 14, 151)
  }

  drawFooter(doc, project, page)

  onProgress('Generando resumen estadistico de urgencias...')
  doc.addPage()
  page += 1
  drawHeader(doc, 'Resumen estadistico', 'Distribucion de lesiones por nivel de urgencia')

  const urgencyStats = URGENCY_LEVELS.map(level => {
    const total = data.lesions.filter(lesion => lesion.urgency === level.code).length
    return {
      ...level,
      total,
      ratio: data.lesions.length > 0 ? Math.round((total / data.lesions.length) * 100) : 0,
    }
  })

  let yStats = 42
  urgencyStats.forEach(stat => {
    const [r, g, b] = hexToRgb(stat.color)
    doc.setFillColor(245, 248, 253)
    doc.roundedRect(14, yStats - 6, pageWidth - 28, 16, 2, 2, 'F')

    doc.setFillColor(r, g, b)
    doc.roundedRect(18, yStats - 2, 5, 5, 1.4, 1.4, 'F')

    doc.setTextColor(15, 35, 64)
    doc.setFontSize(11)
    doc.text(stat.name, 27, yStats + 1.5)
    doc.setFontSize(10)
    doc.setTextColor(82, 101, 130)
    doc.text(`${stat.total} lesiones · ${stat.ratio}%`, pageWidth - 18, yStats + 1.5, { align: 'right' })

    yStats += 22
  })

  drawFooter(doc, project, page)

  for (const zone of zones) {
    onProgress(`Generando bloque de zona: ${zone.name}...`)

    doc.addPage()
    page += 1
    drawHeader(doc, `Zona: ${zone.name}`, 'Croquis y fichas tecnicas de lesiones por zona')

    const zoneLesions = lesionsByZone.get(zone.id) ?? []
    const zoneElements = elementsByZone.get(zone.id) ?? []

    doc.setFillColor(239, 245, 254)
    doc.roundedRect(14, 35, pageWidth - 28, 18, 2, 2, 'F')
    doc.setTextColor(15, 35, 64)
    doc.setFontSize(10)
    doc.text(`Planta: ${zone.floor || 'No indicada'}`, 18, 43)
    doc.text(`Unidad: ${zone.unit || 'No indicada'}`, 18, 49)
    doc.text(`Lesiones en zona: ${zoneLesions.length}`, pageWidth - 18, 46, { align: 'right' })

    const croquisDataUrl = await renderCroquisZona(zone, zoneElements, zoneLesions)
    if (croquisDataUrl) {
      doc.setTextColor(79, 99, 129)
      doc.setFontSize(9)
      doc.text('Croquis de la zona', 14, 62)
      doc.addImage(croquisDataUrl, 'JPEG', 14, 64, pageWidth - 28, 78, undefined, 'FAST')
    }

    let yLesion = 150
    for (const lesion of zoneLesions) {
      if (yLesion > pageHeight - 40) {
        drawFooter(doc, project, page)
        doc.addPage()
        page += 1
        drawHeader(doc, `Zona: ${zone.name}`, 'Continuacion de fichas de lesion')
        yLesion = 34
      }

      const color = tipoColor(lesion.tipus)
      const [r, g, b] = hexToRgb(color)
      const urgentColor = urgenciaColor(lesion.urgency)
      const [ur, ug, ub] = hexToRgb(urgentColor)

      doc.setFillColor(250, 252, 255)
      doc.roundedRect(14, yLesion - 5, pageWidth - 28, 26, 2, 2, 'F')

      doc.setFillColor(r, g, b)
      doc.roundedRect(18, yLesion, 3.4, 3.4, 1, 1, 'F')

      doc.setTextColor(15, 35, 64)
      doc.setFontSize(10.5)
      doc.text(`${lesion.code} · ${tipoNombre(lesion.tipus)}`, 24, yLesion + 3)

      doc.setFontSize(9)
      doc.setTextColor(82, 101, 130)
      doc.text(`Situacion: ${situacionNombre(lesion.sit)} · Orientacion: ${orientacionNombre(lesion.ori)}`, 24, yLesion + 8.5)

      doc.setTextColor(ur, ug, ub)
      doc.text(`Urgencia: ${urgenciaNombre(lesion.urgency)}`, pageWidth - 18, yLesion + 3, { align: 'right' })

      doc.setTextColor(79, 99, 129)
      doc.text(`Fotos: ${lesion.photoIds.length}`, pageWidth - 18, yLesion + 8.5, { align: 'right' })

      const obsText = lesion.obs?.trim() ? lesion.obs : 'Sin observaciones tecnicas registradas.'
      const obsLines = doc.splitTextToSize(obsText, pageWidth - 36)
      doc.setFontSize(8.5)
      doc.setTextColor(63, 88, 124)
      doc.text(obsLines.slice(0, 2), 24, yLesion + 14)

      yLesion += 30
    }

    if (zoneLesions.length === 0) {
      doc.setTextColor(95, 118, 154)
      doc.setFontSize(10)
      doc.text('No se han registrado lesiones en esta zona.', 14, 154)
    }

    drawFooter(doc, project, page)
  }

  onProgress('Generando anexo fotografico...')
  const lesionesConFotos = data.lesions.filter(lesion => (photosByLesion.get(lesion.id)?.length ?? 0) > 0)
  if (lesionesConFotos.length > 0) {
    doc.addPage()
    page += 1
    drawHeader(doc, 'Anexo fotografico', 'Registro fotografico vinculado a cada lesion')

    let photoY = 36
    let photoIndex = 1

    for (const lesion of lesionesConFotos) {
      const photos = photosByLesion.get(lesion.id) ?? []
      for (const photo of photos) {
        if (photoY > pageHeight - 78) {
          drawFooter(doc, project, page)
          doc.addPage()
          page += 1
          drawHeader(doc, 'Anexo fotografico', 'Continuacion')
          photoY = 32
        }

        const format = photo.mimeType.includes('png') ? 'PNG' : 'JPEG'
        doc.setFillColor(248, 251, 255)
        doc.roundedRect(14, photoY - 4, pageWidth - 28, 68, 2, 2, 'F')
        doc.addImage(photo.dataUrl, format, 18, photoY, 70, 52, undefined, 'FAST')

        doc.setTextColor(15, 35, 64)
        doc.setFontSize(10)
        doc.text(`Foto ${photoIndex} - ${lesion.code}`, 92, photoY + 6)

        doc.setFontSize(8.5)
        doc.setTextColor(79, 99, 129)
        doc.text(`Tipo: ${tipoNombre(lesion.tipus)}`, 92, photoY + 14)
        doc.text(`Urgencia: ${urgenciaNombre(lesion.urgency)}`, 92, photoY + 20)
        doc.text(`Capturada: ${formatDate(photo.capturedAt)}`, 92, photoY + 26)

        const obs = lesion.obs?.trim() ? lesion.obs : 'Sin observaciones para esta lesion.'
        const lines = doc.splitTextToSize(obs, pageWidth - 106)
        doc.text(lines.slice(0, 5), 92, photoY + 33)

        photoY += 74
        photoIndex += 1
      }
    }

    drawFooter(doc, project, page)
  }

  onProgress('Finalizando informe PDF corporativo...')
  doc.save(`${safeName(project.name)}_${project.workCode || 'informe'}_corporativo.pdf`)
}

export async function exportZIP(projectId: string, options?: ExportOptions): Promise<void> {
  const onProgress = options?.onProgress ?? (() => undefined)
  onProgress('Preparando backup completo del proyecto...')

  const data = await exportProjectData(projectId)
  if (!data.project) return

  const zip = new JSZip()

  onProgress('Empaquetando estructura de datos en project_data.json...')
  zip.file('project_data.json', JSON.stringify(data, null, 2))

  onProgress('Copiando fotografias a la carpeta fotos...')
  const photosFolder = zip.folder('fotos')
  if (photosFolder) {
    data.photos.forEach((photo, index) => {
      const lesion = data.lesions.find(item => item.id === photo.lesionId)
      const lesionCode = lesion?.code ?? 'SIN-CODIGO'
      const ext = mimeToExtension(photo.mimeType)
      const baseName = safeName(photo.filename || `${photo.id}.${ext}`) || `foto_${index + 1}`
      const finalName = `foto_${String(index + 1).padStart(3, '0')}_${lesionCode}_${baseName}.${ext}`

      const match = photo.dataUrl.match(/^data:([^;]+);base64,(.+)$/)
      if (match?.[2]) {
        photosFolder.file(finalName, match[2], { base64: true })
      }
    })
  }

  onProgress('Generando archivo ZIP para descarga...')
  const blob = await zip.generateAsync({ type: 'blob' })
  saveAs(blob, `${safeName(data.project.name)}_${data.project.workCode || 'respaldo'}_backup.zip`)
}
