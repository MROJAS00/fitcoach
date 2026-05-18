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

  const routine = await prisma.routine.findUnique({
    where: { clientId },
    include: {
      days: {
        include: {
          exercises: {
            include: { exercise: true },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { dayOfWeek: 'asc' },
      },
      overrides: {
        include: {
          exercises: {
            include: { exercise: true },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { date: 'asc' },
      },
    },
  })

  return NextResponse.json(routine)
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'TRAINER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { clientId, name, days } = await req.json()
  if (!clientId || !name) {
    return NextResponse.json({ error: 'clientId y name son requeridos' }, { status: 400 })
  }

  // delete existing routine for this client if any
  const existing = await prisma.routine.findUnique({ where: { clientId } })
  if (existing) {
    await prisma.routine.delete({ where: { clientId } })
  }

  const routine = await prisma.routine.create({
    data: {
      name,
      clientId,
      trainerId: session.userId,
      days: {
        create: days?.map((day: { dayOfWeek: string; label: string; exercises: Array<{ exerciseId: string; order: number; sets: number; reps: string; weight?: string; notes?: string }> }) => ({
          dayOfWeek: day.dayOfWeek,
          label: day.label,
          exercises: {
            create: day.exercises?.map((ex) => ({
              exerciseId: ex.exerciseId,
              order: ex.order,
              sets: ex.sets,
              reps: ex.reps,
              weight: ex.weight,
              notes: ex.notes,
            })) ?? [],
          },
        })) ?? [],
      },
    },
    include: {
      days: {
        include: {
          exercises: { include: { exercise: true }, orderBy: { order: 'asc' } },
        },
      },
    },
  })

  return NextResponse.json(routine, { status: 201 })
}
