import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { CalendarView } from './CalendarView'
import { toISODate } from '@/lib/utils'

export default async function CalendarPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const today = new Date()
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  const [routine, logs] = await Promise.all([
    prisma.routine.findUnique({
      where: { clientId: session.userId },
      include: {
        days: { select: { dayOfWeek: true, label: true } },
        overrides: {
          where: { date: { gte: monthStart, lte: monthEnd } },
          select: { id: true, date: true, label: true },
        },
      },
    }),
    prisma.workoutLog.findMany({
      where: {
        clientId: session.userId,
        date: { gte: monthStart, lte: monthEnd },
      },
      select: { date: true, completed: true },
    }),
  ])

  const completedDates = logs
    .filter(l => l.completed)
    .map(l => toISODate(new Date(l.date)))

  const startedDates = logs
    .filter(l => !l.completed)
    .map(l => toISODate(new Date(l.date)))

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold text-[#f0f0f0] mb-6">Calendario</h1>
      <CalendarView
        routine={routine}
        completedDates={completedDates}
        startedDates={startedDates}
        today={toISODate(today)}
      />
    </div>
  )
}
