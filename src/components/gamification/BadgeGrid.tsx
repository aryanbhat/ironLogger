import { useEffect, useState } from 'react'
import { Dumbbell, Flame, Swords, Shield, Star, Trophy, Camera, PenLine, Award } from 'lucide-react'
import { db, Achievement } from '../../db/schema'

interface Badge {
  key: string
  icon: React.ReactNode
  name: string
  description: string
  color: string
  bg: string
}

const ALL_BADGES: Badge[] = [
  {
    key: 'first_iron',
    icon: <Dumbbell size={22} strokeWidth={1.8} />,
    name: 'First Iron',
    description: 'Completed your first workout',
    color: '#FF6B35',
    bg: 'rgba(255,107,53,0.12)',
  },
  {
    key: 'getting_started',
    icon: <Flame size={22} strokeWidth={1.8} />,
    name: 'Getting Started',
    description: '3-day streak achieved',
    color: '#FF8C42',
    bg: 'rgba(255,140,66,0.12)',
  },
  {
    key: 'one_week_warrior',
    icon: <Swords size={22} strokeWidth={1.8} />,
    name: 'Week Warrior',
    description: '7-day streak achieved',
    color: '#DAA520',
    bg: 'rgba(218,165,32,0.12)',
  },
  {
    key: 'two_week_titan',
    icon: <Shield size={22} strokeWidth={1.8} />,
    name: 'Two Week Titan',
    description: '14-day streak achieved',
    color: '#1E90FF',
    bg: 'rgba(30,144,255,0.12)',
  },
  {
    key: 'ironlog_veteran',
    icon: <Award size={22} strokeWidth={1.8} />,
    name: 'IronLog Veteran',
    description: '30-day streak achieved',
    color: '#9B59B6',
    bg: 'rgba(155,89,182,0.12)',
  },
  {
    key: 'pr_machine',
    icon: <Trophy size={22} strokeWidth={1.8} />,
    name: 'PR Machine',
    description: 'Set 10 personal records',
    color: '#DAA520',
    bg: 'rgba(218,165,32,0.12)',
  },
  {
    key: 'century_club',
    icon: <Star size={22} strokeWidth={1.8} />,
    name: 'Century Club',
    description: '100 workouts completed',
    color: '#FF6B35',
    bg: 'rgba(255,107,53,0.12)',
  },
  {
    key: 'iron_photo',
    icon: <Camera size={22} strokeWidth={1.8} />,
    name: 'Iron Photo',
    description: 'First progress photo logged',
    color: '#2D6A4F',
    bg: 'rgba(45,106,79,0.12)',
  },
  {
    key: 'scribbler',
    icon: <PenLine size={22} strokeWidth={1.8} />,
    name: 'Scribbler',
    description: 'First scribble note saved',
    color: '#8BA3B8',
    bg: 'rgba(139,163,184,0.12)',
  },
]

export function BadgeGrid() {
  const [unlocked, setUnlocked] = useState<Set<string>>(new Set())

  useEffect(() => {
    db.achievements.toArray().then((achievements: Achievement[]) => {
      setUnlocked(new Set(achievements.map(a => a.key)))
    })
  }, [])

  return (
    <div className="grid grid-cols-3 gap-3">
      {ALL_BADGES.map(badge => {
        const isUnlocked = unlocked.has(badge.key)
        return (
          <div
            key={badge.key}
            className={`rounded-2xl p-3 flex flex-col items-center gap-2 transition-all duration-300 ${
              isUnlocked ? 'bg-surface' : 'bg-surface/50'
            }`}
          >
            {/* Icon container */}
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                isUnlocked ? '' : 'opacity-25 grayscale'
              }`}
              style={isUnlocked ? { backgroundColor: badge.bg, color: badge.color } : { backgroundColor: '#1F3347', color: '#8BA3B8' }}
            >
              {badge.icon}
            </div>

            {/* Text */}
            <div className={`text-center transition-opacity ${isUnlocked ? 'opacity-100' : 'opacity-35'}`}>
              <p className="text-textPrimary text-[11px] font-bold leading-tight">{badge.name}</p>
              <p className="text-muted text-[9px] leading-tight mt-0.5">{badge.description}</p>
            </div>

            {/* Lock indicator */}
            {!isUnlocked && (
              <div className="w-4 h-4 rounded-full bg-surface2 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-muted/50" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
