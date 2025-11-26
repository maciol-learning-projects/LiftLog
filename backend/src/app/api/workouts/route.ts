import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth"; 

export async function POST(req: NextRequest) {
  try {

    const userPayload = await getCurrentUser();
    if (!userPayload) {
      return NextResponse.json(
        { error: "Not authenticated" }, 
        { status: 401 }
      );
    }

    const body = await req.json();

    // Use the authenticated user's ID, not from request body
    const workout = await prisma.workout.create({
      data: {
        name: body.name,
        userId: userPayload.userId, 
        notes: body.notes,
      }
    });

    return NextResponse.json(workout);
  } catch (error) {
    console.error("Error creating workout:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {

    const userPayload = await getCurrentUser();
    
    if (!userPayload) {
      return NextResponse.json(
        { error: "Not authenticated" }, 
        { status: 401 }
      );
    }

    // Use the authenticated user's ID
    const workouts = await prisma.workout.findMany({
      where: { 
        userId: userPayload.userId
      },
      include: {
        exercises: {
          include: { sets: true },
          orderBy: { order: 'asc' }
        },
      },
      orderBy: { date: 'desc' }
    });

    // Properly serialize the response
    const serializedWorkouts = workouts.map(workout => ({
      ...workout,
      date: workout.date.toISOString(),
      exercises: workout.exercises.map(exercise => ({
        ...exercise,
        sets: exercise.sets.map(set => ({
          ...set,
          weight: set.weight !== null ? Number(set.weight) : undefined
        }))
      }))
    }));

    return NextResponse.json(serializedWorkouts);
  } catch (error) {
    console.error("Error fetching workouts:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}