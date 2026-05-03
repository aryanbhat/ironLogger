import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, Clock, AlertTriangle, Dumbbell, Zap, Settings2, User, Weight, Move, TrendingUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWorkoutStore, ActiveExercise, ActiveSet } from '../store/workoutStore'
import { useExerciseStore } from '../store/exerciseStore'
import { Exercise } from '../db/schema'
import { useProfileStore } from '../store/profileStore'
import { SetRow } from '../components/workout/SetRow'
import { RestTimer } from '../components/workout/RestTimer'
import { PRCelebration } from '../components/workout/PRCelebration'
import { ExercisePicker } from '../components/workout/ExercisePicker'
import { BottomSheet } from '../components/layout/BottomSheet'
import { db, PersonalRecord } from '../db/schema'
import { elapsedSeconds, formatDuration, today } from '../utils/date'
import { formatVolume } from '../utils/volume'
import { PRResult } from '../store/workoutStore'

export default function Log() {
  const navigate = useNavigate()
  const {
    activeWorkout, activeExercises, newPRs,
    startWorkout, addExercise, removeExercise, addSet,
    updateSet, logSet, finishWorkout, clearNewPRs, loadRecentExercises,
  } = useWorkoutStore()
  const { getById } = useExerciseStore()
  const { profile } = useProfileStore()

  const [elapsed, setElapsed] = useState(0)
  const [showPicker, setShowPicker] = useState(false)
  const [showFinish, setShowFinish] = useState(false)
  const [restActive, setRestActive] = useState(false)
  const [currentPR, setCurrentPR] = useState<PRResult | null>(null)
  const [mood, setMood] = useState<1|2|3|4|5>(3)
  const [notes, setNotes] = useState('')
  const [exercisePRs, setExercisePRs] = useState<Record<string, PersonalRecord[]>>({})
  const [progressionSuggestions, setProgressionSuggestions] = useState<Record<string, { suggestedWeight: number; id: string }>>({})
  const [workoutDate, setWorkoutDate] = useState(today())

  // Show PRs one by one
  useEffect(() => {
    if (newPRs.length > 0 && !currentPR) {
      setCurrentPR(newPRs[0])
    }
  }, [newPRs, currentPR])

  const dismissPR = useCallback(() => {
    setCurrentPR(null)
    clearNewPRs()
  }, [clearNewPRs])

  // Elapsed timer
  useEffect(() => {
    if (!activeWorkout) return
    const tick = () => setElapsed(elapsedSeconds(activeWorkout.startTime))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [activeWorkout])

  // Load PRs for exercises
  useEffect(() => {
    activeExercises.forEach(async ({ exerciseId }) => {
      const prs = await db.personal_records.where('exerciseId').equals(exerciseId).toArray()
      setExercisePRs(p => ({ ...p, [exerciseId]: prs }))

      const suggestion = await db.progression_suggestions
        .where('exerciseId').equals(exerciseId)
        .filter(s => !s.dismissed)
        .first()
      if (suggestion) {
        setProgressionSuggestions(p => ({ ...p, [exerciseId]: { suggestedWeight: suggestion.suggestedWeight, id: suggestion.id } }))
      }
    })
  }, [activeExercises])

  useEffect(() => { loadRecentExercises() }, [loadRecentExercises])

  const handleLogSet = async (exerciseId: string, setId: string) => {
    await logSet(exerciseId, setId)
    setRestActive(true)
  }

  const handleFinish = async () => {
    await finishWorkout(notes, mood)
    navigate('/', { replace: true })
  }

  const dismissSuggestion = async (exerciseId: string) => {
    const s = progressionSuggestions[exerciseId]
    if (s) {
      await db.progression_suggestions.update(s.id, { dismissed: true })
      setProgressionSuggestions(p => { const n = { ...p }; delete n[exerciseId]; return n })
    }
  }

  const acceptSuggestion = (exerciseId: string) => {
    const s = progressionSuggestions[exerciseId]
    if (!s) return
    const exercise = activeExercises.find(e => e.exerciseId === exerciseId)
    if (!exercise) return
    const lastSet = exercise.sets[exercise.sets.length - 1]
    if (lastSet) {
      updateSet(exerciseId, lastSet.id, { weight: s.suggestedWeight })
    }
    dismissSuggestion(exerciseId)
  }

  if (!activeWorkout) {
    return (
      <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-6 pb-24">
        <div className="w-20 h-20 bg-surface rounded-2xl flex items-center justify-center mb-6">
          <Dumbbell size={36} className="text-accent" strokeWidth={1.5} />
        </div>
        <h1 className="text-textPrimary font-black text-2xl mb-3 text-center">Ready to lift?</h1>
        <p className="text-muted text-sm mb-8 text-center">Log sets in under 3 seconds. Every rep counts.</p>
        <button
          onClick={() => startWorkout(workoutDate)}
          className="w-full max-w-xs py-4 bg-accent rounded-xl text-white font-bold text-lg shadow-lg shadow-accent/30"
        >
          Start Workout
        </button>
        <div className="mt-4">
          <input
            type="date"
            value={workoutDate}
            max={today()}
            onChange={e => setWorkoutDate(e.target.value)}
            className="bg-surface2 rounded-xl px-4 py-2 text-muted text-sm outline-none text-center"
          />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg pb-32">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-bg/95 backdrop-blur-sm border-b border-surface2 px-4 py-3">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <Clock size={16} className="text-accent" />
            <span className="text-textPrimary font-bold font-mono text-lg">{formatDuration(elapsed)}</span>
          </div>
          <button
            onClick={() => setShowFinish(true)}
            className="px-4 py-2 bg-danger/20 text-danger rounded-xl font-bold text-sm border border-danger/30"
          >
            Finish
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4 max-w-lg mx-auto">
        {/* Exercise cards */}
        {activeExercises.map(ae => (
          <ExerciseCard
            key={ae.exerciseId}
            ae={ae}
            prs={exercisePRs[ae.exerciseId] || []}
            suggestion={progressionSuggestions[ae.exerciseId]}
            getById={getById}
            onAddSet={() => addSet(ae.exerciseId)}
            onRemove={() => removeExercise(ae.exerciseId)}
            onUpdateSet={(setId, data) => updateSet(ae.exerciseId, setId, data as Partial<ActiveSet>)}
            onLogSet={(setId) => handleLogSet(ae.exerciseId, setId)}
            onAcceptSuggestion={() => acceptSuggestion(ae.exerciseId)}
            onDismissSuggestion={() => dismissSuggestion(ae.exerciseId)}
          />
        ))}

        {/* Add exercise */}
        <button
          onClick={() => setShowPicker(true)}
          className="w-full py-4 border-2 border-dashed border-surface2 rounded-2xl flex items-center justify-center gap-2 text-muted hover:border-accent hover:text-accent transition-colors"
        >
          <Plus size={20} />
          <span className="font-medium">Add Exercise</span>
        </button>

        {activeExercises.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted text-sm">Tap "Add Exercise" to begin your session</p>
          </div>
        )}
      </div>

      {/* Rest timer */}
      {restActive && (
        <RestTimer
          duration={profile?.defaultRestTimer || 90}
          onComplete={() => setRestActive(false)}
          onDismiss={() => setRestActive(false)}
        />
      )}

      {/* PR Celebration */}
      <PRCelebration pr={currentPR} onDismiss={dismissPR} />

      {/* Exercise picker */}
      <ExercisePicker
        open={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={addExercise}
        selectedIds={activeExercises.map(e => e.exerciseId)}
      />

      {/* Finish sheet */}
      <BottomSheet open={showFinish} onClose={() => setShowFinish(false)} title="Finish Workout">
        <FinishSheet
          elapsed={elapsed}
          exerciseCount={activeExercises.length}
          setCount={activeExercises.reduce((a, e) => a + e.sets.filter(s => s.logged).length, 0)}
          volume={formatVolume(activeExercises.reduce((a, e) =>
            a + e.sets.filter(s => s.logged && !s.isWarmup).reduce((b, s) => b + s.weight * s.reps, 0), 0
          ))}
          mood={mood}
          notes={notes}
          onMoodChange={setMood}
          onNotesChange={setNotes}
          onFinish={handleFinish}
          onCancel={() => setShowFinish(false)}
        />
      </BottomSheet>
    </div>
  )
}

// Extracted ExerciseCard component
interface ExerciseCardProps {
  ae: ActiveExercise
  prs: PersonalRecord[]
  suggestion?: { suggestedWeight: number; id: string }
  getById: (id: string) => Exercise | undefined
  onAddSet: () => void
  onRemove: () => void
  onUpdateSet: (setId: string, data: Partial<ActiveSet>) => void
  onLogSet: (setId: string) => void
  onAcceptSuggestion: () => void
  onDismissSuggestion: () => void
}

function ExerciseCard({
  ae, prs, suggestion, getById, onAddSet, onRemove,
  onUpdateSet, onLogSet, onAcceptSuggestion, onDismissSuggestion
}: ExerciseCardProps) {
  const exercise = getById(ae.exerciseId)
  const bestPR = prs.length > 0 ? prs.reduce((a, b) => a.weight > b.weight ? a : b) : null

  const EQUIPMENT_ICONS: Record<string, React.ReactNode> = {
    Barbell: <Weight size={14} strokeWidth={1.8} />,
    Dumbbell: <Dumbbell size={14} strokeWidth={1.8} />,
    Cable: <Zap size={14} strokeWidth={1.8} />,
    Machine: <Settings2 size={14} strokeWidth={1.8} />,
    Bodyweight: <User size={14} strokeWidth={1.8} />,
    Kettlebell: <Weight size={14} strokeWidth={1.8} />,
    'Smith Machine': <Move size={14} strokeWidth={1.8} />,
    'Resistance Band': <Move size={14} strokeWidth={1.8} />,
  }

  return (
    <div className="bg-surface rounded-2xl overflow-hidden">
      <div className="px-4 pt-4 pb-3 flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-muted flex-shrink-0">
              {EQUIPMENT_ICONS[exercise?.equipment || ''] || <Dumbbell size={14} strokeWidth={1.8} />}
            </span>
            <h2 className="text-textPrimary font-bold text-base leading-tight">{exercise?.name}</h2>
          </div>
          {bestPR && (
            <p className="text-muted text-xs ml-5 flex items-center gap-1">
              <TrendingUp size={10} />
              Best: {bestPR.weight}kg × {bestPR.reps}
            </p>
          )}
        </div>
        <button onClick={onRemove} className="p-1.5 text-muted hover:text-danger transition-colors">
          <X size={16} />
        </button>
      </div>

      {/* Progression suggestion */}
      <AnimatePresence>
        {suggestion && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mx-4 mb-3 bg-accent/10 border border-accent/30 rounded-xl p-3 flex items-center gap-3"
          >
            <TrendingUp size={18} className="text-accent flex-shrink-0" strokeWidth={2} />
            <div className="flex-1">
              <p className="text-accent text-xs font-semibold">Ready to progress?</p>
              <p className="text-textPrimary text-xs">Try {suggestion.suggestedWeight}kg this session</p>
            </div>
            <div className="flex gap-1">
              <button onClick={onAcceptSuggestion} className="px-2 py-1 bg-accent text-white text-xs rounded-lg font-medium">Yes</button>
              <button onClick={onDismissSuggestion} className="px-2 py-1 bg-surface2 text-muted text-xs rounded-lg">Skip</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Set header */}
      <div className="flex items-center gap-2 px-4 pb-2">
        <div className="w-7" />
        <div className="flex-1 text-center">
          <span className="text-muted text-xs uppercase tracking-wider">Weight</span>
        </div>
        <div className="flex-1 text-center">
          <span className="text-muted text-xs uppercase tracking-wider">Reps</span>
        </div>
        <div className="w-14 text-center">
          <span className="text-muted text-xs uppercase tracking-wider">Log</span>
        </div>
      </div>

      {/* Sets */}
      <div className="px-3 space-y-1">
        {ae.sets.map(set => (
          <SetRow
            key={set.id}
            set={set}
            onUpdate={(data) => onUpdateSet(set.id, data as Partial<ActiveSet>)}
            onLog={() => onLogSet(set.id)}
          />
        ))}
      </div>

      <div className="p-3">
        <button
          onClick={onAddSet}
          className="w-full py-3 rounded-xl bg-surface2 text-muted text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-primary/50 transition-colors"
        >
          <Plus size={16} />
          Add Set
        </button>
      </div>
    </div>
  )
}

interface FinishSheetProps {
  elapsed: number
  exerciseCount: number
  setCount: number
  volume: string
  mood: 1|2|3|4|5
  notes: string
  onMoodChange: (m: 1|2|3|4|5) => void
  onNotesChange: (n: string) => void
  onFinish: () => void
  onCancel: () => void
}

const MOODS: { label: string; color: string }[] = [
  { label: 'Rough', color: '#C1121F' },
  { label: 'Meh', color: '#8B4513' },
  { label: 'OK', color: '#8BA3B8' },
  { label: 'Good', color: '#2D6A4F' },
  { label: 'Fire', color: '#FF6B35' },
]

function FinishSheet({ elapsed, exerciseCount, setCount, volume, mood, notes, onMoodChange, onNotesChange, onFinish, onCancel }: FinishSheetProps) {
  return (
    <div className="p-4 space-y-5 pb-8">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Duration', value: formatDuration(elapsed) },
          { label: 'Exercises', value: String(exerciseCount) },
          { label: 'Volume', value: volume },
        ].map(item => (
          <div key={item.label} className="bg-surface2 rounded-xl p-3 text-center">
            <p className="text-textPrimary font-bold text-lg font-mono">{item.value}</p>
            <p className="text-muted text-xs">{item.label}</p>
          </div>
        ))}
      </div>

      <p className="text-muted text-xs text-center">{setCount} sets logged</p>

      {/* Mood */}
      <div>
        <p className="text-muted text-xs uppercase tracking-wider mb-3">How did it feel?</p>
        <div className="flex gap-2">
          {MOODS.map((m, i) => (
            <button
              key={i}
              onClick={() => onMoodChange((i + 1) as 1|2|3|4|5)}
              className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all border ${
                mood === i + 1
                  ? 'border-transparent scale-105'
                  : 'border-surface2 opacity-50'
              }`}
              style={mood === i + 1 ? { backgroundColor: `${m.color}22`, color: m.color, borderColor: `${m.color}44` } : {}}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <p className="text-muted text-xs uppercase tracking-wider mb-2">Post-workout notes</p>
        <textarea
          value={notes}
          onChange={e => onNotesChange(e.target.value)}
          placeholder="How'd it go? PRs? Anything to note..."
          rows={3}
          className="w-full bg-surface2 rounded-xl px-4 py-3 text-textPrimary text-sm outline-none resize-none border border-transparent focus:border-accent"
        />
      </div>

      {setCount === 0 && (
        <div className="flex items-center gap-2 text-muted bg-surface2 rounded-xl p-3">
          <AlertTriangle size={16} />
          <p className="text-xs">No sets logged yet. Are you sure?</p>
        </div>
      )}

      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 py-3 bg-surface2 text-muted rounded-xl font-medium">
          Cancel
        </button>
        <button onClick={onFinish} className="flex-1 py-3 bg-accent text-white rounded-xl font-bold">
          Save Workout
        </button>
      </div>
    </div>
  )
}
