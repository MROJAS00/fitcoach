'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { DAY_LABELS, DAYS_ORDER, MUSCLE_LABELS, cn } from '@/lib/utils'
import { Plus, Trash2, Search, ChevronLeft, GripVertical, Save } from 'lucide-react'

type Exercise = { id: string; name: string; muscleGroup: string; category: string }
type RoutineExercise = { exerciseId: string; exercise: Exercise; order: number; sets: number; reps: string; weight?: string | null; notes?: string | null }
type RoutineDay = { dayOfWeek: string; label: string; exercises: RoutineExercise[] }

interface Props {
  client: { id: string; name: string; email: string }
  exercises: Exercise[]
  initialRoutine: { id: string; name: string; days: RoutineDay[] } | null
}

export function RoutineBuilder({ client, exercises, initialRoutine }: Props) {
  const router = useRouter()
  const [routineName, setRoutineName] = useState(initialRoutine?.name ?? 'Rutina principal')
  const [days, setDays] = useState<RoutineDay[]>(
    initialRoutine?.days ?? []
  )
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [exerciseSearch, setExerciseSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const activeDays = useMemo(() => days.map(d => d.dayOfWeek), [days])

  const filteredExercises = useMemo(() => {
    const q = exerciseSearch.toLowerCase()
    return exercises.filter(ex =>
      ex.name.toLowerCase().includes(q) ||
      MUSCLE_LABELS[ex.muscleGroup]?.toLowerCase().includes(q)
    )
  }, [exercises, exerciseSearch])

  function toggleDay(day: string) {
    if (activeDays.includes(day)) {
      setDays(prev => prev.filter(d => d.dayOfWeek !== day))
      if (selectedDay === day) setSelectedDay(null)
    } else {
      const newDay: RoutineDay = { dayOfWeek: day, label: getDayDefaultLabel(day), exercises: [] }
      setDays(prev => [...prev, newDay].sort((a, b) => DAYS_ORDER.indexOf(a.dayOfWeek) - DAYS_ORDER.indexOf(b.dayOfWeek)))
      setSelectedDay(day)
    }
  }

  function getDayDefaultLabel(day: string) {
    const labels: Record<string, string> = {
      MONDAY: 'Push', TUESDAY: 'Pull', WEDNESDAY: 'Pierna',
      THURSDAY: 'Push', FRIDAY: 'Pull', SATURDAY: 'Pierna', SUNDAY: 'Descanso'
    }
    return labels[day] ?? 'Entrenamiento'
  }

  function updateDayLabel(day: string, label: string) {
    setDays(prev => prev.map(d => d.dayOfWeek === day ? { ...d, label } : d))
  }

  function addExercise(ex: Exercise) {
    if (!selectedDay) return
    setDays(prev => prev.map(d => {
      if (d.dayOfWeek !== selectedDay) return d
      const exists = d.exercises.find(e => e.exerciseId === ex.id)
      if (exists) return d
      return {
        ...d,
        exercises: [...d.exercises, {
          exerciseId: ex.id,
          exercise: ex,
          order: d.exercises.length,
          sets: 3,
          reps: '8-12',
          weight: '',
          notes: '',
        }]
      }
    }))
  }

  function removeExercise(day: string, exerciseId: string) {
    setDays(prev => prev.map(d => {
      if (d.dayOfWeek !== day) return d
      return { ...d, exercises: d.exercises.filter(e => e.exerciseId !== exerciseId) }
    }))
  }

  function updateExercise(day: string, exerciseId: string, field: string, value: string | number) {
    setDays(prev => prev.map(d => {
      if (d.dayOfWeek !== day) return d
      return {
        ...d,
        exercises: d.exercises.map(e =>
          e.exerciseId === exerciseId ? { ...e, [field]: value } : e
        )
      }
    }))
  }

  async function save() {
    setSaving(true)
    await fetch('/api/routines', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientId: client.id,
        name: routineName,
        days: days.map((d, _i) => ({
          dayOfWeek: d.dayOfWeek,
          label: d.label,
          exercises: d.exercises.map((e, i) => ({
            exerciseId: e.exerciseId,
            order: i,
            sets: e.sets,
            reps: e.reps,
            weight: e.weight || null,
            notes: e.notes || null,
          })),
        })),
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    router.refresh()
  }

  const currentDay = days.find(d => d.dayOfWeek === selectedDay)

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-[#6b7280] hover:text-[#f0f0f0] transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-[#f0f0f0]">Rutina de {client.name}</h1>
          <p className="text-[#6b7280] text-sm">{client.email}</p>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Routine name */}
        <div className="flex gap-3 items-end">
          <Input label="Nombre de la rutina" value={routineName} onChange={e => setRoutineName(e.target.value)} className="max-w-xs" />
          <Button onClick={save} loading={saving} variant={saved ? 'secondary' : 'primary'}>
            <Save className="w-4 h-4" />
            {saved ? '¡Guardado!' : 'Guardar rutina'}
          </Button>
        </div>

        {/* Day selector */}
        <Card>
          <CardHeader>
            <p className="text-sm font-medium text-[#f0f0f0]">Días de entrenamiento</p>
            <p className="text-xs text-[#6b7280] mt-0.5">Selecciona los días y luego añade ejercicios</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {DAYS_ORDER.map(day => (
                <button
                  key={day}
                  onClick={() => activeDays.includes(day) ? setSelectedDay(day) : toggleDay(day)}
                  onDoubleClick={() => activeDays.includes(day) && toggleDay(day)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border',
                    activeDays.includes(day)
                      ? selectedDay === day
                        ? 'bg-green-500 text-white border-green-500'
                        : 'bg-green-500/15 text-green-400 border-green-500/30 hover:bg-green-500/25'
                      : 'bg-[#1a1a1a] text-[#6b7280] border-[#2a2a2a] hover:border-[#3a3a3a] hover:text-[#9ca3af]'
                  )}
                  title={activeDays.includes(day) ? 'Click para seleccionar, doble click para quitar' : 'Click para añadir'}
                >
                  {DAY_LABELS[day]}
                  {activeDays.includes(day) && (
                    <span className="ml-1.5 text-xs opacity-70">
                      {days.find(d => d.dayOfWeek === day)?.exercises.length ?? 0}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Day editor */}
        {selectedDay && currentDay && (
          <div className="grid md:grid-cols-2 gap-4">
            {/* Exercise picker */}
            <Card>
              <CardHeader>
                <p className="text-sm font-medium text-[#f0f0f0]">Añadir ejercicios</p>
              </CardHeader>
              <CardContent className="pt-3">
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6b7280]" />
                  <input
                    type="text"
                    placeholder="Buscar ejercicio o músculo..."
                    value={exerciseSearch}
                    onChange={e => setExerciseSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-sm text-[#f0f0f0] placeholder-[#6b7280] focus:outline-none focus:ring-1 focus:ring-green-500"
                  />
                </div>
                <div className="space-y-1 max-h-72 overflow-y-auto">
                  {filteredExercises.map(ex => {
                    const added = currentDay.exercises.some(e => e.exerciseId === ex.id)
                    return (
                      <button
                        key={ex.id}
                        onClick={() => addExercise(ex)}
                        disabled={added}
                        className={cn(
                          'w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition-colors',
                          added
                            ? 'bg-green-500/10 text-green-400 cursor-default'
                            : 'hover:bg-[#1f1f1f] text-[#f0f0f0]'
                        )}
                      >
                        <span className="truncate">{ex.name}</span>
                        <span className="shrink-0 text-xs text-[#6b7280] ml-2">{MUSCLE_LABELS[ex.muscleGroup]}</span>
                      </button>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Day exercises editor */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#f0f0f0]">{DAY_LABELS[selectedDay]}</p>
                  </div>
                  <Input
                    value={currentDay.label}
                    onChange={e => updateDayLabel(selectedDay, e.target.value)}
                    placeholder="Label (Push, Pull, Legs...)"
                    className="w-36 text-xs"
                  />
                </div>
              </CardHeader>
              <CardContent className="pt-3">
                {currentDay.exercises.length === 0 ? (
                  <p className="text-[#6b7280] text-sm text-center py-6">Añade ejercicios desde la lista</p>
                ) : (
                  <div className="space-y-3">
                    {currentDay.exercises.map(ex => (
                      <div key={ex.exerciseId} className="bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-[#f0f0f0] truncate">{ex.exercise.name}</span>
                          <button
                            onClick={() => removeExercise(selectedDay, ex.exerciseId)}
                            className="text-[#6b7280] hover:text-red-400 transition-colors ml-2"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="text-xs text-[#6b7280] mb-1 block">Series</label>
                            <input
                              type="number"
                              min={1}
                              max={10}
                              value={ex.sets}
                              onChange={e => updateExercise(selectedDay, ex.exerciseId, 'sets', parseInt(e.target.value) || 1)}
                              className="w-full px-2 py-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded text-sm text-center text-[#f0f0f0] focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-[#6b7280] mb-1 block">Reps</label>
                            <input
                              type="text"
                              value={ex.reps}
                              onChange={e => updateExercise(selectedDay, ex.exerciseId, 'reps', e.target.value)}
                              placeholder="8-12"
                              className="w-full px-2 py-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded text-sm text-center text-[#f0f0f0] focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-[#6b7280] mb-1 block">Peso</label>
                            <input
                              type="text"
                              value={ex.weight ?? ''}
                              onChange={e => updateExercise(selectedDay, ex.exerciseId, 'weight', e.target.value)}
                              placeholder="RPE8"
                              className="w-full px-2 py-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded text-sm text-center text-[#f0f0f0] focus:outline-none focus:ring-1 focus:ring-green-500"
                            />
                          </div>
                        </div>
                        <div className="mt-2">
                          <input
                            type="text"
                            value={ex.notes ?? ''}
                            onChange={e => updateExercise(selectedDay, ex.exerciseId, 'notes', e.target.value)}
                            placeholder="Notas (tempo, pausa, técnica...)"
                            className="w-full px-2 py-1 bg-[#1a1a1a] border border-[#2a2a2a] rounded text-xs text-[#9ca3af] focus:outline-none focus:ring-1 focus:ring-green-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {!selectedDay && days.length > 0 && (
          <p className="text-[#6b7280] text-sm text-center py-4">Selecciona un día para editar sus ejercicios</p>
        )}
      </div>
    </div>
  )
}
