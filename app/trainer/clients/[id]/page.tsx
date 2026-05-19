import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatDate, toISODate } from '@/lib/utils'
import { ChevronLeft, Dumbbell, TrendingUp, Calendar, ClipboardList } from 'lucide-react'
import { ClientTabView } from './ClientTabView'

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'TRAINER') redirect('/login')

  const { id } = await params

  const [client, workoutLogs, metrics, routine, cardioLogs] = await Promise.all([
    prisma.user.findUnique({
      where: { id, role: 'CLIENT' },
      select: { id: true, name: true, email: true, status: true, createdAt: true, trainerNotes: true },
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
      take: 60,
    }),
    prisma.bodyMetric.findMany({
      where: { clientId: id },
      orderBy: { date: 'asc' },
    }),
    prisma.routine.findUnique({
      where: { clientId: id },
      include: { days: { select: { dayOfWeek: true, label: true } } },
    }),
    prisma.cardioLog.findMany({
      where: { clientId: id },
      orderBy: { date: 'desc' },
    }),
  ])

  if (!client) notFound()

  const completedLogs = workoutLogs.filter(l => l.completed)
  const totalSets = workoutLogs.reduce((acc, l) => acc + l.sets.length, 0)
  const lastMetric = metrics[metrics.length - 1]

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
          <p className="text-[#6b7280] text-sm">{client.email} · Cliente desde {formatDate(client.createdAt)}</p>
        </div>
        <Link
          href={`/trainer/clients/${id}/routine`}
          className="flex items-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-sm font-medium rounded-lg transition-colors shrink-0"
        >
          <ClipboardList className="w-4 h-4" />
          {routine ? 'Editar rutina' : 'Asignar rutina'}
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Entrenos', value: completedLogs.length, icon: Dumbbell, color: 'text-green-400' },
          { label: 'Series totales', value: totalSets.toLocaleString(), icon: TrendingUp, color: 'text-blue-400' },
          { label: 'Mediciones', value: metrics.length, icon: Calendar, color: 'text-purple-400' },
          { label: 'Peso actual', value: lastMetric?.weight ? `${lastMetric.weight} kg` : '—', icon: TrendingUp, color: 'text-amber-400' },
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
            <p className="font-semibold text-[#f0f0f0]">Rutina: {routine.name}</p>
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

      {/* Tabbed view: Analytics / Historial / Medidas */}
      <ClientTabView
        clientId={id}
        workoutLogs={workoutLogs}
        metrics={metrics}
        cardioLogs={cardioLogs}
        initialNotes={client.trainerNotes ?? null}
      />
    </div>
  )
}
