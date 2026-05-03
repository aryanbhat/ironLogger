import { Shield, ChevronRight } from 'lucide-react'
import { useRank, RankTier } from '../../hooks/useRank'
import { useBodyStore } from '../../store/bodyStore'

interface RankConfig {
  label: string
  color: string
  bgColor: string
  borderColor: string
  icon: React.ReactNode
}

function RankShield({ tier, size = 32 }: { tier: RankTier; size?: number }) {
  const configs: Record<RankTier, { fill: string; stroke: string; stripes: number }> = {
    Rookie:       { fill: '#3D2B1F', stroke: '#8B4513', stripes: 0 },
    Novice:       { fill: '#2A2A2A', stroke: '#A8A9AD', stripes: 1 },
    Intermediate: { fill: '#2D2200', stroke: '#DAA520', stripes: 2 },
    Advanced:     { fill: '#0A1628', stroke: '#1E90FF', stripes: 3 },
    Elite:        { fill: '#1A0A00', stroke: '#FF6B35', stripes: 4 },
    Legend:       { fill: '#1A0A2E', stroke: '#9B59B6', stripes: 5 },
  }
  const c = configs[tier]

  return (
    <svg width={size} height={size * 1.15} viewBox="0 0 40 46" fill="none">
      <path
        d="M20 2L38 9V22C38 32 30 41 20 44C10 41 2 32 2 22V9L20 2Z"
        fill={c.fill}
        stroke={c.stroke}
        strokeWidth="2"
      />
      {/* Roman numeral style stripes */}
      {c.stripes >= 1 && <line x1="14" y1="20" x2="26" y2="20" stroke={c.stroke} strokeWidth="2.5" strokeLinecap="round" />}
      {c.stripes >= 2 && <line x1="14" y1="25" x2="26" y2="25" stroke={c.stroke} strokeWidth="2.5" strokeLinecap="round" />}
      {c.stripes >= 3 && <line x1="14" y1="15" x2="26" y2="15" stroke={c.stroke} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />}
      {c.stripes >= 4 && <line x1="14" y1="30" x2="26" y2="30" stroke={c.stroke} strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />}
      {c.stripes >= 5 && (
        <>
          <circle cx="20" cy="20" r="5" fill="none" stroke={c.stroke} strokeWidth="1.5" opacity="0.8" />
          <circle cx="20" cy="20" r="2" fill={c.stroke} opacity="0.9" />
        </>
      )}
    </svg>
  )
}

const RANK_COLORS: Record<RankTier, { text: string; bg: string; progress: string }> = {
  Rookie:       { text: '#8B4513', bg: 'rgba(139,69,19,0.1)',   progress: '#8B4513' },
  Novice:       { text: '#A8A9AD', bg: 'rgba(168,169,173,0.1)', progress: '#A8A9AD' },
  Intermediate: { text: '#DAA520', bg: 'rgba(218,165,32,0.1)',  progress: '#DAA520' },
  Advanced:     { text: '#1E90FF', bg: 'rgba(30,144,255,0.1)',  progress: '#1E90FF' },
  Elite:        { text: '#FF6B35', bg: 'rgba(255,107,53,0.1)',  progress: '#FF6B35' },
  Legend:       { text: '#9B59B6', bg: 'rgba(155,89,182,0.1)', progress: '#9B59B6' },
}

const TIER_ORDER: RankTier[] = ['Rookie', 'Novice', 'Intermediate', 'Advanced', 'Elite', 'Legend']

export function RankCard() {
  const rank = useRank()
  const { latestWeight } = useBodyStore()

  if (!latestWeight) {
    return (
      <div className="bg-surface rounded-2xl p-4 flex items-center gap-3">
        <div className="w-12 h-14 flex items-center justify-center opacity-30">
          <Shield size={32} className="text-muted" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-textPrimary font-semibold text-sm">Unlock Your Rank</p>
          <p className="text-muted text-xs mt-0.5">Log your bodyweight in Body tab</p>
        </div>
        <ChevronRight size={16} className="text-muted ml-auto flex-shrink-0" />
      </div>
    )
  }

  if (!rank) {
    return (
      <div className="bg-surface rounded-2xl p-4 flex items-center gap-3">
        <div className="w-12 h-14 flex items-center justify-center opacity-30">
          <Shield size={32} className="text-muted" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-textPrimary font-semibold text-sm">No Rank Yet</p>
          <p className="text-muted text-xs mt-0.5">Log Bench / Squat / Deadlift to earn one</p>
        </div>
      </div>
    )
  }

  const colors = RANK_COLORS[rank.tier]
  const tierIdx = TIER_ORDER.indexOf(rank.tier)
  const prevTierRatio = tierIdx > 0
    ? [0, 0.5, 0.75, 1.0, 1.25, 1.5][tierIdx]
    : 0
  const nextTierRatio = rank.nextRatio ?? rank.ratio
  const rangeSize = nextTierRatio - prevTierRatio
  const progress = rangeSize > 0
    ? Math.min(100, ((rank.ratio - prevTierRatio) / rangeSize) * 100)
    : 100

  return (
    <div className="bg-surface rounded-2xl overflow-hidden">
      <div className="flex items-stretch">
        <div className="w-1 flex-shrink-0" style={{ backgroundColor: colors.text }} />

        <div className="flex-1 p-4">
          <div className="flex items-center gap-4 mb-3">
            <RankShield tier={rank.tier} size={40} />
            <div className="flex-1 min-w-0">
              <p className="text-muted text-[10px] uppercase tracking-widest font-medium">Strength Rank</p>
              <p className="font-black text-xl leading-tight" style={{ color: colors.text }}>
                {rank.tier}
              </p>
              <p className="text-muted text-xs mt-0.5">
                {rank.bestLift} · {rank.bestWeight}kg
              </p>
            </div>
            <div className="flex-shrink-0 text-right">
              <p className="text-muted text-[10px]">Ratio</p>
              <p className="text-textPrimary font-black text-lg font-mono">
                {rank.ratio.toFixed(2)}
                <span className="text-muted text-xs font-normal">x</span>
              </p>
            </div>
          </div>

          {rank.nextTier && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-muted text-[10px] uppercase tracking-wider">{rank.tier}</p>
                <p className="text-[10px]" style={{ color: RANK_COLORS[rank.nextTier].text }}>
                  {rank.nextTier}
                </p>
              </div>
              <div className="h-1.5 bg-surface2 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${progress}%`, backgroundColor: colors.progress }}
                />
              </div>
              <p className="text-muted text-[10px] mt-1.5">
                {rank.kgNeeded}kg on {rank.bestLift} to reach{' '}
                <span style={{ color: RANK_COLORS[rank.nextTier].text }}>{rank.nextTier}</span>
              </p>
            </div>
          )}

          {!rank.nextTier && (
            <p className="text-[10px] font-semibold" style={{ color: colors.text }}>
              Maximum rank achieved
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
