import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { workoutId, name, muscleGroup, equipment, level } = body;

    console.log("Adding exercise to workout:", { workoutId, name, muscleGroup, equipment, level });

    // Validation
    if (!workoutId || !name) {
      return NextResponse.json(
        { error: "Workout ID and exercise name are required" },
        { status: 400 }
      );
    }

    // Check if workout exists
    const workout = await prisma.workout.findUnique({
      where: { id: workoutId },
    });

    if (!workout) {
      return NextResponse.json(
        { error: "Workout not found" },
        { status: 404 }
      );
    }

    // Find the highest order number for exercises in this workout
    const lastExercise = await prisma.exercise.findFirst({
      where: { workoutId },
      orderBy: { order: 'desc' },
    });

    const nextOrder = lastExercise ? lastExercise.order + 1 : 0;

    // Create the exercise
    const exercise = await prisma.exercise.create({
      data: {
        name: name.trim(), // Trim whitespace
        workoutId,
        order: nextOrder,
        // Optional: Store additional exercise metadata if you want
        // muscleGroup: muscleGroup || null,
        // equipment: equipment || null,
        // level: level || null,
      },
      include: {
        sets: true,
      },
    });

    console.log("Exercise created successfully:", exercise);

    // Serialize the response
    const serializedExercise = {
      id: exercise.id,
      name: exercise.name,
      workoutId: exercise.workoutId,
      order: exercise.order,
      sets: exercise.sets.map(set => ({
        id: set.id,
        reps: set.reps,
        weight: set.weight !== null ? Number(set.weight) : undefined,
        exerciseId: set.exerciseId,
        order: set.order
      }))
    };

    return NextResponse.json(serializedExercise, { status: 201 });

  } catch (error) {
    console.error("Error creating exercise:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Optional: Add GET endpoint to fetch exercises for a workout
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const workoutId = searchParams.get("workoutId");

    if (!workoutId) {
      return NextResponse.json(
        { error: "workoutId query parameter is required" },
        { status: 400 }
      );
    }

    const exercises = await prisma.exercise.findMany({
      where: { workoutId: parseInt(workoutId) },
      include: {
        sets: {
          orderBy: { order: 'asc' }
        },
      },
      orderBy: { order: 'asc' }
    });

    // Serialize the response
    const serializedExercises = exercises.map(exercise => ({
      id: exercise.id,
      name: exercise.name,
      workoutId: exercise.workoutId,
      order: exercise.order,
      sets: exercise.sets.map(set => ({
        id: set.id,
        reps: set.reps,
        weight: set.weight !== null ? Number(set.weight) : undefined,
        exerciseId: set.exerciseId,
        order: set.order
      }))
    }));

    return NextResponse.json(serializedExercises);

  } catch (error) {
    console.error("Error fetching exercises:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}