import { useState, useEffect, useRef } from 'react'
import { Plus, Camera, Trash2, ArrowLeftRight, Scale, ImageIcon, BarChart3, Dumbbell, Trophy, Activity, TrendingUp, RefreshCw } from 'lucide-react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts'
import { useBodyStore } from '../store/bodyStore'
import { useProfileStore } from '../store/profileStore'
import { BodyMeasurement, ProgressPhoto } from '../db/schema'
import { BottomSheet } from '../components/layout/BottomSheet'
import { compressImage, estimateBase64Size } from '../utils/compress'
import { today, formatDate } from '../utils/date'
import { db } from '../db/schema'

type Tab = 'weight' | 'photos' | 'stats'
type TimeRange = '7d' | '30d' | '90d' | 'all'

export default function Body() {
  const [tab, setTab] = useState<Tab>('weight')
  const { measurements, photos, latestWeight, loadMeasurements, addMeasurement, deleteMeasurement, loadPhotos, addPhoto, deletePhoto } = useBodyStore()
  const { profile } = useProfileStore()

  useEffect(() => {
    loadMeasurements()
    loadPhotos()
  }, [loadMeasurements, loadPhotos])

  return (
    <div className="min-h-screen bg-bg pb-24">
      {/* Tabs */}
      <div className="sticky top-0 z-30 bg-bg/95 backdrop-blur-sm border-b border-surface2 px-4 py-3">
        <h1 className="text-textPrimary font-black text-xl mb-3">Body</h1>
        <div className="flex gap-1 bg-surface2 rounded-xl p-1">
          {(['weight', 'photos', 'stats'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                tab === t ? 'bg-surface text-textPrimary shadow-sm' : 'text-muted'
              }`}
            >
              {t === 'weight' ? 'Weight' : t === 'photos' ? 'Photos' : 'Stats'}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 max-w-lg mx-auto">
        {tab === 'weight' && <WeightTab measurements={measurements} latestWeight={latestWeight} goalWeight={profile?.goalWeight} onAdd={(d) => addMeasurement(d as Omit<BodyMeasurement, 'id'>)} onDelete={deleteMeasurement} />}
        {tab === 'photos' && <PhotosTab photos={photos} onAdd={(d) => addPhoto(d as Omit<ProgressPhoto, 'id'>)} onDelete={deletePhoto} />}
        {tab === 'stats' && <StatsTab />}
      </div>
    </div>
  )
}

interface WeightTabProps {
  measurements: BodyMeasurement[]
  latestWeight: number | null
  goalWeight?: number
  onAdd: (d: Omit<BodyMeasurement, 'id'>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

function WeightTab({ measurements, latestWeight, goalWeight, onAdd, onDelete }: WeightTabProps) {
  const [range, setRange] = useState<TimeRange>('30d')
  const [showAdd, setShowAdd] = useState(false)
  const [weight, setWeight] = useState('')
  const [date, setDate] = useState(today())
  const [smm, setSmm] = useState('')
  const [bf, setBf] = useState('')
  const [notes, setNotes] = useState('')

  const filtered = measurements.filter(m => {
    if (range === 'all') return true
    const days = range === '7d' ? 7 : range === '30d' ? 30 : 90
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    return m.date >= cutoff.toISOString().split('T')[0]
  }).reverse()

  const chartData = filtered.map(m => ({
    date: m.date.slice(5),
    weight: m.weight,
    bf: m.bfPercent,
  }))

  // Moving average
  const withAvg = chartData.map((d, i) => {
    const window = chartData.slice(Math.max(0, i - 6), i + 1)
    const avg = window.reduce((a, b) => a + b.weight, 0) / window.length
    return { ...d, avg: Math.round(avg * 10) / 10 }
  })

  const handleAdd = async () => {
    if (!weight) return
    await onAdd({
      date, weight: parseFloat(weight),
      smm: smm ? parseFloat(smm) : undefined,
      bfPercent: bf ? parseFloat(bf) : undefined,
      notes: notes || undefined,
    })
    setShowAdd(false)
    setWeight(''); setSmm(''); setBf(''); setNotes('')
  }

  return (
    <div className="space-y-4">
      {/* Current weight card */}
      {latestWeight && (
        <div className="bg-surface rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="text-muted text-xs uppercase tracking-wider">Current</p>
            <p className="text-textPrimary font-black text-3xl font-mono">{latestWeight}<span className="text-muted text-lg font-normal">kg</span></p>
          </div>
          {goalWeight && (
            <div className="text-right">
              <p className="text-muted text-xs uppercase tracking-wider">Goal</p>
              <p className="text-accent font-bold text-xl font-mono">{goalWeight}<span className="text-muted text-sm font-normal">kg</span></p>
              <p className="text-muted text-xs">{Math.abs(latestWeight - goalWeight).toFixed(1)}kg to go</p>
            </div>
          )}
        </div>
      )}

      {/* Range selector */}
      <div className="flex gap-1">
        {(['7d','30d','90d','all'] as TimeRange[]).map(r => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              range === r ? 'bg-primary text-textPrimary' : 'bg-surface2 text-muted'
            }`}
          >
            {r === 'all' ? 'All' : r}
          </button>
        ))}
      </div>

      {/* Chart */}
      {filtered.length > 1 ? (
        <div className="bg-surface rounded-2xl p-4">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={withAvg}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1F3347" />
              <XAxis dataKey="date" tick={{ fill: '#8BA3B8', fontSize: 10 }} />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fill: '#8BA3B8', fontSize: 10 }}
                width={35}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#162232', border: '1px solid #1F3347', borderRadius: 8 }}
                labelStyle={{ color: '#8BA3B8', fontSize: 12 }}
                itemStyle={{ color: '#F0F4F8', fontSize: 12 }}
              />
              <Line type="monotone" dataKey="weight" stroke="#FF6B35" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="avg" stroke="#1E3A5F" strokeWidth={1.5} dot={false} strokeDasharray="4 2" />
              {goalWeight && (
                <ReferenceLine y={goalWeight} stroke="#2D6A4F" strokeDasharray="4 2" label={{ value: 'Goal', fill: '#2D6A4F', fontSize: 10 }} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="bg-surface rounded-2xl p-8 text-center">
          <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Scale size={24} className="text-accent" strokeWidth={1.5} />
          </div>
          <p className="text-textPrimary font-bold mb-2">Track your weight</p>
          <p className="text-muted text-sm">Log daily to see your progress chart</p>
        </div>
      )}

      {/* Add button */}
      <button
        onClick={() => setShowAdd(true)}
        className="w-full py-4 bg-accent rounded-xl text-white font-bold flex items-center justify-center gap-2 shadow-lg shadow-accent/25"
      >
        <Plus size={20} />
        Log Weight
      </button>

      {/* Recent entries */}
      <div className="space-y-2">
        {measurements.slice(0, 10).map(m => (
          <div key={m.id} className="bg-surface rounded-xl px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-textPrimary font-semibold font-mono">{m.weight}kg</p>
              <p className="text-muted text-xs">{formatDate(m.date)}</p>
            </div>
            <div className="flex items-center gap-3">
              {m.bfPercent && <span className="text-muted text-xs">{m.bfPercent}% BF</span>}
              {m.smm && <span className="text-muted text-xs">{m.smm}kg SMM</span>}
              <button onClick={() => onDelete(m.id)} className="p-1.5 text-muted hover:text-danger transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add sheet */}
      <BottomSheet open={showAdd} onClose={() => setShowAdd(false)} title="Log Weight">
        <div className="p-4 space-y-4 pb-8">
          <div>
            <label className="text-muted text-xs uppercase tracking-wider mb-1 block">Date</label>
            <input type="date" value={date} max={today()} onChange={e => setDate(e.target.value)}
              className="w-full bg-surface2 rounded-xl px-4 py-3 text-textPrimary outline-none" />
          </div>
          <div>
            <label className="text-muted text-xs uppercase tracking-wider mb-1 block">Weight (kg) *</label>
            <input type="number" value={weight} onChange={e => setWeight(e.target.value)} placeholder="e.g. 75.5" autoFocus
              className="w-full bg-surface2 rounded-xl px-4 py-3 text-textPrimary outline-none border border-transparent focus:border-accent" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-muted text-xs uppercase tracking-wider mb-1 block">SMM (kg)</label>
              <input type="number" value={smm} onChange={e => setSmm(e.target.value)} placeholder="Optional"
                className="w-full bg-surface2 rounded-xl px-4 py-3 text-textPrimary outline-none" />
            </div>
            <div className="flex-1">
              <label className="text-muted text-xs uppercase tracking-wider mb-1 block">BF%</label>
              <input type="number" value={bf} onChange={e => setBf(e.target.value)} placeholder="Optional"
                className="w-full bg-surface2 rounded-xl px-4 py-3 text-textPrimary outline-none" />
            </div>
          </div>
          <div>
            <label className="text-muted text-xs uppercase tracking-wider mb-1 block">Notes</label>
            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any notes..."
              className="w-full bg-surface2 rounded-xl px-4 py-3 text-textPrimary outline-none" />
          </div>
          <button onClick={handleAdd} className="w-full py-4 bg-accent text-white rounded-xl font-bold">Save</button>
        </div>
      </BottomSheet>
    </div>
  )
}

function PhotosTab({ photos, onAdd, onDelete }: {
  photos: ProgressPhoto[]
  onAdd: (d: Omit<ProgressPhoto, 'id'>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [angle, setAngle] = useState<'front' | 'side' | 'back'>('front')
  const [date, setDate] = useState(today())
  const [compareMode, setCompareMode] = useState(false)
  const [selected, setSelected] = useState<string[]>([])

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const base64Data = await compressImage(file)
    await onAdd({ date, angle, base64Data })
    e.target.value = ''
  }

  const totalSize = photos.reduce((a, p) => a + estimateBase64Size(p.base64Data), 0)
  const sizeMB = (totalSize / (1024 * 1024)).toFixed(1)

  const comparePhotos = selected.map(id => photos.find(p => p.id === id)).filter(Boolean)

  return (
    <div className="space-y-4">
      {compareMode && selected.length === 2 ? (
        <div>
          <div className="flex gap-2 mb-3">
            <button onClick={() => { setCompareMode(false); setSelected([]) }} className="px-3 py-1.5 bg-surface2 text-muted rounded-lg text-sm">
              ← Back
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {comparePhotos.map(p => p && (
              <div key={p.id} className="rounded-xl overflow-hidden">
                <img src={p.base64Data} className="w-full aspect-[3/4] object-cover" alt={p.angle} />
                <p className="text-muted text-xs text-center py-1">{formatDate(p.date)} · {p.angle}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Controls */}
          <div className="flex gap-2 items-center">
            <div className="flex gap-1 flex-1">
              {(['front','side','back'] as const).map(a => (
                <button key={a} onClick={() => setAngle(a)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize ${angle === a ? 'bg-accent text-white' : 'bg-surface2 text-muted'}`}>
                  {a}
                </button>
              ))}
            </div>
            <input type="date" value={date} max={today()} onChange={e => setDate(e.target.value)}
              className="bg-surface2 rounded-lg px-2 py-2 text-muted text-xs outline-none" />
          </div>

          <div className="flex gap-2">
            <button onClick={() => fileRef.current?.click()}
              className="flex-1 py-3 bg-accent rounded-xl text-white font-bold flex items-center justify-center gap-2">
              <Camera size={18} />
              Add Photo
            </button>
            {photos.length >= 2 && (
              <button onClick={() => setCompareMode(true)}
                className="px-4 py-3 bg-surface2 rounded-xl text-muted flex items-center gap-1">
                <ArrowLeftRight size={16} />
              </button>
            )}
          </div>

          <input ref={fileRef} type="file" accept="image/*" capture="environment"
            onChange={handleFile} className="hidden" />

          {photos.length === 0 ? (
            <div className="bg-surface rounded-2xl p-8 text-center">
              <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ImageIcon size={24} className="text-accent" strokeWidth={1.5} />
              </div>
              <p className="text-textPrimary font-bold mb-2">No progress photos yet</p>
              <p className="text-muted text-sm">Track your transformation visually</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {photos.map(p => (
                <div key={p.id} className={`relative rounded-xl overflow-hidden cursor-pointer ${
                  compareMode && selected.includes(p.id) ? 'ring-2 ring-accent' : ''
                }`}
                  onClick={() => {
                    if (!compareMode) return
                    setSelected(s => s.includes(p.id) ? s.filter(i => i !== p.id) : s.length < 2 ? [...s, p.id] : s)
                  }}>
                  <img src={p.base64Data} className="w-full aspect-square object-cover" alt={p.angle} />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 p-1">
                    <p className="text-white text-[9px]">{p.date.slice(5)} · {p.angle[0].toUpperCase()}</p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); onDelete(p.id) }}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/50 rounded-full flex items-center justify-center"
                  >
                    <Trash2 size={10} className="text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {photos.length > 0 && (
            <p className="text-muted text-xs text-center">{photos.length} photos · ~{sizeMB} MB</p>
          )}

          {compareMode && (
            <p className="text-accent text-sm text-center">
              Select 2 photos to compare ({selected.length}/2)
            </p>
          )}
        </>
      )}
    </div>
  )
}

function StatsTab() {
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalVolume: 0,
    avgPerWeek: 0,
    mostLogged: '',
    heaviestLift: { name: '', weight: 0 },
    longestStreak: 0,
  })

  useEffect(() => {
    async function compute() {
      const workouts = await db.workouts.where('type').equals('structured').toArray()
      const sets = await db.workout_sets.toArray()

      const totalVolume = sets
        .filter(s => !s.isWarmup)
        .reduce((a, s) => a + s.weight * s.reps, 0)

      // Avg per week (last 4 weeks)
      const fourWeeksAgo = new Date()
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28)
      const recentWorkouts = workouts.filter(w => w.date >= fourWeeksAgo.toISOString().split('T')[0])
      const avgPerWeek = Math.round((recentWorkouts.length / 4) * 10) / 10

      // Most logged exercise
      const counts: Record<string, number> = {}
      sets.forEach(s => { counts[s.exerciseId] = (counts[s.exerciseId] || 0) + 1 })
      const topId = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0]
      const topEx = topId ? await db.exercises.get(topId) : null

      // Heaviest lift
      const heaviest = sets.reduce((a, b) => b.weight > a.weight ? b : a, { weight: 0, exerciseId: '' })
      const heavyEx = heaviest.exerciseId ? await db.exercises.get(heaviest.exerciseId) : null

      setStats({
        totalWorkouts: workouts.length,
        totalVolume,
        avgPerWeek,
        mostLogged: topEx?.name || '—',
        heaviestLift: { name: heavyEx?.name || '—', weight: heaviest.weight },
        longestStreak: 0,
      })
    }
    compute()
  }, [])

  const items = [
    { icon: <Dumbbell size={18} strokeWidth={1.8} />, color: '#FF6B35', bg: 'rgba(255,107,53,0.12)', label: 'Total Workouts', value: String(stats.totalWorkouts) },
    { icon: <Activity size={18} strokeWidth={1.8} />, color: '#1E90FF', bg: 'rgba(30,144,255,0.12)', label: 'Total Volume', value: stats.totalVolume >= 1000 ? `${(stats.totalVolume/1000).toFixed(1)}t` : `${stats.totalVolume.toFixed(0)}kg` },
    { icon: <RefreshCw size={18} strokeWidth={1.8} />, color: '#2D6A4F', bg: 'rgba(45,106,79,0.12)', label: 'Avg/Week (4w)', value: `${stats.avgPerWeek}x` },
    { icon: <TrendingUp size={18} strokeWidth={1.8} />, color: '#DAA520', bg: 'rgba(218,165,32,0.12)', label: 'Most Logged', value: stats.mostLogged },
    { icon: <Trophy size={18} strokeWidth={1.8} />, color: '#DAA520', bg: 'rgba(218,165,32,0.12)', label: 'Heaviest Lift', value: stats.heaviestLift.weight > 0 ? `${stats.heaviestLift.weight}kg` : '—' },
    { icon: <BarChart3 size={18} strokeWidth={1.8} />, color: '#8BA3B8', bg: 'rgba(139,163,184,0.12)', label: 'Exercise', value: stats.heaviestLift.name },
  ]

  return (
    <div className="space-y-3">
      {[0, 2, 4].map(i => (
        <div key={i} className="grid grid-cols-2 gap-3">
          {[items[i], items[i+1]].map(item => item && (
            <div key={item.label} className="bg-surface rounded-2xl p-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: item.bg, color: item.color }}>
                {item.icon}
              </div>
              <p className="text-textPrimary font-bold text-lg leading-tight truncate">{item.value}</p>
              <p className="text-muted text-xs mt-0.5">{item.label}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
