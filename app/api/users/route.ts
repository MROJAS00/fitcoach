import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'TRAINER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    where: { role: 'CLIENT' },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, email: true, name: true, status: true, createdAt: true,
      assignedRoutine: { select: { id: true, name: true } },
    },
  })

  return NextResponse.json(users)
}
