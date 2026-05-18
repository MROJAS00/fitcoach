import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const exercises = await prisma.exercise.findMany({
    orderBy: [{ muscleGroup: 'asc' }, { name: 'asc' }],
  })

  return NextResponse.json(exercises, {
    headers: { 'Cache-Control': 'private, max-age=3600' },
  })
}
