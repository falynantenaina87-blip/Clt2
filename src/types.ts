export type Priority = 'low' | 'medium' | 'high';

export interface StudyTask {
  id: string;
  text: string;
  priority: Priority;
  completed: boolean;
  createdAt: number;
}

export interface SavedQuiz {
  id: string;
  topic: string;
  questions: any[];
  date: number;
}

export interface QuizResult {
  id: string;
  topic: string;
  score: number;
  totalQuestions: number;
  date: number;
}

export interface AppData {
  studies: StudyTask[];
  savedQuizzes: SavedQuiz[];
  quizHistory: QuizResult[];
}

export const initialData: AppData = {
  studies: [],
  savedQuizzes: [],
  quizHistory: [],
};

export function validateAppData(data: any): AppData {
  if (!data || typeof data !== 'object') return initialData;
  
  const validStudies = Array.isArray(data.studies) ? data.studies : [];
  const validSavedQuizzes = Array.isArray(data.savedQuizzes) ? data.savedQuizzes : [];
  const validQuizHistory = Array.isArray(data.quizHistory) ? data.quizHistory : [];
  
  return {
    studies: validStudies,
    savedQuizzes: validSavedQuizzes,
    quizHistory: validQuizHistory
  };
}
