'use client'
import { useState, useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatDate, cn } from '@/lib/utils'
import { Plus, Scale, Dumbbell, X, TrendingDown, TrendingUp, Minus } from 'lucide-react'

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
  { key: 'weight',     label: 'Peso',        unit: 'kg', color: '#22c55e', lowerIsBetter: true  },
  { key: 'bodyFat',   label: '% Grasa',      unit: '%',  color: '#f59e0b', lowerIsBetter: true  },
  { key: 'waist',     label: 'Cintura',      unit: 'cm', color: '#3b82f6', lowerIsBetter: true  },
  { key: 'chest',     label: 'Pecho',        unit: 'cm', color: '#8b5cf6', lowerIsBetter: false },
  { key: 'hips',      label: 'Cadera',       unit: 'cm', color: '#ec4899', lowerIsBetter: null  },
  { key: 'leftArm',   label: 'Brazo Izq.',   unit: 'cm', color: '#06b6d4', lowerIsBetter: false },
  { key: 'rightArm',  label: 'Brazo Der.',   unit: 'cm', color: '#06b6d4', lowerIsBetter: false },
  { key: 'leftThigh', label: 'Muslo Izq.',   unit: 'cm', color: '#f97316', lowerIsBetter: false },
  { key: 'rightThigh',label: 'Muslo Der.',   unit: 'cm', color: '#f97316', lowerIsBetter: false },
]

