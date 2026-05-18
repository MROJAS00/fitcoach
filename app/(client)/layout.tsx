import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { AppShell } from '@/components/AppShell'

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role === 'TRAINER') redirect('/trainer')

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, status: true },
  })

  if (user?.status !== 'ACTIVE') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <p className="text-2xl mb-3">⏳</p>
          <h2 className="text-lg font-bold text-[#f0f0f0] mb-2">Cuenta pendiente</h2>
          <p className="text-[#9ca3af] text-sm mb-4">Tu entrenador aún no ha aprobado tu cuenta. Vuelve a intentarlo más tarde.</p>
          <a href="/login" className="text-green-400 text-sm hover:text-green-300">Cerrar sesión</a>
        </div>
      </div>
    )
  }

  return (
    <AppShell role="CLIENT" userName={user?.name ?? session.email}>
      {children}
    </AppShell>
  )
}
