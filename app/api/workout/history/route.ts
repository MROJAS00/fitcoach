import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const clientId = session.role === 'CLIENT'
    ? session.userId
    : req.nextUrl.searchParams.get('clientId')

  if (!clientId) return NextResponse.json({ error: 'clientId requerido' }, { status: 400 })

  // Get last 90 days of workout logs
  const since = new Date()
  since.setDate(since.getDate() - 90)

  const logs = await prisma.workoutLog.findMany({
    where: { clientId, date: { gte: since } },
    include: {
      sets: {
        where: { completed: true },
        include: { exercise: true },
        orderBy: [{ exerciseId: 'asc' }, { setNumber: 'asc' }],
      },
    },
    orderBy: { date: 'desc' },
  })

  return NextResponse.json(logs)
}
