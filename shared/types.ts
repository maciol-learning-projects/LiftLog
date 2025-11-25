import { WorkoutStatus } from "../frontend/utils/workoutStatus";

export interface Workout {
  id: number; // This is correct - your schema uses Int
  name: string;
  date: string; // Keep as string for frontend display
  userId: string; // Add this missing field
  notes?: string;
  status: WorkoutStatus;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
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
  notes?: string;
  completed: boolean;
  completedAt?: string;
}

export interface WorkoutHistory {
  id: number;
  workoutId: number;
  name: string;
  userId: string;
  duration?: number;
  completedAt: string;
  exerciseCount: number;
  totalSets: number;
  completedSets: number;
  notes?: string;
}