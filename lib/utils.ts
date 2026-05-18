import { type ClassValue, clsx } from 'clsx'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Lunes',
  TUESDAY: 'Martes',
  WEDNESDAY: 'Miércoles',
  THURSDAY: 'Jueves',
  FRIDAY: 'Viernes',
  SATURDAY: 'Sábado',
  SUNDAY: 'Domingo',
}

export const MUSCLE_LABELS: Record<string, string> = {
  CHEST: 'Pecho',
  BACK: 'Espalda',
  SHOULDERS: 'Hombros',
  BICEPS: 'Bíceps',
  TRICEPS: 'Tríceps',
  QUADRICEPS: 'Cuádriceps',
  HAMSTRINGS: 'Isquiotibiales',
  GLUTES: 'Glúteos',
  CALVES: 'Gemelos',
  CORE: 'Core',
  FULL_BODY: 'Cuerpo Completo',
}

export const CATEGORY_LABELS: Record<string, string> = {
  COMPOUND: 'Compuesto',
  ISOLATION: 'Aislamiento',
  CARDIO: 'Cardio',
  MOBILITY: 'Movilidad',
}

export const DAYS_ORDER = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY']

export function getDayOfWeek(date: Date): string {
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY']
  return days[date.getDay()]
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function toISODate(date: Date): string {
  return date.toISOString().split('T')[0]
}
