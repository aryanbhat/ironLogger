import { useState, useEffect } from 'react'
import { ChevronRight, Download, Trash2, Database, Dumbbell, Settings, Award, User } from 'lucide-react'
import { useProfileStore } from '../store/profileStore'
import { useBodyStore } from '../store/bodyStore'
import { BadgeGrid } from '../components/gamification/BadgeGrid'
import { useStorage } from '../hooks/useStorage'
import { db } from '../db/schema'

const REST_OPTIONS = [60, 90, 120, 180]
const INCREMENT_OPTIONS = [0.5, 1, 2.5, 5]
const GOAL_OPTIONS = [2, 3, 4, 5, 6, 7]
export default function Profile() {
  const { profile, save } = useProfileStore()
  const { latestWeight } = useBodyStore()
  const storage = useStorage()
  const [name, setName] = useState(profile?.name || '')
  const [height, setHeight] = useState(String(profile?.height || ''))
  const [goalWeight, setGoalWeight] = useState(String(profile?.goalWeight || ''))
  const [section, setSection] = useState<'settings' | 'achievements'>('settings')
  const [showClearConfirm, setShowClearConfirm] = useState(false)

  useEffect(() => {
    if (profile) {
      setName(profile.name)
      setHeight(String(profile.height || ''))
      setGoalWeight(String(profile.goalWeight || ''))
    }
  }, [profile])

  const saveProfile = () => {
    save({
      name: name.trim() || 'Lifter',
      height: height ? parseFloat(height) : undefined,
      goalWeight: goalWeight ? parseFloat(goalWeight) : undefined,
    })
  }

  const exportData = async () => {
    const data = {
      exercises: await db.exercises.where('isCustom').equals(1).toArray(),
      workouts: await db.workouts.toArray(),
      workout_sets: await db.workout_sets.toArray(),
      personal_records: await db.personal_records.toArray(),
      body_measurements: await db.body_measurements.toArray(),
      scribble_notes: await db.scribble_notes.toArray(),
      user_profile: await db.user_profile.toArray(),
      achievements: await db.achievements.toArray(),
      exported_at: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ironlog-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const clearAllData = async () => {
    await Promise.all([
      db.workouts.clear(), db.workout_sets.clear(), db.personal_records.clear(),
      db.body_measurements.clear(), db.progress_photos.clear(), db.scribble_notes.clear(),
      db.achievements.clear(), db.progression_suggestions.clear(),
    ])
    await save({ onboarded: false })
    window.location.reload()
  }

  if (!profile) return null

  const bmi = latestWeight && profile.height
    ? (latestWeight / Math.pow(profile.height / 100, 2)).toFixed(1)
    : null

  const age = profile.dateOfBirth
    ? Math.floor((Date.now() - new Date(profile.dateOfBirth).getTime()) / (365.25 * 86400000))
    : null

  return (
    <div className="min-h-screen bg-bg pb-24">
      {/* Profile header */}
      <div className="bg-surface px-4 pt-14 pb-6 border-b border-surface2">
        <div className="flex items-center gap-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-primary/40 border border-primary/60 flex items-center justify-center">
            <User size={28} className="text-accent" strokeWidth={1.8} />
          </div>
          <div className="flex-1">
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              onBlur={saveProfile}
              className="text-textPrimary font-black text-xl bg-transparent outline-none border-b border-transparent focus:border-accent w-full"
            />
            {age && <p className="text-muted text-sm">{age} years old</p>}
            {bmi && <p className="text-muted text-xs">BMI: {bmi}</p>}
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="px-4 pt-4 max-w-lg mx-auto">
        <div className="flex gap-1 bg-surface2 rounded-xl p-1 mb-4">
          {([
            { id: 'settings', label: 'Settings', icon: <Settings size={14} strokeWidth={2} /> },
            { id: 'achievements', label: 'Achievements', icon: <Award size={14} strokeWidth={2} /> },
          ] as const).map(s => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                section === s.id ? 'bg-surface text-textPrimary shadow-sm' : 'text-muted'
              }`}
            >
              {s.icon}
              {s.label}
            </button>
          ))}
        </div>

        {section === 'settings' ? (
          <div className="space-y-4">
            {/* Stats */}
            <div className="bg-surface rounded-2xl p-4 space-y-3">
              <p className="text-muted text-xs uppercase tracking-wider font-medium">Your Stats</p>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-muted text-xs mb-1 block">Height (cm)</label>
                  <input type="number" value={height} onChange={e => setHeight(e.target.value)} onBlur={saveProfile}
                    placeholder="175" className="w-full bg-surface2 rounded-xl px-3 py-2.5 text-textPrimary outline-none text-sm" />
                </div>
                <div className="flex-1">
                  <label className="text-muted text-xs mb-1 block">Goal Weight (kg)</label>
                  <input type="number" value={goalWeight} onChange={e => setGoalWeight(e.target.value)} onBlur={saveProfile}
                    placeholder="70" className="w-full bg-surface2 rounded-xl px-3 py-2.5 text-textPrimary outline-none text-sm" />
                </div>
              </div>
            </div>

            {/* Workout settings */}
            <div className="bg-surface rounded-2xl p-4 space-y-4">
              <p className="text-muted text-xs uppercase tracking-wider font-medium">Workout</p>

              <div>
                <p className="text-textPrimary text-sm mb-2">Weekly Goal</p>
                <div className="flex gap-2">
                  {GOAL_OPTIONS.map(g => (
                    <button key={g} onClick={() => save({ weeklyGoal: g })}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                        profile.weeklyGoal === g ? 'bg-accent text-white' : 'bg-surface2 text-muted'
                      }`}>{g}</button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-textPrimary text-sm mb-2">Default Rest Timer</p>
                <div className="flex gap-2">
                  {REST_OPTIONS.map(r => (
                    <button key={r} onClick={() => save({ defaultRestTimer: r })}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                        profile.defaultRestTimer === r ? 'bg-primary text-textPrimary' : 'bg-surface2 text-muted'
                      }`}>{r}s</button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-textPrimary text-sm mb-2">Weight Increment</p>
                <div className="flex gap-2">
                  {INCREMENT_OPTIONS.map(i => (
                    <button key={i} onClick={() => save({ defaultWeightIncrement: i })}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-colors ${
                        profile.defaultWeightIncrement === i ? 'bg-primary text-textPrimary' : 'bg-surface2 text-muted'
                      }`}>{i}kg</button>
                  ))}
                </div>
              </div>
            </div>

            {/* Data */}
            <div className="bg-surface rounded-2xl p-4 space-y-1">
              <p className="text-muted text-xs uppercase tracking-wider font-medium mb-3">Data</p>

              {storage && (
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <Database size={18} className="text-muted" />
                    <div>
                      <p className="text-textPrimary text-sm">Storage Used</p>
                      <p className="text-muted text-xs">{storage.usedMB.toFixed(1)} MB of ~{storage.totalMB.toFixed(0)} MB</p>
                    </div>
                  </div>
                  <div className="w-16 h-1.5 bg-surface2 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${storage.percent > 80 ? 'bg-danger' : 'bg-accent'}`}
                      style={{ width: `${Math.min(100, storage.percent)}%` }} />
                  </div>
                </div>
              )}

              <button onClick={exportData}
                className="w-full flex items-center gap-3 py-3 border-t border-surface2">
                <Download size={18} className="text-muted" />
                <span className="text-textPrimary text-sm flex-1 text-left">Export Data (JSON)</span>
                <ChevronRight size={16} className="text-muted" />
              </button>

              <button onClick={() => setShowClearConfirm(true)}
                className="w-full flex items-center gap-3 py-3 border-t border-surface2">
                <Trash2 size={18} className="text-danger" />
                <span className="text-danger text-sm flex-1 text-left">Clear All Data</span>
                <ChevronRight size={16} className="text-muted" />
              </button>
            </div>

            {showClearConfirm && (
              <div className="bg-danger/10 border border-danger/30 rounded-2xl p-4 space-y-3">
                <p className="text-danger font-bold text-sm">⚠️ This will delete everything!</p>
                <p className="text-muted text-xs">All workouts, PRs, body measurements, and photos will be permanently deleted.</p>
                <div className="flex gap-3">
                  <button onClick={() => setShowClearConfirm(false)}
                    className="flex-1 py-2 bg-surface2 text-muted rounded-xl text-sm font-medium">Cancel</button>
                  <button onClick={clearAllData}
                    className="flex-1 py-2 bg-danger text-white rounded-xl text-sm font-bold">Yes, Delete All</button>
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-2 pb-4 pt-2">
              <Dumbbell size={14} className="text-muted" strokeWidth={1.5} />
              <p className="text-muted text-xs">
                Iron<span className="text-accent font-semibold">Log</span> v1.0 · 100% offline
              </p>
            </div>
          </div>
        ) : (
          <BadgeGrid />
        )}
      </div>
    </div>
  )
}
