import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { WorkoutSession } from './WorkoutSession'
import { getDayOfWeek } from '@/lib/utils'

export default async function WorkoutPage({ params }: { params: Promise<{ date: string }> }) {
  const session = await getSession()
  if (!session) redirect('/login')

  const { date } = await params
  const dateObj = new Date(date + 'T12:00:00')
  const dow = getDayOfWeek(dateObj)

  const [routine, existingLog] = await Promise.all([
    prisma.routine.findUnique({
      where: { clientId: session.userId },
      include: {
        days: {
          where: { dayOfWeek: dow as never },
          include: {
            exercises: { include: { exercise: true }, orderBy: { order: 'asc' } },
          },
        },
        overrides: {
          where: { date: new Date(date) },
          include: {
            exercises: { include: { exercise: true }, orderBy: { order: 'asc' } },
          },
        },
      },
    }),
    prisma.workoutLog.findUnique({
      where: { clientId_date: { clientId: session.userId, date: new Date(date) } },
      include: {
        sets: {
          include: { exercise: true },
          orderBy: [{ exerciseId: 'asc' }, { setNumber: 'asc' }],
        },
      },
    }),
  ])

  const todayRoutine = routine?.overrides[0] ?? routine?.days[0] ?? null

  if (!todayRoutine) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-4xl mb-4">😴</p>
          <h2 className="text-lg font-bold text-[#f0f0f0] mb-2">Día de descanso</h2>
          <p className="text-[#9ca3af] text-sm mb-4">No tienes entrenamiento programado para este día.</p>
          <a href="/calendar" className="text-green-400 hover:text-green-300 text-sm">Ver calendario</a>
        </div>
      </div>
    )
  }

  return (
    <WorkoutSession
      date={date}
      routineDay={todayRoutine}
      existingLog={existingLog}
    />
  )
}
