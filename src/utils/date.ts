export function today(): string {
  return new Date().toISOString().split('T')[0]
}

export function toDateString(date: Date): string {
  return date.toISOString().split('T')[0]
}

export function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export function formatDateLong(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
}

export function daysAgo(dateStr: string): number {
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const d = new Date(dateStr + 'T00:00:00')
  d.setHours(0, 0, 0, 0)
  return Math.round((now.getTime() - d.getTime()) / 86400000)
}

export function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 21) return 'Good evening'
  return 'Good night'
}

export function elapsedSeconds(startTime: string): number {
  return Math.floor((Date.now() - new Date(startTime).getTime()) / 1000)
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function getLast12Weeks(): string[] {
  const dates: string[] = []
  const now = new Date()
  for (let i = 83; i >= 0; i--) {
    const d = new Date(now)
    d.setDate(d.getDate() - i)
    dates.push(toDateString(d))
  }
  return dates
}
