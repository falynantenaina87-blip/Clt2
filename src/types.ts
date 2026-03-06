export type Priority = 'low' | 'medium' | 'high';
export type Intensity = 'low' | 'medium' | 'high';

export interface StudyTask {
  id: string;
  text: string;
  priority: Priority;
  completed: boolean;
  createdAt: number;
}

export interface WorkoutLog {
  id: string;
  exercise: string;
  details: string; // sets/reps or duration
  intensity: Intensity;
  date: number;
}

export interface WishlistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface HobbyData {
  notes: string;
  wishlist: WishlistItem[];
}

export interface SavedQuiz {
  id: string;
  topic: string;
  questions: any[];
  date: number;
}

export interface AppData {
  studies: StudyTask[];
  sport: WorkoutLog[];
  hobbies: HobbyData;
  savedQuizzes: SavedQuiz[];
}

export const initialData: AppData = {
  studies: [],
  sport: [],
  hobbies: {
    notes: '',
    wishlist: [],
  },
  savedQuizzes: [],
};

export function validateAppData(data: any): AppData {
  if (!data || typeof data !== 'object') return initialData;
  
  const validStudies = Array.isArray(data.studies) ? data.studies : [];
  const validSport = Array.isArray(data.sport) ? data.sport : [];
  const validHobbies = (data.hobbies && typeof data.hobbies === 'object') ? data.hobbies : { notes: '', wishlist: [] };
  const validSavedQuizzes = Array.isArray(data.savedQuizzes) ? data.savedQuizzes : [];
  
  // Ensure nested structures are correct
  if (typeof validHobbies.notes !== 'string') validHobbies.notes = '';
  if (!Array.isArray(validHobbies.wishlist)) validHobbies.wishlist = [];

  return {
    studies: validStudies,
    sport: validSport,
    hobbies: validHobbies,
    savedQuizzes: validSavedQuizzes
  };
}
