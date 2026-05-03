import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Toast {
  id: string
  message: string
  emoji?: string
  type?: 'success' | 'info' | 'error'
}

let addToastFn: ((t: Omit<Toast, 'id'>) => void) | null = null

export function toast(message: string, emoji?: string, type: Toast['type'] = 'success') {
  addToastFn?.({ message, emoji, type })
}

export function ToastProvider() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((t: Omit<Toast, 'id'>) => {
    const id = crypto.randomUUID()
    setToasts(p => [...p, { ...t, id }])
    setTimeout(() => setToasts(p => p.filter(x => x.id !== id)), 3000)
  }, [])

  useEffect(() => {
    addToastFn = addToast
    return () => { addToastFn = null }
  }, [addToast])

  return (
    <div className="fixed top-4 left-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none max-w-sm mx-auto">
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ y: -20, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0, scale: 0.9 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl pointer-events-auto ${
              t.type === 'error' ? 'bg-danger' : 'bg-surface border border-surface2'
            }`}
          >
            {t.emoji && <span className="text-xl">{t.emoji}</span>}
            <p className="text-textPrimary text-sm font-medium">{t.message}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
