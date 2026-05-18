'use client'
import { useState } from 'react'
import { Activity } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error)
      setLoading(false)
      return
    }

    window.location.href = data.role === 'TRAINER' ? '/trainer' : '/dashboard'
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-green-500 flex items-center justify-center mb-4">
            <Activity className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#f0f0f0]">FitCoach</h1>
          <p className="text-[#6b7280] text-sm mt-1">Inicia sesión en tu cuenta</p>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6">
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
            placeholder="••••••••"
            required
            autoComplete="current-password"
          />

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>
          )}

          <Button type="submit" loading={loading} size="lg" className="w-full mt-1">
            Iniciar sesión
          </Button>

          <p className="text-center text-sm text-[#6b7280]">
            ¿No tienes cuenta?{' '}
            <a href="/register" className="text-green-400 hover:text-green-300">
              Regístrate
            </a>
          </p>
        </form>
      </div>
    </div>
  )
}
