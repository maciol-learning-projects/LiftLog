// backend/app/api/sets/[id]/complete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper to get params
async function getParams(request: NextRequest) {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/');
  const id = pathSegments[pathSegments.length - 2]; // Because this is /complete route
  return { id };
}

// POST /api/sets/[id]/complete - Mark set as completed
export async function POST(request: NextRequest) {
  try {
    const { id } = await getParams(request);
    const setId = parseInt(id);
    
    if (isNaN(setId)) {
      return NextResponse.json({ error: "Invalid set ID" }, { status: 400 });
    }

    // Check if set exists
    const existingSet = await prisma.set.findUnique({
      where: { id: setId },
    });

    if (!existingSet) {
      return NextResponse.json({ error: "Set not found" }, { status: 404 });
    }

    const set = await prisma.set.update({
      where: { id: setId },
      data: {
        completed: true,
        completedAt: new Date(),
      },
    });

    return NextResponse.json(set);
  } catch (error) {
    console.error("Failed to complete set:", error);
    return NextResponse.json(
      { error: "Failed to complete set" },
      { status: 500 }
    );
  }
}