import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const date = req.nextUrl.searchParams.get('date')
  const clientId = session.role === 'CLIENT'
    ? session.userId
    : req.nextUrl.searchParams.get('clientId')

  if (!date || !clientId) {
    return NextResponse.json({ error: 'date y clientId requeridos' }, { status: 400 })
  }

  const log = await prisma.workoutLog.findUnique({
    where: { clientId_date: { clientId, date: new Date(date) } },
    include: {
      sets: {
        include: { exercise: true },
        orderBy: [{ exerciseId: 'asc' }, { setNumber: 'asc' }],
      },
    },
  })

  return NextResponse.json(log)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'CLIENT') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { date } = await req.json()
  if (!date) return NextResponse.json({ error: 'date requerido' }, { status: 400 })

  const log = await prisma.workoutLog.upsert({
    where: { clientId_date: { clientId: session.userId, date: new Date(date) } },
    update: { startedAt: new Date() },
    create: {
      clientId: session.userId,
      date: new Date(date),
      startedAt: new Date(),
    },
    include: { sets: { include: { exercise: true } } },
  })

  return NextResponse.json(log, { status: 201 })
}
