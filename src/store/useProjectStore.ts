import { create } from 'zustand'
import { db, getAllProjects, getZonesByProject, getLesionsByZone, getElementsByZone, getPhotosByLesion, deleteProjectCascade } from '@/db/db'
import type { Project, Zone, CanvasElement, Lesion, Photo } from '@/types'

// ─── Tipat de l'estat ────────────────────────────────────────────────────────

interface ProjectState {
  /** Llista de projectes carregada des de IndexedDB */
  projects: Project[]
  /** ID del projecte actiu (oberta la vista d'inspecció) */
  activeProjectId: string | null
  /** Zones de l'actiu (carregades lazy) */
  zones: Zone[]
  /** ID de la zona activa (pestanya activa) */
  activeZoneId: string | null
  /** Elements del croquis de la zona activa */
  canvasElements: CanvasElement[]
  /** Lesions de la zona activa */
  lesions: Lesion[]
  /** Fotos de la lesió seleccionada */
  photos: Photo[]
  /** Estat de càrrega global */
  loading: boolean
  /** Missatge d'error (si n'hi ha) */
  error: string | null
}

interface ProjectActions {
  // ── Projectes ──────────────────────────────────────────────────
  loadProjects: () => Promise<void>
  createProject: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Project>
  updateProject: (id: string, patch: Partial<Omit<Project, 'id'>>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  openProject: (id: string) => Promise<void>
  closeProject: () => void

  // ── Zones ──────────────────────────────────────────────────────
  createZone: (data: Omit<Zone, 'id' | 'createdAt'>) => Promise<Zone>
  updateZone: (id: string, patch: Partial<Omit<Zone, 'id'>>) => Promise<void>
  deleteZone: (id: string) => Promise<void>
  setActiveZone: (id: string) => Promise<void>

  // ── Elements del croquis ───────────────────────────────────────
  upsertCanvasElement: (element: CanvasElement) => Promise<void>
  deleteCanvasElement: (id: string) => Promise<void>

  // ── Lesions ────────────────────────────────────────────────────
  createLesion: (data: Omit<Lesion, 'createdAt' | 'updatedAt'>) => Promise<Lesion>
  updateLesion: (id: string, patch: Partial<Omit<Lesion, 'id'>>) => Promise<void>
  deleteLesion: (id: string) => Promise<void>

  // ── Fotos ──────────────────────────────────────────────────────
  loadPhotos: (lesionId: string) => Promise<void>
  addPhoto: (photo: Photo) => Promise<void>
  deletePhoto: (id: string) => Promise<void>
}

type Store = ProjectState & ProjectActions

// ─── Utilitats ────────────────────────────────────────────────────────────────

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
}

function now(): string {
  return new Date().toISOString()
}

// ─── Store Zustand ───────────────────────────────────────────────────────────

