import { Exercise } from "../services/api";

const muscleGroupMap: { [key: string]: string } = {
  quadriceps: 'Legs',
  hamstrings: 'Legs',
  calves: 'Legs',
  adductors: 'Legs',
  abductors: 'Legs',
  glutes: 'Legs',
  biceps: 'Arms',
  triceps: 'Arms',
  forearms: 'Arms',
  chest: 'Chest',
  shoulders: 'Shoulders',
  traps: 'Back',
  lats: 'Back',
  'middle back': 'Back',
  'lower back': 'Back',
  neck: 'Back',
  abdominals: 'Core',
};

export const getPrimaryMuscleGroup = (exercise: Exercise): string => {
  if (!exercise.primaryMuscles || exercise.primaryMuscles.length === 0) {
    return 'Other';
  }
  
  const primaryMuscle = exercise.primaryMuscles[0];
  return muscleGroupMap[primaryMuscle] || 'Other';
};

// You could also export the muscleGroupMap if needed elsewhere
export { muscleGroupMap };