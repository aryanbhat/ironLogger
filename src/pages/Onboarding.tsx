import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Dumbbell, Ruler, Calendar, ChevronRight, Check, Weight, TrendingUp } from 'lucide-react'
import { useProfileStore } from '../store/profileStore'
import { useBodyStore } from '../store/bodyStore'
import { today } from '../utils/date'

const TRAINING_DAYS = [2, 3, 4, 5, 6]

// IronLog wordmark SVG component
function IronLogLogo({ size = 48 }: { size?: number }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="rounded-2xl flex items-center justify-center bg-primary"
        style={{ width: size, height: size }}
      >
        <Dumbbell size={size * 0.5} className="text-accent" strokeWidth={1.8} />
      </div>
      <div className="text-center">
        <p className="text-textPrimary font-black text-2xl tracking-tight leading-none">Iron<span className="text-accent">Log</span></p>
        <p className="text-muted text-xs tracking-widest uppercase mt-0.5">Gym Tracker</p>
      </div>
    </div>
  )
}

export default function Onboarding() {
  const navigate = useNavigate()
  const { save, setOnboarded } = useProfileStore()
  const { addMeasurement } = useBodyStore()

  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [dob, setDob] = useState('')
  const [weeklyGoal, setWeeklyGoal] = useState(4)

  const next = () => setStep(s => s + 1)

  const finish = async () => {
    await save({
      name: name.trim() || 'Lifter',
      height: height ? parseFloat(height) : undefined,
      dateOfBirth: dob || undefined,
      weeklyGoal,
    })
    if (weight) {
      await addMeasurement({ date: today(), weight: parseFloat(weight) })
    }
    await setOnboarded()
    navigate('/log', { replace: true })
  }

  const variants = {
    enter: { x: 40, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -40, opacity: 0 },
  }

  const steps = [
    // Step 0 — Welcome
    <motion.div
      key="s0"
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex flex-col items-center text-center px-6 pt-12 pb-10"
    >
      <IronLogLogo size={64} />

      <div className="mt-10 mb-8 w-full">
        <h2 className="text-textPrimary font-black text-xl mb-6">What should we call you?</h2>
        <input
          autoFocus
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && name.trim() && next()}
          placeholder="Enter your name"
          className="w-full bg-surface rounded-xl px-4 py-4 text-textPrimary text-lg outline-none border border-surface2 focus:border-accent transition-colors text-center font-bold"
        />
      </div>

      <button
        onClick={next}
        disabled={!name.trim()}
        className="w-full py-4 bg-accent rounded-xl text-white font-bold text-base flex items-center justify-center gap-2 disabled:opacity-40 disabled:pointer-events-none shadow-lg shadow-accent/20 transition-all"
      >
        Continue
        <ChevronRight size={18} strokeWidth={2.5} />
      </button>
    </motion.div>,

    // Step 1 — Stats
    <motion.div
      key="s1"
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex flex-col px-6 pt-8 pb-10"
    >
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-primary/30 rounded-xl flex items-center justify-center">
          <Ruler size={22} className="text-accent" strokeWidth={1.8} />
        </div>
        <div>
          <h2 className="text-textPrimary font-black text-xl leading-tight">Your stats</h2>
          <p className="text-muted text-sm">Used for BMI and rank (optional)</p>
        </div>
      </div>

      <div className="space-y-4 flex-1">
        <div>
          <label className="text-muted text-xs uppercase tracking-wider mb-2 block font-medium">Body Weight (kg)</label>
          <div className="relative">
            <Weight size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="number"
              value={weight}
              onChange={e => setWeight(e.target.value)}
              placeholder="e.g. 72"
              className="w-full bg-surface rounded-xl pl-10 pr-4 py-3.5 text-textPrimary outline-none border border-surface2 focus:border-accent transition-colors"
            />
          </div>
        </div>
        <div>
          <label className="text-muted text-xs uppercase tracking-wider mb-2 block font-medium">Height (cm)</label>
          <div className="relative">
            <Ruler size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="number"
              value={height}
              onChange={e => setHeight(e.target.value)}
              placeholder="e.g. 175"
              className="w-full bg-surface rounded-xl pl-10 pr-4 py-3.5 text-textPrimary outline-none border border-surface2 focus:border-accent transition-colors"
            />
          </div>
        </div>
        <div>
          <label className="text-muted text-xs uppercase tracking-wider mb-2 block font-medium">Date of Birth</label>
          <div className="relative">
            <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="date"
              value={dob}
              onChange={e => setDob(e.target.value)}
              max={today()}
              className="w-full bg-surface rounded-xl pl-10 pr-4 py-3.5 text-textPrimary outline-none border border-surface2 focus:border-accent transition-colors"
            />
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        <button onClick={() => setStep(0)} className="w-12 h-12 flex-shrink-0 bg-surface rounded-xl flex items-center justify-center text-muted border border-surface2">
          <ChevronRight size={18} className="rotate-180" />
        </button>
        <button onClick={next} className="flex-1 py-3 bg-accent rounded-xl text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-accent/20">
          Continue <ChevronRight size={18} strokeWidth={2.5} />
        </button>
      </div>
    </motion.div>,

    // Step 2 — Weekly Goal
    <motion.div
      key="s2"
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex flex-col items-center px-6 pt-8 pb-10"
    >
      <div className="flex items-center gap-3 mb-8 self-start">
        <div className="w-12 h-12 bg-primary/30 rounded-xl flex items-center justify-center">
          <Calendar size={22} className="text-accent" strokeWidth={1.8} />
        </div>
        <div>
          <h2 className="text-textPrimary font-black text-xl leading-tight">Weekly goal</h2>
          <p className="text-muted text-sm">How many days per week?</p>
        </div>
      </div>

      <div className="flex gap-3 mb-6 w-full">
        {TRAINING_DAYS.map(d => (
          <button
            key={d}
            onClick={() => setWeeklyGoal(d)}
            className={`flex-1 py-5 rounded-2xl font-black text-2xl transition-all ${
              weeklyGoal === d
                ? 'bg-accent text-white shadow-lg shadow-accent/30 scale-105'
                : 'bg-surface border border-surface2 text-muted'
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Visual goal indicator */}
      <div className="w-full bg-surface rounded-2xl p-4 mb-8">
        <div className="flex gap-1.5 mb-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-2 rounded-full transition-colors duration-300 ${
                i < weeklyGoal ? 'bg-accent' : 'bg-surface2'
              }`}
            />
          ))}
        </div>
        <p className="text-muted text-xs">
          {weeklyGoal >= 5 ? 'Serious athlete mode' : weeklyGoal >= 4 ? 'Solid training plan' : 'Good starting point'}
        </p>
      </div>

      <div className="flex gap-3 w-full">
        <button onClick={() => setStep(1)} className="w-12 h-12 flex-shrink-0 bg-surface rounded-xl flex items-center justify-center text-muted border border-surface2">
          <ChevronRight size={18} className="rotate-180" />
        </button>
        <button onClick={next} className="flex-1 py-3 bg-accent rounded-xl text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-accent/20">
          Continue <ChevronRight size={18} strokeWidth={2.5} />
        </button>
      </div>
    </motion.div>,

    // Step 3 — Ready
    <motion.div
      key="s3"
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="flex flex-col items-center text-center px-6 pt-12 pb-10"
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', damping: 14, stiffness: 200, delay: 0.1 }}
        className="w-20 h-20 bg-accent/15 border-2 border-accent/30 rounded-2xl flex items-center justify-center mb-6"
      >
        <Check size={36} className="text-accent" strokeWidth={2.5} />
      </motion.div>

      <h1 className="text-textPrimary font-black text-2xl mb-2">
        You're set, {name.trim() || 'Lifter'}
      </h1>
      <p className="text-muted text-sm mb-8 max-w-xs">
        IronLog is ready. Every session logged, every PR tracked, all offline.
      </p>

      <div className="w-full bg-surface rounded-2xl p-4 mb-8 space-y-3 text-left">
        {[
          { icon: <Dumbbell size={16} strokeWidth={1.8} />, text: '125+ exercises loaded' },
          { icon: <TrendingUp size={16} strokeWidth={1.8} />, text: 'Auto PR detection' },
          { icon: <Check size={16} strokeWidth={2} />, text: 'Works 100% offline' },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="text-accent">{item.icon}</span>
            <p className="text-muted text-sm">{item.text}</p>
          </div>
        ))}
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={finish}
        className="w-full py-4 bg-accent rounded-xl text-white font-bold text-base shadow-lg shadow-accent/25 flex items-center justify-center gap-2"
      >
        <Dumbbell size={18} strokeWidth={2} />
        Start First Workout
      </motion.button>
    </motion.div>,
  ]

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Progress indicator */}
      <div className="flex items-center gap-2 px-6 pt-14 pb-2">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-400 ${
              i === step ? 'flex-[2] bg-accent' : i < step ? 'flex-1 bg-accent/40' : 'flex-1 bg-surface2'
            }`}
          />
        ))}
      </div>

      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          {steps[step]}
        </AnimatePresence>
      </div>
    </div>
  )
}
