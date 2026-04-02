import { useEffect, useMemo, useState } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { AppLayout } from '@/components/AppLayout'
import { Dashboard } from '@/features/projects/Dashboard'
import { NewProjectModal } from '@/features/projects/NewProjectModal'
import { ProjectView } from '@/features/inspection/ProjectView'
import type { Project } from '@/types'
import { Download, Plus, Wifi, WifiOff } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export default function App() {
  const { activeProjectId, openProject, closeProject } = useProjectStore()
  const [projectModal, setProjectModal] = useState<{ open: boolean; project: Project | null }>({
    open: false,
    project: null,
  })
  const [isOnline, setIsOnline] = useState(() => window.navigator.onLine)
  const [deferredInstall, setDeferredInstall] = useState<BeforeInstallPromptEvent | null>(null)

  const isStandalone = useMemo(() => {
    return window.matchMedia('(display-mode: standalone)').matches
  }, [])

  useEffect(() => {
    const onOnline = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)

    const onBeforeInstall = (event: Event) => {
      event.preventDefault()
      setDeferredInstall(event as BeforeInstallPromptEvent)
    }

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    window.addEventListener('beforeinstallprompt', onBeforeInstall)

    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
    }
  }, [])

  const openCreateProject = () => setProjectModal({ open: true, project: null })
  const openEditProject = (project: Project) => setProjectModal({ open: true, project })
  const closeProjectModal = () => setProjectModal({ open: false, project: null })

  const handleCreated = async (id: string) => {
    closeProjectModal()
    await openProject(id)
  }

  const handleUpdated = () => {
    closeProjectModal()
  }

  const handleInstallPwa = async () => {
    if (!deferredInstall) return
    await deferredInstall.prompt()
    const choice = await deferredInstall.userChoice
    if (choice.outcome === 'accepted') {
      setDeferredInstall(null)
    }
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {activeProjectId ? (
        <ProjectView onBack={closeProject} />
      ) : (
        <AppLayout
          title="InspecApp"
          subtitle="Gestiona inspecciones de edificios con una interfaz mas clara, tarjetas amplias y acceso directo a creacion y edicion de proyectos."
          actions={
            <div className="flex items-center gap-3">
              <span className={`inline-flex h-12 items-center gap-2 rounded-xl border px-4 text-sm font-semibold shadow-sm ${isOnline ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-amber-200 bg-amber-50 text-amber-700'}`}>
                {isOnline ? <Wifi className="h-4 w-4" strokeWidth={2.2} /> : <WifiOff className="h-4 w-4" strokeWidth={2.2} />}
                {isOnline ? 'Conectado' : 'Modo sin conexion'}
              </span>

              {!isStandalone && deferredInstall && (
                <button
                  type="button"
                  onClick={handleInstallPwa}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 text-sm font-semibold text-text shadow-sm transition hover:border-accent/35 hover:text-accent"
                >
                  <Download className="h-4 w-4" strokeWidth={2.3} />
                  Instalar app
                </button>
              )}

              <button
                type="button"
                onClick={openCreateProject}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-accent-h"
              >
                <Plus className="h-4 w-4" strokeWidth={2.4} />
                Nuevo proyecto
              </button>
            </div>
          }
        >
          <Dashboard
            onOpenProject={openProject}
            onCreateNew={openCreateProject}
            onEditProject={openEditProject}
          />
        </AppLayout>
      )}

      <NewProjectModal
        open={projectModal.open}
        project={projectModal.project}
        onClose={closeProjectModal}
        onCreated={handleCreated}
        onUpdated={handleUpdated}
      />
    </div>
  )
}