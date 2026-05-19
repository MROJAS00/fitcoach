export const CARDIO_TYPES = {
  WALK: { label: 'Caminata', emoji: '🚶', color: '#22c55e' },
  HIKE: { label: 'Senderismo', emoji: '🥾', color: '#f59e0b' },
  RUN:  { label: 'Carrera',   emoji: '🏃', color: '#3b82f6' },
  BIKE: { label: 'Bicicleta', emoji: '🚴', color: '#8b5cf6' },
  SWIM: { label: 'Natación',  emoji: '🏊', color: '#06b6d4' },
  OTHER:{ label: 'Otro',      emoji: '⚡', color: '#6b7280' },
} as const

export type CardioType = keyof typeof CARDIO_TYPES

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}
