'use client'
import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { formatDate, cn } from '@/lib/utils'
import { Plus, TrendingUp, Scale, Ruler, Dumbbell, X } from 'lucide-react'

type Metric = {
  id: string; date: Date | string
  weight?: number | null; bodyFat?: number | null
  chest?: number | null; waist?: number | null; hips?: number | null
  leftArm?: number | null; rightArm?: number | null
  leftThigh?: number | null; rightThigh?: number | null
  notes?: string | null
}
type WorkoutSet = { exerciseId: string; exercise: { id: string; name: string }; weight: number | null; reps: number | null; setNumber: number }
type WorkoutLog = { date: Date | string; sets: WorkoutSet[] }

interface Props {
  metrics: Metric[]
  workoutHistory: WorkoutLog[]
}

const METRIC_FIELDS = [
  { key: 'weight', label: 'Peso corporal', unit: 'kg', color: '#22c55e' },
  { key: 'bodyFat', label: '% Grasa', unit: '%', color: '#f59e0b' },
  { key: 'waist', label: 'Cintura', unit: 'cm', color: '#3b82f6' },
  { key: 'chest', label: 'Pecho', unit: 'cm', color: '#8b5cf6' },
  { key: 'hips', label: 'Cadera', unit: 'cm', color: '#ec4899' },
  { key: 'leftArm', label: 'Brazo Izq.', unit: 'cm', color: '#06b6d4' },
  { key: 'rightArm', label: 'Brazo Der.', unit: 'cm', color: '#06b6d4' },
  { key: 'leftThigh', label: 'Muslo Izq.', unit: 'cm', color: '#f97316' },
  { key: 'rightThigh', label: 'Muslo Der.', unit: 'cm', color: '#f97316' },
]

