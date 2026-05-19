'use client'
import { useState } from 'react'
import { cn, formatDate, toISODate, MUSCLE_LABELS } from '@/lib/utils'
import { ClientAnalytics } from './ClientAnalytics'
import { ClientEvolutionCharts } from './ClientEvolutionCharts'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { BarChart2, History, Scale } from 'lucide-react'

type Exercise = { id: string; name: string; muscleGroup: string }
type WorkoutSet = {
  exerciseId: string; exercise: Exercise
  weight: number | null; reps: number | null; setNumber: number; completed: boolean
}
type WorkoutLog = { date: Date | string; sets: WorkoutSet[]; completed: boolean }
type Metric = {
  id: string; date: Date | string
  weight?: number | null; bodyFat?: number | null; waist?: number | null
  chest?: number | null; hips?: number | null; leftArm?: number | null; rightArm?: number | null
  leftThigh?: number | null; rightThigh?: number | null; notes?: string | null
}

interface Props {
  clientId: string
  workoutLogs: WorkoutLog[]
  metrics: Metric[]
  initialNotes: string | null
}

function toISO(d: Date | string) {
  const date = typeof d === 'string' ? new Date(d) : d
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

const METRIC_NAMES: Record<string, string> = {
  weight: 'Peso', bodyFat: '% Grasa', waist: 'Cintura', chest: 'Pecho',
  hips: 'Cadera', leftArm: 'Brazo Izq', rightArm: 'Brazo Der', leftThigh: 'Muslo Izq', rightThigh: 'Muslo Der',
}

const TABS = [
  { key: 'analytics', label: 'Análisis', icon: BarChart2 },
  { key: 'history', label: 'Historial', icon: History },
  { key: 'metrics', label: 'Medidas', icon: Scale },
]

export function ClientTabView({ clientId, workoutLogs, metrics, initialNotes }: Props) {
  const [tab, setTab] = useState<'analytics' | 'history' | 'metrics'>('analytics')

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-1 mb-4">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key as typeof tab)}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-colors',
              tab === key ? 'bg-[#2a2a2a] text-[#f0f0f0]' : 'text-[#6b7280] hover:text-[#9ca3af]'
            )}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Analytics tab */}
      {tab === 'analytics' && (
        <>
          {metrics.length > 1 && (
            <div className="mb-4">
              <ClientEvolutionCharts metrics={metrics} workoutLogs={workoutLogs} />
            </div>
          )}
          <ClientAnalytics clientId={clientId} workoutLogs={workoutLogs} initialNotes={initialNotes} />
        </>
      )}

      {/* History tab */}
      {tab === 'history' && (
        <Card>
          <CardHeader>
            <p className="font-semibold text-[#f0f0f0]">Historial de entrenamientos</p>
          </CardHeader>
          {workoutLogs.length === 0 ? (
            <CardContent>
              <p className="text-[#6b7280] text-sm text-center py-6">El cliente aún no ha registrado ningún entrenamiento.</p>
            </CardContent>
          ) : (
            <div className="divide-y divide-[#2a2a2a]">
              {workoutLogs.map(log => {
                const byExercise = log.sets.reduce<Record<string, { name: string; sets: WorkoutSet[] }>>((acc, s) => {
                  if (!acc[s.exerciseId]) acc[s.exerciseId] = { name: s.exercise.name, sets: [] }
                  acc[s.exerciseId].sets.push(s)
                  return acc
                }, {})

                return (
                  <div key={toISO(log.date)} className="px-5 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-medium text-[#f0f0f0]">{formatDate(new Date(toISO(log.date) + 'T12:00:00'))}</p>
                        <p className="text-xs text-[#6b7280]">{log.sets.length} series registradas</p>
                      </div>
                      <Badge variant={log.completed ? 'success' : 'warning'}>
                        {log.completed ? 'Completado' : 'En progreso'}
                      </Badge>
                    </div>
                    {Object.values(byExercise).length > 0 && (
                      <div className="space-y-2">
                        {Object.values(byExercise).map(({ name, sets }) => {
                          const maxWeight = Math.max(...sets.map(s => s.weight ?? 0))
                          const totalVol = sets.reduce((acc, s) => acc + (s.weight ?? 0) * (s.reps ?? 0), 0)
                          return (
                            <div key={name} className="bg-[#0f0f0f] rounded-lg px-3 py-2">
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-sm text-[#d1d5db] font-medium">{name}</span>
                                <span className="text-xs text-[#6b7280]">{sets.length} series</span>
                              </div>
                              <div className="flex flex-wrap gap-1.5">
                                {sets.map(s => (
                                  <span key={s.setNumber} className="text-xs px-2 py-0.5 rounded bg-green-500/10 text-green-400">
                                    {s.weight ? `${s.weight}kg` : '—'} × {s.reps ?? '—'}
                                  </span>
                                ))}
                              </div>
                              <p className="text-xs text-[#6b7280] mt-1">
                                Máx: {maxWeight > 0 ? `${maxWeight} kg` : '—'} · Vol: {totalVol > 0 ? `${Math.round(totalVol).toLocaleString()} kg` : '—'}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      )}

      {/* Metrics tab */}
      {tab === 'metrics' && (
        <Card>
          <CardHeader>
            <p className="font-semibold text-[#f0f0f0]">Historial de medidas corporales</p>
          </CardHeader>
          {metrics.length === 0 ? (
            <CardContent>
              <p className="text-[#6b7280] text-sm text-center py-6">El cliente aún no ha registrado ninguna medida.</p>
            </CardContent>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[520px]">
                <thead>
                  <tr className="border-b border-[#2a2a2a]">
                    <th className="text-left px-5 py-2.5 text-[#6b7280] font-medium">Fecha</th>
                    {['weight', 'bodyFat', 'waist', 'chest', 'hips', 'leftArm', 'leftThigh'].map(k => (
                      <th key={k} className="text-center px-3 py-2.5 text-[#6b7280] font-medium">{METRIC_NAMES[k]}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f1f1f]">
                  {[...metrics].reverse().map(m => (
                    <tr key={m.id} className="hover:bg-[#1f1f1f]">
                      <td className="px-5 py-2.5 text-[#d1d5db]">{formatDate(new Date(toISO(m.date) + 'T12:00:00'))}</td>
                      {['weight', 'bodyFat', 'waist', 'chest', 'hips', 'leftArm', 'leftThigh'].map(k => {
                        const v = (m as Record<string, unknown>)[k] as number | null
                        return (
                          <td key={k} className="px-3 py-2.5 text-center text-[#9ca3af]">
                            {v != null ? v : '—'}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  )
}
