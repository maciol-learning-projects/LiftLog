import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const { id } = await Promise.resolve(context.params);
    const workoutId = parseInt(id);
    const body = await req.json();
    const { exercises } = body;

    console.log("📥 Received order update for workout:", workoutId);
    console.log("📝 Exercises to update:", exercises);

    if (isNaN(workoutId)) {
      return NextResponse.json({ error: "Invalid workout ID" }, { status: 400 });
    }

    if (!exercises || !Array.isArray(exercises)) {
      return NextResponse.json({ error: "Exercises array is required" }, { status: 400 });
    }

    // Verify the workout exists and user has permission
    const workout = await prisma.workout.findUnique({
      where: { id: workoutId }
    });

    if (!workout) {
      return NextResponse.json({ error: "Workout not found" }, { status: 404 });
    }

    // Update each exercise's order in a transaction
    const updatePromises = exercises.map((ex: { id: number; order: number }) =>
      prisma.exercise.update({
        where: { 
          id: ex.id,
          workoutId: workoutId // Ensure exercise belongs to this workout
        },
        data: { order: ex.order }
      })
    );

    await Promise.all(updatePromises);

    console.log("✅ Exercise order updated successfully");

    return NextResponse.json({ 
      success: true, 
      message: "Exercise order updated successfully" 
    });
  } catch (err) {
    console.error("❌ Error updating exercise order:", err);
    return NextResponse.json({ error: "Failed to update exercise order" }, { status: 500 });
  }
}