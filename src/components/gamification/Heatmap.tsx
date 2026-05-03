import { Activity } from 'lucide-react'
import { getLast12Weeks, today, toDateString } from '../../utils/date'

interface HeatmapProps {
  workoutDates: Set<string>
  scribbleDates?: Set<string>
}

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export function Heatmap({ workoutDates, scribbleDates = new Set() }: HeatmapProps) {
  const dates = getLast12Weeks()
  const todayStr = today()

  // Group by week (columns)
  const weeks: string[][] = []
  for (let i = 0; i < dates.length; i += 7) {
    weeks.push(dates.slice(i, i + 7))
  }

  return (
    <div className="bg-surface rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Activity size={14} className="text-muted" strokeWidth={1.8} />
        <p className="text-muted text-xs font-medium uppercase tracking-wider">Activity</p>
      </div>
      <div className="flex gap-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1 flex-1">
            {week.map((date, di) => {
              const hasWorkout = workoutDates.has(date)
              const hasScribble = scribbleDates.has(date)
              const isToday = date === todayStr
              const isFuture = date > todayStr

              let bg = 'bg-surface2'
              if (hasWorkout) bg = 'bg-primary'
              else if (hasScribble) bg = 'bg-[#6B9DC2]'

              return (
                <div
                  key={date}
                  title={date}
                  className={`
                    aspect-square rounded-sm transition-colors
                    ${bg}
                    ${isToday ? 'ring-1 ring-accent ring-offset-1 ring-offset-surface' : ''}
                    ${isFuture ? 'opacity-20' : ''}
                  `}
                >
                  {wi === 0 && di < 7 && (
                    <span className="sr-only">{DAYS[di]}</span>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-surface2">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-primary" />
          <span className="text-muted text-[10px] font-medium">Workout</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-[#6B9DC2]" />
          <span className="text-muted text-[10px] font-medium">Scribble</span>
        </div>
        <div className="ml-auto">
          <span className="text-muted text-[10px]">12 weeks</span>
        </div>
      </div>
    </div>
  )
}
