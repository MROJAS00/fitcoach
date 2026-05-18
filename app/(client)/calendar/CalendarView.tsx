'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn, DAY_LABELS, DAYS_ORDER, getDayOfWeek } from '@/lib/utils'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'

interface Routine {
  days: { dayOfWeek: string; label: string }[]
  overrides: { id: string; date: Date | string; label: string }[]
}

interface Props {
  routine: Routine | null
  completedDates: string[]
  startedDates: string[]
  today: string
}

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const DOW_HEADER = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

export function CalendarView({ routine, completedDates, startedDates, today }: Props) {
  const todayDate = new Date(today + 'T12:00:00')
  const [year, setYear] = useState(todayDate.getFullYear())
  const [month, setMonth] = useState(todayDate.getMonth())

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const startDow = (firstDay.getDay() + 6) % 7 // Monday=0

  const days: (Date | null)[] = []
  for (let i = 0; i < startDow; i++) days.push(null)
  for (let d = 1; d <= lastDay.getDate(); d++) days.push(new Date(year, month, d))

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }

  function getDayLabel(date: Date): string | null {
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    const override = routine?.overrides.find(o => {
      const d = new Date(o.date)
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}` === iso
    })
    if (override) return override.label

    const dow = getDayOfWeek(date)
    const routineDay = routine?.days.find(d => d.dayOfWeek === dow)
    return routineDay?.label ?? null
  }

  function getIso(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  return (
    <div>
      <Card className="overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#2a2a2a]">
          <button onClick={prevMonth} className="text-[#6b7280] hover:text-[#f0f0f0] transition-colors p-1">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-semibold text-[#f0f0f0]">{MONTH_NAMES[month]} {year}</span>
          <button onClick={nextMonth} className="text-[#6b7280] hover:text-[#f0f0f0] transition-colors p-1">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Day headers */}
        <div className="grid grid-cols-7 border-b border-[#2a2a2a]">
          {DOW_HEADER.map(d => (
            <div key={d} className="text-center text-xs text-[#6b7280] py-2">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {days.map((date, i) => {
            if (!date) return <div key={`empty-${i}`} className="aspect-square border-b border-r border-[#1f1f1f] last:border-r-0" />

            const iso = getIso(date)
            const label = getDayLabel(date)
            const isToday = iso === today
            const isCompleted = completedDates.includes(iso)
            const isStarted = startedDates.includes(iso)
            const isRest = !label
            const isPast = date < todayDate && !isToday

            return (
              <Link
                key={iso}
                href={label ? `/workout/${iso}` : '#'}
                className={cn(
                  'aspect-square border-b border-r border-[#1f1f1f] p-1.5 flex flex-col items-center justify-start transition-colors',
                  (i + 1) % 7 === 0 && 'border-r-0',
                  label ? 'hover:bg-[#1f1f1f] cursor-pointer' : 'cursor-default',
                  isToday && 'bg-green-500/10',
                )}
              >
                <span className={cn(
                  'text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full',
                  isToday ? 'bg-green-500 text-white' : isPast ? 'text-[#6b7280]' : 'text-[#d1d5db]'
                )}>
                  {date.getDate()}
                </span>
                {label && (
                  <span className={cn(
                    'text-[9px] mt-0.5 px-1 py-0.5 rounded font-medium truncate max-w-full',
                    isCompleted ? 'bg-green-500/20 text-green-400' :
                    isStarted ? 'bg-blue-500/20 text-blue-400' :
                    'bg-[#2a2a2a] text-[#9ca3af]'
                  )}>
                    {isCompleted ? '✓' : ''}{label}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-4 px-1">
        {[
          { label: 'Completado', className: 'bg-green-500/20 text-green-400' },
          { label: 'En progreso', className: 'bg-blue-500/20 text-blue-400' },
          { label: 'Programado', className: 'bg-[#2a2a2a] text-[#9ca3af]' },
        ].map(({ label, className }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className={cn('text-[9px] px-1.5 py-0.5 rounded font-medium', className)}>{label[0]}</span>
            <span className="text-xs text-[#6b7280]">{label}</span>
          </div>
        ))}
      </div>

      {/* Routine summary */}
      {routine && (
        <Card className="mt-4">
          <div className="px-5 py-4">
            <p className="text-sm font-medium text-[#f0f0f0] mb-3">Tu split semanal</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {DAYS_ORDER.map(dow => {
                const day = routine.days.find(d => d.dayOfWeek === dow)
                return (
                  <div key={dow} className={cn(
                    'px-3 py-2 rounded-lg text-xs border',
                    day ? 'bg-green-500/10 border-green-500/20' : 'bg-[#1a1a1a] border-[#2a2a2a]'
                  )}>
                    <p className="text-[#6b7280]">{DAY_LABELS[dow].slice(0, 3)}</p>
                    <p className={day ? 'text-green-400 font-medium' : 'text-[#6b7280]'}>
                      {day?.label ?? 'Descanso'}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
