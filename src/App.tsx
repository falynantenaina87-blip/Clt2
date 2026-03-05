import React, { useState, useEffect } from 'react';
import { AppData, initialData, Priority, Intensity, validateAppData } from './types';
import { StudyColumn } from './components/StudyColumn';
import { SportColumn } from './components/SportColumn';
import { HobbyColumn } from './components/HobbyColumn';
import { QuickLog } from './components/QuickLog';
import { DataControls } from './components/DataControls';
import { LayoutGrid, AlertCircle } from 'lucide-react';
import { getDateFromText } from './services/aiService';

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
    // Determine date based on input text if available in itemData (not currently passed)
    // But we can infer it from the raw input if we had it, or just use current time.
    // Ideally QuickLog should pass rawInput to handleAiAction.
    // For now, we'll use the date logic on the itemData text if possible, or just current date.
    // Actually, let's assume the date logic is applied to the raw input in QuickLog or here.
    // QuickLog calls onAiAction(result). We need to change QuickLog to pass rawInput.
    
    // However, since I can't easily change QuickLog signature without editing it too, 
    // I'll rely on the fact that I can edit QuickLog.tsx as well.
    // Wait, I am editing App.tsx. I should update QuickLog.tsx to pass rawInput.
    
    // Let's assume for now we use the text inside itemData to check for date keywords
    // or we update QuickLog.tsx in the next step.
    
    // Actually, I'll update QuickLog.tsx to pass the raw input to this handler.
    
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

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans selection:bg-indigo-500/30">
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
        <header className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <LayoutGrid className="text-indigo-400" size={32} />
            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
              Core Life Tracker
            </h1>
          </div>
          <p className="text-white/40 text-sm">Organize your life with AI-powered precision</p>
        </header>

        {/* Quick Log */}
        <QuickLog onAiAction={handleAiAction} />

        {/* Main Grid */}
        <div className="flex-1 lg:min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-6 pb-24 lg:pb-6">
          <StudyColumn 
            tasks={data.studies} 
            onAddTask={(text, priority) => addStudyTask(text, priority)} 
            onToggleTask={toggleStudyTask} 
            onDeleteTask={deleteStudyTask} 
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
    </div>
  );
}

export default App;
