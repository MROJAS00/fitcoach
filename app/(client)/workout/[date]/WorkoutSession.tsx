'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { cn, formatDate } from '@/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { ChevronLeft, CheckCircle, Timer, ChevronDown, ChevronUp, Dumbbell } from 'lucide-react'

type Exercise = { id: string; name: string; muscleGroup: string }
type RoutineExercise = { exerciseId: string; exercise: Exercise; sets: number; reps: string; weight?: string | null; notes?: string | null }
type RoutineDay = { label: string; exercises: RoutineExercise[] }
type SetLog = { id: string; exerciseId: string; setNumber: number; weight: number | null; reps: number | null; completed: boolean }
type WorkoutLog = { id: string; completed: boolean; sets: SetLog[] }

interface Props {
  date: string
  routineDay: RoutineDay
  existingLog: WorkoutLog | null
}

export function WorkoutSession({ date, routineDay, existingLog }: Props) {
  const router = useRouter()
  const [log, setLog] = useState<WorkoutLog | null>(existingLog)
  const [starting, setStarting] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [expandedEx, setExpandedEx] = useState<string | null>(routineDay.exercises[0]?.exerciseId ?? null)
  const [restTimer, setRestTimer] = useState<number | null>(null)
  const [savingSet, setSavingSet] = useState<string | null>(null)

  // Rest timer countdown
  useEffect(() => {
    if (restTimer === null || restTimer <= 0) return
    const t = setTimeout(() => setRestTimer(r => (r ?? 1) - 1), 1000)
    return () => clearTimeout(t)
  }, [restTimer])

  async function startWorkout() {
    setStarting(true)
    const res = await fetch('/api/workout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date }),
    })
    const data = await res.json()
    setLog(data)
    setStarting(false)
  }

  function getSetLog(exerciseId: string, setNumber: number): SetLog | undefined {
    return log?.sets.find(s => s.exerciseId === exerciseId && s.setNumber === setNumber)
  }

  async function logSet(exerciseId: string, setNumber: number, weight: string, reps: string) {
    if (!log) return
    const key = `${exerciseId}-${setNumber}`
    setSavingSet(key)

    const existing = getSetLog(exerciseId, setNumber)
    const w = parseFloat(weight) || null
    const r = parseInt(reps) || null

    let newSet: SetLog

    if (existing) {
      const res = await fetch('/api/workout/sets', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setId: existing.id, weight: w, reps: r, completed: true }),
      })
      newSet = await res.json()
    } else {
      const res = await fetch('/api/workout/sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workoutLogId: log.id, exerciseId, setNumber, weight: w, reps: r }),
      })
      newSet = await res.json()
    }

    setLog(prev => {
      if (!prev) return prev
      const filtered = prev.sets.filter(s => !(s.exerciseId === exerciseId && s.setNumber === setNumber))
      return { ...prev, sets: [...filtered, newSet] }
    })

    setRestTimer(90)
    setSavingSet(null)

    // Auto-advance to next exercise if all sets done
    const exSets = routineDay.exercises.find(e => e.exerciseId === exerciseId)?.sets ?? 0
    const completedForEx = log.sets.filter(s => s.exerciseId === exerciseId && s.completed).length
    if (completedForEx + 1 >= exSets) {
      const idx = routineDay.exercises.findIndex(e => e.exerciseId === exerciseId)
      if (idx < routineDay.exercises.length - 1) {
        setTimeout(() => setExpandedEx(routineDay.exercises[idx + 1].exerciseId), 300)
      }
    }
  }

  async function completeWorkout() {
    if (!log) return
    setCompleting(true)
    await fetch('/api/workout/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workoutLogId: log.id }),
    })
    setLog(prev => prev ? { ...prev, completed: true } : prev)
    setCompleting(false)
  }

  const totalSets = routineDay.exercises.reduce((acc, ex) => acc + ex.sets, 0)
  const completedSets = log?.sets.filter(s => s.completed).length ?? 0
  const progress = totalSets > 0 ? (completedSets / totalSets) * 100 : 0

  if (!log) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-sm w-full">
          <div className="w-16 h-16 rounded-2xl bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-8 h-8 text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-[#f0f0f0] mb-1">{routineDay.label}</h2>
          <p className="text-[#6b7280] text-sm mb-2">{formatDate(new Date(date + 'T12:00:00'))}</p>
          <p className="text-[#9ca3af] text-sm mb-6">{routineDay.exercises.length} ejercicios · {totalSets} series</p>
          <Button onClick={startWorkout} loading={starting} size="lg" className="w-full">
            Empezar entrenamiento
          </Button>
          <button onClick={() => router.back()} className="mt-4 text-sm text-[#6b7280] hover:text-[#9ca3af]">
            Volver
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.back()} className="text-[#6b7280] hover:text-[#f0f0f0]">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-[#f0f0f0]">{routineDay.label}</h1>
            {log.completed && <Badge variant="success"><CheckCircle className="w-3 h-3 mr-1" />Completado</Badge>}
          </div>
          <p className="text-xs text-[#6b7280]">{formatDate(new Date(date + 'T12:00:00'))}</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-[#6b7280] mb-1.5">
          <span>{completedSets}/{totalSets} series</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-1.5 bg-[#2a2a2a] rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Rest timer */}
      {restTimer !== null && restTimer > 0 && (
        <div className="mb-4 bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-blue-400" />
            <span className="text-sm text-blue-300 font-medium">Descanso</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-mono font-bold text-blue-300">
              {Math.floor(restTimer / 60)}:{String(restTimer % 60).padStart(2, '0')}
            </span>
            <button onClick={() => setRestTimer(null)} className="text-xs text-blue-400 hover:text-blue-300">
              Saltar
            </button>
          </div>
        </div>
      )}

      {/* Exercises */}
      <div className="space-y-3">
        {routineDay.exercises.map((ex, _idx) => {
          const completedForEx = log.sets.filter(s => s.exerciseId === ex.exerciseId && s.completed).length
          const isExpanded = expandedEx === ex.exerciseId
          const allDone = completedForEx >= ex.sets

          return (
            <Card key={ex.exerciseId} className={cn(allDone && 'opacity-80')}>
              <button
                className="w-full flex items-center justify-between px-5 py-3"
                onClick={() => setExpandedEx(isExpanded ? null : ex.exerciseId)}
              >
                <div className="flex items-center gap-3 text-left">
                  <div className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                    allDone ? 'bg-green-500 text-white' : 'bg-[#2a2a2a] text-[#9ca3af]'
                  )}>
                    {allDone ? '✓' : _idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#f0f0f0]">{ex.exercise.name}</p>
                    <p className="text-xs text-[#6b7280]">{ex.sets} series · {ex.reps} reps {ex.weight ? `· ${ex.weight}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#6b7280]">{completedForEx}/{ex.sets}</span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-[#6b7280]" /> : <ChevronDown className="w-4 h-4 text-[#6b7280]" />}
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-[#2a2a2a] px-5 py-4">
                  {ex.notes && (
                    <p className="text-xs text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 mb-4">
                      💡 {ex.notes}
                    </p>
                  )}

                  {/* Column headers */}
                  <div className="grid grid-cols-4 gap-2 mb-2 text-xs text-[#6b7280] px-1">
                    <span>Serie</span>
                    <span className="text-center">Objetivo</span>
                    <span className="text-center">Peso (kg)</span>
                    <span className="text-center">Reps</span>
                  </div>

                  {/* Set rows */}
                  {Array.from({ length: ex.sets }, (_, i) => {
                    const setNum = i + 1
                    const setLog = getSetLog(ex.exerciseId, setNum)
                    const key = `${ex.exerciseId}-${setNum}`
                    const isSaving = savingSet === key

                    return (
                      <SetRow
                        key={setNum}
                        setNumber={setNum}
                        target={`${ex.reps}`}
                        existing={setLog}
                        disabled={log.completed}
                        saving={isSaving}
                        onSave={(weight, reps) => logSet(ex.exerciseId, setNum, weight, reps)}
                      />
                    )
                  })}
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Complete button */}
      {!log.completed && progress > 0 && (
        <div className="mt-6 pb-4">
          <Button
            onClick={completeWorkout}
            loading={completing}
            size="lg"
            className="w-full"
            variant={progress >= 100 ? 'primary' : 'secondary'}
          >
            <CheckCircle className="w-4 h-4" />
            {progress >= 100 ? 'Finalizar entrenamiento' : `Finalizar (${Math.round(progress)}% completado)`}
          </Button>
        </div>
      )}

      {log.completed && (
        <div className="mt-6 text-center">
          <p className="text-green-400 font-medium mb-1">¡Entrenamiento completado! 💪</p>
          <button onClick={() => router.push('/dashboard')} className="text-sm text-[#6b7280] hover:text-[#9ca3af]">
            Volver al inicio
          </button>
        </div>
      )}
    </div>
  )
}

function SetRow({ setNumber, target, existing, disabled, saving, onSave }: {
  setNumber: number
  target: string
  existing?: SetLog
  disabled?: boolean
  saving?: boolean
  onSave: (weight: string, reps: string) => void
}) {
  const [weight, setWeight] = useState(existing?.weight?.toString() ?? '')
  const [reps, setReps] = useState(existing?.reps?.toString() ?? '')
  const done = existing?.completed

  return (
    <div className={cn(
      'grid grid-cols-4 gap-2 items-center py-1.5',
      done && 'opacity-70'
    )}>
      <div className={cn(
        'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold',
        done ? 'bg-green-500/20 text-green-400' : 'bg-[#2a2a2a] text-[#9ca3af]'
      )}>
        {done ? '✓' : setNumber}
      </div>
      <p className="text-xs text-[#6b7280] text-center">{target}</p>
      <input
        type="number"
        inputMode="decimal"
        step="0.5"
        min="0"
        value={weight}
        onChange={e => setWeight(e.target.value)}
        disabled={disabled}
        placeholder={existing?.weight?.toString() ?? '0'}
        className="w-full px-2 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-center text-[#f0f0f0] focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-50"
      />
      <div className="flex gap-1">
        <input
          type="number"
          inputMode="numeric"
          min="0"
          value={reps}
          onChange={e => setReps(e.target.value)}
          disabled={disabled}
          placeholder={existing?.reps?.toString() ?? '0'}
          className="w-full px-2 py-1.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-sm text-center text-[#f0f0f0] focus:outline-none focus:ring-1 focus:ring-green-500 disabled:opacity-50"
          onKeyDown={e => {
            if (e.key === 'Enter') onSave(weight, reps)
          }}
        />
        <button
          onClick={() => onSave(weight, reps)}
          disabled={disabled || saving || (!weight && !reps)}
          className={cn(
            'w-8 h-8 rounded-lg flex items-center justify-center transition-colors shrink-0',
            done ? 'bg-green-500/20 text-green-400' : 'bg-green-500 text-white hover:bg-green-600',
            (disabled || saving || (!weight && !reps)) && 'opacity-50 cursor-not-allowed'
          )}
        >
          {saving ? (
            <svg className="animate-spin w-3 h-3" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : '✓'}
        </button>
      </div>
    </div>
  )
}
