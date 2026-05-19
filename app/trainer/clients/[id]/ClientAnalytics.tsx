'use client'
import { useState, useMemo } from 'react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatDate, MUSCLE_LABELS, cn } from '@/lib/utils'
import { Trophy, Flame, Save, StickyNote } from 'lucide-react'

type Exercise = { id: string; name: string; muscleGroup: string }
type WorkoutSet = {
  exerciseId: string
  exercise: Exercise
  weight: number | null
  reps: number | null
  setNumber: number
  completed: boolean
}
type WorkoutLog = { date: Date | string; sets: WorkoutSet[]; completed: boolean }

interface Props {
  clientId: string
  workoutLogs: WorkoutLog[]
  initialNotes: string | null
}

function toISO(d: Date | string) {
  const date = typeof d === 'string' ? new Date(d) : d
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

const MUSCLE_COLORS: Record<string, string> = {
  CHEST: '#3b82f6', BACK: '#8b5cf6', SHOULDERS: '#f59e0b',
  BICEPS: '#06b6d4', TRICEPS: '#ec4899', QUADRICEPS: '#22c55e',
  HAMSTRINGS: '#f97316', GLUTES: '#a855f7', CALVES: '#14b8a6',
  CORE: '#ef4444', FULL_BODY: '#6b7280',
}

export function ClientAnalytics({ clientId, workoutLogs, initialNotes }: Props) {
  const [selectedExercise, setSelectedExercise] = useState('')
  const [notes, setNotes] = useState(initialNotes ?? '')
  const [savingNotes, setSavingNotes] = useState(false)
  const [notesSaved, setNotesSaved] = useState(false)

  // All unique exercises with data
  const exercises = useMemo(() => {
    const map = new Map<string, Exercise>()
    for (const log of workoutLogs) {
      for (const s of log.sets) {
        if (s.weight && !map.has(s.exerciseId)) map.set(s.exerciseId, s.exercise)
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [workoutLogs])

  // Exercise progression chart
  const exerciseData = useMemo(() => {
    if (!selectedExercise) return []
    return workoutLogs
      .filter(l => l.sets.some(s => s.exerciseId === selectedExercise && s.weight))
      .map(l => {
        const sets = l.sets.filter(s => s.exerciseId === selectedExercise && s.weight)
        const maxWeight = Math.max(...sets.map(s => s.weight ?? 0))
        const bestVol = Math.max(...sets.map(s => (s.weight ?? 0) * (s.reps ?? 0)))
        return {
          label: formatDate(new Date(toISO(l.date) + 'T12:00:00')),
          maxWeight,
          bestVol: Math.round(bestVol),
        }
      })
      .filter(d => d.maxWeight > 0)
  }, [workoutLogs, selectedExercise])

  // Personal records per exercise
  const prs = useMemo(() => {
    const map = new Map<string, { name: string; weight: number; reps: number; date: string; vol: number }>()
    for (const log of workoutLogs) {
      for (const s of log.sets) {
        if (!s.weight || !s.completed) continue
        const vol = s.weight * (s.reps ?? 1)
        const existing = map.get(s.exerciseId)
        if (!existing || s.weight > existing.weight) {
          map.set(s.exerciseId, {
            name: s.exercise.name,
            weight: s.weight,
            reps: s.reps ?? 0,
            date: toISO(log.date),
            vol: Math.round(vol),
          })
        }
      }
    }
    return Array.from(map.values())
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 10)
  }, [workoutLogs])

  // Muscle group volume this month
  const muscleVolume = useMemo(() => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const vol: Record<string, number> = {}
    for (const log of workoutLogs) {
      const d = new Date(toISO(log.date) + 'T12:00:00')
      if (d < monthStart) continue
      for (const s of log.sets) {
        if (!s.weight || !s.completed) continue
        const mg = s.exercise.muscleGroup
        vol[mg] = (vol[mg] ?? 0) + s.weight * (s.reps ?? 1)
      }
    }
    return Object.entries(vol)
      .map(([mg, volume]) => ({ mg, label: MUSCLE_LABELS[mg] ?? mg, volume: Math.round(volume) }))
      .sort((a, b) => b.volume - a.volume)
  }, [workoutLogs])

  // Consistency heatmap — 12 weeks
  const heatmap = useMemo(() => {
    const completedDates = new Set(
      workoutLogs.filter(l => l.completed).map(l => toISO(l.date))
    )
    const today = new Date()
    const cells: { date: string; active: boolean; week: number; dow: number }[] = []
    for (let i = 83; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const iso = toISO(d)
      const dow = (d.getDay() + 6) % 7
      const week = Math.floor((83 - i) / 7)
      cells.push({ date: iso, active: completedDates.has(iso), week, dow })
    }
    return cells
  }, [workoutLogs])

  const streak = useMemo(() => {
    const completedDates = new Set(workoutLogs.filter(l => l.completed).map(l => toISO(l.date)))
    let count = 0
    const today = new Date()
    for (let i = 0; i < 60; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      if (completedDates.has(toISO(d))) count++
      else if (i > 0) break
    }
    return count
  }, [workoutLogs])

  const totalThisMonth = useMemo(() => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    return workoutLogs.filter(l => l.completed && new Date(toISO(l.date) + 'T12:00:00') >= monthStart).length
  }, [workoutLogs])

  async function saveNotes() {
    setSavingNotes(true)
    await fetch(`/api/users/${clientId}/notes`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trainerNotes: notes }),
    })
    setSavingNotes(false)
    setNotesSaved(true)
    setTimeout(() => setNotesSaved(false), 2000)
  }

  return (
    <div className="space-y-4">
      {/* Consistency heatmap */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" />
              <p className="font-semibold text-[#f0f0f0]">Consistencia — últimas 12 semanas</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-[#6b7280]">
              {streak > 0 && (
                <span className="text-orange-400 font-medium">🔥 {streak} día{streak !== 1 ? 's' : ''} seguidos</span>
              )}
              <span>{totalThisMonth} entrenos este mes</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-1 flex-wrap">
            {Array.from({ length: 12 }, (_, w) => (
              <div key={w} className="flex flex-col gap-1">
                {Array.from({ length: 7 }, (_, d) => {
                  const cell = heatmap.find(c => c.week === w && c.dow === d)
                  if (!cell) return <div key={d} className="w-3 h-3" />
                  return (
                    <div
                      key={d}
                      title={cell.date}
                      className={cn(
                        'w-3 h-3 rounded-sm transition-colors',
                        cell.active ? 'bg-green-500' : 'bg-[#2a2a2a]'
                      )}
                    />
                  )
                })}
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-[#6b7280]">
            <span>Menos</span>
            <div className="w-3 h-3 rounded-sm bg-[#2a2a2a]" />
            <div className="w-3 h-3 rounded-sm bg-green-500/40" />
            <div className="w-3 h-3 rounded-sm bg-green-500" />
            <span>Más</span>
          </div>
        </CardContent>
      </Card>

      {/* Muscle group volume */}
      {muscleVolume.length > 0 && (
        <Card>
          <CardHeader>
            <p className="font-semibold text-[#f0f0f0]">Volumen por grupo muscular este mes</p>
            <p className="text-xs text-[#6b7280] mt-0.5">kg totales (series × reps × peso)</p>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={muscleVolume} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
                <Tooltip
                  contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, fontSize: 12 }}
                  formatter={(v: unknown) => [`${Number(v).toLocaleString()} kg`, 'Volumen']}
                />
                <Bar dataKey="volume" radius={[4, 4, 0, 0]}>
                  {muscleVolume.map(entry => (
                    <Cell key={entry.mg} fill={MUSCLE_COLORS[entry.mg] ?? '#6b7280'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Exercise progression */}
      <Card>
        <CardHeader>
          <p className="font-semibold text-[#f0f0f0]">Progresión en ejercicio</p>
        </CardHeader>
        <CardContent>
          <select
            value={selectedExercise}
            onChange={e => setSelectedExercise(e.target.value)}
            className="w-full px-3 py-2 mb-4 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-sm text-[#f0f0f0] focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            <option value="">-- Selecciona un ejercicio --</option>
            {exercises.map(ex => (
              <option key={ex.id} value={ex.id}>{ex.name}</option>
            ))}
          </select>

          {selectedExercise && exerciseData.length > 1 ? (
            <ResponsiveContainer width="100%" height={200}>
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
                <Line type="monotone" dataKey="maxWeight" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 3 }} name="maxWeight" />
                <Line type="monotone" dataKey="bestVol" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} strokeDasharray="4 2" name="bestVol" />
              </LineChart>
            </ResponsiveContainer>
          ) : selectedExercise ? (
            <p className="text-center text-sm text-[#6b7280] py-6">Necesita al menos 2 sesiones con este ejercicio para ver el gráfico.</p>
          ) : (
            <p className="text-center text-sm text-[#6b7280] py-6">Selecciona un ejercicio para ver su progresión.</p>
          )}
        </CardContent>
      </Card>

      {/* Personal records */}
      {prs.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-400" />
              <p className="font-semibold text-[#f0f0f0]">Records personales (top 10 por peso)</p>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[420px]">
              <thead>
                <tr className="border-b border-[#2a2a2a]">
                  <th className="text-left px-5 py-2 text-xs text-[#6b7280] font-medium">Ejercicio</th>
                  <th className="text-center px-3 py-2 text-xs text-[#6b7280] font-medium">Peso</th>
                  <th className="text-center px-3 py-2 text-xs text-[#6b7280] font-medium">Reps</th>
                  <th className="text-center px-3 py-2 text-xs text-[#6b7280] font-medium">Vol.</th>
                  <th className="text-right px-5 py-2 text-xs text-[#6b7280] font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f1f1f]">
                {prs.map((pr, i) => (
                  <tr key={pr.name} className="hover:bg-[#1f1f1f]">
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-2">
                        {i === 0 && <span title="Mejor PR">🥇</span>}
                        {i === 1 && <span title="2º PR">🥈</span>}
                        {i === 2 && <span title="3º PR">🥉</span>}
                        <span className="text-[#d1d5db] truncate max-w-[160px]">{pr.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center font-bold text-green-400">{pr.weight} kg</td>
                    <td className="px-3 py-2.5 text-center text-[#9ca3af]">×{pr.reps}</td>
                    <td className="px-3 py-2.5 text-center text-[#6b7280] text-xs">{pr.vol} kg</td>
                    <td className="px-5 py-2.5 text-right text-xs text-[#6b7280]">
                      {formatDate(new Date(pr.date + 'T12:00:00'))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Trainer notes */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <StickyNote className="w-4 h-4 text-yellow-400" />
            <p className="font-semibold text-[#f0f0f0]">Notas del entrenador</p>
            <span className="text-xs text-[#6b7280]">(solo tú las ves)</span>
          </div>
        </CardHeader>
        <CardContent>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Anota observaciones, lesiones, objetivos, ajustes de dieta, respuesta al entrenamiento..."
            rows={5}
            className="w-full px-3 py-2.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-sm text-[#f0f0f0] placeholder-[#6b7280] focus:outline-none focus:ring-1 focus:ring-green-500 resize-none"
          />
          <div className="flex justify-end mt-2">
            <Button size="sm" onClick={saveNotes} loading={savingNotes} variant={notesSaved ? 'secondary' : 'primary'}>
              <Save className="w-3.5 h-3.5" />
              {notesSaved ? '¡Guardado!' : 'Guardar notas'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
