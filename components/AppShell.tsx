'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Calendar, TrendingUp, Users, Dumbbell, LogOut, Activity
} from 'lucide-react'

interface AppShellProps {
  children: React.ReactNode
  role: 'TRAINER' | 'CLIENT'
  userName: string
}

const clientNav = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Inicio' },
  { href: '/calendar', icon: Calendar, label: 'Calendario' },
  { href: '/evolution', icon: TrendingUp, label: 'Evolución' },
]

const trainerNav = [
  { href: '/trainer', icon: Users, label: 'Clientes' },
  { href: '/trainer/exercises', icon: Dumbbell, label: 'Ejercicios' },
]

export function AppShell({ children, role, userName }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const nav = role === 'TRAINER' ? trainerNav : clientNav

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    window.location.href = '/login'
  }

  return (
    <div className="flex h-screen bg-[#0f0f0f] overflow-hidden">
      {/* Sidebar — desktop only */}
      <aside className="hidden md:flex flex-col w-56 border-r border-[#1f1f1f] bg-[#0f0f0f] shrink-0">
        <div className="px-4 py-5 border-b border-[#1f1f1f]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-green-500 flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-[#f0f0f0]">FitCoach</span>
          </div>
        </div>

        <nav className="flex-1 px-2 py-4 space-y-0.5">
          {nav.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                pathname === href || pathname.startsWith(href + '/')
                  ? 'bg-[#1a1a1a] text-[#f0f0f0]'
                  : 'text-[#9ca3af] hover:text-[#f0f0f0] hover:bg-[#1a1a1a]'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="px-2 py-4 border-t border-[#1f1f1f]">
          <div className="px-3 py-2 mb-1">
            <p className="text-xs text-[#6b7280] truncate">{userName}</p>
            <p className="text-xs text-green-500 font-medium">{role === 'TRAINER' ? 'Entrenador' : 'Cliente'}</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#9ca3af] hover:text-red-400 hover:bg-[#1a1a1a] transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-[#1f1f1f] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-green-500 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-[#f0f0f0] text-sm">FitCoach</span>
          </div>
          <button onClick={handleLogout} className="text-[#6b7280] hover:text-red-400">
            <LogOut className="w-4 h-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto pb-20 md:pb-0">
          {children}
        </div>

        {/* Bottom nav — mobile only */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-[#1f1f1f] bg-[#0f0f0f] flex">
          {nav.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-2 text-xs transition-colors',
                pathname === href || pathname.startsWith(href + '/')
                  ? 'text-green-400'
                  : 'text-[#6b7280]'
              )}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
        </nav>
      </main>
    </div>
  )
}
