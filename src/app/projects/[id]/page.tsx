import { ProjectDetails } from '@/components/ProjectDetails'

export default function ProjectPage({ params }: { params: { id: string } }) {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8 pt-24">
      <div className="max-w-7xl mx-auto">
        <ProjectDetails projectId={parseInt(params.id)} />
      </div>
    </div>
  )
} 