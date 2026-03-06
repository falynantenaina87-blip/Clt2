import { GoogleGenAI } from "@google/genai";

// Use VITE_GEMINI_API_KEY. 
// We avoid process.env here to prevent "process is not defined" errors in browser environments (Vercel).
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey) {
  console.error("VITE_GEMINI_API_KEY is missing. AI features will not work.");
}

// Initialize safely. If no key, we can't make calls, but we shouldn't crash the app on load.
// We'll handle the missing key in the function call.
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

const modelId = "gemini-3-flash-preview";

const systemInstruction = `
You are an intelligent assistant for a personal tracking app called "Core Life Tracker".
Your goal is to categorize user input into one of three categories: "studies", "sport", or "hobbies".

Return a JSON object with the following structure:
{
  "category": "studies" | "sport" | "hobbies",
  "action": "add",
  "data": object
}

Specific data structures per category:

1. For "studies":
   "data": {
     "text": string (the task description),
     "priority": "low" | "medium" | "high" (infer priority if possible, default to medium)
   }

2. For "sport":
   "data": {
     "exercise": string (e.g., "Running", "Bench Press"),
     "details": string (e.g., "40 mins", "3 sets of 10 reps"),
     "intensity": "low" | "medium" | "high" (infer intensity, default to medium)
   }

3. For "hobbies":
   If it's a wish/goal/item to buy:
   "data": {
     "type": "wishlist",
     "text": string
   }
   If it's a general idea or project note:
   "data": {
     "type": "note",
     "text": string
   }

Example Inputs & Outputs:
Input: "Ran 5km in 30 mins hard"
Output: { "category": "sport", "action": "add", "data": { "exercise": "Running", "details": "5km in 30 mins", "intensity": "high" } }

Input: "Need to study for history exam"
Output: { "category": "studies", "action": "add", "data": { "text": "Study for history exam", "priority": "high" } }

Input: "I want to buy a new guitar"
Output: { "category": "hobbies", "action": "add", "data": { "type": "wishlist", "text": "Buy a new guitar" } }

Input: "Idea for a painting: sunset over the ocean"
Output: { "category": "hobbies", "action": "add", "data": { "type": "note", "text": "Idea for a painting: sunset over the ocean" } }
`;

export async function parseLogInput(input: string): Promise<any> {
  if (!ai) {
    console.error("Gemini API key is missing. Cannot parse input.");
    throw new Error("Gemini API key is missing");
  }

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: input,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("Error parsing log input:", error);
    throw error;
  }
}

export function getDateFromText(text: string): number {
  const lowerText = text.toLowerCase();
  const now = new Date();
  
  if (lowerText.includes('avant-hier')) {
    now.setDate(now.getDate() - 2);
  } else if (lowerText.includes('hier')) {
    now.setDate(now.getDate() - 1);
  }
  // 'demain' could be handled here too if needed, but usually logs are for past/present
  
  return now.getTime();
}