function toISODate(d: Date | string) {
  const date = typeof d === 'string' ? new Date(d) : d
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

export function EvolutionClient({ metrics: initialMetrics, workoutHistory }: Props) {
  const [metrics, setMetrics] = useState(initialMetrics)
  const [activeTab, setActiveTab] = useState<'body' | 'performance'>('body')
  const [selectedMetric, setSelectedMetric] = useState('weight')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState<string>('')
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '', bodyFat: '', chest: '', waist: '', hips: '',
    leftArm: '', rightArm: '', leftThigh: '', rightThigh: '', notes: '',
  })

  // Build chart data for body metrics
  const chartData = metrics.map(m => ({
    date: toISODate(m.date),
    label: formatDate(new Date(toISODate(m.date) + 'T12:00:00')),
    [selectedMetric]: (m as Record<string, unknown>)[selectedMetric],
  })).filter(d => d[selectedMetric] != null)

  // Build exercise performance chart
  const exercises = Array.from(
    new Map(workoutHistory.flatMap(l => l.sets.map(s => [s.exercise.id, s.exercise]))).values()
  )
  const exerciseData = selectedExercise
    ? workoutHistory
        .filter(l => l.sets.some(s => s.exerciseId === selectedExercise))
        .map(l => {
          const exSets = l.sets.filter(s => s.exerciseId === selectedExercise && s.weight)
          const maxWeight = exSets.length ? Math.max(...exSets.map(s => s.weight ?? 0)) : null
          const maxVolume = exSets.length ? Math.max(...exSets.map(s => (s.weight ?? 0) * (s.reps ?? 0))) : null
          return {
            date: toISODate(l.date),
            label: formatDate(new Date(toISODate(l.date) + 'T12:00:00')),
            maxWeight,
            maxVolume,
          }
        }).filter(d => d.maxWeight)
    : []

  const selectedMeta = METRIC_FIELDS.find(f => f.key === selectedMetric)!
  const latest = metrics[metrics.length - 1]
  const prev = metrics[metrics.length - 2]

  async function saveMetric() {
    setSaving(true)
    const body: Record<string, unknown> = { date: form.date }
    for (const f of METRIC_FIELDS) {
      const v = parseFloat((form as Record<string, string>)[f.key])
      if (!isNaN(v)) body[f.key] = v
    }
    if (form.notes) body.notes = form.notes

    const res = await fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    setMetrics(prev => {
      const filtered = prev.filter(m => toISODate(m.date) !== toISODate(data.date))
      return [...filtered, data].sort((a, b) => toISODate(a.date).localeCompare(toISODate(b.date)))
    })
    setShowForm(false)
    setSaving(false)
  }

  async function deleteMetric(id: string) {
    await fetch('/api/metrics', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setMetrics(prev => prev.filter(m => m.id !== id))
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[#f0f0f0]">Evolución</h1>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" /> Registrar medidas
        </Button>
      </div>

      {/* Add metric form */}
      {showForm && (
        <Card className="mb-4 border-green-500/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-[#f0f0f0]">Nueva medición</p>
              <button onClick={() => setShowForm(false)} className="text-[#6b7280] hover:text-[#f0f0f0]">
                <X className="w-4 h-4" />
              </button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
              <Input
                label="Fecha"
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              />
              <Input label="Peso (kg)" type="number" step="0.1" placeholder="75.5" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} />
              <Input label="% Grasa" type="number" step="0.1" placeholder="18.0" value={form.bodyFat} onChange={e => setForm(f => ({ ...f, bodyFat: e.target.value }))} />
              <Input label="Cintura (cm)" type="number" step="0.5" placeholder="80" value={form.waist} onChange={e => setForm(f => ({ ...f, waist: e.target.value }))} />
              <Input label="Pecho (cm)" type="number" step="0.5" placeholder="100" value={form.chest} onChange={e => setForm(f => ({ ...f, chest: e.target.value }))} />
              <Input label="Cadera (cm)" type="number" step="0.5" placeholder="95" value={form.hips} onChange={e => setForm(f => ({ ...f, hips: e.target.value }))} />
              <Input label="Brazo Izq. (cm)" type="number" step="0.5" placeholder="35" value={form.leftArm} onChange={e => setForm(f => ({ ...f, leftArm: e.target.value }))} />
              <Input label="Brazo Der. (cm)" type="number" step="0.5" placeholder="35" value={form.rightArm} onChange={e => setForm(f => ({ ...f, rightArm: e.target.value }))} />
              <Input label="Muslo Izq. (cm)" type="number" step="0.5" placeholder="58" value={form.leftThigh} onChange={e => setForm(f => ({ ...f, leftThigh: e.target.value }))} />
              <Input label="Muslo Der. (cm)" type="number" step="0.5" placeholder="58" value={form.rightThigh} onChange={e => setForm(f => ({ ...f, rightThigh: e.target.value }))} />
              <div className="col-span-2 sm:col-span-3">
                <Input label="Notas" placeholder="Observaciones..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
              </div>
            </div>
            <Button onClick={saveMetric} loading={saving}>Guardar</Button>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-1 mb-4">
        {[
          { key: 'body', label: 'Medidas corporales', icon: Scale },
          { key: 'performance', label: 'Rendimiento', icon: Dumbbell },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as 'body' | 'performance')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors',
              activeTab === key ? 'bg-[#2a2a2a] text-[#f0f0f0]' : 'text-[#6b7280] hover:text-[#9ca3af]'
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'body' ? (
        <>
          {/* Metric selector */}
          <div className="flex flex-wrap gap-2 mb-4">
            {METRIC_FIELDS.map(f => (
              <button
                key={f.key}
                onClick={() => setSelectedMetric(f.key)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                  selectedMetric === f.key
                    ? 'text-white border-transparent'
                    : 'bg-[#1a1a1a] text-[#6b7280] border-[#2a2a2a] hover:text-[#9ca3af]'
                )}
                style={selectedMetric === f.key ? { backgroundColor: f.color, borderColor: f.color } : {}}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Chart */}
          {chartData.length > 1 ? (
            <Card className="mb-4">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <p className="font-medium text-[#f0f0f0]">{selectedMeta.label}</p>
                  {latest && prev && (latest as Record<string, unknown>)[selectedMetric] != null && (prev as Record<string, unknown>)[selectedMetric] != null && (
                    <Badge variant={
                      ((latest as Record<string, unknown>)[selectedMetric] as number) <= ((prev as Record<string, unknown>)[selectedMetric] as number)
                        ? (selectedMetric === 'weight' || selectedMetric === 'waist' || selectedMetric === 'bodyFat') ? 'success' : 'danger'
                        : (selectedMetric === 'weight' || selectedMetric === 'waist' || selectedMetric === 'bodyFat') ? 'danger' : 'success'
                    }>
                      {((latest as Record<string, unknown>)[selectedMetric] as number) > ((prev as Record<string, unknown>)[selectedMetric] as number) ? '▲' : '▼'}{' '}
                      {Math.abs(((latest as Record<string, unknown>)[selectedMetric] as number) - ((prev as Record<string, unknown>)[selectedMetric] as number)).toFixed(1)} {selectedMeta.unit}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, fontSize: 12 }}
                      formatter={(v: unknown) => [`${v} ${selectedMeta.unit}`, selectedMeta.label]}
                    />
                    <Line type="monotone" dataKey={selectedMetric} stroke={selectedMeta.color} strokeWidth={2} dot={{ fill: selectedMeta.color, r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ) : (
            <Card className="mb-4">
              <CardContent className="text-center py-10 text-[#6b7280] text-sm">
                {metrics.length === 0
                  ? 'Registra tus primeras medidas para ver el progreso'
                  : 'Necesitas al menos 2 registros para ver el gráfico'}
              </CardContent>
            </Card>
          )}

          {/* History table */}
          {metrics.length > 0 && (
            <Card>
              <CardHeader>
                <p className="font-medium text-[#f0f0f0] text-sm">Historial</p>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#2a2a2a]">
                      <th className="text-left px-5 py-2 text-[#6b7280] font-medium">Fecha</th>
                      <th className="text-center px-2 py-2 text-[#6b7280] font-medium">Peso</th>
                      <th className="text-center px-2 py-2 text-[#6b7280] font-medium">Grasa%</th>
                      <th className="text-center px-2 py-2 text-[#6b7280] font-medium">Cintura</th>
                      <th className="text-center px-2 py-2 text-[#6b7280] font-medium">Brazo</th>
                      <th className="px-2 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1f1f1f]">
                    {[...metrics].reverse().map(m => (
                      <tr key={m.id} className="hover:bg-[#1f1f1f]">
                        <td className="px-5 py-2.5 text-[#d1d5db]">{formatDate(new Date(toISODate(m.date) + 'T12:00:00'))}</td>
                        <td className="px-2 py-2.5 text-center text-[#f0f0f0]">{m.weight ? `${m.weight} kg` : '—'}</td>
                        <td className="px-2 py-2.5 text-center text-[#9ca3af]">{m.bodyFat ? `${m.bodyFat}%` : '—'}</td>
                        <td className="px-2 py-2.5 text-center text-[#9ca3af]">{m.waist ? `${m.waist}` : '—'}</td>
                        <td className="px-2 py-2.5 text-center text-[#9ca3af]">{m.leftArm ? `${m.leftArm}` : '—'}</td>
                        <td className="px-2 py-2.5">
                          <button onClick={() => deleteMetric(m.id)} className="text-[#6b7280] hover:text-red-400">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      ) : (
        <>
          {/* Exercise selector */}
          <div className="mb-4">
            <label className="text-sm text-[#6b7280] mb-1.5 block">Selecciona un ejercicio</label>
            <select
              value={selectedExercise}
              onChange={e => setSelectedExercise(e.target.value)}
              className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-[#f0f0f0] focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="">-- Elige un ejercicio --</option>
              {exercises.map(ex => (
                <option key={ex.id} value={ex.id}>{ex.name}</option>
              ))}
            </select>
          </div>

          {selectedExercise && exerciseData.length > 0 ? (
            <Card>
              <CardHeader>
                <p className="font-medium text-[#f0f0f0]">
                  {exercises.find(e => e.id === selectedExercise)?.name} — Peso máximo
                </p>
              </CardHeader>
              <CardContent className="pt-2">
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={exerciseData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, fontSize: 12 }}
                      formatter={(v: unknown) => [`${v} kg`, 'Peso máx.']}
                    />
                    <Line type="monotone" dataKey="maxWeight" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          ) : selectedExercise ? (
            <Card>
              <CardContent className="text-center py-10 text-[#6b7280] text-sm">
                Sin datos de rendimiento para este ejercicio
              </CardContent>
            </Card>
          ) : null}

          {!selectedExercise && workoutHistory.length === 0 && (
            <Card>
              <CardContent className="text-center py-10 text-[#6b7280] text-sm">
                Completa entrenamientos para ver tu progreso en ejercicios
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
