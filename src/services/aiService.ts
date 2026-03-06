import { GoogleGenAI } from "@google/genai";

// We support 3 separate keys to avoid rate limits.
// If the specific keys aren't provided, it falls back to the main key.
const mainKey = import.meta.env.VITE_GEMINI_API_KEY;
const quizKey = import.meta.env.VITE_GEMINI_QUIZ_KEY || mainKey;
const imageKey = import.meta.env.VITE_GEMINI_IMAGE_KEY || mainKey;

if (!mainKey) {
  console.error("VITE_GEMINI_API_KEY is missing. Core AI features will not work.");
}

let mainAi: GoogleGenAI | null = null;
let quizAi: GoogleGenAI | null = null;
let imageAi: GoogleGenAI | null = null;

if (mainKey) mainAi = new GoogleGenAI({ apiKey: mainKey });
if (quizKey) quizAi = new GoogleGenAI({ apiKey: quizKey });
if (imageKey) imageAi = new GoogleGenAI({ apiKey: imageKey });

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
  if (!mainAi) {
    console.error("Gemini API key is missing. Cannot parse input.");
    throw new Error("Gemini API key is missing");
  }

  try {
    const response = await mainAi.models.generateContent({
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

export async function generateQuiz(topic: string): Promise<any> {
  if (!quizAi) throw new Error("Gemini API key is missing");

  const prompt = `Create a 3-question multiple choice quiz about: "${topic}".
Return ONLY a JSON array of objects with this exact structure, nothing else:
[
  {
    "question": "The question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswerIndex": 0
  }
]`;

  try {
    const response = await quizAi.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating quiz:", error);
    throw error;
  }
}

export async function generateQuizFromImage(base64Data: string, mimeType: string): Promise<any> {
  if (!quizAi) throw new Error("Gemini API key is missing");

  const prompt = `Analyze this image (which could be notes, a book page, or a diagram). Create a comprehensive 5 to 7 question multiple-choice quiz based on the information found in the image.
Return ONLY a JSON array of objects with this exact structure, nothing else:
[
  {
    "question": "The question text",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswerIndex": 0
  }
]`;

  try {
    const response = await quizAi.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating quiz from image:", error);
    throw error;
  }
}

export async function breakdownTask(task: string): Promise<string[]> {
  if (!quizAi) throw new Error("Gemini API key is missing");

  const prompt = `Break down this complex task into 3 to 5 simple, actionable subtasks: "${task}".
Return ONLY a JSON array of strings, nothing else.
Example: ["Read chapter 1", "Summarize key points", "Create flashcards"]`;

  try {
    const response = await quizAi.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Error breaking down task:", error);
    throw error;
  }
}

export async function generateDailySummary(data: any): Promise<string> {
  if (!mainAi) throw new Error("Gemini API key is missing");

  const prompt = `Act as a motivational AI coach. Here is the user's current data:
Studies: ${JSON.stringify(data.studies)}
Sport: ${JSON.stringify(data.sport)}
Hobbies: ${JSON.stringify(data.hobbies)}

Write a short, encouraging 2-sentence summary of their progress and a tip for tomorrow. Keep it in French.`;

  try {
    const response = await mainAi.models.generateContent({
      model: modelId,
      contents: prompt,
    });
    return response.text || "Continue comme ça !";
  } catch (error) {
    console.error("Error generating summary:", error);
    throw error;
  }
}

export async function generateCoachAudio(text: string): Promise<string> {
  if (!mainAi) throw new Error("Gemini API key is missing");

  try {
    const response = await mainAi.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Puck" }
          }
        }
      }
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio generated");
    return base64Audio;
  } catch (error) {
    console.error("Error generating audio:", error);
    throw error;
  }
}

// Audio Playback Utilities
let currentAudioSource: AudioBufferSourceNode | null = null;
let audioContext: AudioContext | null = null;

export async function playCoachAudio(base64Audio: string, onEnded: () => void) {
  try {
    if (currentAudioSource) {
      currentAudioSource.stop();
    }
    if (!audioContext) {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }
    
    const binaryString = window.atob(base64Audio);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const buffer = new Int16Array(bytes.buffer);
    const float32Buffer = new Float32Array(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
      float32Buffer[i] = buffer[i] / 32768.0;
    }
    
    const audioBuffer = audioContext.createBuffer(1, float32Buffer.length, 24000);
    audioBuffer.getChannelData(0).set(float32Buffer);
    
    currentAudioSource = audioContext.createBufferSource();
    currentAudioSource.buffer = audioBuffer;
    currentAudioSource.connect(audioContext.destination);
    currentAudioSource.onended = onEnded;
    currentAudioSource.start();
  } catch (e) {
    console.error("Failed to play audio", e);
    onEnded();
  }
}

export function stopCoachAudio() {
  if (currentAudioSource) {
    currentAudioSource.stop();
    currentAudioSource = null;
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
