// app/api/workouts/[id]/reset/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // params is a Promise!
) {
  try {
    // Await the params Promise first!
    const { id } = await params;
    const workoutId = parseInt(id);

    console.log(`🔄 Attempting to reset workout ${workoutId}`);

    // STEP 1: Reset all sets for this workout - FIXED SYNTAX
    const setResult = await prisma.set.updateMany({
      where: {
        exercise: {
          workout: { // Use 'workout' not 'workoutId'
            id: workoutId
          }
        }
      },
      data: {
        completed: false,
        completedAt: null
      }
    });
    console.log(`✅ Reset ${setResult.count} sets`);

    // STEP 2: Reset the workout itself
    const workout = await prisma.workout.update({
      where: { id: workoutId },
      data: {
        status: 'DRAFT',
        startedAt: null,
        completedAt: null,
        duration: null,
      },
      include: {
        exercises: {
          include: {
            sets: {
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { order: 'asc' }
        }
      }
    });

    console.log(`✅ Workout ${workoutId} reset to DRAFT`);

    // Properly serialize the response
    const serializedWorkout = {
      ...workout,
      date: workout.date.toISOString(),
      startedAt: workout.startedAt?.toISOString(),
      completedAt: workout.completedAt?.toISOString(),
      exercises: workout.exercises.map(exercise => ({
        ...exercise,
        sets: exercise.sets.map(set => ({
          ...set,
          weight: set.weight !== null ? Number(set.weight) : undefined,
          completedAt: set.completedAt?.toISOString()
        }))
      }))
    };

    return NextResponse.json(serializedWorkout);
    
  } catch (error) {
    console.error("❌ Error resetting workout:", error);
    return NextResponse.json(
      { error: "Failed to reset workout" },
      { status: 500 }
    );
  }
}