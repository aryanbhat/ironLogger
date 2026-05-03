import { useEffect, useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus } from 'lucide-react'

interface RestTimerProps {
  duration: number
  onComplete: () => void
  onDismiss: () => void
}

export function RestTimer({ duration, onComplete, onDismiss }: RestTimerProps) {
  const [remaining, setRemaining] = useState(duration)
  const [totalDuration, setTotalDuration] = useState(duration)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const start = useCallback(() => {
    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!)
          onComplete()
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [onComplete])

  useEffect(() => {
    start()
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [start])

  const progress = remaining / totalDuration

  const extend = () => {
    setRemaining(r => r + 30)
    setTotalDuration(t => t + 30)
  }

  const mins = Math.floor(remaining / 60)
  const secs = remaining % 60

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="fixed bottom-[80px] left-4 right-4 z-40 bg-surface border border-surface2 rounded-2xl shadow-xl p-4"
      >
        <div className="flex items-center gap-4">
          {/* Ring */}
          <div className="relative w-14 h-14 flex-shrink-0">
            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="24" fill="none" stroke="#1F3347" strokeWidth="4" />
              <motion.circle
                cx="28" cy="28" r="24"
                fill="none"
                stroke="#FF6B35"
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 24}`}
                strokeDashoffset={`${2 * Math.PI * 24 * (1 - progress)}`}
                transition={{ duration: 1, ease: 'linear' }}
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-textPrimary font-bold font-mono text-sm">
              {mins > 0 ? `${mins}:${String(secs).padStart(2,'0')}` : secs}
            </span>
          </div>

          <div className="flex-1">
            <p className="text-muted text-xs">Rest Timer</p>
            <p className="text-textPrimary font-semibold text-sm">
              {remaining > 0 ? 'Resting...' : 'Go!'}
            </p>
          </div>

          <button
            onClick={extend}
            className="w-9 h-9 rounded-lg bg-surface2 flex items-center justify-center text-muted"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={onDismiss}
            className="w-9 h-9 rounded-lg bg-surface2 flex items-center justify-center text-muted"
          >
            <X size={16} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
