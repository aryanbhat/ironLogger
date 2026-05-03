import { create } from 'zustand'
import { db, Workout, WorkoutSet, PersonalRecord } from '../db/schema'
import { estimated1RM } from '../utils/epley'
import { calculateVolume } from '../utils/volume'
import { today } from '../utils/date'

export interface ActiveSet {
  id: string
  exerciseId: string
  setNumber: number
  weight: number
  reps: number
  rpe?: number
  isWarmup: boolean
  logged: boolean
}

export interface ActiveExercise {
  exerciseId: string
  sets: ActiveSet[]
}

export interface PRResult {
  exerciseId: string
  reps: number
  weight: number
  isEstimated: boolean
}

interface WorkoutStore {
  activeWorkout: Workout | null
  activeExercises: ActiveExercise[]
  newPRs: PRResult[]
  startWorkout: (date?: string) => Promise<void>
  addExercise: (exerciseId: string) => void
  removeExercise: (exerciseId: string) => void
  addSet: (exerciseId: string) => void
  updateSet: (exerciseId: string, setId: string, data: Partial<ActiveSet>) => void
  logSet: (exerciseId: string, setId: string) => Promise<PRResult[]>
  finishWorkout: (notes?: string, mood?: 1|2|3|4|5) => Promise<void>
  clearNewPRs: () => void
  getLastSets: (exerciseId: string) => Promise<ActiveSet[]>
  recentExerciseIds: string[]
  loadRecentExercises: () => Promise<void>
}

function makeDefaultSet(exerciseId: string, setNumber: number, prevSet?: ActiveSet): ActiveSet {
  return {
    id: crypto.randomUUID(),
    exerciseId,
    setNumber,
    weight: prevSet?.weight ?? 20,
    reps: prevSet?.reps ?? 10,
    isWarmup: false,
    logged: false,
  }
}

export const useWorkoutStore = create<WorkoutStore>((set, get) => ({
  activeWorkout: null,
  activeExercises: [],
  newPRs: [],
  recentExerciseIds: [],

  startWorkout: async (date = today()) => {
    const workout: Workout = {
      id: crypto.randomUUID(),
      date,
      startTime: new Date().toISOString(),
      type: 'structured',
      createdAt: new Date().toISOString(),
    }
    await db.workouts.add(workout)
    set({ activeWorkout: workout, activeExercises: [], newPRs: [] })
  },

  addExercise: (exerciseId) => {
    const existing = get().activeExercises.find(e => e.exerciseId === exerciseId)
    if (existing) return
    const defaultSet = makeDefaultSet(exerciseId, 1)
    set(s => ({
      activeExercises: [...s.activeExercises, { exerciseId, sets: [defaultSet] }],
    }))
  },

  removeExercise: (exerciseId) => {
    set(s => ({
      activeExercises: s.activeExercises.filter(e => e.exerciseId !== exerciseId),
    }))
  },

  addSet: (exerciseId) => {
    set(s => ({
      activeExercises: s.activeExercises.map(e => {
        if (e.exerciseId !== exerciseId) return e
        const last = e.sets[e.sets.length - 1]
        const newSet = makeDefaultSet(exerciseId, e.sets.length + 1, last)
        return { ...e, sets: [...e.sets, newSet] }
      }),
    }))
  },

  updateSet: (exerciseId, setId, data) => {
    set(s => ({
      activeExercises: s.activeExercises.map(e => {
        if (e.exerciseId !== exerciseId) return e
        return {
          ...e,
          sets: e.sets.map(st => st.id === setId ? { ...st, ...data } : st),
        }
      }),
    }))
  },

  logSet: async (exerciseId, setId) => {
    const workout = get().activeWorkout
    if (!workout) return []

    const exercise = get().activeExercises.find(e => e.exerciseId === exerciseId)
    const setData = exercise?.sets.find(s => s.id === setId)
    if (!setData) return []

    const dbSet: WorkoutSet = {
      id: setId,
      workoutId: workout.id,
      exerciseId,
      setNumber: setData.setNumber,
      weight: setData.weight,
      reps: setData.reps,
      rpe: setData.rpe,
      isWarmup: setData.isWarmup,
      timestamp: new Date().toISOString(),
    }

    await db.workout_sets.add(dbSet)

    get().updateSet(exerciseId, setId, { logged: true })

    try { navigator.vibrate([30]) } catch {}

    const prs: PRResult[] = []
    if (!setData.isWarmup) {
      const repCounts: (1|3|5|8|10|12)[] = [1, 3, 5, 8, 10, 12]
      const closestRep = repCounts.reduce((prev, curr) =>
        Math.abs(curr - setData.reps) < Math.abs(prev - setData.reps) ? curr : prev
      )

      const existing = await db.personal_records
        .where({ exerciseId, reps: closestRep })
        .first()

      if (!existing || setData.weight > existing.weight) {
        const e1RM = estimated1RM(setData.weight, setData.reps)
        const pr: PersonalRecord = {
          id: crypto.randomUUID(),
          exerciseId,
          reps: closestRep,
          weight: setData.weight,
          date: workout.date,
          estimated1RM: e1RM,
        }
        if (existing) await db.personal_records.delete(existing.id)
        await db.personal_records.add(pr)
        prs.push({ exerciseId, reps: setData.reps, weight: setData.weight, isEstimated: false })
      }

      const bestE1RM = await db.personal_records
        .where('exerciseId').equals(exerciseId)
        .toArray()
        .then(arr => Math.max(...arr.map(p => p.estimated1RM), 0))

      const e1RM = estimated1RM(setData.weight, setData.reps)
      if (e1RM > bestE1RM && prs.length === 0) {
        prs.push({ exerciseId, reps: setData.reps, weight: setData.weight, isEstimated: true })
      }
    }

    if (prs.length > 0) {
      set(s => ({ newPRs: [...s.newPRs, ...prs] }))
    }

    return prs
  },

  finishWorkout: async (notes, mood) => {
    const workout = get().activeWorkout
    if (!workout) return

    const allSets = await db.workout_sets.where('workoutId').equals(workout.id).toArray()
    const totalVolume = calculateVolume(allSets)

    const updated: Workout = {
      ...workout,
      endTime: new Date().toISOString(),
      notes,
      mood,
      totalVolume,
    }
    await db.workouts.put(updated)

    await runProgressionCheck(get().activeExercises.map(e => e.exerciseId), workout.date)
    await checkAchievements(workout.id)

    set({ activeWorkout: null, activeExercises: [], newPRs: [] })
  },

  clearNewPRs: () => set({ newPRs: [] }),

  getLastSets: async (exerciseId) => {
    const recentSets = await db.workout_sets
      .where('exerciseId').equals(exerciseId)
      .reverse()
      .limit(20)
      .toArray()
    return recentSets.map(s => ({ ...s, logged: true }))
  },

  loadRecentExercises: async () => {
    const recentSets = await db.workout_sets
      .orderBy('timestamp')
      .reverse()
      .limit(100)
      .toArray()
    const seen = new Set<string>()
    const ids: string[] = []
    for (const s of recentSets) {
      if (!seen.has(s.exerciseId)) {
        seen.add(s.exerciseId)
        ids.push(s.exerciseId)
      }
      if (ids.length >= 10) break
    }
    set({ recentExerciseIds: ids })
  },
}))

