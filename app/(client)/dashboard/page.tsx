import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { getDayOfWeek, DAY_LABELS, toISODate, formatDate } from '@/lib/utils'
import { Calendar, TrendingUp, Dumbbell, ChevronRight, CheckCircle } from 'lucide-react'

export default async function DashboardPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const today = new Date()
  const todayISO = toISODate(today)
  const todayDOW = getDayOfWeek(today)

  const [user, routine, todayLog, lastMetric, recentLogs] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.userId }, select: { name: true } }),
    prisma.routine.findUnique({
      where: { clientId: session.userId },
      include: {
        days: {
          where: { dayOfWeek: todayDOW as never },
          include: {
            exercises: { include: { exercise: true }, orderBy: { order: 'asc' } },
          },
        },
        overrides: {
          where: { date: new Date(todayISO) },
          include: {
            exercises: { include: { exercise: true }, orderBy: { order: 'asc' } },
          },
        },
      },
    }),
    prisma.workoutLog.findUnique({
      where: { clientId_date: { clientId: session.userId, date: new Date(todayISO) } },
      include: { sets: { where: { completed: true } } },
    }),
    prisma.bodyMetric.findFirst({
      where: { clientId: session.userId },
      orderBy: { date: 'desc' },
    }),
    prisma.workoutLog.findMany({
      where: { clientId: session.userId, completed: true },
      orderBy: { date: 'desc' },
      take: 5,
    }),
  ])

  const todayRoutine = routine?.overrides[0] ?? routine?.days[0] ?? null
  const isRestDay = !todayRoutine

  const hour = today.getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#f0f0f0]">{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-[#6b7280] text-sm mt-0.5">{DAY_LABELS[todayDOW]}, {formatDate(today)}</p>
      </div>

      {/* Today's workout */}
      <Card className={`mb-4 ${isRestDay ? '' : 'border-green-500/20'}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Dumbbell className="w-4 h-4 text-green-400" />
              <span className="font-semibold text-[#f0f0f0]">Hoy</span>
            </div>
            {todayLog?.completed && <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />Completado</Badge>}
          </div>
        </CardHeader>
        <CardContent>
          {isRestDay ? (
            <div className="text-center py-4">
              <p className="text-3xl mb-2">😴</p>
              <p className="text-[#9ca3af] font-medium">Día de descanso</p>
              <p className="text-[#6b7280] text-sm mt-1">Recupera y descansa bien</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-3">
                <Badge variant="info">{todayRoutine.label}</Badge>
                <span className="text-xs text-[#6b7280]">{todayRoutine.exercises.length} ejercicios</span>
              </div>
              <div className="space-y-1.5 mb-4">
                {todayRoutine.exercises.slice(0, 4).map(ex => (
                  <div key={ex.exerciseId} className="flex items-center justify-between text-sm">
                    <span className="text-[#d1d5db]">{ex.exercise.name}</span>
                    <span className="text-[#6b7280] text-xs">{ex.sets}×{ex.reps}</span>
                  </div>
                ))}
                {todayRoutine.exercises.length > 4 && (
                  <p className="text-xs text-[#6b7280]">+{todayRoutine.exercises.length - 4} más</p>
                )}
              </div>
              <Link
                href={`/workout/${todayISO}`}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {todayLog ? 'Continuar entrenamiento' : 'Iniciar entrenamiento'}
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-[#6b7280]">Entrenos (7d)</span>
            </div>
            <p className="text-2xl font-bold text-[#f0f0f0]">
              {recentLogs.filter(l => {
                const d = new Date(l.date)
                const diff = (today.getTime() - d.getTime()) / (1000 * 60 * 60 * 24)
                return diff <= 7
              }).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-xs text-[#6b7280]">Peso corporal</span>
            </div>
            <p className="text-2xl font-bold text-[#f0f0f0]">
              {lastMetric?.weight ? `${lastMetric.weight} kg` : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent workouts */}
      {recentLogs.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-[#f0f0f0] text-sm">Últimos entrenamientos</h2>
          </CardHeader>
          <div className="divide-y divide-[#2a2a2a]">
            {recentLogs.map(log => (
              <Link
                key={log.id}
                href={`/workout/${toISODate(new Date(log.date))}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-[#1f1f1f] transition-colors"
              >
                <span className="text-sm text-[#d1d5db]">{formatDate(new Date(log.date))}</span>
                <div className="flex items-center gap-2">
                  <Badge variant="success">Completado</Badge>
                  <ChevronRight className="w-4 h-4 text-[#6b7280]" />
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
