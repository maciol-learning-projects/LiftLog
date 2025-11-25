// backend/app/api/users/[userId]/workout-history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";

async function getParams(request: NextRequest) {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/');
  const userId = pathSegments[pathSegments.length - 2];
  return { userId };
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await getParams(request);
    
    const workoutHistory = await prisma.workoutHistory.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' },
    });

    return NextResponse.json(workoutHistory);
  } catch (error) {
    console.error("Failed to fetch workout history:", error);
    return NextResponse.json(
      { error: "Failed to fetch workout history" },
      { status: 500 }
    );
  }
}