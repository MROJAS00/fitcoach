import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { RoutineBuilder } from './RoutineBuilder'

export default async function ClientRoutinePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'TRAINER') redirect('/login')

  const { id } = await params

  const [client, exercises, routine] = await Promise.all([
    prisma.user.findUnique({
      where: { id, role: 'CLIENT' },
      select: { id: true, name: true, email: true },
    }),
    prisma.exercise.findMany({ orderBy: [{ muscleGroup: 'asc' }, { name: 'asc' }] }),
    prisma.routine.findUnique({
      where: { clientId: id },
      include: {
        days: {
          include: {
            exercises: { include: { exercise: true }, orderBy: { order: 'asc' } },
          },
          orderBy: { dayOfWeek: 'asc' },
        },
      },
    }),
  ])

  if (!client) notFound()

  return <RoutineBuilder client={client} exercises={exercises} initialRoutine={routine} />
}
