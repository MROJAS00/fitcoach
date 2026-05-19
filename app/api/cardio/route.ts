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

  const logs = await prisma.cardioLog.findMany({
    where: { clientId },
    orderBy: { date: 'desc' },
  })

  return NextResponse.json(logs)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'CLIENT') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { date, type, duration, distance, elevation, calories, notes } = await req.json()

  if (!date || !type || !duration) {
    return NextResponse.json({ error: 'date, type y duration son requeridos' }, { status: 400 })
  }

  const log = await prisma.cardioLog.create({
    data: {
      clientId: session.userId,
      date: new Date(date),
      type,
      duration: parseInt(duration),
      distance: distance ? parseFloat(distance) : null,
      elevation: elevation ? parseFloat(elevation) : null,
      calories: calories ? parseInt(calories) : null,
      notes: notes || null,
    },
  })

  return NextResponse.json(log, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'CLIENT') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { id } = await req.json()

  const log = await prisma.cardioLog.findUnique({ where: { id } })
  if (!log || log.clientId !== session.userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  await prisma.cardioLog.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
