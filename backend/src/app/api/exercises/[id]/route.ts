import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> } // ✅ Add Promise wrapper
) {
  try {
    console.log("🔍 DELETE request received");
    console.log("🔍 Full URL:", req.url);
    
    // ✅ Correct way to get params in Next.js 13+ App Router
    const resolvedParams = await params;
    console.log("🔍 Resolved params:", resolvedParams);
    
    const { id } = resolvedParams;
    console.log("🔍 Extracted ID:", id, "Type:", typeof id);
    
    const exerciseId = parseInt(id);
    console.log("🔍 Parsed exercise ID:", exerciseId, "Is NaN?", isNaN(exerciseId));

    if (isNaN(exerciseId)) {
      console.log("❌ Invalid exercise ID - could not parse:", id);
      return NextResponse.json({ error: "Invalid exercise ID" }, { status: 400 });
    }

    // Check if the exercise exists
    const exerciseExists = await prisma.exercise.findUnique({
      where: { id: exerciseId },
    });

    if (!exerciseExists) {
      console.log("❌ Exercise not found with ID:", exerciseId);
      return NextResponse.json({ error: "Exercise not found" }, { status: 404 });
    }

    console.log("✅ Exercise found:", exerciseExists.name);

    // Delete all sets associated with this exercise
    await prisma.set.deleteMany({
      where: { exerciseId },
    });

    // Then delete the exercise
    const exercise = await prisma.exercise.delete({
      where: { id: exerciseId },
    });

    console.log("✅ Exercise deleted successfully:", exercise.name);

    return NextResponse.json({ 
      message: "Exercise deleted successfully",
      deletedExercise: exercise 
    });

  } catch (error) {
    console.error("💥 Error deleting exercise:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}