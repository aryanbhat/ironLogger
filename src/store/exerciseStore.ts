import { create } from 'zustand'
import { db, Exercise } from '../db/schema'

interface ExerciseState {
  exercises: Exercise[]
  loading: boolean
  load: () => Promise<void>
  addCustom: (ex: Omit<Exercise, 'id' | 'isCustom'>) => Promise<Exercise>
  getById: (id: string) => Exercise | undefined
}

export const useExerciseStore = create<ExerciseState>((set, get) => ({
  exercises: [],
  loading: true,

  load: async () => {
    const exercises = await db.exercises.orderBy('name').toArray()
    set({ exercises, loading: false })
  },

  addCustom: async (data) => {
    const ex: Exercise = {
      ...data,
      id: crypto.randomUUID(),
      isCustom: true,
    }
    await db.exercises.add(ex)
    const exercises = await db.exercises.orderBy('name').toArray()
    set({ exercises })
    return ex
  },

  getById: (id) => get().exercises.find(e => e.id === id),
}))
