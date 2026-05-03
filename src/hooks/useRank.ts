import { useEffect, useState } from 'react'
import { db } from '../db/schema'
import { useBodyStore } from '../store/bodyStore'

export type RankTier = 'Rookie' | 'Novice' | 'Intermediate' | 'Advanced' | 'Elite' | 'Legend'

export interface RankData {
  tier: RankTier
  ratio: number
  bestLift: string
  bestWeight: number
  nextTier: RankTier | null
  nextRatio: number | null
  kgNeeded: number | null
}

const THRESHOLDS: { ratio: number; tier: RankTier }[] = [
  { ratio: 1.5, tier: 'Legend' },
  { ratio: 1.25, tier: 'Elite' },
  { ratio: 1.0, tier: 'Advanced' },
  { ratio: 0.75, tier: 'Intermediate' },
  { ratio: 0.5, tier: 'Novice' },
  { ratio: 0, tier: 'Rookie' },
]

const TIER_ORDER: RankTier[] = ['Rookie', 'Novice', 'Intermediate', 'Advanced', 'Elite', 'Legend']

function getTier(ratio: number): RankTier {
  for (const t of THRESHOLDS) {
    if (ratio >= t.ratio) return t.tier
  }
  return 'Rookie'
}

const KEY_LIFTS = [
  { name: 'Bench Press', ids: ['ex-001'] },
  { name: 'Squat', ids: ['ex-051'] },
  { name: 'Deadlift', ids: ['ex-028'] },
]

export function useRank() {
  const { latestWeight } = useBodyStore()
  const [rankData, setRankData] = useState<RankData | null>(null)

  useEffect(() => {
    if (!latestWeight) return
    async function compute() {
      let bestRatio = 0
      let bestLift = ''
      let bestWeight = 0

      for (const lift of KEY_LIFTS) {
        for (const id of lift.ids) {
          const prs = await db.personal_records.where('exerciseId').equals(id).toArray()
          if (prs.length === 0) continue
          const maxWeight = Math.max(...prs.map(p => p.weight))
          const ratio = maxWeight / latestWeight!
          if (ratio > bestRatio) {
            bestRatio = ratio
            bestLift = lift.name
            bestWeight = maxWeight
          }
        }
      }

      if (bestRatio === 0) { setRankData(null); return }

      const tier = getTier(bestRatio)
      const tierIdx = TIER_ORDER.indexOf(tier)
      const nextTier = tierIdx < TIER_ORDER.length - 1 ? TIER_ORDER[tierIdx + 1] : null
      const nextThreshold = nextTier ? THRESHOLDS.find(t => t.tier === nextTier)?.ratio ?? null : null
      const kgNeeded = nextThreshold ? Math.max(0, Math.round((nextThreshold * latestWeight! - bestWeight) * 10) / 10) : null

      setRankData({ tier, ratio: bestRatio, bestLift, bestWeight, nextTier, nextRatio: nextThreshold, kgNeeded })
    }
    compute()
  }, [latestWeight])

  return rankData
}
