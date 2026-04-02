// ─── Constantes de dominio ────────────────────────────────────────────────────

export const LESION_TYPES = [
  { code: 'E',  name: 'Grietas',               color: '#EF4444', hasOrientation: true  },
  { code: 'F',  name: 'Fisuras',               color: '#F97316', hasOrientation: true  },
  { code: 'MF', name: 'Micro-Fisuras',          color: '#EAB308', hasOrientation: true  },
  { code: 'ES', name: 'Desconchados',           color: '#A855F7', hasOrientation: true  },
  { code: 'Q',  name: 'Cuarteado',              color: '#EC4899', hasOrientation: false },
  { code: 'DA', name: 'Desadherencias',         color: '#3B82F6', hasOrientation: false },
  { code: 'DG', name: 'Degradaciones',          color: '#71717A', hasOrientation: false },
  { code: 'O',  name: 'Oxidaciones',            color: '#D97706', hasOrientation: false },
  { code: 'H',  name: 'Humedades',              color: '#06B6D4', hasOrientation: false },
  { code: 'AD', name: 'Armaduras vistas',        color: '#DC2626', hasOrientation: false },
] as const

export const SITUATIONS = [
  { code: 'P', name: 'Pared' },
  { code: 'T', name: 'Suelo' },
  { code: 'S', name: 'Techo' },
] as const

export const ORIENTATIONS = [
  { code: 'H', name: 'Horizontal' },
  { code: 'V', name: 'Vertical' },
  { code: 'I', name: 'Inclinada' },
] as const

export const URGENCY_LEVELS = [
  { code: 'U', name: 'Urgente',      color: '#EF4444' },
  { code: 'L', name: 'Leve',         color: '#F59E0B' },
  { code: 'I', name: 'Informativo',  color: '#3B82F6' },
] as const

export const ZONE_TYPES = [
  { code: 'FA', name: 'Fachada Anterior',  emoji: '🏛' },
  { code: 'FP', name: 'Fachada Posterior', emoji: '🏛' },
  { code: 'ZC', name: 'Zonas Comunes',     emoji: '🚪' },
  { code: 'CO', name: 'Cubierta',          emoji: '🏠' },
  { code: 'HA', name: 'Vivienda',          emoji: '🛏' },
  { code: 'LO', name: 'Local',             emoji: '🏪' },
] as const

// ─── Tipos derivados ─────────────────────────────────────────────────────────

export type LesionTypeCode   = typeof LESION_TYPES[number]['code']
export type SituationCode    = typeof SITUATIONS[number]['code']
export type OrientationCode  = typeof ORIENTATIONS[number]['code']
export type UrgencyCode      = typeof URGENCY_LEVELS[number]['code']
export type ZoneTypeCode     = typeof ZONE_TYPES[number]['code']

// ─── Entidades de dominio ─────────────────────────────────────────────────────

export interface Photo {
  id: string
  lesionId: string
  /** Data URL (base64) o URL blob */
  dataUrl: string
  mimeType: string
  /** Nombre original del archivo */
  filename: string
  capturedAt: string
}

export interface Lesion {
  id: string
  zoneId: string
  /** Codigo autogenerado: ej. "FHP1", "DAP2" */
  code: string
  tipus: LesionTypeCode
  sit: SituationCode
  ori: OrientationCode | null
  urgency: UrgencyCode
  obs: string
  /** Posicion en el croquis (coordenadas absolutas del canvas) */
  x: number
  y: number
  photoIds: string[]
  createdAt: string
  updatedAt: string
}

export interface CanvasElement {
  id: string
  zoneId: string
  x: number
  y: number
  w: number
  h: number
  label: string
}

export interface Zone {
  id: string
  projectId: string
  name: string
  type: ZoneTypeCode
  /** Identificador de planta (ej: "Planta Baja", "Principal") */
  floor: string
  /** Piso o designacion (ej: "1a", "—") */
  unit: string
  /** Orden visual en las pestanas */
  order: number
  /** Data URL de la imagen de fondo del croquis (opcional) */
  backgroundImage?: string
  createdAt: string
}

export interface Project {
  id: string
  /** Nombre corto del proyecto (ej: "Ramon Turro, 157") */
  name: string
  /** Codigo interno de obra (ej: "15350") */
  workCode: string
  /** Direccion completa del edificio */
  address: string
  /** Nombre del inspector responsable */
  inspector: string
  /** Fecha de inspeccion (ISO 8601) */
  inspectionDate: string
  /** Descripcion del edificio (tipologia, estructura...) */
  description: string
  createdAt: string
  updatedAt: string
}
