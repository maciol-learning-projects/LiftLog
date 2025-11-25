// backend/app/api/sets/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Helper to get params - THIS IS THE KEY FIX
async function getParams(request: NextRequest) {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/');
  const id = pathSegments[pathSegments.length - 1];
  return { id };
}

// GET /api/sets/[id] - Get a specific set
export async function GET(request: NextRequest) {
  try {
    const { id } = await getParams(request);
    const setId = parseInt(id);
    
    if (isNaN(setId)) {
      return NextResponse.json({ error: "Invalid set ID" }, { status: 400 });
    }

    const set = await prisma.set.findUnique({
      where: { id: setId },
      include: {
        exercise: {
          include: {
            workout: true,
          },
        },
      },
    });

    if (!set) {
      return NextResponse.json({ error: "Set not found" }, { status: 404 });
    }

    return NextResponse.json(set);
  } catch (error) {
    console.error("Failed to fetch set:", error);
    return NextResponse.json(
      { error: "Failed to fetch set" },
      { status: 500 }
    );
  }
}

// PUT /api/sets/[id] - Update a set
export async function PUT(request: NextRequest) {
  try {
    const { id } = await getParams(request);
    const setId = parseInt(id);
    
    if (isNaN(setId)) {
      return NextResponse.json({ error: "Invalid set ID" }, { status: 400 });
    }

    const { reps, weight, notes } = await request.json();

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
        ...(reps !== undefined && { reps }),
        ...(weight !== undefined && { weight }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json(set);
  } catch (error) {
    console.error("Failed to update set:", error);
    return NextResponse.json(
      { error: "Failed to update set" },
      { status: 500 }
    );
  }
}

// DELETE /api/sets/[id] - Delete a set
export async function DELETE(request: NextRequest) {
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

    await prisma.set.delete({
      where: { id: setId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete set:", error);
    return NextResponse.json(
      { error: "Failed to delete set" },
      { status: 500 }
    );
  }
}