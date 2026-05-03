import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useProfileStore } from './store/profileStore'
import { useExerciseStore } from './store/exerciseStore'
import { useBodyStore } from './store/bodyStore'
import { initDB } from './db/schema'
import { BottomNav } from './components/layout/BottomNav'
import { FAB } from './components/layout/FAB'
import { ToastProvider } from './components/ui/Toast'

const Home = lazy(() => import('./pages/Home'))
const Log = lazy(() => import('./pages/Log'))
const Body = lazy(() => import('./pages/Body'))
const Profile = lazy(() => import('./pages/Profile'))
const Scribble = lazy(() => import('./pages/Scribble'))
const Onboarding = lazy(() => import('./pages/Onboarding'))

function PageLoader() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-surface2 border-t-accent animate-spin" />
    </div>
  )
}

function AppShell() {
  const { profile, loading } = useProfileStore()

  if (loading) return <PageLoader />

  if (!profile?.onboarded) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Onboarding />
      </Suspense>
    )
  }

  return (
    <>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/log" element={<Log />} />
          <Route path="/body" element={<Body />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/scribble" element={<Scribble />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <BottomNav />
      <FAB />
      <ToastProvider />
    </>
  )
}

export default function App() {
  const { load: loadProfile } = useProfileStore()
  const { load: loadExercises } = useExerciseStore()
  const { loadMeasurements } = useBodyStore()

  useEffect(() => {
    initDB().then(() => {
      loadProfile()
      loadExercises()
      loadMeasurements()
    })

    // Reduce motion for low-memory devices
    if ('deviceMemory' in navigator && (navigator as Navigator & { deviceMemory: number }).deviceMemory < 4) {
      document.documentElement.style.setProperty('--motion-duration', '0ms')
    }
  }, [loadProfile, loadExercises, loadMeasurements])

  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  )
}
