import { create } from 'zustand'
import { db, UserProfile } from '../db/schema'

interface ProfileState {
  profile: UserProfile | null
  loading: boolean
  load: () => Promise<void>
  save: (data: Partial<UserProfile>) => Promise<void>
  setOnboarded: () => Promise<void>
}

const DEFAULT_PROFILE: UserProfile = {
  id: 'local_user',
  name: 'Lifter',
  unit: 'metric',
  weeklyGoal: 4,
  onboarded: false,
  defaultRestTimer: 90,
  defaultWeightIncrement: 2.5,
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  loading: true,

  load: async () => {
    let profile = await db.user_profile.get('local_user')
    if (!profile) {
      await db.user_profile.put(DEFAULT_PROFILE)
      profile = DEFAULT_PROFILE
    }
    set({ profile, loading: false })
  },

  save: async (data) => {
    const current = get().profile || DEFAULT_PROFILE
    const updated = { ...current, ...data }
    await db.user_profile.put(updated)
    set({ profile: updated })
  },

  setOnboarded: async () => {
    await get().save({ onboarded: true })
  },
}))
