// backend/app/api/workouts/[id]/start/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper to get params from URL
async function getParams(request: NextRequest) {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/');
  const id = pathSegments[pathSegments.length - 2]; // Because this is /start route
  return { id };
}

// POST /api/workouts/[id]/start - Start a workout
export async function POST(request: NextRequest) {
  try {
    const { id } = await getParams(request);
    const workoutId = parseInt(id);
    
    if (isNaN(workoutId)) {
      return NextResponse.json({ error: "Invalid workout ID" }, { status: 400 });
    }

    // Check if workout exists
    const existingWorkout = await prisma.workout.findUnique({
      where: { id: workoutId },
    });

    if (!existingWorkout) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 });
    }

    // Update workout status and start time
    const workout = await prisma.workout.update({
      where: { id: workoutId },
      data: {
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      },
      include: {
        exercises: {
          include: {
            sets: {
              orderBy: { order: 'asc' }
            },
          },
          orderBy: { order: 'asc' }
        },
      },
    });

    return NextResponse.json(workout);
  } catch (error) {
    console.error("Failed to start workout:", error);
    return NextResponse.json(
      { error: "Failed to start workout" },
      { status: 500 }
    );
  }
}