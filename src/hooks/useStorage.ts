import { useEffect, useState } from 'react'

interface StorageInfo {
  usedMB: number
  totalMB: number
  percent: number
}

export function useStorage() {
  const [info, setInfo] = useState<StorageInfo | null>(null)

  useEffect(() => {
    if (!navigator.storage?.estimate) return
    navigator.storage.estimate().then(est => {
      const used = (est.usage ?? 0) / (1024 * 1024)
      const total = (est.quota ?? 50 * 1024 * 1024) / (1024 * 1024)
      setInfo({ usedMB: used, totalMB: total, percent: (used / total) * 100 })
    })
  }, [])

  return info
}
