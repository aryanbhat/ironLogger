/** Epley formula: weight × (1 + reps/30) */
export function estimated1RM(weight: number, reps: number): number {
  if (reps === 1) return weight
  return Math.round(weight * (1 + reps / 30) * 10) / 10
}

export function weightForReps(oneRM: number, reps: number): number {
  if (reps === 1) return oneRM
  return Math.round((oneRM / (1 + reps / 30)) * 10) / 10
}
