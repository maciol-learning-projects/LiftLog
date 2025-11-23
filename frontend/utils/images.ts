import { Exercise } from "../services/api";
// Function to get full exercise image URL
const getExerciseImageUrl = (exercise: Exercise): string | null => {
  if (!exercise.images || exercise.images.length === 0) {
    return null;
  }
  
  // Use the first image and construct the full URL
  const imagePath = exercise.images[0];
  return `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${imagePath}`;
};

export { getExerciseImageUrl };