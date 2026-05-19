import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'TRAINER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { id } = await params
  const { trainerNotes } = await req.json()

  const user = await prisma.user.update({
    where: { id },
    data: { trainerNotes },
    select: { id: true, trainerNotes: true },
  })

  return NextResponse.json(user)
}
