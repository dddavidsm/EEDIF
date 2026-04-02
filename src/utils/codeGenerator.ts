import { LESION_TYPES } from '@/types'
import type { LesionTypeCode, SituationCode, OrientationCode, Lesion } from '@/types'

/**
 * Genera automàticament el codi de nomenclatura per a una nova lesió,
 * seguint la convenció de l'InspecApp:
 *
 *  - Lesions amb orientació: {TIPUS}{ORI}{SIT}{N}  → EHP1, FVP2
 *  - Lesions sense orientació: {TIPUS}{SIT}{N}      → DAP1, HS2
 *
 * El número N és l'increment de lesions del mateix tipus i situació
 * dins la zona.
 */
export function generateLesionCode(
  tipus: LesionTypeCode,
  sit: SituationCode,
  ori: OrientationCode | null,
  existingLesions: Pick<Lesion, 'code'>[],
): string {
  const lesionType = LESION_TYPES.find(t => t.code === tipus)
  const hasOri = lesionType?.hasOrientation ?? false
  const base = hasOri && ori ? `${tipus}${ori}${sit}` : `${tipus}${sit}`

  const count = existingLesions.filter(l => {
    const suffix = l.code.slice(base.length)
    return l.code.startsWith(base) && /^\d+$/.test(suffix)
  }).length

  return `${base}${count + 1}`
}

/**
 * Retorna el color associat a un tipus de lesió per al seu codi.
 * Torna blanc si el codi no existeix.
 */
export function getLesionColor(code: LesionTypeCode): string {
  return LESION_TYPES.find(t => t.code === code)?.color ?? '#ffffff'
}

/**
 * Format de data localitzat (ca-ES) a partir d'un ISO string.
 */
export function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString('ca-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Genera un ID únic lleuger basat en timestamp + random.
 */
export function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

/**
 * Converteix un File a DataURL (base64) de forma asíncrona.
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
