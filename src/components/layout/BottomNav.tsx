import { NavLink, useLocation } from 'react-router-dom'
import { Home, ClipboardList, BarChart2, User } from 'lucide-react'
import { useWorkoutStore } from '../../store/workoutStore'

const tabs = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/log', icon: ClipboardList, label: 'Log' },
  { to: '/body', icon: BarChart2, label: 'Body' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export function BottomNav() {
  const { pathname } = useLocation()
  const activeWorkout = useWorkoutStore(s => s.activeWorkout)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-surface2 pb-safe">
      <div className="flex items-stretch max-w-lg mx-auto">
        {tabs.map(({ to, icon: Icon, label }) => {
          const isActive = to === '/' ? pathname === '/' : pathname.startsWith(to)
          const isLog = to === '/log'

          return (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors min-h-[56px] relative ${
                isActive ? 'text-accent' : 'text-muted'
              }`}
            >
              <div className="relative">
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                {isLog && activeWorkout && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-accent rounded-full border border-surface animate-pulse" />
                )}
              </div>
              <span className="text-[10px] font-medium tracking-wide">{label}</span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-accent rounded-full" />
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
