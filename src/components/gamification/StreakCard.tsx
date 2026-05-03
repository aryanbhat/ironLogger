import { Flame, TrendingUp } from 'lucide-react'
import { useStreak } from '../../hooks/useStreak'
import { today, toDateString } from '../../utils/date'

export function StreakCard() {
  const { current, best, lastWorkoutDate } = useStreak()
  const todayStr = today()
  const yesterdayStr = toDateString(new Date(Date.now() - 86400000))
  const atRisk = current > 0 && lastWorkoutDate === yesterdayStr && lastWorkoutDate !== todayStr

  return (
    <div className="bg-surface rounded-2xl overflow-hidden">
      <div className="flex items-stretch">
        {/* Left accent bar */}
        <div className={`w-1 flex-shrink-0 ${current > 0 ? 'bg-accent' : 'bg-surface2'}`} />

        <div className="flex-1 p-4 flex items-center gap-4">
          {/* Flame icon */}
          <div className={`relative flex-shrink-0 w-14 h-14 rounded-xl flex items-center justify-center ${
            current > 0 ? 'bg-accent/15' : 'bg-surface2'
          }`}>
            <Flame
              size={26}
              className={current > 0 ? 'text-accent' : 'text-muted'}
              strokeWidth={1.8}
              fill={current > 0 ? 'rgba(255,107,53,0.25)' : 'none'}
            />
            {current >= 7 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent rounded-full flex items-center justify-center">
                <span className="text-[9px] font-black text-white">🔥</span>
              </span>
            )}
          </div>

          {/* Stats */}
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-1.5">
              <span className={`text-4xl font-black font-mono leading-none ${current > 0 ? 'text-textPrimary' : 'text-muted'}`}>
                {current}
              </span>
              <span className="text-muted text-sm">day{current !== 1 ? 's' : ''}</span>
            </div>
            <p className="text-muted text-xs mt-0.5 flex items-center gap-1">
              <TrendingUp size={11} strokeWidth={2} />
              Best: {best} day{best !== 1 ? 's' : ''}
            </p>
            {atRisk && (
              <p className="text-accent text-xs mt-1.5 font-semibold">
                Log today to keep your streak
              </p>
            )}
            {current === 0 && (
              <p className="text-muted text-xs mt-1">Start your streak today</p>
            )}
          </div>

          {/* Streak label */}
          <div className="flex-shrink-0 text-right">
            <p className="text-muted text-[10px] uppercase tracking-widest font-medium">Streak</p>
            {current >= 3 && (
              <p className="text-accent text-xs font-semibold mt-0.5">
                {current >= 30 ? 'Legendary' : current >= 14 ? 'Titan' : current >= 7 ? 'Warrior' : 'Active'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
