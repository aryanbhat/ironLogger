import { useEffect, useState } from 'react'
import { db } from '../db/schema'
import { today, toDateString } from '../utils/date'

interface StreakData {
  current: number
  best: number
  lastWorkoutDate: string | null
  workoutDates: Set<string>
  scribbleDates: Set<string>
}

export function useStreak() {
  const [data, setData] = useState<StreakData>({
    current: 0,
    best: 0,
    lastWorkoutDate: null,
    workoutDates: new Set(),
    scribbleDates: new Set(),
  })

  useEffect(() => {
    async function compute() {
      const workouts = await db.workouts.orderBy('date').toArray()
      const dateSet = new Set<string>()
      const scribbleSet = new Set<string>()

      for (const w of workouts) {
        dateSet.add(w.date)
        if (w.type === 'scribble') scribbleSet.add(w.date)
      }

      const sortedDates = [...dateSet].sort().reverse()
      const todayStr = today()
      const yesterdayStr = toDateString(new Date(Date.now() - 86400000))

      let current = 0
      const firstDate = sortedDates[0]
      const checkDate = firstDate === todayStr || firstDate === yesterdayStr ? firstDate : null

      if (checkDate) {
        const startFrom = new Date(checkDate + 'T00:00:00')
        while (true) {
          const ds = toDateString(startFrom)
          if (dateSet.has(ds)) {
            current++
            startFrom.setDate(startFrom.getDate() - 1)
          } else {
            break
          }
        }
      }

      let best = 0
      let run = 0
      for (let i = 0; i < sortedDates.length; i++) {
        if (i === 0) {
          run = 1
        } else {
          const prev = new Date(sortedDates[i - 1] + 'T00:00:00')
          const curr = new Date(sortedDates[i] + 'T00:00:00')
          const diff = Math.round((prev.getTime() - curr.getTime()) / 86400000)
          run = diff === 1 ? run + 1 : 1
        }
        if (run > best) best = run
      }

      // Streak achievements
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
      if (current >= 3) await unlock('getting_started')
      if (current >= 7) await unlock('one_week_warrior')
      if (current >= 14) await unlock('two_week_titan')
      if (current >= 30) await unlock('ironlog_veteran')

      setData({
        current,
        best,
        lastWorkoutDate: sortedDates[0] ?? null,
        workoutDates: dateSet,
        scribbleDates: scribbleSet,
      })
    }
    compute()
  }, [])

  return data
}
