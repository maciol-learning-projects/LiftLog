// backend/src/app/api/workouts/[id]/complete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

async function getParams(request: NextRequest) {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/');
  const id = pathSegments[pathSegments.length - 2];
  return { id };
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Complete workout API called');
    const { id } = await getParams(request);
    const workoutId = parseInt(id);
    
    // Get elapsedTime from request body
    const { elapsedTime } = await request.json();
    console.log('⏱️ Received elapsedTime from frontend:', elapsedTime);
    
    if (isNaN(workoutId)) {
      return NextResponse.json({ error: "Invalid workout ID" }, { status: 400 });
    }

    // Get the original workout
    const originalWorkout = await prisma.workout.findUnique({
      where: { id: workoutId },
      include: {
        exercises: {
          include: {
            sets: true,
          },
        },
      },
    });

    if (!originalWorkout) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 });
    }

    console.log('✅ Workout found:', originalWorkout.name);
    console.log('📅 Workout startedAt:', originalWorkout.startedAt);

    // Calculate duration - use elapsedTime from frontend as primary source
    const completedAt = new Date();
    let duration = elapsedTime || 0;
    
    // If we have startedAt, we can calculate duration from it as a fallback
    if (originalWorkout.startedAt && !elapsedTime) {
      duration = Math.floor((completedAt.getTime() - originalWorkout.startedAt.getTime()) / 1000);
      console.log('⏱️ Duration calculated from startedAt:', duration, 'seconds');
    } else if (elapsedTime) {
      console.log('⏱️ Duration from frontend elapsedTime:', elapsedTime, 'seconds');
    } else {
      console.log('⚠️ No duration data available, using 0');
    }

    // ... rest of your existing code for calculating sets and creating workout history
    const completedSets = originalWorkout.exercises.reduce((total, exercise) => {
      return total + (exercise.sets?.filter(set => set.completed).length || 0);
    }, 0);

    const totalSets = originalWorkout.exercises.reduce((total, exercise) => {
      return total + (exercise.sets?.length || 0);
    }, 0);

    console.log('📊 Workout stats:', { duration, completedSets, totalSets });

    // Create workout history record
    console.log('📝 Creating workout history record...');
    const workoutHistory = await prisma.workoutHistory.create({
      data: {
        workoutId: originalWorkout.id,
        name: originalWorkout.name,
        userId: originalWorkout.userId,
        duration: duration,
        exerciseCount: originalWorkout.exercises.length,
        totalSets: totalSets,
        completedSets: completedSets,
        notes: originalWorkout.notes || '',
      },
    });

    console.log('✅ Workout history created with ID:', workoutHistory.id);

    // Reset the original workout back to DRAFT
    console.log('🔄 Resetting original workout to DRAFT...');
    const resetWorkout = await prisma.workout.update({
      where: { id: workoutId },
      data: {
        status: 'DRAFT',
        startedAt: null,
        completedAt: null,
        duration: null,
        exercises: {
          update: originalWorkout.exercises.map(exercise => ({
            where: { id: exercise.id },
            data: {
              sets: {
                update: exercise.sets.map(set => ({
                  where: { id: set.id },
                  data: {
                    completed: false,
                    completedAt: null,
                  },
                })),
              },
            },
          })),
        },
      },
      include: {
        exercises: {
          include: {
            sets: true,
          },
        },
      },
    });

    console.log('✅ Workout reset to DRAFT:', resetWorkout.id);

    // Return the expected structure
    const response = {
      resetWorkout: resetWorkout,
      sessionData: {
        duration,
        completedAt: completedAt.toISOString(),
        exerciseCount: originalWorkout.exercises.length,
        totalSets,
        completedSets,
      },
    };

    console.log('📤 Sending response:', response);
    return NextResponse.json(response);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('💥 Complete workout backend error:', errorMessage);
    
    return NextResponse.json(
      { error: "Failed to complete workout: " + errorMessage },
      { status: 500 }
    );
  }
}