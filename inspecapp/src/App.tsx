import { useState } from 'react'
import { useProjectStore } from '@/store/useProjectStore'
import { Dashboard } from '@/features/projects/Dashboard'
import { NewProjectModal } from '@/features/projects/NewProjectModal'
import { ProjectView } from '@/features/inspection/ProjectView'

export default function App() {
  const { activeProjectId, openProject, closeProject } = useProjectStore()
  const [showNewProject, setShowNewProject] = useState(false)

  const handleCreated = async (id: string) => {
    setShowNewProject(false)
    await openProject(id)
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {activeProjectId ? (
        <ProjectView onBack={closeProject} />
      ) : (
        <Dashboard
          onOpenProject={openProject}
          onCreateNew={() => setShowNewProject(true)}
        />
      )}

      <NewProjectModal
        open={showNewProject}
        onClose={() => setShowNewProject(false)}
        onCreated={handleCreated}
      />
    </div>
  )
}