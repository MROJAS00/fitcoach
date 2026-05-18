import { PrismaClient, MuscleGroup, ExerciseCategory } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import * as dotenv from 'dotenv'
dotenv.config()

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const exercises = [
  // CHEST - Compound
  { name: 'Press Banca Plano', muscleGroup: MuscleGroup.CHEST, category: ExerciseCategory.COMPOUND },
  { name: 'Press Banca Inclinado', muscleGroup: MuscleGroup.CHEST, category: ExerciseCategory.COMPOUND },
  { name: 'Press Banca Declinado', muscleGroup: MuscleGroup.CHEST, category: ExerciseCategory.COMPOUND },
  { name: 'Press Banca Mancuernas', muscleGroup: MuscleGroup.CHEST, category: ExerciseCategory.COMPOUND },
  { name: 'Press Banca Inclinado Mancuernas', muscleGroup: MuscleGroup.CHEST, category: ExerciseCategory.COMPOUND },
  { name: 'Fondos en Paralelas (Pecho)', muscleGroup: MuscleGroup.CHEST, category: ExerciseCategory.COMPOUND },
  { name: 'Press Pecho Máquina', muscleGroup: MuscleGroup.CHEST, category: ExerciseCategory.COMPOUND },
  // CHEST - Isolation
  { name: 'Aperturas Mancuernas Plano', muscleGroup: MuscleGroup.CHEST, category: ExerciseCategory.ISOLATION },
  { name: 'Aperturas Mancuernas Inclinado', muscleGroup: MuscleGroup.CHEST, category: ExerciseCategory.ISOLATION },
  { name: 'Cruces Polea Alta', muscleGroup: MuscleGroup.CHEST, category: ExerciseCategory.ISOLATION },
  { name: 'Cruces Polea Baja', muscleGroup: MuscleGroup.CHEST, category: ExerciseCategory.ISOLATION },
  { name: 'Pec Deck (Mariposa)', muscleGroup: MuscleGroup.CHEST, category: ExerciseCategory.ISOLATION },
  { name: 'Pullover Mancuerna', muscleGroup: MuscleGroup.CHEST, category: ExerciseCategory.ISOLATION },
  // BACK - Compound
  { name: 'Peso Muerto', muscleGroup: MuscleGroup.BACK, category: ExerciseCategory.COMPOUND },
  { name: 'Peso Muerto Rumano', muscleGroup: MuscleGroup.BACK, category: ExerciseCategory.COMPOUND },
  { name: 'Dominadas', muscleGroup: MuscleGroup.BACK, category: ExerciseCategory.COMPOUND },
  { name: 'Dominadas Agarre Supino', muscleGroup: MuscleGroup.BACK, category: ExerciseCategory.COMPOUND },
  { name: 'Remo Barra', muscleGroup: MuscleGroup.BACK, category: ExerciseCategory.COMPOUND },
  { name: 'Remo Mancuerna', muscleGroup: MuscleGroup.BACK, category: ExerciseCategory.COMPOUND },
  { name: 'Remo Pendlay', muscleGroup: MuscleGroup.BACK, category: ExerciseCategory.COMPOUND },
  { name: 'Jalón Polea Agarre Ancho', muscleGroup: MuscleGroup.BACK, category: ExerciseCategory.COMPOUND },
  { name: 'Jalón Polea Agarre Cerrado', muscleGroup: MuscleGroup.BACK, category: ExerciseCategory.COMPOUND },
  { name: 'Remo en Polea Sentado', muscleGroup: MuscleGroup.BACK, category: ExerciseCategory.COMPOUND },
  { name: 'Remo en T', muscleGroup: MuscleGroup.BACK, category: ExerciseCategory.COMPOUND },
  // BACK - Isolation
  { name: 'Pull-over Polea', muscleGroup: MuscleGroup.BACK, category: ExerciseCategory.ISOLATION },
  { name: 'Remo Máquina', muscleGroup: MuscleGroup.BACK, category: ExerciseCategory.ISOLATION },
  { name: 'Face Pull', muscleGroup: MuscleGroup.BACK, category: ExerciseCategory.ISOLATION },
  { name: 'Encogimientos Barra (Trapecios)', muscleGroup: MuscleGroup.BACK, category: ExerciseCategory.ISOLATION },
  { name: 'Hiperextensiones', muscleGroup: MuscleGroup.BACK, category: ExerciseCategory.ISOLATION },
  // SHOULDERS - Compound
  { name: 'Press Militar Barra', muscleGroup: MuscleGroup.SHOULDERS, category: ExerciseCategory.COMPOUND },
  { name: 'Press Militar Mancuernas', muscleGroup: MuscleGroup.SHOULDERS, category: ExerciseCategory.COMPOUND },
  { name: 'Press Arnold', muscleGroup: MuscleGroup.SHOULDERS, category: ExerciseCategory.COMPOUND },
  { name: 'Push Press', muscleGroup: MuscleGroup.SHOULDERS, category: ExerciseCategory.COMPOUND },
  { name: 'Press Hombro Máquina', muscleGroup: MuscleGroup.SHOULDERS, category: ExerciseCategory.COMPOUND },
  // SHOULDERS - Isolation
  { name: 'Elevaciones Laterales Mancuernas', muscleGroup: MuscleGroup.SHOULDERS, category: ExerciseCategory.ISOLATION },
  { name: 'Elevaciones Laterales Polea', muscleGroup: MuscleGroup.SHOULDERS, category: ExerciseCategory.ISOLATION },
  { name: 'Elevaciones Frontales Mancuernas', muscleGroup: MuscleGroup.SHOULDERS, category: ExerciseCategory.ISOLATION },
  { name: 'Elevaciones Frontales Barra', muscleGroup: MuscleGroup.SHOULDERS, category: ExerciseCategory.ISOLATION },
  { name: 'Pájaros Mancuernas', muscleGroup: MuscleGroup.SHOULDERS, category: ExerciseCategory.ISOLATION },
  { name: 'Pájaros Polea', muscleGroup: MuscleGroup.SHOULDERS, category: ExerciseCategory.ISOLATION },
  { name: 'Encogimientos Hombros', muscleGroup: MuscleGroup.SHOULDERS, category: ExerciseCategory.ISOLATION },
  // BICEPS
  { name: 'Curl Barra', muscleGroup: MuscleGroup.BICEPS, category: ExerciseCategory.ISOLATION },
  { name: 'Curl Barra Z (EZ)', muscleGroup: MuscleGroup.BICEPS, category: ExerciseCategory.ISOLATION },
  { name: 'Curl Mancuernas Alterno', muscleGroup: MuscleGroup.BICEPS, category: ExerciseCategory.ISOLATION },
  { name: 'Curl Mancuernas Simultáneo', muscleGroup: MuscleGroup.BICEPS, category: ExerciseCategory.ISOLATION },
  { name: 'Curl Martillo', muscleGroup: MuscleGroup.BICEPS, category: ExerciseCategory.ISOLATION },
  { name: 'Curl Concentrado', muscleGroup: MuscleGroup.BICEPS, category: ExerciseCategory.ISOLATION },
  { name: 'Curl Polea Baja', muscleGroup: MuscleGroup.BICEPS, category: ExerciseCategory.ISOLATION },
  { name: 'Curl Scott (Predicador)', muscleGroup: MuscleGroup.BICEPS, category: ExerciseCategory.ISOLATION },
  { name: 'Curl Inclinado Mancuernas', muscleGroup: MuscleGroup.BICEPS, category: ExerciseCategory.ISOLATION },
  { name: 'Curl 21s', muscleGroup: MuscleGroup.BICEPS, category: ExerciseCategory.ISOLATION },
  // TRICEPS
  { name: 'Press Francés Barra', muscleGroup: MuscleGroup.TRICEPS, category: ExerciseCategory.ISOLATION },
  { name: 'Press Francés Mancuernas', muscleGroup: MuscleGroup.TRICEPS, category: ExerciseCategory.ISOLATION },
  { name: 'Extensión Triceps Polea Alta', muscleGroup: MuscleGroup.TRICEPS, category: ExerciseCategory.ISOLATION },
  { name: 'Extensión Triceps Polea (Cuerda)', muscleGroup: MuscleGroup.TRICEPS, category: ExerciseCategory.ISOLATION },
  { name: 'Fondos en Banco', muscleGroup: MuscleGroup.TRICEPS, category: ExerciseCategory.ISOLATION },
  { name: 'Kickback Mancuerna', muscleGroup: MuscleGroup.TRICEPS, category: ExerciseCategory.ISOLATION },
  { name: 'Extensión Triceps sobre Cabeza Polea', muscleGroup: MuscleGroup.TRICEPS, category: ExerciseCategory.ISOLATION },
  { name: 'Close Grip Press Banca', muscleGroup: MuscleGroup.TRICEPS, category: ExerciseCategory.COMPOUND },
  { name: 'Skull Crusher', muscleGroup: MuscleGroup.TRICEPS, category: ExerciseCategory.ISOLATION },
  // QUADRICEPS - Compound
  { name: 'Sentadilla Barra', muscleGroup: MuscleGroup.QUADRICEPS, category: ExerciseCategory.COMPOUND },
  { name: 'Sentadilla Frontal', muscleGroup: MuscleGroup.QUADRICEPS, category: ExerciseCategory.COMPOUND },
  { name: 'Sentadilla Hack', muscleGroup: MuscleGroup.QUADRICEPS, category: ExerciseCategory.COMPOUND },
  { name: 'Sentadilla Búlgara', muscleGroup: MuscleGroup.QUADRICEPS, category: ExerciseCategory.COMPOUND },
  { name: 'Prensa de Piernas', muscleGroup: MuscleGroup.QUADRICEPS, category: ExerciseCategory.COMPOUND },
  { name: 'Zancada con Mancuernas', muscleGroup: MuscleGroup.QUADRICEPS, category: ExerciseCategory.COMPOUND },
  { name: 'Zancada con Barra', muscleGroup: MuscleGroup.QUADRICEPS, category: ExerciseCategory.COMPOUND },
  { name: 'Zancada Caminando', muscleGroup: MuscleGroup.QUADRICEPS, category: ExerciseCategory.COMPOUND },
  { name: 'Step-up Banco', muscleGroup: MuscleGroup.QUADRICEPS, category: ExerciseCategory.COMPOUND },
  { name: 'Goblet Squat', muscleGroup: MuscleGroup.QUADRICEPS, category: ExerciseCategory.COMPOUND },
  // QUADRICEPS - Isolation
  { name: 'Extensión de Piernas Máquina', muscleGroup: MuscleGroup.QUADRICEPS, category: ExerciseCategory.ISOLATION },
  // HAMSTRINGS
  { name: 'Curl Femoral Tumbado', muscleGroup: MuscleGroup.HAMSTRINGS, category: ExerciseCategory.ISOLATION },
  { name: 'Curl Femoral Sentado', muscleGroup: MuscleGroup.HAMSTRINGS, category: ExerciseCategory.ISOLATION },
  { name: 'Curl Femoral de Pie', muscleGroup: MuscleGroup.HAMSTRINGS, category: ExerciseCategory.ISOLATION },
  { name: 'Peso Muerto Piernas Rígidas', muscleGroup: MuscleGroup.HAMSTRINGS, category: ExerciseCategory.COMPOUND },
  { name: 'Good Morning', muscleGroup: MuscleGroup.HAMSTRINGS, category: ExerciseCategory.COMPOUND },
  { name: 'Nordic Curl', muscleGroup: MuscleGroup.HAMSTRINGS, category: ExerciseCategory.ISOLATION },
  // GLUTES
  { name: 'Hip Thrust Barra', muscleGroup: MuscleGroup.GLUTES, category: ExerciseCategory.COMPOUND },
  { name: 'Hip Thrust Máquina', muscleGroup: MuscleGroup.GLUTES, category: ExerciseCategory.COMPOUND },
  { name: 'Glute Bridge', muscleGroup: MuscleGroup.GLUTES, category: ExerciseCategory.ISOLATION },
  { name: 'Patada Trasera Polea', muscleGroup: MuscleGroup.GLUTES, category: ExerciseCategory.ISOLATION },
  { name: 'Abducción de Cadera Máquina', muscleGroup: MuscleGroup.GLUTES, category: ExerciseCategory.ISOLATION },
  { name: 'Sentadilla Sumo', muscleGroup: MuscleGroup.GLUTES, category: ExerciseCategory.COMPOUND },
  { name: 'Romanian Deadlift', muscleGroup: MuscleGroup.GLUTES, category: ExerciseCategory.COMPOUND },
  // CALVES
  { name: 'Elevación de Talones de Pie', muscleGroup: MuscleGroup.CALVES, category: ExerciseCategory.ISOLATION },
  { name: 'Elevación de Talones Sentado', muscleGroup: MuscleGroup.CALVES, category: ExerciseCategory.ISOLATION },
  { name: 'Elevación de Talones en Prensa', muscleGroup: MuscleGroup.CALVES, category: ExerciseCategory.ISOLATION },
  { name: 'Donkey Calf Raise', muscleGroup: MuscleGroup.CALVES, category: ExerciseCategory.ISOLATION },
  { name: 'Saltos a la Comba', muscleGroup: MuscleGroup.CALVES, category: ExerciseCategory.CARDIO },
  // CORE
  { name: 'Crunch Abdominal', muscleGroup: MuscleGroup.CORE, category: ExerciseCategory.ISOLATION },
  { name: 'Crunch Polea Alta', muscleGroup: MuscleGroup.CORE, category: ExerciseCategory.ISOLATION },
  { name: 'Plancha', muscleGroup: MuscleGroup.CORE, category: ExerciseCategory.ISOLATION },
  { name: 'Plancha Lateral', muscleGroup: MuscleGroup.CORE, category: ExerciseCategory.ISOLATION },
  { name: 'Plancha con Toque de Hombro', muscleGroup: MuscleGroup.CORE, category: ExerciseCategory.ISOLATION },
  { name: 'Elevación de Piernas Tumbado', muscleGroup: MuscleGroup.CORE, category: ExerciseCategory.ISOLATION },
  { name: 'Elevación de Piernas Barra Fija', muscleGroup: MuscleGroup.CORE, category: ExerciseCategory.ISOLATION },
  { name: 'Rueda Abdominal (Ab Wheel)', muscleGroup: MuscleGroup.CORE, category: ExerciseCategory.ISOLATION },
  { name: 'Russian Twist', muscleGroup: MuscleGroup.CORE, category: ExerciseCategory.ISOLATION },
  { name: 'Tijeras', muscleGroup: MuscleGroup.CORE, category: ExerciseCategory.ISOLATION },
  { name: 'Mountain Climbers', muscleGroup: MuscleGroup.CORE, category: ExerciseCategory.ISOLATION },
  { name: 'Dead Bug', muscleGroup: MuscleGroup.CORE, category: ExerciseCategory.MOBILITY },
  { name: 'Hollow Body Hold', muscleGroup: MuscleGroup.CORE, category: ExerciseCategory.ISOLATION },
  { name: 'Pallof Press', muscleGroup: MuscleGroup.CORE, category: ExerciseCategory.ISOLATION },
  { name: 'Dragón Flag', muscleGroup: MuscleGroup.CORE, category: ExerciseCategory.ISOLATION },
  // FULL BODY / COMPOUND
  { name: 'Power Clean', muscleGroup: MuscleGroup.FULL_BODY, category: ExerciseCategory.COMPOUND },
  { name: 'Snatch', muscleGroup: MuscleGroup.FULL_BODY, category: ExerciseCategory.COMPOUND },
  { name: 'Thruster', muscleGroup: MuscleGroup.FULL_BODY, category: ExerciseCategory.COMPOUND },
  { name: 'Burpee', muscleGroup: MuscleGroup.FULL_BODY, category: ExerciseCategory.CARDIO },
  { name: 'Turkish Get-up', muscleGroup: MuscleGroup.FULL_BODY, category: ExerciseCategory.COMPOUND },
  { name: 'Man Maker', muscleGroup: MuscleGroup.FULL_BODY, category: ExerciseCategory.COMPOUND },
  { name: 'Kettlebell Swing', muscleGroup: MuscleGroup.FULL_BODY, category: ExerciseCategory.COMPOUND },
  // CARDIO
  { name: 'Carrera (Cinta)', muscleGroup: MuscleGroup.FULL_BODY, category: ExerciseCategory.CARDIO },
  { name: 'Bicicleta Estática', muscleGroup: MuscleGroup.FULL_BODY, category: ExerciseCategory.CARDIO },
  { name: 'Elíptica', muscleGroup: MuscleGroup.FULL_BODY, category: ExerciseCategory.CARDIO },
  { name: 'Remo Ergómetro', muscleGroup: MuscleGroup.BACK, category: ExerciseCategory.CARDIO },
  { name: 'HIIT en Cinta', muscleGroup: MuscleGroup.FULL_BODY, category: ExerciseCategory.CARDIO },
  { name: 'Saltos de Caja (Box Jumps)', muscleGroup: MuscleGroup.FULL_BODY, category: ExerciseCategory.CARDIO },
  // MOBILITY
  { name: 'Estiramiento de Pecho en Polea', muscleGroup: MuscleGroup.CHEST, category: ExerciseCategory.MOBILITY },
  { name: 'Rotación Torácica', muscleGroup: MuscleGroup.BACK, category: ExerciseCategory.MOBILITY },
  { name: 'Hip Flexor Stretch', muscleGroup: MuscleGroup.FULL_BODY, category: ExerciseCategory.MOBILITY },
  { name: 'Pigeon Pose', muscleGroup: MuscleGroup.GLUTES, category: ExerciseCategory.MOBILITY },
  { name: "World's Greatest Stretch", muscleGroup: MuscleGroup.FULL_BODY, category: ExerciseCategory.MOBILITY },
  // Additional popular exercises
  { name: 'Press Banca con Agarre Cerrado', muscleGroup: MuscleGroup.CHEST, category: ExerciseCategory.COMPOUND },
  { name: 'Flexiones', muscleGroup: MuscleGroup.CHEST, category: ExerciseCategory.COMPOUND },
  { name: 'Flexiones con Palmada', muscleGroup: MuscleGroup.CHEST, category: ExerciseCategory.COMPOUND },
  { name: 'Remo con Mancuerna en Banco Inclinado', muscleGroup: MuscleGroup.BACK, category: ExerciseCategory.COMPOUND },
  { name: 'Jalón al Pecho con Agarre Neutro', muscleGroup: MuscleGroup.BACK, category: ExerciseCategory.COMPOUND },
  { name: 'Prensa de Piernas a 45 Grados', muscleGroup: MuscleGroup.QUADRICEPS, category: ExerciseCategory.COMPOUND },
  { name: 'Sissy Squat', muscleGroup: MuscleGroup.QUADRICEPS, category: ExerciseCategory.ISOLATION },
  { name: 'Curl de Piernas con Fitball', muscleGroup: MuscleGroup.HAMSTRINGS, category: ExerciseCategory.ISOLATION },
  { name: 'Sentadilla en Multipower', muscleGroup: MuscleGroup.QUADRICEPS, category: ExerciseCategory.COMPOUND },
  { name: 'Press de Hombros en Multipower', muscleGroup: MuscleGroup.SHOULDERS, category: ExerciseCategory.COMPOUND },
  { name: 'Curl de Bíceps en Máquina', muscleGroup: MuscleGroup.BICEPS, category: ExerciseCategory.ISOLATION },
  { name: 'Press de Tríceps en Máquina', muscleGroup: MuscleGroup.TRICEPS, category: ExerciseCategory.ISOLATION },
  { name: 'Abducción de Piernas Máquina', muscleGroup: MuscleGroup.GLUTES, category: ExerciseCategory.ISOLATION },
  { name: 'Aducción de Piernas Máquina', muscleGroup: MuscleGroup.QUADRICEPS, category: ExerciseCategory.ISOLATION },
  { name: 'Cable Pull Through', muscleGroup: MuscleGroup.GLUTES, category: ExerciseCategory.COMPOUND },
  { name: 'Sentadilla Sumo con Mancuerna', muscleGroup: MuscleGroup.GLUTES, category: ExerciseCategory.COMPOUND },
  { name: 'Reverse Fly Máquina', muscleGroup: MuscleGroup.SHOULDERS, category: ExerciseCategory.ISOLATION },
  { name: 'Landmine Press', muscleGroup: MuscleGroup.SHOULDERS, category: ExerciseCategory.COMPOUND },
  { name: 'Snatch de Agarre Amplio', muscleGroup: MuscleGroup.BACK, category: ExerciseCategory.COMPOUND },
]

async function main() {
  console.log('Seeding exercises...')
  for (const ex of exercises) {
    await prisma.exercise.upsert({
      where: { name: ex.name },
      update: {},
      create: ex,
    })
  }
  console.log(`Done. ${exercises.length} exercises seeded.`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
