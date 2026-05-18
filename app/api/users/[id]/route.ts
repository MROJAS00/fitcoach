import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession()
  if (!session || session.role !== 'TRAINER') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 403 })
  }

  const { id } = await params
  const { status } = await req.json()

  if (!['PENDING', 'ACTIVE', 'INACTIVE'].includes(status)) {
    return NextResponse.json({ error: 'Estado inválido' }, { status: 400 })
  }

  const user = await prisma.user.update({
    where: { id },
    data: { status },
    select: { id: true, email: true, name: true, status: true },
  })

  return NextResponse.json(user)
}
