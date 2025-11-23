const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? "http://192.168.2.33:3000";

export interface Workout {
  id: number; // This is correct - your schema uses Int
  name: string;
  date: string; // Keep as string for frontend display
  userId: string; // Add this missing field
  notes?: string;
  exercises: Exercise[];
}

export interface Exercise {
  id: number; // Changed from number to string based on your JSON
  name: string;
  force: string;
  level: string;
  mechanic: string;
  equipment: string;
  muscleGroup: string; // Keep this for your app's data structure
  primaryMuscles: string[]; // This is the actual field from JSON
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
  order: number;
  images?: string[];
  sets: Set[]; // Keep this for your app's data structure
}

export interface Set {
  id: number;
  reps: number;
  weight?: number;
  order: number;
}

export async function fetchWorkouts(userId: string): Promise<Workout[]> {
  const res = await fetch(`${BACKEND_URL}/api/workouts?userId=${userId}`);
  if (!res.ok) throw new Error("Failed to fetch workouts");
  const data = await res.json();
  console.log("API Response:", data);
  return data;
}

export async function createWorkout(name: string, userId: string, notes?: string) {
  const res = await fetch(`${BACKEND_URL}/api/workouts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, userId, notes }),
  });

  if (!res.ok) throw new Error("Failed to create workout");
  return res.json();
}

export async function fetchWorkoutById(workoutId: number): Promise<Workout> {
  console.log("🔍 Fetching workout with ID:", workoutId);
  
  // Call the specific workout endpoint
  const res = await fetch(`${BACKEND_URL}/api/workouts/${workoutId}`);
  
  console.log("📨 Response status:", res.status);
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error("❌ API Error:", errorText);
    throw new Error(`Failed to fetch workout: ${res.status} ${errorText}`);
  }
  
  const data = await res.json();
  console.log("✅ Workout data received:", data);
  
  // Debug: Check the actual data structure
  if (data.exercises && data.exercises.length > 0) {
    console.log("🔍 First exercise details:", {
      name: data.exercises[0].name,
      hasInstructions: data.exercises[0].instructions?.length > 0,
      hasImages: data.exercises[0].images?.length > 0,
      instructionCount: data.exercises[0].instructions?.length,
      imageCount: data.exercises[0].images?.length,
      images: data.exercises[0].images
    });
  }
  
  return data;
}

export async function addExerciseToWorkout(
  workoutId: number, 
  exercise: Omit<Exercise, 'id' | 'sets' | 'primaryMuscles' | 'secondaryMuscles' | 'instructions' | 'category' | 'force' | 'mechanic'> // ✅ Professional way
): Promise<Exercise> {
  console.log("📤 Adding exercise to workout:", { workoutId, exercise });
  
  const res = await fetch(`${BACKEND_URL}/api/exercises`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      workoutId, 
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      equipment: exercise.equipment,
      level: exercise.level
    }),
  });

  const responseText = await res.text();
  console.log("📨 API Response:", responseText);

  if (!res.ok) {
    let errorMessage = `Failed to add exercise: ${res.status}`;
    try {
      const errorData = JSON.parse(responseText);
      errorMessage = errorData.error || errorMessage;
    } catch {
      errorMessage = responseText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  try {
    return JSON.parse(responseText);
  } catch {
    throw new Error("Invalid JSON response from server");
  }
}

export async function fetchExercisesForWorkout(workoutId: number): Promise<Exercise[]> {
  const res = await fetch(`${BACKEND_URL}/api/exercises?workoutId=${workoutId}`);
  
  if (!res.ok) {
    throw new Error(`Failed to fetch exercises: ${res.status}`);
  }
  
  return res.json();
}

export async function removeExerciseFromWorkout(exerciseId: number): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/api/exercises/${exerciseId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to remove exercise: ${res.status} ${errorText}`);
  }
}

export async function updateExerciseOrder(
  workoutId: number, 
  exercises: { id: number; order: number }[]
): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/api/workouts/${workoutId}/exercises/order`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ exercises }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to update exercise order: ${res.status} ${errorText}`);
  }
}