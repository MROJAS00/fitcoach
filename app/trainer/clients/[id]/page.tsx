import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatDate, MUSCLE_LABELS, toISODate } from '@/lib/utils'
import { ChevronLeft, Dumbbell, TrendingUp, Calendar, ClipboardList } from 'lucide-react'
import { ClientEvolutionCharts } from './ClientEvolutionCharts'

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'TRAINER') redirect('/login')

  const { id } = await params

  const [client, workoutLogs, metrics, routine] = await Promise.all([
    prisma.user.findUnique({
      where: { id, role: 'CLIENT' },
      select: { id: true, name: true, email: true, status: true, createdAt: true },
    }),
    prisma.workoutLog.findMany({
      where: { clientId: id },
      include: {
        sets: {
          where: { completed: true },
          include: { exercise: { select: { id: true, name: true, muscleGroup: true } } },
          orderBy: [{ exerciseId: 'asc' }, { setNumber: 'asc' }],
        },
      },
      orderBy: { date: 'desc' },
      take: 30,
    }),
    prisma.bodyMetric.findMany({
      where: { clientId: id },
      orderBy: { date: 'asc' },
    }),
    prisma.routine.findUnique({
      where: { clientId: id },
      include: { days: { select: { dayOfWeek: true, label: true } } },
    }),
  ])

  if (!client) notFound()

  const completedLogs = workoutLogs.filter(l => l.completed)
  const totalSets = workoutLogs.reduce((acc, l) => acc + l.sets.length, 0)
  const lastWorkout = completedLogs[0]

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/trainer" className="text-[#6b7280] hover:text-[#f0f0f0] transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-[#f0f0f0]">{client.name}</h1>
            <Badge variant={client.status === 'ACTIVE' ? 'success' : client.status === 'PENDING' ? 'warning' : 'danger'}>
              {client.status === 'ACTIVE' ? 'Activo' : client.status === 'PENDING' ? 'Pendiente' : 'Inactivo'}
            </Badge>
          </div>
          <p className="text-[#6b7280] text-sm">{client.email}</p>
        </div>
        <Link
          href={`/trainer/clients/${id}/routine`}
          className="flex items-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors"
        >
          <ClipboardList className="w-4 h-4" />
          {routine ? 'Editar rutina' : 'Asignar rutina'}
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Entrenos totales', value: completedLogs.length, icon: Dumbbell, color: 'text-green-400' },
          { label: 'Series totales', value: totalSets, icon: TrendingUp, color: 'text-blue-400' },
          { label: 'Mediciones', value: metrics.length, icon: Calendar, color: 'text-purple-400' },
          { label: 'Peso actual', value: metrics.length ? `${metrics[metrics.length - 1].weight ?? '—'} kg` : '—', icon: TrendingUp, color: 'text-amber-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="py-4">
              <Icon className={`w-4 h-4 ${color} mb-1`} />
              <p className="text-xl font-bold text-[#f0f0f0]">{value}</p>
              <p className="text-xs text-[#6b7280]">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Routine summary */}
      {routine && (
        <Card className="mb-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-[#f0f0f0]">Rutina: {routine.name}</p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {routine.days.map(d => (
                <Badge key={d.dayOfWeek} variant="info">{d.label}</Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Evolution charts */}
      {metrics.length > 1 && (
        <div className="mb-4">
          <ClientEvolutionCharts metrics={metrics} workoutLogs={workoutLogs} />
        </div>
      )}

      {/* Workout history */}
      <Card>
        <CardHeader>
          <p className="font-semibold text-[#f0f0f0]">Historial de entrenamientos</p>
        </CardHeader>
        {workoutLogs.length === 0 ? (
          <CardContent>
            <p className="text-[#6b7280] text-sm text-center py-6">El cliente aún no ha registrado ningún entrenamiento.</p>
          </CardContent>
        ) : (
          <div className="divide-y divide-[#2a2a2a]">
            {workoutLogs.map(log => {
              const byExercise = log.sets.reduce<Record<string, { name: string; sets: typeof log.sets }>>((acc, s) => {
                if (!acc[s.exerciseId]) acc[s.exerciseId] = { name: s.exercise.name, sets: [] }
                acc[s.exerciseId].sets.push(s)
                return acc
              }, {})

              return (
                <div key={log.id} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-medium text-[#f0f0f0]">{formatDate(new Date(toISODate(log.date) + 'T12:00:00'))}</p>
                      <p className="text-xs text-[#6b7280]">{log.sets.length} series registradas</p>
                    </div>
                    <Badge variant={log.completed ? 'success' : 'warning'}>
                      {log.completed ? 'Completado' : 'En progreso'}
                    </Badge>
                  </div>

                  {Object.values(byExercise).length > 0 && (
                    <div className="space-y-2">
                      {Object.values(byExercise).map(({ name, sets }) => {
                        const maxWeight = Math.max(...sets.map(s => s.weight ?? 0))
                        const totalVol = sets.reduce((acc, s) => acc + (s.weight ?? 0) * (s.reps ?? 0), 0)
                        return (
                          <div key={name} className="bg-[#0f0f0f] rounded-lg px-3 py-2">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-sm text-[#d1d5db] font-medium">{name}</span>
                              <span className="text-xs text-[#6b7280]">{sets.length} series</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {sets.map(s => (
                                <span key={s.setNumber} className={`text-xs px-2 py-0.5 rounded ${s.completed ? 'bg-green-500/10 text-green-400' : 'bg-[#2a2a2a] text-[#6b7280]'}`}>
                                  {s.weight ? `${s.weight}kg` : '—'} × {s.reps ?? '—'}
                                </span>
                              ))}
                            </div>
                            <p className="text-xs text-[#6b7280] mt-1">
                              Máx: {maxWeight > 0 ? `${maxWeight} kg` : '—'} · Vol: {totalVol > 0 ? `${totalVol.toLocaleString()} kg` : '—'}
                            </p>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}