async function runProgressionCheck(exerciseIds: string[], _date: string) {
  for (const exerciseId of exerciseIds) {
    const lastWorkouts = await db.workouts
      .where('type').equals('structured')
      .reverse()
      .limit(10)
      .toArray()

    const exerciseSessions: WorkoutSet[][] = []
    for (const w of lastWorkouts) {
      const sets = await db.workout_sets
        .where('workoutId').equals(w.id)
        .filter(s => s.exerciseId === exerciseId && !s.isWarmup)
        .toArray()
      if (sets.length > 0) exerciseSessions.push(sets)
      if (exerciseSessions.length >= 3) break
    }

    if (exerciseSessions.length < 3) continue

    const weights = exerciseSessions.map(session =>
      Math.max(...session.map(s => s.weight))
    )
    const sameWeight = weights.every(w => w === weights[0])
    if (!sameWeight) continue

    const existing = await db.progression_suggestions
      .where('exerciseId').equals(exerciseId)
      .filter(s => !s.dismissed)
      .first()
    if (existing) continue

    const currentWeight = weights[0]
    const ex = await db.exercises.get(exerciseId)
    const isLower = ['Legs'].includes(ex?.category || '')
    const increment = isLower ? 5 : 2.5

    await db.progression_suggestions.add({
      id: crypto.randomUUID(),
      exerciseId,
      currentWeight,
      suggestedWeight: currentWeight + increment,
      createdAt: new Date().toISOString(),
      dismissed: false,
    })
  }
}

async function checkAchievements(workoutId: string) {
  const unlock = async (key: string) => {
    const existing = await db.achievements.where('key').equals(key).first()
    if (existing) return
    await db.achievements.add({
      id: crypto.randomUUID(),
      key,
      unlockedAt: new Date().toISOString(),
      seen: false,
    })
  }

  const workoutCount = await db.workouts.where('type').equals('structured').count()
  if (workoutCount >= 1) await unlock('first_iron')
  if (workoutCount >= 100) await unlock('century_club')

  const prCount = await db.personal_records.count()
  if (prCount >= 10) await unlock('pr_machine')

  const photoCount = await db.progress_photos.count()
  if (photoCount >= 1) await unlock('iron_photo')

  const scribbleCount = await db.scribble_notes.count()
  if (scribbleCount >= 1) await unlock('scribbler')

  void workoutId
}
