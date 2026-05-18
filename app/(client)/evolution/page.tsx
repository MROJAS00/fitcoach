import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { EvolutionClient } from './EvolutionClient'

export default async function EvolutionPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const [metrics, workoutHistory] = await Promise.all([
    prisma.bodyMetric.findMany({
      where: { clientId: session.userId },
      orderBy: { date: 'asc' },
    }),
    prisma.workoutLog.findMany({
      where: { clientId: session.userId, completed: true },
      include: {
        sets: {
          where: { completed: true },
          include: { exercise: { select: { id: true, name: true } } },
          orderBy: [{ exerciseId: 'asc' }, { setNumber: 'asc' }],
        },
      },
      orderBy: { date: 'asc' },
      take: 60,
    }),
  ])

  return <EvolutionClient metrics={metrics} workoutHistory={workoutHistory} />
}
