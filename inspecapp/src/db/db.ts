import Dexie, { type EntityTable } from 'dexie'
import type { Project, Zone, CanvasElement, Lesion, Photo } from '@/types'

/**
 * Base de dades local d'InspecApp via IndexedDB (Dexie.js)
 *
 * Taules:
 *  - projects       → Metadades del projecte d'inspecció
 *  - zones          → Zones / annexos del projecte (façanes, habitatges...)
 *  - canvasElements → Rectangles i formes del croquis de cada zona
 *  - lesions        → Fitxes de lesions detectades
 *  - photos         → Fotos adjuntes a cada lesió (DataURL/Blob)
 */
class InspecDB extends Dexie {
  projects!:       EntityTable<Project,       'id'>
  zones!:          EntityTable<Zone,          'id'>
  canvasElements!: EntityTable<CanvasElement, 'id'>
  lesions!:        EntityTable<Lesion,        'id'>
  photos!:         EntityTable<Photo,         'id'>

  constructor() {
    super('InspecAppDB')

    // v1 — Esquema inicial
    this.version(1).stores({
      projects:       'id, workCode, name, createdAt',
      zones:          'id, projectId, type, order',
      canvasElements: 'id, zoneId',
      lesions:        'id, zoneId, tipus, urgency, code, createdAt',
      photos:         'id, lesionId',
    })
  }
}

export const db = new InspecDB()

// ─── Helpers CRUD ────────────────────────────────────────────────────────────

/** Retorna tots els projectes ordenats per data de creació descendent */
export async function getAllProjects(): Promise<Project[]> {
  return db.projects.orderBy('createdAt').reverse().toArray()
}

/** Retorna totes les zones d'un projecte ordenades per `order` */
export async function getZonesByProject(projectId: string): Promise<Zone[]> {
  return db.zones.where('projectId').equals(projectId).sortBy('order')
}

/** Retorna tots els elements del croquis d'una zona */
export async function getElementsByZone(zoneId: string): Promise<CanvasElement[]> {
  return db.canvasElements.where('zoneId').equals(zoneId).toArray()
}

/** Retorna totes les lesions d'una zona */
export async function getLesionsByZone(zoneId: string): Promise<Lesion[]> {
  return db.lesions.where('zoneId').equals(zoneId).toArray()
}

/** Retorna totes les fotos d'una lesió */
export async function getPhotosByLesion(lesionId: string): Promise<Photo[]> {
  return db.photos.where('lesionId').equals(lesionId).toArray()
}

/**
 * Elimina un projecte i tots els seus registres relacionats en cascada.
 * Opera dins d'una transacció per garantir la integritat.
 */
export async function deleteProjectCascade(projectId: string): Promise<void> {
  await db.transaction('rw', [db.projects, db.zones, db.canvasElements, db.lesions, db.photos], async () => {
    const zones = await db.zones.where('projectId').equals(projectId).toArray()
    const zoneIds = zones.map(z => z.id)

    const lesions = await db.lesions.where('zoneId').anyOf(zoneIds).toArray()
    const lesionIds = lesions.map(l => l.id)

    await db.photos.where('lesionId').anyOf(lesionIds).delete()
    await db.lesions.where('zoneId').anyOf(zoneIds).delete()
    await db.canvasElements.where('zoneId').anyOf(zoneIds).delete()
    await db.zones.where('projectId').equals(projectId).delete()
    await db.projects.delete(projectId)
  })
}

/**
 * Exporta un projecte sencer com a objecte JSON serialitzable
 * (per al backup ZIP).
 */
export async function exportProjectData(projectId: string) {
  const project = await db.projects.get(projectId)
  if (!project) throw new Error(`Projecte ${projectId} no trobat`)

  const zones = await getZonesByProject(projectId)
  const zoneIds = zones.map(z => z.id)

  const elements = await db.canvasElements.where('zoneId').anyOf(zoneIds).toArray()
  const lesions  = await db.lesions.where('zoneId').anyOf(zoneIds).toArray()
  const lesionIds = lesions.map(l => l.id)
  const photos   = await db.photos.where('lesionId').anyOf(lesionIds).toArray()

  return { project, zones, elements, lesions, photos }
}

/**
 * Importa un projecte complet des d'un objecte JSON (restauració de backup).
 * Si ja existeix un projecte amb el mateix ID, el substitueix.
 */
export async function importProjectData(data: Awaited<ReturnType<typeof exportProjectData>>): Promise<void> {
  await db.transaction('rw', [db.projects, db.zones, db.canvasElements, db.lesions, db.photos], async () => {
    await db.projects.put(data.project)
    await Promise.all(data.zones.map(z => db.zones.put(z)))
    await Promise.all(data.elements.map(e => db.canvasElements.put(e)))
    await Promise.all(data.lesions.map(l => db.lesions.put(l)))
    await Promise.all(data.photos.map(p => db.photos.put(p)))
  })
}
