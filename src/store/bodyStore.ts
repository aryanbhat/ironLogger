import { create } from 'zustand'
import { db, BodyMeasurement, ProgressPhoto } from '../db/schema'

interface BodyState {
  measurements: BodyMeasurement[]
  photos: ProgressPhoto[]
  loadMeasurements: () => Promise<void>
  addMeasurement: (data: Omit<BodyMeasurement, 'id'>) => Promise<void>
  deleteMeasurement: (id: string) => Promise<void>
  loadPhotos: () => Promise<void>
  addPhoto: (data: Omit<ProgressPhoto, 'id'>) => Promise<void>
  deletePhoto: (id: string) => Promise<void>
  latestWeight: number | null
}

export const useBodyStore = create<BodyState>((set, get) => ({
  measurements: [],
  photos: [],
  latestWeight: null,

  loadMeasurements: async () => {
    const measurements = await db.body_measurements.orderBy('date').reverse().toArray()
    set({
      measurements,
      latestWeight: measurements[0]?.weight ?? null,
    })
  },

  addMeasurement: async (data) => {
    const m: BodyMeasurement = { ...data, id: crypto.randomUUID() }
    await db.body_measurements.add(m)
    await get().loadMeasurements()
  },

  deleteMeasurement: async (id) => {
    await db.body_measurements.delete(id)
    await get().loadMeasurements()
  },

  loadPhotos: async () => {
    const photos = await db.progress_photos.orderBy('date').reverse().toArray()
    set({ photos })
  },

  addPhoto: async (data) => {
    const p: ProgressPhoto = { ...data, id: crypto.randomUUID() }
    await db.progress_photos.add(p)
    await get().loadPhotos()
  },

  deletePhoto: async (id) => {
    await db.progress_photos.delete(id)
    await get().loadPhotos()
  },
}))
