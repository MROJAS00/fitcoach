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

  const metrics = await prisma.bodyMetric.findMany({
    where: { clientId },
    orderBy: { date: 'asc' },
  })

  return NextResponse.json(metrics)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'CLIENT') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const body = await req.json()
  const { date, weight, bodyFat, chest, waist, hips, leftArm, rightArm, leftThigh, rightThigh, notes } = body

  if (!date) return NextResponse.json({ error: 'date requerido' }, { status: 400 })

  const metric = await prisma.bodyMetric.upsert({
    where: { clientId_date: { clientId: session.userId, date: new Date(date) } },
    update: { weight, bodyFat, chest, waist, hips, leftArm, rightArm, leftThigh, rightThigh, notes },
    create: {
      clientId: session.userId,
      date: new Date(date),
      weight, bodyFat, chest, waist, hips, leftArm, rightArm, leftThigh, rightThigh, notes,
    },
  })

  return NextResponse.json(metric, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'CLIENT') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { id } = await req.json()

  const metric = await prisma.bodyMetric.findUnique({ where: { id } })
  if (!metric || metric.clientId !== session.userId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  await prisma.bodyMetric.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
