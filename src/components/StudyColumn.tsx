import React, { useState } from 'react';
import { StudyTask, Priority } from '../types';
import { PomodoroTimer } from './PomodoroTimer';
import { CheckCircle2, Circle, Trash2, Plus, Wand2, BrainCircuit, X } from 'lucide-react';
import { generateQuiz, breakdownTask } from '../services/aiService';

interface StudyColumnProps {
  tasks: StudyTask[];
  savedQuizzes: any[];
  onAddTask: (text: string, priority: Priority) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onSaveQuiz: (topic: string, questions: any[]) => void;
  onDeleteQuiz: (id: string) => void;
}

export const StudyColumn: React.FC<StudyColumnProps> = ({ tasks, savedQuizzes, onAddTask, onToggleTask, onDeleteTask, onSaveQuiz, onDeleteQuiz }) => {
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('medium');
  
  // Quiz State
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [quizTopic, setQuizTopic] = useState('');
  const [quizData, setQuizData] = useState<any[] | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizError, setQuizError] = useState<string | null>(null);

  // Task Breakdown State
  const [breakingDownTaskId, setBreakingDownTaskId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskText.trim()) {
      onAddTask(newTaskText, newTaskPriority);
      setNewTaskText('');
    }
  };

  const handleBreakdown = async (task: StudyTask) => {
    setBreakingDownTaskId(task.id);
    try {
      const subtasks = await breakdownTask(task.text);
      if (subtasks && subtasks.length > 0) {
        // Add each subtask
        subtasks.forEach(st => onAddTask(`- ${st}`, task.priority));
        // Optionally delete the original task, but let's keep it and just add subtasks
      }
    } catch (error) {
      console.error("Failed to breakdown task", error);
    } finally {
      setBreakingDownTaskId(null);
    }
  };

  const handleGenerateQuiz = async () => {
    if (!quizTopic.trim()) return;
    setIsGeneratingQuiz(true);
    setQuizData(null);
    setQuizFinished(false);
    setCurrentQuestionIndex(0);
    setQuizScore(0);
    setSelectedAnswer(null);
    setQuizError(null);

    try {
      const data = await generateQuiz(quizTopic);
      if (data && data.length > 0) {
        setQuizData(data);
        onSaveQuiz(quizTopic, data); // Save to history
      } else {
        setQuizError("L'IA n'a pas renvoyé de quiz valide. Veuillez réessayer.");
      }
    } catch (error: any) {
      console.error("Failed to generate quiz", error);
      setQuizError("Erreur de connexion à l'IA. Si vous avez fait beaucoup de requêtes, attendez 1 minute (limite de 15/min).");
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const handleReplayQuiz = (quiz: any) => {
    setQuizTopic(quiz.topic);
    setQuizData(quiz.questions);
    setQuizFinished(false);
    setCurrentQuestionIndex(0);
    setQuizScore(0);
    setSelectedAnswer(null);
  };

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null || !quizData) return;
    setSelectedAnswer(index);
    
    const isCorrect = index === quizData[currentQuestionIndex].correctAnswerIndex;
    if (isCorrect) setQuizScore(s => s + 1);

    setTimeout(() => {
      if (currentQuestionIndex < quizData.length - 1) {
        setCurrentQuestionIndex(i => i + 1);
        setSelectedAnswer(null);
      } else {
        setQuizFinished(true);
      }
    }, 1500);
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'high': return 'text-rose-400';
      case 'medium': return 'text-amber-400';
      case 'low': return 'text-emerald-400';
    }
  };

  return (
    <div className="flex flex-col h-full gap-6">
      <PomodoroTimer />
      
      <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 flex-1 flex flex-col min-h-0 relative">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-2 h-8 bg-indigo-500 rounded-full"></span>
            Studies
          </h2>
          <button 
            onClick={() => setIsQuizModalOpen(true)}
            className="flex items-center gap-2 text-xs font-medium bg-indigo-500/20 text-indigo-300 px-3 py-1.5 rounded-lg hover:bg-indigo-500/30 transition-colors"
          >
            <BrainCircuit size={16} />
            AI Quiz
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mb-4 flex gap-2">
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="New task..."
            className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
          <select
            value={newTaskPriority}
            onChange={(e) => setNewTaskPriority(e.target.value as Priority)}
            className="bg-black/20 border border-white/10 rounded-lg px-2 text-white/70 text-sm focus:outline-none"
          >
            <option value="low">Low</option>
            <option value="medium">Med</option>
            <option value="high">High</option>
          </select>
          <button
            type="submit"
            className="bg-indigo-500/20 text-indigo-300 p-2 rounded-lg hover:bg-indigo-500/30 transition-colors"
          >
            <Plus size={20} />
          </button>
        </form>

        <div className="overflow-y-auto flex-1 space-y-2 pr-1 custom-scrollbar">
          {tasks.length === 0 && (
            <div className="text-white/30 text-center py-8 italic text-sm">No tasks yet. Time to learn!</div>
          )}
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`group flex items-center gap-3 p-3 rounded-lg border border-white/5 transition-all ${
                task.completed ? 'bg-white/5 opacity-50' : 'bg-white/10 hover:bg-white/15'
              }`}
            >
              <button
                onClick={() => onToggleTask(task.id)}
                className="text-white/50 hover:text-indigo-400 transition-colors"
              >
                {task.completed ? <CheckCircle2 size={20} className="text-indigo-400" /> : <Circle size={20} />}
              </button>
              <div className="flex-1 min-w-0">
                <p className={`text-sm truncate ${task.completed ? 'line-through text-white/30' : 'text-white'}`}>
                  {task.text}
                </p>
                <span className={`text-xs font-medium uppercase tracking-wider ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
              </div>
              
              {!task.completed && (
                <button
                  onClick={() => handleBreakdown(task)}
                  disabled={breakingDownTaskId === task.id}
                  title="Break down with AI"
                  className={`opacity-0 group-hover:opacity-100 transition-all p-1 ${
                    breakingDownTaskId === task.id ? 'text-indigo-400 animate-pulse opacity-100' : 'text-white/30 hover:text-indigo-400'
                  }`}
                >
                  <Wand2 size={16} />
                </button>
              )}
              
              <button
                onClick={() => onDeleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-rose-400 transition-all p-1"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* Quiz Modal Overlay */}
        {isQuizModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[#1e293b] border border-white/10 rounded-2xl w-full max-w-md p-6 shadow-2xl relative flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-white flex items-center gap-2 text-lg">
                  <BrainCircuit className="text-indigo-400" size={24} />
                  AI Quiz Generator
                </h3>
                <button onClick={() => setIsQuizModalOpen(false)} className="text-white/50 hover:text-white transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                {!quizData && !isGeneratingQuiz && (
                  <div className="flex flex-col gap-4 justify-center py-4">
                    <p className="text-sm text-white/60 text-center mb-2">
                      Enter a topic you want to review, and AI will generate a quick 3-question quiz.
                    </p>
                    <input
                      type="text"
                      value={quizTopic}
                      onChange={(e) => setQuizTopic(e.target.value)}
                      placeholder="e.g., French Revolution, React Hooks..."
                      className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-indigo-500/50"
                      autoFocus
                    />
                    <button
                      onClick={handleGenerateQuiz}
                      disabled={!quizTopic.trim()}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors mt-2"
                    >
                      Generate Quiz
                    </button>

                    {quizError && (
                      <div className="text-rose-400 text-sm bg-rose-500/10 p-3 rounded-lg border border-rose-500/20 mt-2">
                        {quizError}
                      </div>
                    )}

                    {savedQuizzes && savedQuizzes.length > 0 && (
                      <div className="mt-6 border-t border-white/10 pt-4">
                        <h4 className="text-sm font-medium text-white/70 mb-3">Saved Quizzes</h4>
                        <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                          {savedQuizzes.map(quiz => (
                            <div key={quiz.id} className="flex items-center justify-between bg-white/5 p-3 rounded-lg hover:bg-white/10 transition-colors">
                              <button 
                                onClick={() => handleReplayQuiz(quiz)}
                                className="flex-1 text-left text-sm text-white truncate"
                              >
                                {quiz.topic}
                              </button>
                              <button 
                                onClick={() => onDeleteQuiz(quiz.id)}
                                className="text-white/30 hover:text-rose-400 p-1"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {isGeneratingQuiz && (
                  <div className="flex flex-col items-center justify-center py-12 gap-4">
                    <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-indigo-300 animate-pulse">Crafting your quiz...</p>
                  </div>
                )}

                {quizData && !quizFinished && (
                  <div className="flex flex-col">
                    <div className="flex justify-between text-xs text-white/50 mb-6 font-mono bg-black/20 p-2 rounded-lg">
                      <span>Question {currentQuestionIndex + 1} of {quizData.length}</span>
                      <span>Score: {quizScore}</span>
                    </div>
                    
                    <p className="text-white font-medium mb-8 leading-relaxed text-lg">
                      {quizData[currentQuestionIndex].question}
                    </p>

                    <div className="space-y-3">
                      {quizData[currentQuestionIndex].options.map((opt: string, idx: number) => {
                        const isSelected = selectedAnswer === idx;
                        const isCorrect = idx === quizData[currentQuestionIndex].correctAnswerIndex;
                        const showResult = selectedAnswer !== null;
                        
                        let btnClass = "bg-white/5 border-white/10 hover:bg-white/10 text-white/80";
                        if (showResult) {
                          if (isCorrect) btnClass = "bg-emerald-500/20 border-emerald-500/50 text-emerald-200";
                          else if (isSelected) btnClass = "bg-rose-500/20 border-rose-500/50 text-rose-200";
                          else btnClass = "bg-white/5 border-white/10 text-white/30 opacity-50";
                        }

                        return (
                          <button
                            key={idx}
                            onClick={() => handleAnswer(idx)}
                            disabled={showResult}
                            className={`w-full text-left p-4 rounded-xl border transition-all text-sm ${btnClass}`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {quizFinished && (
                  <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
                    <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mb-4">
                      <span className="text-3xl font-bold text-indigo-300">{quizScore}/{quizData?.length}</span>
                    </div>
                    <h4 className="text-xl font-bold text-white">Quiz Complete!</h4>
                    <p className="text-white/60 mb-6">
                      {quizScore === quizData?.length ? "Perfect score! You nailed it." : "Good effort! Keep studying."}
                    </p>
                    <button
                      onClick={() => {
                        setQuizData(null);
                        setQuizTopic('');
                      }}
                      className="bg-white/10 hover:bg-white/20 text-white px-8 py-3 rounded-xl transition-colors font-medium w-full"
                    >
                      Try Another Topic
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
