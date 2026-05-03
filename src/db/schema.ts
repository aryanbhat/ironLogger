import Dexie, { Table } from 'dexie'

export interface Exercise {
  id: string
  name: string
  category: 'Push' | 'Pull' | 'Legs' | 'Core' | 'Cardio' | 'Olympic'
  equipment: 'Barbell' | 'Dumbbell' | 'Cable' | 'Machine' | 'Bodyweight' | 'Kettlebell' | 'Smith Machine' | 'Resistance Band'
  primaryMuscle: string
  secondaryMuscles: string[]
  isCustom: boolean
  notes?: string
}

export interface Workout {
  id: string
  date: string // YYYY-MM-DD
  startTime: string
  endTime?: string
  notes?: string
  mood?: 1 | 2 | 3 | 4 | 5
  type: 'structured' | 'scribble'
  totalVolume?: number
  createdAt: string
}

export interface WorkoutSet {
  id: string
  workoutId: string
  exerciseId: string
  setNumber: number
  weight: number
  reps: number
  rpe?: number
  isWarmup: boolean
  timestamp: string
}

export interface PersonalRecord {
  id: string
  exerciseId: string
  reps: 1 | 3 | 5 | 8 | 10 | 12
  weight: number
  date: string
  estimated1RM: number
}

export interface BodyMeasurement {
  id: string
  date: string
  weight: number
  smm?: number
  bfPercent?: number
  notes?: string
}

export interface ProgressPhoto {
  id: string
  date: string
  angle: 'front' | 'side' | 'back'
  base64Data: string
  notes?: string
}

export interface ScribbleNote {
  id: string
  date: string
  rawText: string
  createdAt: string
}

export interface UserProfile {
  id: 'local_user'
  name: string
  height?: number
  dateOfBirth?: string
  unit: 'metric'
  weeklyGoal: number
  workoutTime?: string
  onboarded: boolean
  goalWeight?: number
  defaultRestTimer: number
  defaultWeightIncrement: number
}

export interface Achievement {
  id: string
  key: string
  unlockedAt: string
  seen: boolean
}

export interface ProgressionSuggestion {
  id: string
  exerciseId: string
  currentWeight: number
  suggestedWeight: number
  createdAt: string
  dismissed: boolean
}

class IronLogDB extends Dexie {
  exercises!: Table<Exercise>
  workouts!: Table<Workout>
  workout_sets!: Table<WorkoutSet>
  personal_records!: Table<PersonalRecord>
  body_measurements!: Table<BodyMeasurement>
  progress_photos!: Table<ProgressPhoto>
  scribble_notes!: Table<ScribbleNote>
  user_profile!: Table<UserProfile>
  achievements!: Table<Achievement>
  progression_suggestions!: Table<ProgressionSuggestion>

  constructor() {
    super('IronLogDB')
    this.version(1).stores({
      exercises: 'id, name, category, equipment, primaryMuscle, isCustom',
      workouts: 'id, date, type, createdAt',
      workout_sets: 'id, workoutId, exerciseId, timestamp',
      personal_records: 'id, exerciseId, reps, date',
      body_measurements: 'id, date',
      progress_photos: 'id, date, angle',
      scribble_notes: 'id, date, createdAt',
      user_profile: 'id',
      achievements: 'id, key, unlockedAt',
      progression_suggestions: 'id, exerciseId, dismissed',
    })
  }
}

export const db = new IronLogDB()

export async function seedExercises() {
  const count = await db.exercises.count()
  if (count > 0) return
  const { default: exercises } = await import('./exercises.json')
  await db.exercises.bulkPut(exercises as Exercise[])
}

export async function initDB() {
  await seedExercises()
}
