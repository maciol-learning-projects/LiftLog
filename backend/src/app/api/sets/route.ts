// backend/app/api/sets/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/sets - Create a new set
export async function POST(request: NextRequest) {
  try {
    const { exerciseId, reps, weight, notes } = await request.json();

    // Validate required fields
    if (!exerciseId || reps === undefined) {
      return NextResponse.json(
        { error: "Exercise ID and reps are required" },
        { status: 400 }
      );
    }

    // Get the current max order for this exercise to place new set at the end
    const lastSet = await prisma.set.findFirst({
      where: { exerciseId },
      orderBy: { order: 'desc' },
    });

    const newOrder = lastSet ? lastSet.order + 1 : 0;

    const set = await prisma.set.create({
      data: {
        exerciseId,
        reps: reps || 0,
        weight: weight || 0,
        notes: notes || '',
        order: newOrder,
        completed: false,
      },
      include: {
        exercise: {
          include: {
            workout: true,
          },
        },
      },
    });

    return NextResponse.json(set);
  } catch (error) {
    console.error("Failed to create set:", error);
    return NextResponse.json(
      { error: "Failed to create set" },
      { status: 500 }
    );
  }
}