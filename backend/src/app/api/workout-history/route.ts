// In backend: app/api/workout-history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const userPayload = await getCurrentUser();
    
    if (!userPayload) {
      return NextResponse.json(
        { error: "Not authenticated" }, 
        { status: 401 }
      );
    }

    const workoutHistory = await prisma.workoutHistory.findMany({
      where: {
        userId: userPayload.userId, // Only get history for current user
      },
      orderBy: {
        completedAt: 'desc',
      },
    });

    return NextResponse.json(workoutHistory);
  } catch (error) {
    console.error("Error fetching workout history:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}