export const useProjectStore = create<Store>((set, get) => ({
  // ── Estat inicial ──────────────────────────────────────────────
  projects: [],
  activeProjectId: null,
  zones: [],
  activeZoneId: null,
  canvasElements: [],
  lesions: [],
  photos: [],
  loading: false,
  error: null,

  // ── Projectes ──────────────────────────────────────────────────

  loadProjects: async () => {
    set({ loading: true, error: null })
    try {
      const projects = await getAllProjects()
      set({ projects, loading: false })
    } catch (e) {
      set({ error: String(e), loading: false })
    }
  },

  createProject: async (data) => {
    const project: Project = {
      ...data,
      id: newId(),
      createdAt: now(),
      updatedAt: now(),
    }
    await db.projects.add(project)
    set(s => ({ projects: [project, ...s.projects] }))
    return project
  },

  updateProject: async (id, patch) => {
    const updated = { ...patch, updatedAt: now() }
    await db.projects.update(id, updated)
    set(s => ({
      projects: s.projects.map(p => p.id === id ? { ...p, ...updated } : p),
    }))
  },

  deleteProject: async (id) => {
    await deleteProjectCascade(id)
    set(s => ({ projects: s.projects.filter(p => p.id !== id) }))
  },

  openProject: async (id) => {
    set({ loading: true, activeProjectId: id, activeZoneId: null, zones: [], canvasElements: [], lesions: [] })
    try {
      const zones = await getZonesByProject(id)
      const firstZoneId = zones[0]?.id ?? null
      let elements: CanvasElement[] = []
      let lesions: Lesion[] = []
      if (firstZoneId) {
        ;[elements, lesions] = await Promise.all([
          getElementsByZone(firstZoneId),
          getLesionsByZone(firstZoneId),
        ])
      }
      set({ zones, activeZoneId: firstZoneId, canvasElements: elements, lesions, loading: false })
    } catch (e) {
      set({ error: String(e), loading: false })
    }
  },

  closeProject: () => {
    set({ activeProjectId: null, zones: [], activeZoneId: null, canvasElements: [], lesions: [] })
  },

  // ── Zones ──────────────────────────────────────────────────────

  createZone: async (data) => {
    const zone: Zone = {
      ...data,
      id: newId(),
      createdAt: now(),
    }
    await db.zones.add(zone)
    set(s => ({ zones: [...s.zones, zone] }))
    return zone
  },

  updateZone: async (id, patch) => {
    await db.zones.update(id, patch)
    set(s => ({ zones: s.zones.map(z => z.id === id ? { ...z, ...patch } : z) }))
  },

  deleteZone: async (id) => {
    // Elimina en cascada elements i lesions de la zona
    await db.transaction('rw', [db.zones, db.canvasElements, db.lesions, db.photos], async () => {
      const lesions = await db.lesions.where('zoneId').equals(id).toArray()
      await db.photos.where('lesionId').anyOf(lesions.map(l => l.id)).delete()
      await db.lesions.where('zoneId').equals(id).delete()
      await db.canvasElements.where('zoneId').equals(id).delete()
      await db.zones.delete(id)
    })
    const { zones, activeZoneId } = get()
    const remaining = zones.filter(z => z.id !== id)
    const nextActive = activeZoneId === id ? (remaining[0]?.id ?? null) : activeZoneId
    set({ zones: remaining, activeZoneId: nextActive })
    if (nextActive && nextActive !== activeZoneId) {
      await get().setActiveZone(nextActive)
    }
  },

  setActiveZone: async (id) => {
    set({ loading: true, activeZoneId: id })
    try {
      const [elements, lesions] = await Promise.all([
        getElementsByZone(id),
        getLesionsByZone(id),
      ])
      set({ canvasElements: elements, lesions, loading: false })
    } catch (e) {
      set({ error: String(e), loading: false })
    }
  },

  // ── Elements del croquis ───────────────────────────────────────

  upsertCanvasElement: async (element) => {
    await db.canvasElements.put(element)
    set(s => {
      const exists = s.canvasElements.some(e => e.id === element.id)
      return {
        canvasElements: exists
          ? s.canvasElements.map(e => e.id === element.id ? element : e)
          : [...s.canvasElements, element],
      }
    })
  },

  deleteCanvasElement: async (id) => {
    await db.canvasElements.delete(id)
    set(s => ({ canvasElements: s.canvasElements.filter(e => e.id !== id) }))
  },

  // ── Lesions ────────────────────────────────────────────────────

  createLesion: async (data) => {
    const lesion: Lesion = {
      ...data,
      createdAt: now(),
      updatedAt: now(),
    }
    await db.lesions.add(lesion)
    set(s => ({ lesions: [...s.lesions, lesion] }))
    return lesion
  },

  updateLesion: async (id, patch) => {
    const updated = { ...patch, updatedAt: now() }
    await db.lesions.update(id, updated)
    set(s => ({ lesions: s.lesions.map(l => l.id === id ? { ...l, ...updated } : l) }))
  },

  deleteLesion: async (id) => {
    await db.transaction('rw', [db.lesions, db.photos], async () => {
      await db.photos.where('lesionId').equals(id).delete()
      await db.lesions.delete(id)
    })
    set(s => ({ lesions: s.lesions.filter(l => l.id !== id) }))
  },

  // ── Fotos ──────────────────────────────────────────────────────

  loadPhotos: async (lesionId) => {
    const photos = await getPhotosByLesion(lesionId)
    set({ photos })
  },

  addPhoto: async (photo) => {
    await db.photos.add(photo)
    // Afegim photoId a la lesió corresponent
    const lesion = get().lesions.find(l => l.id === photo.lesionId)
    if (lesion) {
      const photoIds = [...lesion.photoIds, photo.id]
      await db.lesions.update(photo.lesionId, { photoIds, updatedAt: now() })
      set(s => ({
        lesions: s.lesions.map(l =>
          l.id === photo.lesionId ? { ...l, photoIds, updatedAt: now() } : l
        ),
        photos: [...s.photos, photo],
      }))
    }
  },

  deletePhoto: async (id) => {
    const photo = await db.photos.get(id)
    if (!photo) return
    await db.photos.delete(id)
    const lesion = get().lesions.find(l => l.id === photo.lesionId)
    if (lesion) {
      const photoIds = lesion.photoIds.filter(pid => pid !== id)
      await db.lesions.update(photo.lesionId, { photoIds, updatedAt: now() })
      set(s => ({
        lesions: s.lesions.map(l =>
          l.id === photo.lesionId ? { ...l, photoIds, updatedAt: now() } : l
        ),
        photos: s.photos.filter(p => p.id !== id),
      }))
    }
  },
}))

// ─── Selector helpers ────────────────────────────────────────────────────────

/** Retorna el projecte actiu */
export const selectActiveProject = (s: Store) =>
  s.projects.find(p => p.id === s.activeProjectId) ?? null

/** Retorna la zona activa */
export const selectActiveZone = (s: Store) =>
  s.zones.find(z => z.id === s.activeZoneId) ?? null

/** Compta lesions urgents del projecte actiu */
export const selectUrgentCount = (s: Store) =>
  s.lesions.filter(l => l.urgency === 'U').length
