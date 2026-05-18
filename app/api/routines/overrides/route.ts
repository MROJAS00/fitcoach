import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'TRAINER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { routineId, date, label, exercises } = await req.json()
  if (!routineId || !date || !label) {
    return NextResponse.json({ error: 'routineId, date y label son requeridos' }, { status: 400 })
  }

  // Delete existing override for that date/routine
  const existing = await prisma.routineOverride.findFirst({
    where: { routineId, date: new Date(date) },
  })
  if (existing) {
    await prisma.routineOverride.delete({ where: { id: existing.id } })
  }

  const override = await prisma.routineOverride.create({
    data: {
      routineId,
      date: new Date(date),
      label,
      exercises: {
        create: exercises?.map((ex: { exerciseId: string; order: number; sets: number; reps: string; weight?: string; notes?: string }) => ({
          exerciseId: ex.exerciseId,
          order: ex.order,
          sets: ex.sets,
          reps: ex.reps,
          weight: ex.weight,
          notes: ex.notes,
        })) ?? [],
      },
    },
    include: {
      exercises: { include: { exercise: true }, orderBy: { order: 'asc' } },
    },
  })

  return NextResponse.json(override, { status: 201 })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession()
  if (!session || session.role !== 'TRAINER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { id } = await req.json()
  await prisma.routineOverride.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
