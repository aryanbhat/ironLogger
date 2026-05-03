import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ChevronLeft } from 'lucide-react'
import { db } from '../db/schema'
import { today } from '../utils/date'
import { motion } from 'framer-motion'

export default function Scribble() {
  const navigate = useNavigate()
  const [text, setText] = useState('')
  const [date, setDate] = useState(today())
  const [saved, setSaved] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  const handleSave = async () => {
    if (!text.trim()) return

    const scribbleId = crypto.randomUUID()
    await db.scribble_notes.add({
      id: scribbleId,
      date,
      rawText: text.trim(),
      createdAt: new Date().toISOString(),
    })

    // Create workout record for streak counting
    const existingWorkout = await db.workouts.where('date').equals(date).first()
    if (!existingWorkout) {
      await db.workouts.add({
        id: crypto.randomUUID(),
        date,
        startTime: new Date().toISOString(),
        type: 'scribble',
        createdAt: new Date().toISOString(),
      })
    }

    setSaved(true)
    setTimeout(() => navigate(-1), 800)
  }

  return (
    <div className="fixed inset-0 bg-bg flex flex-col z-50">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-safe pt-4 pb-3">
        <button onClick={() => navigate(-1)} className="p-1 text-muted">
          <ChevronLeft size={24} />
        </button>
        <input
          type="date"
          value={date}
          max={today()}
          onChange={e => setDate(e.target.value)}
          className="bg-surface2 rounded-xl px-3 py-1.5 text-muted text-sm outline-none text-center"
        />
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={handleSave}
          disabled={!text.trim() || saved}
          className={`px-4 py-2 rounded-xl font-bold text-sm transition-colors ${
            saved ? 'bg-success text-white' : text.trim() ? 'bg-accent text-white' : 'bg-surface2 text-muted'
          }`}
        >
          {saved ? <Check size={18} /> : 'Save'}
        </motion.button>
      </div>

      {/* Textarea */}
      <div className="flex-1 px-5 pb-8">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Just write what you did...&#10;&#10;e.g. Chest day. Bench 3×8 @80kg. Incline 3×10. Felt solid today."
          className="w-full h-full bg-transparent text-textPrimary text-xl leading-relaxed outline-none resize-none placeholder:text-surface2"
          style={{ caretColor: '#FF6B35' }}
        />
      </div>

      {text.length > 0 && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center pointer-events-none">
          <span className="text-muted text-xs bg-surface/80 px-3 py-1 rounded-full">
            {text.length} chars
          </span>
        </div>
      )}
    </div>
  )
}
