import { useState, useEffect, useMemo, useRef } from 'react'
import { Search, Plus, X, Dumbbell, Zap, Settings2, User, Link, Weight, Move } from 'lucide-react'
import { BottomSheet } from '../layout/BottomSheet'
import { useExerciseStore } from '../../store/exerciseStore'
import { useWorkoutStore } from '../../store/workoutStore'
import { Exercise } from '../../db/schema'

const EQUIPMENT_ICON_MAP: Record<string, React.ReactNode> = {
  Barbell: <Weight size={16} strokeWidth={1.8} />,
  Dumbbell: <Dumbbell size={16} strokeWidth={1.8} />,
  Cable: <Zap size={16} strokeWidth={1.8} />,
  Machine: <Settings2 size={16} strokeWidth={1.8} />,
  Bodyweight: <User size={16} strokeWidth={1.8} />,
  Kettlebell: <Link size={16} strokeWidth={1.8} />,
  'Smith Machine': <Move size={16} strokeWidth={1.8} />,
  'Resistance Band': <Move size={16} strokeWidth={1.8} />,
}

const CATEGORIES = ['All', 'Push', 'Pull', 'Legs', 'Core', 'Cardio', 'Olympic'] as const
const EQUIPMENT_FILTERS = ['All', 'Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight', 'Kettlebell'] as const

interface ExercisePickerProps {
  open: boolean
  onClose: () => void
  onSelect: (exerciseId: string) => void
  selectedIds?: string[]
}

interface CreateFormData {
  name: string
  primaryMuscle: string
  category: Exercise['category']
  equipment: Exercise['equipment']
  notes: string
}

