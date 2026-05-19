import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import { CardioClient } from './CardioClient'

export default async function CardioPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const logs = await prisma.cardioLog.findMany({
    where: { clientId: session.userId },
    orderBy: { date: 'desc' },
  })

  return <CardioClient initialLogs={logs} />
}
