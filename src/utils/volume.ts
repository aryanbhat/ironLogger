import type { WorkoutSet } from '../db/schema'

export function calculateVolume(sets: WorkoutSet[]): number {
  return sets
    .filter(s => !s.isWarmup)
    .reduce((acc, s) => acc + s.weight * s.reps, 0)
}

export function formatVolume(kg: number): string {
  if (kg >= 1000) return `${(kg / 1000).toFixed(1)}t`
  return `${kg.toFixed(0)}kg`
}