export function ExercisePicker({ open, onClose, onSelect, selectedIds = [] }: ExercisePickerProps) {
  const { exercises, addCustom } = useExerciseStore()
  const { recentExerciseIds } = useWorkoutStore()
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'Recent' | 'All' | 'Category'>('Recent')
  const [category, setCategory] = useState<typeof CATEGORIES[number]>('All')
  const [equipment, setEquipment] = useState<typeof EQUIPMENT_FILTERS[number]>('All')
  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState<CreateFormData>({
    name: '', primaryMuscle: '', category: 'Push', equipment: 'Barbell', notes: ''
  })
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setTimeout(() => searchRef.current?.focus(), 300)
    }
  }, [open])

  const filtered = useMemo(() => {
    let list = exercises
    if (query.trim()) {
      const q = query.toLowerCase()
      list = list.filter(e =>
        e.name.toLowerCase().includes(q) ||
        e.primaryMuscle.toLowerCase().includes(q) ||
        e.equipment.toLowerCase().includes(q)
      )
    } else if (activeTab === 'Recent') {
      const recents = recentExerciseIds
        .map(id => exercises.find(e => e.id === id))
        .filter(Boolean) as Exercise[]
      return recents
    }

    if (category !== 'All') list = list.filter(e => e.category === category)
    if (equipment !== 'All') list = list.filter(e => e.equipment === equipment)
    return list
  }, [exercises, query, activeTab, category, equipment, recentExerciseIds])

  const handleCreate = async () => {
    if (!createForm.name.trim()) return
    const ex = await addCustom({
      name: createForm.name.trim(),
      category: createForm.category,
      equipment: createForm.equipment,
      primaryMuscle: createForm.primaryMuscle || 'Other',
      secondaryMuscles: [],
      notes: createForm.notes,
    })
    onSelect(ex.id)
    onClose()
    setShowCreate(false)
  }

  // no-op (unused after refactor)

  if (showCreate) {
    return (
      <BottomSheet open={open} onClose={() => setShowCreate(false)} title="Create Exercise">
        <div className="p-4 space-y-4">
          <div>
            <label className="text-muted text-xs uppercase tracking-wider mb-1 block">Name *</label>
            <input
              autoFocus
              value={createForm.name}
              onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Bulgarian Split Squat"
              className="w-full bg-surface2 rounded-xl px-4 py-3 text-textPrimary text-sm outline-none border border-transparent focus:border-accent"
            />
          </div>
          <div>
            <label className="text-muted text-xs uppercase tracking-wider mb-1 block">Primary Muscle</label>
            <input
              value={createForm.primaryMuscle}
              onChange={e => setCreateForm(f => ({ ...f, primaryMuscle: e.target.value }))}
              placeholder="e.g. Quads"
              className="w-full bg-surface2 rounded-xl px-4 py-3 text-textPrimary text-sm outline-none border border-transparent focus:border-accent"
            />
          </div>
          <div>
            <label className="text-muted text-xs uppercase tracking-wider mb-1 block">Category</label>
            <select
              value={createForm.category}
              onChange={e => setCreateForm(f => ({ ...f, category: e.target.value as Exercise['category'] }))}
              className="w-full bg-surface2 rounded-xl px-4 py-3 text-textPrimary text-sm outline-none"
            >
              {['Push','Pull','Legs','Core','Cardio','Olympic'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-muted text-xs uppercase tracking-wider mb-1 block">Equipment</label>
            <select
              value={createForm.equipment}
              onChange={e => setCreateForm(f => ({ ...f, equipment: e.target.value as Exercise['equipment'] }))}
              className="w-full bg-surface2 rounded-xl px-4 py-3 text-textPrimary text-sm outline-none"
            >
              {['Barbell','Dumbbell','Cable','Machine','Bodyweight','Kettlebell','Smith Machine','Resistance Band'].map(eq => (
                <option key={eq} value={eq}>{eq}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pb-8">
            <button onClick={() => setShowCreate(false)} className="flex-1 py-3 rounded-xl bg-surface2 text-muted font-medium">
              Cancel
            </button>
            <button onClick={handleCreate} className="flex-1 py-3 rounded-xl bg-accent text-white font-bold">
              Create
            </button>
          </div>
        </div>
      </BottomSheet>
    )
  }

  return (
    <BottomSheet open={open} onClose={onClose} fullHeight>
      <div className="flex flex-col h-full">
        {/* Search + Create */}
        <div className="px-4 pb-3 space-y-3 flex-shrink-0">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                ref={searchRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search exercises..."
                className="w-full bg-surface2 rounded-xl pl-9 pr-4 py-3 text-textPrimary text-sm outline-none"
              />
              {query && (
                <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted">
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="px-3 py-3 bg-accent rounded-xl text-white flex items-center gap-1"
            >
              <Plus size={16} />
            </button>
          </div>

          {/* Tabs */}
          {!query && (
            <div className="flex gap-1">
              {(['Recent', 'All', 'Category'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab ? 'bg-primary text-textPrimary' : 'text-muted'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          )}

          {/* Category / Equipment filters */}
          {activeTab === 'Category' && !query && (
            <>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {CATEGORIES.map(c => (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      category === c ? 'bg-accent text-white' : 'bg-surface2 text-muted'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {EQUIPMENT_FILTERS.map(eq => (
                  <button
                    key={eq}
                    onClick={() => setEquipment(eq)}
                    className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                      equipment === eq ? 'bg-primary text-textPrimary' : 'bg-surface2 text-muted'
                    }`}
                  >
                    {eq}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* List */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 gap-3">
              <p className="text-muted text-sm">No exercises found</p>
              <button
                onClick={() => setShowCreate(true)}
                className="text-accent text-sm font-medium"
              >
                Create "{query}"
              </button>
            </div>
          ) : (
            <div className="pb-8">
              {filtered.map((ex) => {
                const isSelected = selectedIds.includes(ex.id)
                return (
                  <div key={ex.id} className="px-4">
                    <button
                      onClick={() => { onSelect(ex.id); onClose() }}
                      className={`w-full flex items-center gap-3 py-3.5 border-b border-surface2/50 ${
                        isSelected ? 'opacity-50 pointer-events-none' : ''
                      }`}
                    >
                      <span className="w-6 flex items-center justify-center text-muted flex-shrink-0">
                        {EQUIPMENT_ICON_MAP[ex.equipment] || <Dumbbell size={16} strokeWidth={1.8} />}
                      </span>
                      <div className="flex-1 text-left">
                        <p className="text-textPrimary font-medium text-sm leading-tight">{ex.name}</p>
                        <p className="text-muted text-xs">{ex.primaryMuscle} · {ex.equipment}</p>
                      </div>
                      {ex.isCustom && (
                        <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">Custom</span>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </BottomSheet>
  )
}