function toISO(d: Date | string) {
  const date = typeof d === 'string' ? new Date(d) : d
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

function DeltaBadge({ current, previous, lowerIsBetter }: { current: number; previous: number; lowerIsBetter: boolean | null }) {
  const diff = current - previous
  if (Math.abs(diff) < 0.01) return <span className="text-xs text-[#6b7280] flex items-center gap-0.5"><Minus className="w-3 h-3" /> Sin cambio</span>

  const isPositive = diff > 0
  const isGood = lowerIsBetter === null ? null : (lowerIsBetter ? !isPositive : isPositive)

  const color = isGood === null ? 'text-[#9ca3af]' : isGood ? 'text-green-400' : 'text-red-400'
  const Icon = isPositive ? TrendingUp : TrendingDown

  return (
    <span className={`text-xs flex items-center gap-0.5 font-medium ${color}`}>
      <Icon className="w-3 h-3" />
      {isPositive ? '+' : ''}{diff.toFixed(1)}
    </span>
  )
}

export function EvolutionClient({ metrics: initialMetrics, workoutHistory }: Props) {
  const [metrics, setMetrics] = useState(initialMetrics)
  const [activeTab, setActiveTab] = useState<'body' | 'performance'>('body')
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState('')
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null)
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    weight: '', bodyFat: '', chest: '', waist: '', hips: '',
    leftArm: '', rightArm: '', leftThigh: '', rightThigh: '', notes: '',
  })

  // Per-field chart data
  const chartsByField = useMemo(() =>
    Object.fromEntries(
      METRIC_FIELDS.map(f => [
        f.key,
        metrics
          .filter(m => (m as Record<string, unknown>)[f.key] != null)
          .map(m => ({
            label: formatDate(new Date(toISO(m.date) + 'T12:00:00')),
            value: (m as Record<string, unknown>)[f.key] as number,
          })),
      ])
    ), [metrics])

  // Fields that actually have data (≥1 entry)
  const activeFields = METRIC_FIELDS.filter(f => (chartsByField[f.key]?.length ?? 0) >= 1)

  // Latest vs previous per field
  const latest = metrics[metrics.length - 1]
  const prev   = metrics[metrics.length - 2]

  // Exercise performance data
  const exercises = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>()
    for (const log of workoutHistory)
      for (const s of log.sets)
        if (s.weight && !map.has(s.exerciseId)) map.set(s.exerciseId, s.exercise)
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [workoutHistory])

  const exerciseData = useMemo(() => {
    if (!selectedExercise) return []
    return workoutHistory
      .filter(l => l.sets.some(s => s.exerciseId === selectedExercise && s.weight))
      .map(l => {
        const sets = l.sets.filter(s => s.exerciseId === selectedExercise && s.weight)
        return {
          label: formatDate(new Date(toISO(l.date) + 'T12:00:00')),
          maxWeight: Math.max(...sets.map(s => s.weight ?? 0)),
          bestVol: Math.max(...sets.map(s => (s.weight ?? 0) * (s.reps ?? 0))),
        }
      })
      .filter(d => d.maxWeight > 0)
  }, [workoutHistory, selectedExercise])

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
    setMetrics(p => {
      const filtered = p.filter(m => toISO(m.date) !== toISO(data.date))
      return [...filtered, data].sort((a, b) => toISO(a.date).localeCompare(toISO(b.date)))
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
    setMetrics(p => p.filter(m => m.id !== id))
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-[#f0f0f0]">Evolución</h1>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4" /> Registrar medidas
        </Button>
      </div>

      {/* Form */}
      {showForm && (
        <Card className="mb-4 border-green-500/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-[#f0f0f0]">Nueva medición</p>
              <button onClick={() => setShowForm(false)} className="text-[#6b7280] hover:text-[#f0f0f0]"><X className="w-4 h-4" /></button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
              <Input label="Fecha" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
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
          <button key={key} onClick={() => setActiveTab(key as 'body' | 'performance')}
            className={cn('flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors',
              activeTab === key ? 'bg-[#2a2a2a] text-[#f0f0f0]' : 'text-[#6b7280] hover:text-[#9ca3af]')}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {/* ── BODY TAB ── */}
      {activeTab === 'body' && (
        <>
          {metrics.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-3xl mb-3">📏</p>
                <p className="text-[#9ca3af] font-medium mb-1">Sin medidas registradas</p>
                <p className="text-[#6b7280] text-sm">Pulsa "Registrar medidas" para empezar a ver tu progreso</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Summary cards — latest value + delta */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                {activeFields.map(f => {
                  const latestVal = latest ? (latest as Record<string, unknown>)[f.key] as number | null : null
                  const prevVal   = prev   ? (prev   as Record<string, unknown>)[f.key] as number | null : null
                  if (latestVal == null) return null
                  return (
                    <button
                      key={f.key}
                      onClick={() => setExpandedMetric(expandedMetric === f.key ? null : f.key)}
                      className={cn(
                        'text-left bg-[#1a1a1a] border rounded-xl px-4 py-3 transition-colors hover:bg-[#222]',
                        expandedMetric === f.key ? 'border-opacity-80' : 'border-[#2a2a2a]'
                      )}
                      style={expandedMetric === f.key ? { borderColor: f.color } : {}}
                    >
                      <p className="text-xs text-[#6b7280] mb-1">{f.label}</p>
                      <p className="text-2xl font-bold" style={{ color: f.color }}>
                        {latestVal}<span className="text-sm font-normal text-[#6b7280] ml-0.5">{f.unit}</span>
                      </p>
                      {prevVal != null && (
                        <div className="mt-1">
                          <DeltaBadge current={latestVal} previous={prevVal} lowerIsBetter={f.lowerIsBetter} />
                        </div>
                      )}
                      <p className="text-xs text-[#6b7280] mt-1">
                        {chartsByField[f.key].length} registro{chartsByField[f.key].length !== 1 ? 's' : ''}
                      </p>
                    </button>
                  )
                })}
              </div>

              {/* Expanded full chart */}
              {expandedMetric && (() => {
                const f = METRIC_FIELDS.find(x => x.key === expandedMetric)!
                const data = chartsByField[expandedMetric]
                if (data.length < 2) return (
                  <Card className="mb-4">
                    <CardContent className="text-center py-6 text-[#6b7280] text-sm">
                      Necesitas al menos 2 registros para ver el gráfico de {f.label}.
                    </CardContent>
                  </Card>
                )
                const first = data[0].value
                return (
                  <Card className="mb-4" style={{ borderColor: `${f.color}40` }}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-[#f0f0f0]">{f.label}</p>
                        <div className="flex items-center gap-3 text-xs text-[#6b7280]">
                          <span>Inicio: <span className="text-[#d1d5db]">{first} {f.unit}</span></span>
                          <span>Actual: <span className="font-bold" style={{ color: f.color }}>{data[data.length - 1].value} {f.unit}</span></span>
                          <span className={cn(
                            'font-medium',
                            f.lowerIsBetter === null ? 'text-[#9ca3af]' :
                            f.lowerIsBetter
                              ? (data[data.length-1].value < first ? 'text-green-400' : 'text-red-400')
                              : (data[data.length-1].value > first ? 'text-green-400' : 'text-red-400')
                          )}>
                            Total: {data[data.length-1].value > first ? '+' : ''}{(data[data.length-1].value - first).toFixed(1)} {f.unit}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                      <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                          <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} interval="preserveStartEnd" />
                          <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} domain={['auto', 'auto']} />
                          <ReferenceLine y={first} stroke={`${f.color}40`} strokeDasharray="4 2" />
                          <Tooltip
                            contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, fontSize: 12 }}
                            formatter={(v: unknown) => [`${v} ${f.unit}`, f.label]}
                          />
                          <Line type="monotone" dataKey="value" stroke={f.color} strokeWidth={2.5}
                            dot={{ fill: f.color, r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                )
              })()}

              {/* Mini-chart grid — all fields with ≥2 entries */}
              {activeFields.filter(f => chartsByField[f.key].length >= 2 && f.key !== expandedMetric).length > 0 && (
                <>
                  <p className="text-xs text-[#6b7280] mb-3">Pulsa una tarjeta para ver el gráfico completo</p>
                  <div className="grid sm:grid-cols-2 gap-3 mb-4">
                    {activeFields
                      .filter(f => chartsByField[f.key].length >= 2 && f.key !== expandedMetric)
                      .map(f => {
                        const data = chartsByField[f.key]
                        return (
                          <button
                            key={f.key}
                            onClick={() => setExpandedMetric(expandedMetric === f.key ? null : f.key)}
                            className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-3 text-left hover:border-[#3a3a3a] transition-colors"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-[#d1d5db]">{f.label}</span>
                              <span className="text-xs font-bold" style={{ color: f.color }}>
                                {data[data.length - 1].value} {f.unit}
                              </span>
                            </div>
                            <ResponsiveContainer width="100%" height={60}>
                              <LineChart data={data} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                                <Line type="monotone" dataKey="value" stroke={f.color} strokeWidth={2}
                                  dot={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          </button>
                        )
                      })}
                  </div>
                </>
              )}

              {/* History table */}
              <Card>
                <CardHeader>
                  <p className="font-medium text-[#f0f0f0] text-sm">Historial completo</p>
                </CardHeader>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[480px]">
                    <thead>
                      <tr className="border-b border-[#2a2a2a]">
                        <th className="text-left px-5 py-2 text-[#6b7280] font-medium">Fecha</th>
                        <th className="text-center px-2 py-2 text-[#6b7280] font-medium">Peso</th>
                        <th className="text-center px-2 py-2 text-[#6b7280] font-medium">Grasa%</th>
                        <th className="text-center px-2 py-2 text-[#6b7280] font-medium">Cintura</th>
                        <th className="text-center px-2 py-2 text-[#6b7280] font-medium">Pecho</th>
                        <th className="text-center px-2 py-2 text-[#6b7280] font-medium">Brazo</th>
                        <th className="text-center px-2 py-2 text-[#6b7280] font-medium">Muslo</th>
                        <th className="px-2 py-2" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1f1f1f]">
                      {[...metrics].reverse().map((m, i, arr) => {
                        const mprev = arr[i + 1]
                        return (
                          <tr key={m.id} className="hover:bg-[#1f1f1f]">
                            <td className="px-5 py-2.5 text-[#d1d5db] whitespace-nowrap">
                              {formatDate(new Date(toISO(m.date) + 'T12:00:00'))}
                            </td>
                            {[
                              { k: 'weight', unit: 'kg' },
                              { k: 'bodyFat', unit: '%' },
                              { k: 'waist', unit: '' },
                              { k: 'chest', unit: '' },
                              { k: 'leftArm', unit: '' },
                              { k: 'leftThigh', unit: '' },
                            ].map(({ k, unit }) => {
                              const v = (m as Record<string, unknown>)[k] as number | null
                              const pv = mprev ? (mprev as Record<string, unknown>)[k] as number | null : null
                              const diff = v != null && pv != null ? v - pv : null
                              const field = METRIC_FIELDS.find(f => f.key === k)!
                              const isGood = diff === null || field.lowerIsBetter === null ? null
                                : (field.lowerIsBetter ? diff < 0 : diff > 0)
                              return (
                                <td key={k} className="px-2 py-2.5 text-center">
                                  {v != null ? (
                                    <div>
                                      <span className="text-[#f0f0f0]">{v}{unit}</span>
                                      {diff !== null && Math.abs(diff) >= 0.05 && (
                                        <div className={cn('text-[10px] leading-tight',
                                          isGood === null ? 'text-[#6b7280]' : isGood ? 'text-green-400' : 'text-red-400')}>
                                          {diff > 0 ? '+' : ''}{diff.toFixed(1)}
                                        </div>
                                      )}
                                    </div>
                                  ) : <span className="text-[#4b5563]">—</span>}
                                </td>
                              )
                            })}
                            <td className="px-2 py-2.5">
                              <button onClick={() => deleteMetric(m.id)} className="text-[#6b7280] hover:text-red-400">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          )}
        </>
      )}

      {/* ── PERFORMANCE TAB ── */}
      {activeTab === 'performance' && (
        <>
          <div className="mb-4">
            <label className="text-sm text-[#6b7280] mb-1.5 block">Selecciona un ejercicio</label>
            <select value={selectedExercise} onChange={e => setSelectedExercise(e.target.value)}
              className="w-full px-3 py-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-[#f0f0f0] focus:outline-none focus:ring-1 focus:ring-green-500">
              <option value="">-- Elige un ejercicio --</option>
              {exercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
            </select>
          </div>

          {selectedExercise && exerciseData.length > 1 ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="font-medium text-[#f0f0f0]">{exercises.find(e => e.id === selectedExercise)?.name}</p>
                  <div className="flex gap-4 text-xs">
                    <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-green-500 inline-block" />Peso máx.</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-blue-400 inline-block border-dashed border-t" />Vol. mejor serie</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-2">
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={exerciseData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} interval="preserveStartEnd" />
                    <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} domain={['auto', 'auto']} />
                    <Tooltip
                      contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, fontSize: 12 }}
                      formatter={(v: unknown, name: unknown) => [
                        `${v} ${name === 'maxWeight' ? 'kg' : 'kg·rep'}`,
                        name === 'maxWeight' ? 'Peso máx.' : 'Vol. mejor serie',
                      ]}
                    />
                    <Line type="monotone" dataKey="maxWeight" stroke="#22c55e" strokeWidth={2.5}
                      dot={{ fill: '#22c55e', r: 4 }} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="bestVol" stroke="#3b82f6" strokeWidth={2}
                      dot={{ fill: '#3b82f6', r: 3 }} strokeDasharray="5 3" activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: 'Primer registro', value: `${exerciseData[0].maxWeight} kg` },
                    { label: 'Mejor registro', value: `${Math.max(...exerciseData.map(d => d.maxWeight))} kg`, highlight: true },
                    { label: 'Progreso total', value: `+${(exerciseData[exerciseData.length-1].maxWeight - exerciseData[0].maxWeight).toFixed(1)} kg` },
                  ].map(({ label, value, highlight }) => (
                    <div key={label} className="bg-[#0f0f0f] rounded-lg px-3 py-2">
                      <p className="text-xs text-[#6b7280]">{label}</p>
                      <p className={`text-sm font-bold ${highlight ? 'text-green-400' : 'text-[#f0f0f0]'}`}>{value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : selectedExercise ? (
            <Card>
              <CardContent className="text-center py-10 text-[#6b7280] text-sm">
                {exerciseData.length === 0
                  ? 'No hay datos de peso para este ejercicio'
                  : 'Necesitas al menos 2 sesiones para ver la progresión'}
              </CardContent>
            </Card>
          ) : workoutHistory.length === 0 ? (
            <Card>
              <CardContent className="text-center py-10 text-[#6b7280] text-sm">
                Completa entrenamientos para ver tu progreso en ejercicios
              </CardContent>
            </Card>
          ) : null}
        </>
      )}
    </div>
  )
}
