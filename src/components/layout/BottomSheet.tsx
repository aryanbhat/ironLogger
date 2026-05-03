import { ReactNode, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  fullHeight?: boolean
}

export function BottomSheet({ open, onClose, children, title, fullHeight }: BottomSheetProps) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-2xl shadow-2xl ${fullHeight ? 'h-[90vh]' : 'max-h-[90vh]'} flex flex-col`}
          >
            <div className="flex-shrink-0 pt-3 pb-2 px-4">
              <div className="w-10 h-1 bg-surface2 rounded-full mx-auto mb-3" />
              {title && (
                <h2 className="text-textPrimary font-bold text-lg text-center">{title}</h2>
              )}
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
