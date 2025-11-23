import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // Get the ID from params - use await
    const { id } = await Promise.resolve(context.params);
    const workoutId = parseInt(id);

    if (isNaN(workoutId)) {
      return NextResponse.json({ error: "Invalid workout ID" }, { status: 400 });
    }

    const workout = await prisma.workout.findUnique({
      where: { id: workoutId },
      include: {
        exercises: {
          include: { sets: true },
          orderBy: { order: 'asc' } // Add this to maintain order
        },
      },
    });

    if (!workout) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 });
    }

    // ✅ ADD THIS: Load full exercise details from GitHub
    let exercisesWithDetails = [];
    try {
      const githubResponse = await fetch('https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json');
      const allExercises = await githubResponse.json();
      
      exercisesWithDetails = workout.exercises.map(exercise => {
        const githubExercise = allExercises.find((ex: any) => ex.name === exercise.name);
        return {
          ...exercise,
          instructions: githubExercise?.instructions || [],
          images: githubExercise?.images || [],
          primaryMuscles: githubExercise?.primaryMuscles || [],
          secondaryMuscles: githubExercise?.secondaryMuscles || [],
          equipment: githubExercise?.equipment || '',
          level: githubExercise?.level || '',
          force: githubExercise?.force || '',
          mechanic: githubExercise?.mechanic || '',
          category: githubExercise?.category || '',
          muscleGroup: githubExercise?.primaryMuscles?.[0] || '', // Use first primary muscle as muscleGroup
        };
      });
    } catch (error) {
      console.error("Failed to load GitHub exercise data:", error);
      // Fallback to basic exercises if GitHub fails
      exercisesWithDetails = workout.exercises.map(exercise => ({
        ...exercise,
        instructions: [],
        images: [],
        primaryMuscles: [],
        secondaryMuscles: [],
        equipment: '',
        level: '',
        force: '',
        mechanic: '',
        category: '',
        muscleGroup: '',
      }));
    }

    // Serialize the response with full exercise details
    const serializedWorkout = {
      id: workout.id,
      name: workout.name,
      date: workout.date.toISOString(),
      userId: workout.userId,
      notes: workout.notes || undefined,
      exercises: exercisesWithDetails.map(exercise => ({
        id: exercise.id,
        name: exercise.name,
        workoutId: exercise.workoutId,
        order: exercise.order,
        instructions: exercise.instructions,
        images: exercise.images,
        primaryMuscles: exercise.primaryMuscles,
        secondaryMuscles: exercise.secondaryMuscles,
        equipment: exercise.equipment,
        level: exercise.level,
        force: exercise.force,
        mechanic: exercise.mechanic,
        category: exercise.category,
        muscleGroup: exercise.muscleGroup,
        sets: exercise.sets.map(set => ({
          id: set.id,
          reps: set.reps,
          weight: set.weight !== null ? Number(set.weight) : undefined,
          exerciseId: set.exerciseId,
          order: set.order
        }))
      }))
    };

    return NextResponse.json(serializedWorkout);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to fetch workout" }, { status: 500 });
  }
}

