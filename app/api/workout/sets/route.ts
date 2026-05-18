import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'CLIENT') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { workoutLogId, exerciseId, setNumber, weight, reps } = await req.json()

  const workoutLog = await prisma.workoutLog.findUnique({ where: { id: workoutLogId } })
  if (!workoutLog || workoutLog.clientId !== session.userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const set = await prisma.workoutSet.upsert({
    where: {
      id: (await prisma.workoutSet.findFirst({
        where: { workoutLogId, exerciseId, setNumber },
        select: { id: true },
      }))?.id ?? 'new',
    },
    update: { weight, reps, completed: true },
    create: {
      workoutLogId,
      exerciseId,
      setNumber,
      weight,
      reps,
      completed: true,
    },
    include: { exercise: true },
  })

  return NextResponse.json(set)
}

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'CLIENT') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { setId, weight, reps, completed, notes } = await req.json()

  const existing = await prisma.workoutSet.findUnique({
    where: { id: setId },
    include: { workoutLog: true },
  })

  if (!existing || existing.workoutLog.clientId !== session.userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const updated = await prisma.workoutSet.update({
    where: { id: setId },
    data: { weight, reps, completed, notes },
    include: { exercise: true },
  })

  return NextResponse.json(updated)
}
