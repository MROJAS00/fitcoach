import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createHash } from 'crypto'

function hashPassword(password: string) {
  return createHash('sha256').update(password).digest('hex')
}

export async function POST(req: NextRequest) {
  const { email, name, password } = await req.json()

  if (!email || !name || !password) {
    return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
  }

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (existing) {
    return NextResponse.json({ error: 'Ya existe una cuenta con ese email' }, { status: 409 })
  }

  await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      name,
      passwordHash: hashPassword(password),
      role: 'CLIENT',
      status: 'PENDING',
    },
  })

  return NextResponse.json({ ok: true })
}
