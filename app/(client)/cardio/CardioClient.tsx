'use client'
import { useState, useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { CARDIO_TYPES, CardioType, formatDuration } from '@/lib/cardio'
import { formatDate, cn } from '@/lib/utils'
import { Plus, X, Footprints, Flame, Timer, MapPin, Mountain } from 'lucide-react'

type CardioLog = {
  id: string; date: Date | string; type: CardioType
  duration: number; distance: number | null; elevation: number | null
  calories: number | null; notes: string | null
}

function toISO(d: Date | string) {
  const date = typeof d === 'string' ? new Date(d) : d
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

const EMPTY_FORM = {
  date: new Date().toISOString().split('T')[0],
  type: 'WALK' as CardioType,
  duration: '',
  distance: '',
  elevation: '',
  calories: '',
  notes: '',
}

export function CardioClient({ initialLogs }: { initialLogs: CardioLog[] }) {
  const [logs, setLogs] = useState(initialLogs)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  // Stats
  const totalMinutes = logs.reduce((a, l) => a + l.duration, 0)
  const totalDistance = logs.reduce((a, l) => a + (l.distance ?? 0), 0)
  const totalElevation = logs.reduce((a, l) => a + (l.elevation ?? 0), 0)
  const thisMonth = useMemo(() => {
    const now = new Date()
    return logs.filter(l => {
      const d = new Date(toISO(l.date) + 'T12:00:00')
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
  }, [logs])

  // Weekly distance chart (last 8 weeks)
  const weeklyData = useMemo(() => {
    const weeks: Record<string, { label: string; distance: number; duration: number }> = {}
    const now = new Date()
    for (let w = 7; w >= 0; w--) {
      const d = new Date(now)
      d.setDate(d.getDate() - w * 7)
      const mon = new Date(d)
      mon.setDate(d.getDate() - ((d.getDay() + 6) % 7))
      const key = toISO(mon)
      weeks[key] = { label: `${mon.getDate()}/${mon.getMonth() + 1}`, distance: 0, duration: 0 }
    }
    for (const log of logs) {
      const d = new Date(toISO(log.date) + 'T12:00:00')
      const mon = new Date(d)
      mon.setDate(d.getDate() - ((d.getDay() + 6) % 7))
      const key = toISO(mon)
      if (weeks[key]) {
        weeks[key].distance += log.distance ?? 0
        weeks[key].duration += log.duration
      }
    }
    return Object.values(weeks)
  }, [logs])

  // Activity type distribution
  const byType = useMemo(() => {
    const counts: Partial<Record<CardioType, number>> = {}
    for (const log of logs) {
      counts[log.type] = (counts[log.type] ?? 0) + 1
    }
    return Object.entries(counts).map(([type, count]) => ({
      type: type as CardioType,
      count,
      label: CARDIO_TYPES[type as CardioType].label,
      color: CARDIO_TYPES[type as CardioType].color,
    })).sort((a, b) => b.count - a.count)
  }, [logs])

  async function save() {
    if (!form.duration) return
    setSaving(true)
    const res = await fetch('/api/cardio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()
    setLogs(prev => [data, ...prev])
    setForm(EMPTY_FORM)
    setShowForm(false)
    setSaving(false)
  }

  async function remove(id: string) {
    await fetch('/api/cardio', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setLogs(prev => prev.filter(l => l.id !== id))
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#f0f0f0]">Actividad</h1>
          <p className="text-[#6b7280] text-sm mt-0.5">Caminatas, senderismo y más</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" /> Registrar
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="mb-4 border-green-500/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-[#f0f0f0]">Nueva actividad</p>
              <button onClick={() => setShowForm(false)} className="text-[#6b7280] hover:text-[#f0f0f0]">
                <X className="w-4 h-4" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Activity type selector */}
            <div className="mb-4">
              <p className="text-sm text-[#6b7280] mb-2">Tipo de actividad</p>
              <div className="flex flex-wrap gap-2">
                {(Object.entries(CARDIO_TYPES) as [CardioType, typeof CARDIO_TYPES[CardioType]][]).map(([key, { label, emoji, color }]) => (
                  <button
                    key={key}
                    onClick={() => setForm(f => ({ ...f, type: key }))}
                    className={cn(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors',
                      form.type === key
                        ? 'text-white border-transparent'
                        : 'bg-[#1a1a1a] text-[#9ca3af] border-[#2a2a2a] hover:border-[#3a3a3a]'
                    )}
                    style={form.type === key ? { backgroundColor: color, borderColor: color } : {}}
                  >
                    <span>{emoji}</span> {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <Input
                label="Fecha"
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              />
              <Input
                label="Duración (min) *"
                type="number"
                min="1"
                placeholder="60"
                value={form.duration}
                onChange={e => setForm(f => ({ ...f, duration: e.target.value }))}
              />
              <Input
                label="Distancia (km)"
                type="number"
                step="0.1"
                placeholder="5.2"
                value={form.distance}
                onChange={e => setForm(f => ({ ...f, distance: e.target.value }))}
              />
              <Input
                label="Desnivel (m)"
                type="number"
                placeholder="320"
                value={form.elevation}
                onChange={e => setForm(f => ({ ...f, elevation: e.target.value }))}
              />
              <Input
                label="Calorías"
                type="number"
                placeholder="450"
                value={form.calories}
                onChange={e => setForm(f => ({ ...f, calories: e.target.value }))}
              />
              <div className="col-span-2">
                <Input
                  label="Notas"
                  placeholder="Ruta, sensaciones..."
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>
            <Button onClick={save} loading={saving} disabled={!form.duration}>Guardar</Button>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { icon: Footprints, label: 'Actividades', value: logs.length, color: 'text-green-400' },
          { icon: Timer, label: 'Tiempo total', value: formatDuration(totalMinutes), color: 'text-blue-400' },
          { icon: MapPin, label: 'Distancia total', value: totalDistance > 0 ? `${totalDistance.toFixed(1)} km` : '—', color: 'text-purple-400' },
          { icon: Mountain, label: 'Desnivel total', value: totalElevation > 0 ? `${Math.round(totalElevation)} m` : '—', color: 'text-amber-400' },
        ].map(({ icon: Icon, label, value, color }) => (
          <Card key={label}>
            <CardContent className="py-4">
              <Icon className={`w-4 h-4 ${color} mb-1`} />
              <p className="text-lg font-bold text-[#f0f0f0] leading-tight">{value}</p>
              <p className="text-xs text-[#6b7280]">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Weekly chart */}
      {logs.length > 0 && (
        <Card className="mb-4">
          <CardHeader>
            <p className="font-medium text-[#f0f0f0]">Distancia semanal (km) — últimas 8 semanas</p>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={weeklyData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
                <Tooltip
                  contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: unknown) => [`${Number(v).toFixed(1)} km`, 'Distancia']}
                />
                <Bar dataKey="distance" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* This month + type breakdown */}
      {logs.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-3 mb-4">
          <Card>
            <CardContent className="py-4">
              <p className="text-xs text-[#6b7280] mb-3">Este mes</p>
              <p className="text-2xl font-bold text-[#f0f0f0] mb-1">{thisMonth.length} <span className="text-sm font-normal text-[#6b7280]">actividades</span></p>
              <p className="text-sm text-[#9ca3af]">{formatDuration(thisMonth.reduce((a, l) => a + l.duration, 0))} · {thisMonth.reduce((a, l) => a + (l.distance ?? 0), 0).toFixed(1)} km</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4">
              <p className="text-xs text-[#6b7280] mb-3">Por tipo</p>
              <div className="space-y-1.5">
                {byType.slice(0, 4).map(({ type, count, label, color }) => (
                  <div key={type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{CARDIO_TYPES[type].emoji}</span>
                      <span className="text-sm text-[#d1d5db]">{label}</span>
                    </div>
                    <span className="text-sm font-medium" style={{ color }}>{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Log list */}
      {logs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-4xl mb-3">🥾</p>
            <p className="text-[#9ca3af] font-medium mb-1">Sin actividades registradas</p>
            <p className="text-[#6b7280] text-sm">Registra tu primera caminata o senderismo</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <p className="font-semibold text-[#f0f0f0]">Historial</p>
          </CardHeader>
          <div className="divide-y divide-[#2a2a2a]">
            {logs.map(log => {
              const meta = CARDIO_TYPES[log.type]
              return (
                <div key={log.id} className="px-5 py-3 flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                    style={{ backgroundColor: `${meta.color}20` }}
                  >
                    {meta.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-[#f0f0f0]">{meta.label}</span>
                      <span className="text-xs text-[#6b7280]">{formatDate(new Date(toISO(log.date) + 'T12:00:00'))}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                      <span className="text-xs text-[#9ca3af]">⏱ {formatDuration(log.duration)}</span>
                      {log.distance && <span className="text-xs text-[#9ca3af]">📍 {log.distance} km</span>}
                      {log.elevation && <span className="text-xs text-[#9ca3af]">⛰ {log.elevation} m</span>}
                      {log.calories && <span className="text-xs text-[#9ca3af]">🔥 {log.calories} kcal</span>}
                    </div>
                    {log.notes && <p className="text-xs text-[#6b7280] mt-0.5 truncate">{log.notes}</p>}
                  </div>
                  <button onClick={() => remove(log.id)} className="text-[#6b7280] hover:text-red-400 shrink-0">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
        </Card>
      )}
    </div>
  )
}
