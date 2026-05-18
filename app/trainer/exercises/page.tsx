import { prisma } from '@/lib/db'
import { MUSCLE_LABELS, CATEGORY_LABELS } from '@/lib/utils'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'

export default async function ExercisesPage() {
  const exercises = await prisma.exercise.findMany({
    orderBy: [{ muscleGroup: 'asc' }, { name: 'asc' }],
  })

  const byGroup = exercises.reduce<Record<string, typeof exercises>>((acc, ex) => {
    if (!acc[ex.muscleGroup]) acc[ex.muscleGroup] = []
    acc[ex.muscleGroup].push(ex)
    return acc
  }, {})

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#f0f0f0]">Biblioteca de ejercicios</h1>
        <p className="text-[#6b7280] text-sm mt-0.5">{exercises.length} ejercicios disponibles</p>
      </div>

      <div className="space-y-4">
        {Object.entries(byGroup).map(([group, exList]) => (
          <Card key={group}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-[#f0f0f0]">{MUSCLE_LABELS[group]}</h2>
                <Badge variant="neutral">{exList.length}</Badge>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-[#1f1f1f]">
                  {exList.map(ex => (
                    <tr key={ex.id} className="hover:bg-[#1f1f1f]">
                      <td className="px-5 py-2.5 text-[#d1d5db]">{ex.name}</td>
                      <td className="px-5 py-2.5 text-right">
                        <Badge variant={
                          ex.category === 'COMPOUND' ? 'info' :
                          ex.category === 'CARDIO' ? 'warning' :
                          ex.category === 'MOBILITY' ? 'success' : 'neutral'
                        }>
                          {CATEGORY_LABELS[ex.category]}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
