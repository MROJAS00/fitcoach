'use client'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { formatDate } from '@/lib/utils'

type Metric = {
  id: string; date: Date | string
  weight?: number | null; waist?: number | null; bodyFat?: number | null
}
type WorkoutSet = { exerciseId: string; weight: number | null; reps: number | null }
type WorkoutLog = { date: Date | string; sets: WorkoutSet[] }

function toISODate(d: Date | string) {
  const date = typeof d === 'string' ? new Date(d) : d
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`
}

export function ClientEvolutionCharts({ metrics, workoutLogs }: { metrics: Metric[]; workoutLogs: WorkoutLog[] }) {
  const weightData = metrics
    .filter(m => m.weight != null)
    .map(m => ({ label: formatDate(new Date(toISODate(m.date) + 'T12:00:00')), weight: m.weight }))

  const volumeData = workoutLogs
    .filter(l => l.sets.length > 0)
    .map(l => ({
      label: formatDate(new Date(toISODate(l.date) + 'T12:00:00')),
      volume: Math.round(l.sets.reduce((acc, s) => acc + (s.weight ?? 0) * (s.reps ?? 0), 0)),
    }))
    .filter(d => d.volume > 0)
    .slice(-20)

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {weightData.length > 1 && (
        <Card>
          <CardHeader><p className="font-medium text-[#f0f0f0] text-sm">Peso corporal (kg)</p></CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={weightData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#6b7280' }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 9, fill: '#6b7280' }} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, fontSize: 11 }} formatter={(v: unknown) => [`${v} kg`, 'Peso']} />
                <Line type="monotone" dataKey="weight" stroke="#22c55e" strokeWidth={2} dot={{ fill: '#22c55e', r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
      {volumeData.length > 1 && (
        <Card>
          <CardHeader><p className="font-medium text-[#f0f0f0] text-sm">Volumen de entreno (kg totales)</p></CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={160}>
              <LineChart data={volumeData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f1f1f" />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#6b7280' }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 9, fill: '#6b7280' }} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, fontSize: 11 }} formatter={(v: unknown) => [`${v} kg`, 'Volumen']} />
                <Line type="monotone" dataKey="volume" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
