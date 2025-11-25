// prisma/seed.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting seed...')

  // Create test user
  const user = await prisma.user.upsert({
    where: { email: 'test@example.com' },
    update: {},
    create: {
      email: 'test@example.com',
    },
  })
  console.log('✅ Created test user:', user.email)

  // Create a sample workout
  const workout = await prisma.workout.create({
    data: {
      name: 'Chest & Triceps Day',
      notes: 'Focus on form and controlled movements',
      userId: user.id,
      status: 'DRAFT',
      exercises: {
        create: [
          {
            name: 'Bench Press',
            order: 0,
            sets: {
              create: [
                { reps: 10, weight: 60, order: 0, completed: false },
                { reps: 8, weight: 70, order: 1, completed: false },
              ],
            },
          },
        ],
      },
    },
  })
  console.log('✅ Created sample workout:', workout.id)

  console.log('🎉 Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })