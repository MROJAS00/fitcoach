'use client'
import { useState } from 'react'
import { Activity, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error)
      setLoading(false)
      return
    }

    setDone(true)
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center">
          <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#f0f0f0] mb-2">¡Solicitud enviada!</h2>
          <p className="text-[#9ca3af] mb-6">Tu cuenta está pendiente de aprobación por tu entrenador. Te avisará cuando puedas acceder.</p>
          <a href="/login" className="text-green-400 hover:text-green-300 text-sm">Volver al inicio de sesión</a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-green-500 flex items-center justify-center mb-4">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#f0f0f0]">FitCoach</h1>
          <p className="text-[#6b7280] text-sm mt-1">Crea tu cuenta de cliente</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
          <Input
            label="Nombre completo"
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Tu nombre"
            required
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
            autoComplete="email"
          />
          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Mínimo 6 caracteres"
            required
            autoComplete="new-password"
          />

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
          )}

          <Button type="submit" loading={loading} size="lg" className="w-full mt-1">
            Crear cuenta
          </Button>

          <p className="text-center text-sm text-[#6b7280]">
            ¿Ya tienes cuenta?{' '}
            <a href="/login" className="text-green-400 hover:text-green-300">
              Inicia sesión
            </a>
          </p>
        </form>
      </div>
    </div>
  )
}
