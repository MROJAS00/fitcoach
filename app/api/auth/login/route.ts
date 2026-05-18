import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createToken, COOKIE_NAME, MAX_AGE } from '@/lib/auth'
import { createHash } from 'crypto'

function hashPassword(password: string) {
  return createHash('sha256').update(password).digest('hex')
}

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: 'Campos requeridos' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } })
  if (!user || user.passwordHash !== hashPassword(password)) {
    return NextResponse.json({ error: 'Credenciales incorrectas' }, { status: 401 })
  }

  if (user.status === 'PENDING') {
    return NextResponse.json({ error: 'Tu cuenta está pendiente de aprobación' }, { status: 403 })
  }
  if (user.status === 'INACTIVE') {
    return NextResponse.json({ error: 'Tu cuenta está desactivada' }, { status: 403 })
  }

  const token = await createToken({ userId: user.id, email: user.email, role: user.role })
  const res = NextResponse.json({ ok: true, role: user.role })
  res.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: MAX_AGE,
    path: '/',
  })
  return res
}
