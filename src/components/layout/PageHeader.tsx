import { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

interface PageHeaderProps {
  title: string
  back?: boolean
  right?: ReactNode
}

export function PageHeader({ title, back, right }: PageHeaderProps) {
  const navigate = useNavigate()
  return (
    <div className="flex items-center justify-between px-4 py-3 sticky top-0 z-30 bg-bg/95 backdrop-blur-sm border-b border-surface2">
      <div className="flex items-center gap-2">
        {back && (
          <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-muted">
            <ChevronLeft size={24} />
          </button>
        )}
        <h1 className="text-textPrimary font-bold text-xl">{title}</h1>
      </div>
      {right && <div>{right}</div>}
    </div>
  )
}
