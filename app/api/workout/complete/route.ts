import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'CLIENT') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { workoutLogId } = await req.json()

  const log = await prisma.workoutLog.findUnique({ where: { id: workoutLogId } })
  if (!log || log.clientId !== session.userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const updated = await prisma.workoutLog.update({
    where: { id: workoutLogId },
    data: { completed: true, finishedAt: new Date() },
  })

  return NextResponse.json(updated)
}
