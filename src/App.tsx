import React, { useState, useEffect } from 'react';
import { AppData, initialData, Priority, Intensity, validateAppData } from './types';
import { StudyColumn } from './components/StudyColumn';
import { SportColumn } from './components/SportColumn';
import { HobbyColumn } from './components/HobbyColumn';
import { QuickLog } from './components/QuickLog';
import { DataControls } from './components/DataControls';
import { LayoutGrid, AlertCircle, Sparkles, X, Volume2, Loader2, Square } from 'lucide-react';
import { getDateFromText, generateDailySummary, generateCoachAudio, playCoachAudio, stopCoachAudio } from './services/aiService';

function App() {
  const [data, setData] = useState<AppData>(() => {
    try {
      const saved = localStorage.getItem('coreLifeTrackerData');
      if (saved) {
        const parsed = JSON.parse(saved);
        return validateAppData(parsed);
      }
    } catch (error) {
      console.error("Failed to load data from localStorage:", error);
    }
    return initialData;
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  
  // AI Coach State
  const [isCoachModalOpen, setIsCoachModalOpen] = useState(false);
  const [coachMessage, setCoachMessage] = useState<string | null>(null);
  const [isGeneratingCoach, setIsGeneratingCoach] = useState(false);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  
  // Splash Screen State
  const [showSplash, setShowSplash] = useState(true);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setIsFading(true), 2500);
    const removeTimer = setTimeout(() => setShowSplash(false), 3000);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('coreLifeTrackerData', JSON.stringify(data));
    } catch (error) {
      console.error("Failed to save data to localStorage:", error);
      setToastMessage("Warning: Storage full, data may not be saved.");
    }
  }, [data]);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => setToastMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  // Stop audio when modal closes
  useEffect(() => {
    if (!isCoachModalOpen) {
      stopCoachAudio();
      setIsAudioPlaying(false);
    }
  }, [isCoachModalOpen]);

  const handlePlayAudio = async () => {
    if (isAudioPlaying) {
      stopCoachAudio();
      setIsAudioPlaying(false);
      return;
    }
    
    if (!coachMessage) return;
    setIsAudioLoading(true);
    try {
      const audioBase64 = await generateCoachAudio(coachMessage);
      setIsAudioLoading(false);
      setIsAudioPlaying(true);
      playCoachAudio(audioBase64, () => setIsAudioPlaying(false));
    } catch (error) {
      console.error(error);
      setIsAudioLoading(false);
      setToastMessage("Erreur lors de la génération de l'audio. Vérifiez votre quota.");
    }
  };

  const handleGetCoachSummary = async () => {
    setIsCoachModalOpen(true);
    setIsGeneratingCoach(true);
    setCoachMessage(null);
    try {
      const summary = await generateDailySummary(data);
      setCoachMessage(summary);
    } catch (error: any) {
      setCoachMessage("Désolé, je n'ai pas pu générer le résumé. Vérifiez votre clé API ou votre connexion.");
    } finally {
      setIsGeneratingCoach(false);
    }
  };

  const handleImport = (newData: AppData) => {
    setData(validateAppData(newData));
  };

  // --- Studies Handlers ---
  const addStudyTask = (text: string, priority: Priority, date?: number) => {
    setData(prev => ({
      ...prev,
      studies: [
        { id: crypto.randomUUID(), text, priority, completed: false, createdAt: date || Date.now() },
        ...prev.studies
      ]
    }));
  };

  const toggleStudyTask = (id: string) => {
    setData(prev => ({
      ...prev,
      studies: prev.studies.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
    }));
  };

  const deleteStudyTask = (id: string) => {
    setData(prev => ({
      ...prev,
      studies: prev.studies.filter(t => t.id !== id)
    }));
  };

  // --- Sport Handlers ---
  const addWorkoutLog = (log: { exercise: string; details: string; intensity: Intensity }, date?: number) => {
    setData(prev => ({
      ...prev,
      sport: [
        { id: crypto.randomUUID(), ...log, date: date || Date.now() },
        ...prev.sport
      ]
    }));
  };

  const deleteWorkoutLog = (id: string) => {
    setData(prev => ({
      ...prev,
      sport: prev.sport.filter(l => l.id !== id)
    }));
  };

  // --- Hobbies Handlers ---
  const updateNotes = (notes: string) => {
    setData(prev => ({
      ...prev,
      hobbies: { ...prev.hobbies, notes }
    }));
  };

  const addWishlistItem = (text: string) => {
    setData(prev => ({
      ...prev,
      hobbies: {
        ...prev.hobbies,
        wishlist: [...prev.hobbies.wishlist, { id: crypto.randomUUID(), text, completed: false }]
      }
    }));
  };

  const toggleWishlistItem = (id: string) => {
    setData(prev => ({
      ...prev,
      hobbies: {
        ...prev.hobbies,
        wishlist: prev.hobbies.wishlist.map(w => w.id === id ? { ...w, completed: !w.completed } : w)
      }
    }));
  };

  const deleteWishlistItem = (id: string) => {
    setData(prev => ({
      ...prev,
      hobbies: {
        ...prev.hobbies,
        wishlist: prev.hobbies.wishlist.filter(w => w.id !== id)
      }
    }));
  };

  // --- AI Action Handler ---
  const handleAiAction = (result: any, rawInput?: string, errorMessage?: string) => {
    // Fallback if result is null (error case handled in QuickLog but passed here if needed)
    if (!result && rawInput) {
       const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
       const newNote = `\n[${timestamp}] (Unclassified) ${rawInput}`;
       updateNotes(data.hobbies.notes + newNote);
       setToastMessage(errorMessage || "AI unavailable. Added to Notes.");
       return;
    }

    const { category, data: itemData } = result;
    const date = rawInput ? getDateFromText(rawInput) : Date.now();

    if (category === 'studies') {
      addStudyTask(itemData.text, itemData.priority || 'medium', date);
    } else if (category === 'sport') {
      addWorkoutLog({
        exercise: itemData.exercise,
        details: itemData.details,
        intensity: itemData.intensity || 'medium'
      }, date);
    } else if (category === 'hobbies') {
      if (itemData.type === 'wishlist') {
        addWishlistItem(itemData.text);
      } else {
        // Append to notes with a timestamp
        const timestamp = new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const newNote = `\n[${timestamp}] ${itemData.text}`;
        updateNotes(data.hobbies.notes + newNote);
      }
    }
  };

  // --- Quiz Handlers ---
  const saveQuiz = (topic: string, questions: any[]) => {
    setData(prev => ({
      ...prev,
      savedQuizzes: [
        { id: crypto.randomUUID(), topic, questions, date: Date.now() },
        ...(prev.savedQuizzes || [])
      ]
    }));
  };

  const deleteQuiz = (id: string) => {
    setData(prev => ({
      ...prev,
      savedQuizzes: (prev.savedQuizzes || []).filter(q => q.id !== id)
    }));
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans selection:bg-indigo-500/30">
      {/* Splash Screen */}
      {showSplash && (
        <div className={`fixed inset-0 z-[9999] bg-[#0f172a] flex flex-col items-center justify-center transition-opacity duration-500 ${isFading ? 'opacity-0' : 'opacity-100'}`}>
          <div className="relative flex flex-col items-center animate-in zoom-in duration-700">
            <img
              src="/intro.gif"
              alt="App Intro"
              className="w-48 h-48 object-contain mb-6 rounded-2xl shadow-2xl"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                const fallback = document.getElementById('fallback-icon');
                if (fallback) {
                  fallback.classList.remove('hidden');
                  fallback.classList.add('flex');
                }
              }}
            />
            <div id="fallback-icon" className="hidden flex-col items-center">
              <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mb-6 animate-pulse">
                <Sparkles size={40} className="text-indigo-400" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-white tracking-widest">CORE LIFE</h1>
            <p className="text-indigo-400 mt-2 text-sm tracking-widest uppercase">Tracker</p>
          </div>
        </div>
      )}

      {/* Background Gradients */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-900/20 rounded-full blur-[120px]"></div>
        <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] bg-sky-900/20 rounded-full blur-[120px]"></div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-rose-500/90 text-white px-4 py-2 rounded-lg shadow-lg backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={18} />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      <div className="relative z-10 container mx-auto px-4 py-6 flex flex-col lg:h-screen min-h-screen">
        {/* Header */}
        <header className="mb-8 text-center relative">
          <div className="flex items-center justify-center gap-3 mb-2">
            <LayoutGrid className="text-indigo-400" size={32} />
            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              Core Life Tracker
            </h1>
          </div>
          <p className="text-white/40 text-sm">Organize your life with AI-powered precision</p>
          
          <button 
            onClick={handleGetCoachSummary}
            className="absolute right-0 top-0 hidden md:flex items-center gap-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 px-4 py-2 rounded-full transition-colors text-sm font-medium"
          >
            <Sparkles size={16} />
            Bilan IA
          </button>
          
          {/* Mobile AI Coach Button */}
          <button 
            onClick={handleGetCoachSummary}
            className="md:hidden mt-4 mx-auto flex items-center gap-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 px-4 py-2 rounded-full transition-colors text-sm font-medium"
          >
            <Sparkles size={16} />
            Bilan IA
          </button>
        </header>

        {/* Quick Log */}
        <QuickLog onAiAction={handleAiAction} />

        {/* Main Grid */}
        <div className="flex-1 lg:min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-6 pb-24 lg:pb-6">
          <StudyColumn 
            tasks={data.studies} 
            savedQuizzes={data.savedQuizzes || []}
            onAddTask={(text, priority) => addStudyTask(text, priority)} 
            onToggleTask={toggleStudyTask} 
            onDeleteTask={deleteStudyTask} 
            onSaveQuiz={saveQuiz}
            onDeleteQuiz={deleteQuiz}
          />
          <SportColumn 
            logs={data.sport} 
            onAddLog={(log) => addWorkoutLog(log)} 
            onDeleteLog={deleteWorkoutLog} 
          />
          <HobbyColumn 
            data={data.hobbies} 
            onUpdateNotes={updateNotes} 
            onAddWishlistItem={addWishlistItem} 
            onToggleWishlistItem={toggleWishlistItem} 
            onDeleteWishlistItem={deleteWishlistItem} 
          />
        </div>
      </div>

      <DataControls data={data} onImport={handleImport} />

      {/* AI Coach Modal */}
      {isCoachModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1e293b] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
            <button 
              onClick={() => setIsCoachModalOpen(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Sparkles size={20} />
              </div>
              <h2 className="text-xl font-bold text-white">Ton Coach IA</h2>
            </div>

            {isGeneratingCoach ? (
              <div className="flex flex-col items-center justify-center py-8 gap-4">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-sm text-indigo-300 animate-pulse">Analyse de ta journée...</p>
              </div>
            ) : (
              <div className="text-white/90 leading-relaxed text-lg">
                {coachMessage}
              </div>
            )}
            
            {!isGeneratingCoach && coachMessage && (
              <div className="mt-8 flex flex-col gap-3">
                <button 
                  onClick={handlePlayAudio}
                  disabled={isAudioLoading}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-medium py-3 rounded-xl transition-colors"
                >
                  {isAudioLoading ? (
                    <><Loader2 size={18} className="animate-spin" /> Génération de la voix...</>
                  ) : isAudioPlaying ? (
                    <><Square size={18} className="fill-current" /> Arrêter la lecture</>
                  ) : (
                    <><Volume2 size={18} /> Écouter le bilan</>
                  )}
                </button>
                <button 
                  onClick={() => setIsCoachModalOpen(false)}
                  className="w-full bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-xl transition-colors"
                >
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
