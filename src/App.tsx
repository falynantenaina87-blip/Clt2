import React, { useState, useEffect } from 'react';
import { AppData, initialData, Priority, validateAppData } from './types';
import { AlertCircle, Sparkles, X, Loader2 } from 'lucide-react';
import { generateDailySummary, generateCoachAudio, playCoachAudio, stopCoachAudio } from './services/aiService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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

  const [newTaskText, setNewTaskText] = useState('');
  const [currentView, setCurrentView] = useState<'dashboard' | 'quiz'>('dashboard');

  // --- Quiz State ---
  const [quizTheme, setQuizTheme] = useState('');
  const [quizQuestionCount, setQuizQuestionCount] = useState(3);
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [quizFinished, setQuizFinished] = useState(false);

  const playQuestionAudio = async (questionObj: any) => {
    try {
      const textToRead = `${questionObj.question}. Options are: A. ${questionObj.options[0]}, B. ${questionObj.options[1]}, C. ${questionObj.options[2]}, D. ${questionObj.options[3]}`;
      const audioBase64 = await generateCoachAudio(textToRead);
      setIsAudioPlaying(true);
      playCoachAudio(audioBase64, () => setIsAudioPlaying(false));
    } catch (error) {
      console.error("Audio failed", error);
    }
  };

  const handleStartQuiz = async () => {
    const activeTasks = data.studies.filter(t => !t.completed).map(t => t.text).join(", ");
    const topic = quizTheme.trim() || activeTasks || "General Knowledge";
    
    setCurrentView('quiz');
    setIsGeneratingQuiz(true);
    setQuizQuestions([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setScore(0);
    setQuizFinished(false);

    try {
      const { generateQuiz } = await import('./services/aiService');
      const questions = await generateQuiz(topic, quizQuestionCount);
      setQuizQuestions(questions);
      if (questions.length > 0) {
        playQuestionAudio(questions[0]);
      }
    } catch (error) {
      setToastMessage("Failed to generate quiz.");
      setCurrentView('dashboard');
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleAnswerSelect = (index: number) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(index);
    const correct = index === quizQuestions[currentQuestionIndex].correctAnswerIndex;
    setIsCorrect(correct);
    const newScore = correct ? score + 1 : score;
    if (correct) setScore(newScore);

    setTimeout(() => {
      if (currentQuestionIndex < quizQuestions.length - 1) {
        setCurrentQuestionIndex(i => i + 1);
        setSelectedAnswer(null);
        setIsCorrect(null);
        playQuestionAudio(quizQuestions[currentQuestionIndex + 1]);
      } else {
        setQuizFinished(true);
        
        // Save quiz result
        const activeTasks = data.studies.filter(t => !t.completed).map(t => t.text).join(", ");
        const topic = quizTheme.trim() || activeTasks || "General Knowledge";
        
        setData(prev => ({
          ...prev,
          quizHistory: [
            ...prev.quizHistory,
            {
              id: crypto.randomUUID(),
              topic: topic,
              score: newScore,
              totalQuestions: quizQuestions.length,
              date: Date.now()
            }
          ]
        }));
      }
    }, 2000);
  };

  const handleCommandSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newTaskText.trim()) {
      addStudyTask(newTaskText.trim(), 'medium');
      setNewTaskText('');
    }
  };

  const completedTasks = data.studies.filter(t => t.completed).length;
  const totalTasks = data.studies.length;
  const performanceScore = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  if (currentView === 'quiz') {
    return (
      <div className="dark bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-display selection:bg-primary/30">
        {/* Top App Bar (Header) */}
        <header className="flex items-center bg-transparent p-6 justify-between">
          <div 
            onClick={() => setCurrentView('dashboard')}
            className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <span className="material-symbols-outlined text-slate-600 dark:text-slate-400">close</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase tracking-[0.2em] text-primary font-bold">Core Study</span>
            <h2 className="text-slate-900 dark:text-slate-100 text-sm font-semibold leading-tight">Focus Mode</h2>
          </div>
          <div className="flex size-10 items-center justify-end">
            <button 
              onClick={() => {
                if (quizQuestions.length > 0 && currentQuestionIndex < quizQuestions.length) {
                  playQuestionAudio(quizQuestions[currentQuestionIndex]);
                }
              }}
              className="flex items-center justify-center rounded-lg border border-slate-200 dark:border-slate-800 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="material-symbols-outlined text-primary">volume_up</span>
            </button>
          </div>
        </header>

        {/* Main Content (Centered Question) */}
        <main className="flex-1 flex flex-col justify-center px-6 max-w-xl mx-auto w-full">
          {isGeneratingQuiz ? (
            <div className="flex flex-col items-center justify-center gap-4">
              <Loader2 size={48} className="animate-spin text-primary" />
              <p className="text-slate-500 font-medium">Generating your personalized quiz...</p>
            </div>
          ) : quizFinished ? (
            <div className="flex flex-col items-center justify-center gap-6 text-center">
              <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100">Quiz Complete!</h1>
              <p className="text-xl text-slate-600 dark:text-slate-400">You scored {score} out of {quizQuestions.length}</p>
              <button 
                onClick={() => setCurrentView('dashboard')}
                className="mt-8 px-8 py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          ) : quizQuestions.length > 0 ? (
            <>
              {/* AI Reading Indicator */}
              <div className={`flex items-center justify-center gap-2 mb-8 ${isAudioPlaying ? 'animate-pulse opacity-100' : 'opacity-0'} transition-opacity`}>
                <div className="flex gap-0.5 items-center h-4">
                  <div className="w-0.5 h-2 bg-primary rounded-full"></div>
                  <div className="w-0.5 h-4 bg-primary rounded-full"></div>
                  <div className="w-0.5 h-3 bg-primary rounded-full"></div>
                  <div className="w-0.5 h-4 bg-primary rounded-full"></div>
                  <div className="w-0.5 h-2 bg-primary rounded-full"></div>
                </div>
                <p className="text-primary text-xs font-medium tracking-wide">AI VOICE ACTIVE</p>
              </div>

              {/* Question Text */}
              <h1 className="text-slate-900 dark:text-slate-100 tracking-tight text-3xl md:text-4xl font-bold leading-tight text-center mb-12">
                {quizQuestions[currentQuestionIndex].question}
              </h1>

              {/* Answer Buttons */}
              <div className="flex flex-col gap-3 w-full">
                {quizQuestions[currentQuestionIndex].options.map((option: string, index: number) => {
                  const isSelected = selectedAnswer === index;
                  const isCorrectAnswer = index === quizQuestions[currentQuestionIndex].correctAnswerIndex;
                  const showCorrect = selectedAnswer !== null && isCorrectAnswer;
                  const showIncorrect = selectedAnswer !== null && isSelected && !isCorrectAnswer;
                  
                  let buttonClass = "group flex items-center justify-between w-full px-6 py-5 bg-white dark:bg-slate-900/50 border rounded-xl transition-all duration-200 shadow-sm ";
                  let textClass = "font-medium transition-colors ";
                  let iconClass = "text-xs font-mono ";
                  let iconContent = String.fromCharCode(65 + index); // A, B, C, D

                  if (showCorrect) {
                    buttonClass += "border-green-500 bg-green-50 dark:bg-green-500/10 shadow-[0_0_15px_rgba(34,197,94,0.2)]";
                    textClass += "text-green-700 dark:text-green-400 font-semibold";
                    iconClass += "material-symbols-outlined text-green-500 text-sm";
                    iconContent = "check_circle";
                  } else if (showIncorrect) {
                    buttonClass += "border-red-500 bg-red-50 dark:bg-red-500/10";
                    textClass += "text-red-700 dark:text-red-400 font-semibold";
                    iconClass += "material-symbols-outlined text-red-500 text-sm";
                    iconContent = "cancel";
                  } else if (selectedAnswer === null) {
                    buttonClass += "border-slate-200 dark:border-slate-800 hover:border-primary dark:hover:border-primary/50 active:scale-[0.98]";
                    textClass += "text-slate-700 dark:text-slate-300 group-hover:text-primary";
                    iconClass += "text-slate-400";
                  } else {
                    buttonClass += "border-slate-200 dark:border-slate-800 opacity-50";
                    textClass += "text-slate-500";
                    iconClass += "text-slate-400";
                  }

                  return (
                    <button 
                      key={index}
                      onClick={() => handleAnswerSelect(index)}
                      disabled={selectedAnswer !== null}
                      className={buttonClass}
                    >
                      <span className={textClass}>{option}</span>
                      <span className={iconClass}>{iconContent}</span>
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-6 text-center">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Ready to test your knowledge?</h1>
              <p className="text-slate-600 dark:text-slate-400">We'll generate a quiz based on your active study tasks.</p>
              <button 
                onClick={handleStartQuiz}
                className="mt-4 px-8 py-4 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors"
              >
                Start Quiz
              </button>
            </div>
          )}
        </main>

        {/* Bottom Footer (Progress) */}
        {!isGeneratingQuiz && !quizFinished && quizQuestions.length > 0 && (
          <footer className="p-8 max-w-xl mx-auto w-full">
            <div className="flex flex-col gap-4">
              <div className="flex items-end justify-between">
                <div className="flex flex-col">
                  <span className="text-slate-400 dark:text-slate-500 text-xs font-medium uppercase tracking-widest mb-1">Current Progress</span>
                  <p className="text-slate-900 dark:text-slate-100 text-lg font-bold tabular-nums">
                    Question {(currentQuestionIndex + 1).toString().padStart(2, '0')} <span className="text-slate-400 font-normal">/ {quizQuestions.length.toString().padStart(2, '0')}</span>
                  </p>
                </div>
                <p className="text-slate-400 dark:text-slate-500 text-xs font-medium italic">
                  {quizQuestions.length - currentQuestionIndex - 1} remaining
                </p>
              </div>
              {/* Linear style progress bar */}
              <div className="relative h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-500" 
                  style={{ width: `${((currentQuestionIndex) / quizQuestions.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </footer>
        )}
        {/* Bottom Safe Area Spacer */}
        <div className="h-6 w-full"></div>
      </div>
    );
  }

  return (
    <div className="dark bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-display">
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
            <h1 className="text-3xl font-bold text-white tracking-widest">CORE STUDY</h1>
            <p className="text-indigo-400 mt-2 text-sm tracking-widest uppercase">Tracker</p>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-rose-500/90 text-white px-4 py-2 rounded-lg shadow-lg backdrop-blur-md flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={18} />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-white">
            <span className="material-symbols-outlined text-[20px]">terminal</span>
          </div>
          <h1 className="text-base font-semibold tracking-tight">Core Study</h1>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setToastMessage("No new notifications")}
            className="text-slate-500 dark:text-slate-400 hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <div 
            onClick={() => setToastMessage("Profile settings coming soon")}
            className="size-8 rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-800 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
          >
            <img alt="User avatar" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCljjx9FRyvaKbzwNsdNjf_nujDPlLTHDyHyAdOxOPYTrZ-gg1ahfFLSy2fB6NDkDaEoxxkKcFQ2sKAr4W8FpVsrtrYoGn3psI6TcLHT1jOGXQw2ZRgN8hKL-BDaY5uyGNWFORcXSF9AP9fWlIhRN1MUD0IisAkIbLhnVsyYaijMsVEl9cHGT-Xj3l4cYDHFr34y3pT8EtwuB7J3JDOozNJb52Z3mu9fHp7OxsKdLjFf0CTBJh40HwsfgHXgvx1b6uyCyL8L3LtOk8" />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-6 custom-scrollbar">
        {/* Command Input Section */}
        <section className="relative">
          <div className="flex items-center gap-2 bg-slate-200/50 dark:bg-white/5 border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 focus-within:ring-1 focus-within:ring-primary/50 transition-all">
            <span className="material-symbols-outlined text-slate-400 dark:text-slate-500 text-[20px]">keyboard_command_key</span>
            <input 
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyDown={handleCommandSubmit}
              className="bg-transparent border-none focus:ring-0 text-sm w-full placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none" 
              placeholder="Type a command or task and press Enter..." 
            />
            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-600 border border-slate-300 dark:border-white/10 px-1.5 py-0.5 rounded uppercase">K</span>
          </div>
        </section>

        {/* Task Manager Bento Box */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Active Tasks</h2>
          </div>
          <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-white/5 max-h-[300px] overflow-y-auto custom-scrollbar">
              {data.studies.length === 0 ? (
                <div className="p-4 text-center text-sm text-slate-500">No active tasks. Add one above!</div>
              ) : (
                data.studies.map(task => (
                  <div key={task.id} className="flex items-center gap-3 p-4 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">
                    <input 
                      type="checkbox" 
                      checked={task.completed}
                      onChange={() => toggleStudyTask(task.id)}
                      className="h-4 w-4 rounded-sm border-slate-300 dark:border-white/20 bg-transparent text-primary focus:ring-0 focus:ring-offset-0 cursor-pointer" 
                    />
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${task.completed ? 'line-through text-slate-500' : ''}`}>
                        {task.text}
                      </p>
                    </div>
                    <button onClick={() => deleteStudyTask(task.id)} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-500 transition-opacity">
                      <X size={16} />
                    </button>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      task.priority === 'high' ? 'bg-red-500/10 text-red-500' :
                      task.priority === 'medium' ? 'bg-primary/10 text-primary' :
                      'bg-slate-500/10 text-slate-500'
                    }`}>
                      {task.priority === 'high' ? 'High' : task.priority === 'medium' ? 'Med' : 'Low'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        {/* Metrics & AI Coach Grid */}
        <div className="bento-grid">
          {/* Study Performance */}
          <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500">Performance</h3>
            <div className="flex items-end gap-1.5 h-16">
              <div className="flex-1 bg-primary/20 rounded-t-sm h-[40%]"></div>
              <div className="flex-1 bg-primary/40 rounded-t-sm h-[70%]"></div>
              <div className="flex-1 bg-primary rounded-t-sm h-[90%]"></div>
              <div className="flex-1 bg-primary/60 rounded-t-sm h-[55%]"></div>
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight">{performanceScore}%</p>
              <p className="text-[10px] text-slate-400">Completion rate</p>
            </div>
          </div>

          {/* Start Quiz */}
          <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <h3 className="text-xs font-semibold text-slate-400 dark:text-slate-500">Test Knowledge</h3>
              <span className="material-symbols-outlined text-[18px] text-primary">quiz</span>
            </div>
            <div className="py-2 space-y-2">
              <input
                type="text"
                value={quizTheme}
                onChange={(e) => setQuizTheme(e.target.value)}
                placeholder="Custom theme (optional)"
                className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-primary/50 outline-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 uppercase">Questions: {quizQuestionCount}</span>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={quizQuestionCount}
                  onChange={(e) => setQuizQuestionCount(parseInt(e.target.value))}
                  className="w-24 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-700"
                />
              </div>
            </div>
            <button 
              onClick={handleStartQuiz}
              className="w-full py-1.5 bg-primary text-white rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors"
            >
              Start
            </button>
          </div>
        </div>

        {/* Quiz Results Chart */}
        {data.quizHistory.length > 0 && (
          <section className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">Quiz History</h3>
            </div>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.quizHistory.slice(-10)} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <XAxis 
                    dataKey="topic" 
                    tick={{ fontSize: 10, fill: '#94a3b8' }} 
                    tickFormatter={(value) => value.length > 10 ? value.substring(0, 10) + '...' : value}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: '#94a3b8' }} 
                    domain={[0, 'dataMax']} 
                    allowDecimals={false}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', fontSize: '12px', color: '#f8fafc' }}
                    formatter={(value: number, name: string, props: any) => [`${value} / ${props.payload.totalQuestions}`, 'Score']}
                    labelFormatter={(label) => `Topic: ${label}`}
                  />
                  <Bar dataKey="score" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* AI Coach Section */}
        <section className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[20px]">auto_awesome</span>
              <h3 className="text-sm font-semibold text-primary">AI Coach</h3>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleGetCoachSummary}
                disabled={isGeneratingCoach}
                className="size-8 rounded-full bg-primary/20 text-primary flex items-center justify-center hover:bg-primary/30 transition-colors disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-[18px] ${isGeneratingCoach ? 'animate-spin' : ''}`}>
                  {isGeneratingCoach ? 'refresh' : 'chat'}
                </span>
              </button>
              <button 
                onClick={handlePlayAudio}
                disabled={!coachMessage || isAudioLoading}
                className="size-8 rounded-full bg-primary text-white flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
              >
                {isAudioLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[18px]">
                    {isAudioPlaying ? 'stop' : 'play_arrow'}
                  </span>
                )}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300 italic">
              {coachMessage ? `"${coachMessage}"` : '"Click the chat icon to generate a personalized review of your tasks."'}
            </p>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-white dark:bg-white/5 rounded text-[10px] border border-slate-200 dark:border-white/5 text-slate-400">Personalized</span>
              <span className="px-2 py-1 bg-white dark:bg-white/5 rounded text-[10px] border border-slate-200 dark:border-white/5 text-slate-400">Real-time</span>
            </div>
          </div>
        </section>
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="sticky bottom-0 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-xl border-t border-slate-200 dark:border-white/5 px-6 pb-8 pt-3 flex justify-around items-center">
        <button 
          onClick={() => setCurrentView('dashboard')}
          className={`flex flex-col items-center gap-1 transition-colors ${currentView === 'dashboard' ? 'text-primary' : 'text-slate-400 dark:text-slate-500 hover:text-primary'}`}
        >
          <span className="material-symbols-outlined">grid_view</span>
        </button>
        <button 
          onClick={() => setCurrentView('quiz')}
          className={`flex flex-col items-center gap-1 transition-colors ${currentView === 'quiz' ? 'text-primary' : 'text-slate-400 dark:text-slate-500 hover:text-primary'}`}
        >
          <span className="material-symbols-outlined">quiz</span>
        </button>
      </nav>
    </div>
  );
}

export default App;
