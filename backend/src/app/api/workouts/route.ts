import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const workout = await prisma.workout.create({
      data: {
        name: body.name,
        userId: body.userId,
        notes: body.notes,
      }
    });

    return NextResponse.json(workout);
  } catch (error) {
    console.error("Error creating workout:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const workouts = await prisma.workout.findMany({
      where: { userId },
      include: {
        exercises: {
          include: { sets: true },
          orderBy: { order: 'asc' }
        },
      },
      orderBy: { date: 'desc' }
    });

    // Properly serialize the response - convert Date objects to ISO strings
    const serializedWorkouts = workouts.map(workout => ({
      ...workout,
      date: workout.date.toISOString(), // Convert Date to string
      exercises: workout.exercises.map(exercise => ({
        ...exercise,
        sets: exercise.sets.map(set => ({
          ...set,
          // Ensure all numeric fields are properly converted
          weight: set.weight !== null ? Number(set.weight) : undefined
        }))
      }))
    }));

    return NextResponse.json(serializedWorkouts);
  } catch (error) {
    console.error("Error fetching workouts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}