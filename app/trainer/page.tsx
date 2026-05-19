import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Users, Clock, CheckCircle, UserX, ChevronRight } from 'lucide-react'
import { ClientStatusActions } from './ClientStatusActions'

export default async function TrainerPage() {
  const session = await getSession()
  if (!session) redirect('/login')

  const clients = await prisma.user.findMany({
    where: { role: 'CLIENT' },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    select: {
      id: true, email: true, name: true, status: true, createdAt: true,
      assignedRoutine: { select: { id: true, name: true } },
    },
  })

  const pending = clients.filter(c => c.status === 'PENDING')
  const active = clients.filter(c => c.status === 'ACTIVE')
  const inactive = clients.filter(c => c.status === 'INACTIVE')

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#f0f0f0]">Panel del Entrenador</h1>
        <p className="text-[#6b7280] text-sm mt-0.5">Gestiona tus clientes y sus rutinas</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Activos', count: active.length, icon: CheckCircle, color: 'text-green-400' },
          { label: 'Pendientes', count: pending.length, icon: Clock, color: 'text-amber-400' },
          { label: 'Inactivos', count: inactive.length, icon: UserX, color: 'text-red-400' },
        ].map(({ label, count, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="flex flex-col items-center py-4">
              <Icon className={`w-6 h-6 ${color} mb-1`} />
              <span className="text-2xl font-bold text-[#f0f0f0]">{count}</span>
              <span className="text-xs text-[#6b7280]">{label}</span>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pending approvals */}
      {pending.length > 0 && (
        <Card className="mb-4 border-amber-500/30">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <h2 className="font-semibold text-[#f0f0f0]">Solicitudes pendientes</h2>
              <Badge variant="warning">{pending.length}</Badge>
            </div>
          </CardHeader>
          <div className="divide-y divide-[#2a2a2a]">
            {pending.map(client => (
              <div key={client.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#f0f0f0]">{client.name}</p>
                  <p className="text-xs text-[#6b7280]">{client.email}</p>
                </div>
                <ClientStatusActions clientId={client.id} currentStatus={client.status} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Active clients */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-green-400" />
            <h2 className="font-semibold text-[#f0f0f0]">Clientes activos</h2>
          </div>
        </CardHeader>
        {active.length === 0 ? (
          <CardContent>
            <p className="text-[#6b7280] text-sm text-center py-4">No hay clientes activos aún.</p>
          </CardContent>
        ) : (
          <div className="divide-y divide-[#2a2a2a]">
            {active.map(client => (
              <div key={client.id} className="px-5 py-3 flex items-center justify-between">
                <Link href={`/trainer/clients/${client.id}`} className="flex-1 min-w-0 hover:opacity-80 transition-opacity">
                  <p className="text-sm font-medium text-[#f0f0f0]">{client.name}</p>
                  <p className="text-xs text-[#6b7280]">{client.email}</p>
                  {client.assignedRoutine ? (
                    <p className="text-xs text-green-400 mt-0.5">Rutina: {client.assignedRoutine.name}</p>
                  ) : (
                    <p className="text-xs text-amber-400 mt-0.5">Sin rutina asignada</p>
                  )}
                </Link>
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  <ClientStatusActions clientId={client.id} currentStatus={client.status} compact />
                  <Link
                    href={`/trainer/clients/${client.id}/routine`}
                    className="flex items-center gap-1 text-xs text-[#9ca3af] hover:text-green-400 transition-colors"
                  >
                    Rutina <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Inactive */}
      {inactive.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <UserX className="w-4 h-4 text-[#6b7280]" />
              <h2 className="font-semibold text-[#9ca3af]">Clientes inactivos</h2>
            </div>
          </CardHeader>
          <div className="divide-y divide-[#2a2a2a]">
            {inactive.map(client => (
              <div key={client.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[#9ca3af]">{client.name}</p>
                  <p className="text-xs text-[#6b7280]">{client.email}</p>
                </div>
                <ClientStatusActions clientId={client.id} currentStatus={client.status} compact />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
