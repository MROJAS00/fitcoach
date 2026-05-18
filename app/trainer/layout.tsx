import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { AppShell } from '@/components/AppShell'

export default async function TrainerLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'TRAINER') redirect('/dashboard')

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true },
  })

  return (
    <AppShell role="TRAINER" userName={user?.name ?? session.email}>
      {children}
    </AppShell>
  )
}
