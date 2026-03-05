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

export interface AppData {
  studies: StudyTask[];
  sport: WorkoutLog[];
  hobbies: HobbyData;
}

export const initialData: AppData = {
  studies: [],
  sport: [],
  hobbies: {
    notes: '',
    wishlist: [],
  },
};

export function validateAppData(data: any): AppData {
  if (!data || typeof data !== 'object') return initialData;
  
  const validStudies = Array.isArray(data.studies) ? data.studies : [];
  const validSport = Array.isArray(data.sport) ? data.sport : [];
  const validHobbies = (data.hobbies && typeof data.hobbies === 'object') ? data.hobbies : { notes: '', wishlist: [] };
  
  // Ensure nested structures are correct
  if (typeof validHobbies.notes !== 'string') validHobbies.notes = '';
  if (!Array.isArray(validHobbies.wishlist)) validHobbies.wishlist = [];

  return {
    studies: validStudies,
    sport: validSport,
    hobbies: validHobbies
  };
}
