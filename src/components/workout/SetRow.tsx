import React, { useCallback, useRef } from 'react'
import { Check, Minus, Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { ActiveSet } from '../../store/workoutStore'

interface SetRowProps {
  set: ActiveSet
  onUpdate: (data: Partial<ActiveSet>) => void
  onLog: () => void
  weightIncrement?: number
}

export const SetRow = React.memo(function SetRow({ set, onUpdate, onLog, weightIncrement = 2.5 }: SetRowProps) {
  const longPressRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined)

  const startLongPress = useCallback((delta: number) => {
    onUpdate({ weight: Math.max(0, Math.round((set.weight + delta) * 10) / 10) })
    longPressRef.current = setInterval(() => {
      onUpdate({ weight: Math.max(0, Math.round((set.weight + delta * 2) * 10) / 10) })
    }, 150)
  }, [set.weight, onUpdate])

  const stopLongPress = useCallback(() => {
    if (longPressRef.current) clearInterval(longPressRef.current)
  }, [])

  const stepReps = useCallback((delta: number) => {
    onUpdate({ reps: Math.max(1, set.reps + delta) })
  }, [set.reps, onUpdate])

  const handleWeightEdit = () => {
    const val = prompt('Weight (kg):', String(set.weight))
    if (val !== null) {
      const n = parseFloat(val)
      if (!isNaN(n) && n >= 0) onUpdate({ weight: n })
    }
  }

  const handleRepsEdit = () => {
    const val = prompt('Reps:', String(set.reps))
    if (val !== null) {
      const n = parseInt(val)
      if (!isNaN(n) && n > 0) onUpdate({ reps: n })
    }
  }

  return (
    <motion.div
      layout
      className={`flex items-center gap-2 py-2 rounded-xl transition-all ${
        set.logged ? 'opacity-55' : ''
      } ${set.isWarmup ? 'opacity-70' : ''}`}
    >
      {/* Set label */}
      <div className="w-7 flex-shrink-0 text-center">
        <span className="text-xs font-bold text-muted">
          {set.isWarmup ? 'W' : set.setNumber}
        </span>
      </div>

      {/* Weight control */}
      <div className="flex items-center gap-1.5 flex-1">
        <button
          onPointerDown={() => startLongPress(-weightIncrement)}
          onPointerUp={stopLongPress}
          onPointerLeave={stopLongPress}
          className="w-10 h-11 rounded-xl bg-surface2 flex items-center justify-center active:bg-primary/60 transition-colors"
        >
          <Minus size={15} className="text-muted" />
        </button>
        <button
          onClick={handleWeightEdit}
          className="flex-1 h-11 bg-surface2 rounded-xl flex flex-col items-center justify-center gap-0"
        >
          <span className="text-textPrimary font-bold text-xl font-mono leading-tight">{set.weight}</span>
          <span className="text-muted text-[9px] leading-none">kg</span>
        </button>
        <button
          onPointerDown={() => startLongPress(weightIncrement)}
          onPointerUp={stopLongPress}
          onPointerLeave={stopLongPress}
          className="w-10 h-11 rounded-xl bg-surface2 flex items-center justify-center active:bg-primary/60 transition-colors"
        >
          <Plus size={15} className="text-muted" />
        </button>
      </div>

      {/* Reps control */}
      <div className="flex items-center gap-1.5 flex-1">
        <button
          onPointerDown={() => stepReps(-1)}
          className="w-10 h-11 rounded-xl bg-surface2 flex items-center justify-center active:bg-primary/60 transition-colors"
        >
          <Minus size={15} className="text-muted" />
        </button>
        <button
          onClick={handleRepsEdit}
          className="flex-1 h-11 bg-surface2 rounded-xl flex flex-col items-center justify-center"
        >
          <span className="text-textPrimary font-bold text-xl font-mono leading-tight">{set.reps}</span>
          <span className="text-muted text-[9px] leading-none">reps</span>
        </button>
        <button
          onPointerDown={() => stepReps(1)}
          className="w-10 h-11 rounded-xl bg-surface2 flex items-center justify-center active:bg-primary/60 transition-colors"
        >
          <Plus size={15} className="text-muted" />
        </button>
      </div>

      {/* Log button */}
      <motion.button
        whileTap={{ scale: 0.85 }}
        onClick={onLog}
        disabled={set.logged}
        className={`w-14 h-11 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
          set.logged
            ? 'bg-success/25 text-success border border-success/30'
            : 'bg-accent text-white shadow-md shadow-accent/30 active:shadow-none'
        }`}
      >
        <Check size={20} strokeWidth={2.5} />
      </motion.button>
    </motion.div>
  )
})
