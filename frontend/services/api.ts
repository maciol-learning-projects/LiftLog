import { Workout, Exercise, Set, WorkoutHistory } from "../../shared/types";
import { WorkoutStatus } from "../utils/workoutStatus";

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL ?? "http://192.168.2.33:3000";

// ADD: Common fetch options with credentials
const fetchOptions = {
  credentials: 'include' as const, // This sends cookies with every request
};

export async function fetchWorkouts(): Promise<Workout[]> { // REMOVE userId parameter
  const res = await fetch(`${BACKEND_URL}/api/workouts`, {
    ...fetchOptions, // ADD credentials
  });
  if (!res.ok) throw new Error("Failed to fetch workouts");
  const data = await res.json();
  console.log("API Response:", data);
  return data;
}

export async function createWorkout(name: string, notes?: string) { // REMOVE userId parameter
  const res = await fetch(`${BACKEND_URL}/api/workouts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, notes }), // REMOVE userId from body
    credentials: 'include', // ADD credentials
  });

  if (!res.ok) throw new Error("Failed to create workout");
  return res.json();
}

export async function fetchWorkoutById(workoutId: number): Promise<Workout> {
  console.log("🔍 Fetching workout with ID:", workoutId);
  
  const res = await fetch(`${BACKEND_URL}/api/workouts/${workoutId}`, {
    ...fetchOptions, // ADD credentials
  });
  
  console.log("📨 Response status:", res.status);
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error("❌ API Error:", errorText);
    throw new Error(`Failed to fetch workout: ${res.status} ${errorText}`);
  }
  
  const data = await res.json();
  console.log("✅ Workout data received:", data);
  
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
  exercise: Omit<Exercise, 'id' | 'sets' | 'primaryMuscles' | 'secondaryMuscles' | 'instructions' | 'category' | 'force' | 'mechanic' | 'order' >
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
    credentials: 'include', // ADD credentials
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
  const res = await fetch(`${BACKEND_URL}/api/exercises?workoutId=${workoutId}`, {
    ...fetchOptions, // ADD credentials
  });
  
  if (!res.ok) {
    throw new Error(`Failed to fetch exercises: ${res.status}`);
  }
  
  return res.json();
}

export async function removeExerciseFromWorkout(exerciseId: number): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/api/exercises/${exerciseId}`, {
    method: "DELETE",
    ...fetchOptions, // ADD credentials
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
    credentials: 'include', // ADD credentials
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to update exercise order: ${res.status} ${errorText}`);
  }
}

// Set management functions - ADD credentials to all
export const createSet = async (setData: {
  exerciseId: number;
  reps?: number;
  weight?: number;
  notes?: string;
}): Promise<Set> => {
  const response = await fetch(`${BACKEND_URL}/api/sets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(setData),
    credentials: 'include', // ADD
  });
  if (!response.ok) throw new Error('Failed to create set');
  return response.json();
};

export const updateSet = async (setId: number, setData: {
  reps?: number;
  weight?: number;
  notes?: string;
}): Promise<Set> => {
  const response = await fetch(`${BACKEND_URL}/api/sets/${setId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(setData),
    credentials: 'include', // ADD
  });
  if (!response.ok) throw new Error('Failed to update set');
  return response.json();
};

export const deleteSet = async (setId: number): Promise<void> => {
  const response = await fetch(`${BACKEND_URL}/api/sets/${setId}`, {
    method: 'DELETE',
    credentials: 'include', // ADD
  });
  if (!response.ok) throw new Error('Failed to delete set');
};

export const completeSet = async (setId: number): Promise<Set> => {
  const response = await fetch(`${BACKEND_URL}/api/sets/${setId}/complete`, {
    method: 'POST',
    credentials: 'include', // ADD
  });
  if (!response.ok) throw new Error('Failed to complete set');
  return response.json();
};

// Workout status functions - ADD credentials to all
export const startWorkout = async (workoutId: number): Promise<Workout> => {
  const response = await fetch(`${BACKEND_URL}/api/workouts/${workoutId}/start`, {
    method: 'POST',
    credentials: 'include', // ADD
  });
  if (!response.ok) throw new Error('Failed to start workout');
  return response.json();
};

export const completeWorkout = async (workoutId: number, elapsedTime: number): Promise<{
  resetWorkout: Workout;
  sessionData: {
    duration: number;
    completedAt: string;
    exerciseCount: number;
    totalSets: number;
    completedSets: number;
  }
}> => {
  const response = await fetch(`${BACKEND_URL}/api/workouts/${workoutId}/complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ elapsedTime }),
    credentials: 'include', // ADD
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Complete workout failed:', errorText);
    throw new Error(`Failed to complete workout: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (data.resetWorkout && data.sessionData) {
    return data;
  } else {
    throw new Error('Unexpected API response format');
  }
};

export const updateWorkoutStatus = async (workoutId: number, status: WorkoutStatus): Promise<Workout> => {
  const response = await fetch(`${BACKEND_URL}/api/workouts/${workoutId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
    credentials: 'include', // ADD
  });
  if (!response.ok) throw new Error('Failed to update workout status');
  return response.json();
};

// REMOVE userId parameter from duplicateWorkout
export const duplicateWorkout = async (workoutId: number): Promise<Workout> => {
  const response = await fetch(`${BACKEND_URL}/api/workouts/${workoutId}/duplicate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}), // Empty body since backend gets user from auth
    credentials: 'include', // ADD
  });
  if (!response.ok) throw new Error('Failed to duplicate workout');
  return response.json();
};

// REMOVE userId parameter from fetchWorkoutHistory
export const fetchWorkoutHistory = async (): Promise<WorkoutHistory[]> => {
  const response = await fetch(`${BACKEND_URL}/api/workout-history`, { // Changed endpoint
    credentials: 'include', // ADD
  });
  if (!response.ok) throw new Error('Failed to fetch workout history');
  return response.json();
};

export const fetchWorkoutHistoryById = async (historyId: number): Promise<WorkoutHistory> => {
  const response = await fetch(`${BACKEND_URL}/api/workout-history/${historyId}`, {
    credentials: 'include', // ADD
  });
  if (!response.ok) throw new Error('Failed to fetch workout history details');
  return response.json();
};

export const resetWorkout = async (workoutId: number): Promise<Workout> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/workouts/${workoutId}/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // ADD
    });

    if (!response.ok) {
      throw new Error(`Failed to reset workout: ${response.statusText}`);
    }

    const workout = await response.json();
    console.log(`Workout ${workoutId} reset successfully`);
    return workout;
  } catch (error) {
    console.error('Error resetting workout:', error);
    throw error;
  }
};