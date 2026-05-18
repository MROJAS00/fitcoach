'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Check, X, Power, PowerOff } from 'lucide-react'

interface Props {
  clientId: string
  currentStatus: string
  compact?: boolean
}

export function ClientStatusActions({ clientId, currentStatus, compact }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function updateStatus(status: string) {
    setLoading(true)
    await fetch(`/api/users/${clientId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    router.refresh()
    setLoading(false)
  }

  if (currentStatus === 'PENDING') {
    return (
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="primary"
          loading={loading}
          onClick={() => updateStatus('ACTIVE')}
          title="Aprobar"
        >
          <Check className="w-3.5 h-3.5" />
          {!compact && 'Aprobar'}
        </Button>
        <Button
          size="sm"
          variant="danger"
          loading={loading}
          onClick={() => updateStatus('INACTIVE')}
          title="Rechazar"
        >
          <X className="w-3.5 h-3.5" />
          {!compact && 'Rechazar'}
        </Button>
      </div>
    )
  }

  if (currentStatus === 'ACTIVE') {
    return (
      <Button
        size="sm"
        variant="secondary"
        loading={loading}
        onClick={() => updateStatus('INACTIVE')}
        title="Desactivar"
      >
        <PowerOff className="w-3.5 h-3.5" />
        {!compact && 'Desactivar'}
      </Button>
    )
  }

  return (
    <Button
      size="sm"
      variant="secondary"
      loading={loading}
      onClick={() => updateStatus('ACTIVE')}
      title="Activar"
    >
      <Power className="w-3.5 h-3.5" />
      {!compact && 'Activar'}
    </Button>
  )
}
