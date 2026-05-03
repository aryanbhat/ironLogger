import { useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy } from 'lucide-react'
import { PRResult } from '../../store/workoutStore'

interface PRCelebrationProps {
  pr: PRResult | null
  onDismiss: () => void
}

function fireConfetti() {
  import('canvas-confetti').then(mod => {
    const fn = mod.default as (opts: Record<string, unknown>) => void
    fn({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.4 },
      colors: ['#FF6B35', '#1E3A5F', '#FFD700', '#F0F4F8'],
    })
  }).catch(() => {})
}

export function PRCelebration({ pr, onDismiss }: PRCelebrationProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (!pr) return
    fireConfetti()
    timerRef.current = setTimeout(onDismiss, 3000)
    return () => clearTimeout(timerRef.current)
  }, [pr, onDismiss])

  return (
    <AnimatePresence>
      {pr && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          onClick={onDismiss}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm"
        >
          <div className="text-center px-8">
            <motion.div
              initial={{ scale: 0, rotate: -10 }}
              animate={{ scale: [0, 1.25, 1], rotate: [0, 5, 0] }}
              transition={{ duration: 0.5, times: [0, 0.6, 1] }}
              className="w-28 h-28 mx-auto mb-6 bg-accent/15 border-2 border-accent/40 rounded-3xl flex items-center justify-center"
            >
              <Trophy size={52} className="text-accent" strokeWidth={1.5} fill="rgba(255,107,53,0.2)" />
            </motion.div>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-accent font-black text-4xl tracking-tight mb-2"
            >
              New PR
            </motion.p>
            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="text-textPrimary font-bold text-2xl font-mono"
            >
              {pr.weight}kg × {pr.reps}
            </motion.p>
            {pr.isEstimated && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-muted text-sm mt-2"
              >
                Estimated 1RM PR
              </motion.p>
            )}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="text-muted text-xs mt-6"
            >
              Tap to dismiss
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
