import { useState } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { AppLayout } from '@/components/AppLayout'
import { Dashboard } from '@/features/projects/Dashboard'
import { NewProjectModal } from '@/features/projects/NewProjectModal'
import { ProjectView } from '@/features/inspection/ProjectView'
import type { Project } from '@/types'
import { Plus } from 'lucide-react'

export default function App() {
  const { activeProjectId, openProject, closeProject } = useProjectStore()
  const [projectModal, setProjectModal] = useState<{ open: boolean; project: Project | null }>({
    open: false,
    project: null,
  })

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

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {activeProjectId ? (
        <ProjectView onBack={closeProject} />
      ) : (
        <AppLayout
          title="InspecApp"
          subtitle="Gestion de inspecciones de edificios"
          actions={
            <button
              type="button"
              onClick={openCreateProject}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-accent px-3.5 text-xs font-semibold text-white transition hover:bg-accent-h"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.4} />
              Nuevo proyecto
            </button>
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