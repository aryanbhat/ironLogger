import { useNavigate } from 'react-router-dom'
import { PenLine } from 'lucide-react'
import { motion } from 'framer-motion'

export function FAB() {
  const navigate = useNavigate()
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={() => navigate('/scribble')}
      className="fixed bottom-[72px] right-4 z-50 w-14 h-14 rounded-full bg-accent shadow-lg shadow-accent/30 flex items-center justify-center"
      aria-label="Scribble note"
    >
      <PenLine size={22} color="white" strokeWidth={2.2} />
    </motion.button>
  )
}
