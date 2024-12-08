import { ProjectForm } from '@/components/ProjectForm'

export default function NewProjectPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8 pt-24">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Create New Project</h1>
        <ProjectForm />
      </div>
    </div>
  )
} 