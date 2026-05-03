import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronUp, Dumbbell, Target, Plus } from 'lucide-react'
import { useProfileStore } from '../store/profileStore'
import { useBodyStore } from '../store/bodyStore'
import { useStreak } from '../hooks/useStreak'
import { StreakCard } from '../components/gamification/StreakCard'
import { RankCard } from '../components/gamification/RankCard'
import { Heatmap } from '../components/gamification/Heatmap'
import { db, Workout } from '../db/schema'
import { greeting, formatDateLong, today } from '../utils/date'
import { formatVolume } from '../utils/volume'

export default function Home() {
  const navigate = useNavigate()
  const { profile } = useProfileStore()
  const { latestWeight, loadMeasurements } = useBodyStore()
  const { workoutDates, scribbleDates, current: streak } = useStreak()
  const [lastWorkout, setLastWorkout] = useState<Workout | null>(null)
  const [weekCount, setWeekCount] = useState(0)
  const [lastExercises, setLastExercises] = useState<string[]>([])
  const [showLastWorkout, setShowLastWorkout] = useState(false)

  useEffect(() => {
    loadMeasurements()
    db.workouts.orderBy('date').reverse().first().then(w => setLastWorkout(w ?? null))

    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const weekStartStr = weekStart.toISOString().split('T')[0]
    db.workouts.where('date').aboveOrEqual(weekStartStr).count().then(setWeekCount)
  }, [loadMeasurements])

  useEffect(() => {
    if (!lastWorkout) return
    db.workout_sets
      .where('workoutId').equals(lastWorkout.id)
      .toArray()
      .then(async sets => {
        const seen = new Set<string>()
        const names: string[] = []
        for (const s of sets) {
          if (!seen.has(s.exerciseId)) {
            seen.add(s.exerciseId)
            const ex = await db.exercises.get(s.exerciseId)
            if (ex) names.push(ex.name)
          }
        }
        setLastExercises(names)
      })
  }, [lastWorkout])

  const todayStr = today()
  const weeklyGoal = profile?.weeklyGoal || 4
  const weekProgress = Math.min(weekCount / weeklyGoal, 1)

  return (
    <div className="min-h-screen bg-bg pb-24">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="px-4 pt-14 pb-4">
          <p className="text-muted text-sm font-medium">{formatDateLong(todayStr)}</p>
          <h1 className="text-textPrimary font-black text-2xl mt-1 tracking-tight">
            {greeting()}, {profile?.name?.split(' ')[0] || 'Lifter'}
          </h1>
        </div>

        <div className="px-4 space-y-3">
          {/* Streak */}
          <StreakCard />

          {/* This week */}
          <div className="bg-surface rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Target size={16} className="text-muted" strokeWidth={1.8} />
                <p className="text-muted text-xs font-medium uppercase tracking-wider">This Week</p>
              </div>
              <p className="text-muted text-xs font-mono">{weekCount} / {weeklyGoal}</p>
            </div>
            <div className="h-2 bg-surface2 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-accent transition-all duration-700"
                style={{ width: `${weekProgress * 100}%` }}
              />
            </div>
            {weekCount >= weeklyGoal ? (
              <p className="text-success text-xs mt-2 font-semibold">Weekly goal achieved</p>
            ) : (
              <p className="text-muted text-xs mt-2">
                {weeklyGoal - weekCount} session{weeklyGoal - weekCount !== 1 ? 's' : ''} to go
              </p>
            )}
          </div>

          {/* Rank */}
          {latestWeight && <RankCard />}

          {/* Heatmap */}
          <Heatmap workoutDates={workoutDates} scribbleDates={scribbleDates} />

          {/* Last workout */}
          {lastWorkout && (
            <div className="bg-surface rounded-2xl overflow-hidden">
              <button
                onClick={() => setShowLastWorkout(s => !s)}
                className="w-full flex items-center justify-between p-4"
              >
                <div className="text-left">
                  <p className="text-muted text-[10px] uppercase tracking-wider font-medium">Last Workout</p>
                  <p className="text-textPrimary font-semibold text-sm mt-0.5">
                    {formatDateLong(lastWorkout.date)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {lastWorkout.totalVolume && (
                    <span className="text-muted text-xs font-mono">{formatVolume(lastWorkout.totalVolume)}</span>
                  )}
                  {showLastWorkout
                    ? <ChevronUp size={16} className="text-muted" />
                    : <ChevronDown size={16} className="text-muted" />
                  }
                </div>
              </button>
              {showLastWorkout && (
                <div className="px-4 pb-4 border-t border-surface2">
                  <div className="mt-3 space-y-2">
                    {lastExercises.map(name => (
                      <div key={name} className="flex items-center gap-2">
                        <Dumbbell size={12} className="text-muted flex-shrink-0" strokeWidth={1.5} />
                        <p className="text-muted text-sm">{name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {workoutDates.size === 0 && streak === 0 && (
            <div className="bg-surface rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Dumbbell size={28} className="text-accent" strokeWidth={1.5} />
              </div>
              <p className="text-textPrimary font-bold text-lg mb-2">Your first workout is waiting</p>
              <p className="text-muted text-sm mb-6 leading-relaxed">
                Start logging to build your streak and track your progress
              </p>
              <button
                onClick={() => navigate('/log')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-white rounded-xl font-bold shadow-lg shadow-accent/20"
              >
                <Plus size={18} strokeWidth={2.5} />
                Start Logging
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
