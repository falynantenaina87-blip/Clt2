import React, { useState } from 'react';
import { StudyTask, Priority } from '../types';
import { PomodoroTimer } from './PomodoroTimer';
import { CheckCircle2, Circle, Trash2, Plus } from 'lucide-react';

interface StudyColumnProps {
  tasks: StudyTask[];
  onAddTask: (text: string, priority: Priority) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

export const StudyColumn: React.FC<StudyColumnProps> = ({ tasks, onAddTask, onToggleTask, onDeleteTask }) => {
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<Priority>('medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskText.trim()) {
      onAddTask(newTaskText, newTaskPriority);
      setNewTaskText('');
    }
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
      
      <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 flex-1 flex flex-col min-h-0">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-indigo-500 rounded-full"></span>
          Studies
        </h2>

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
              <button
                onClick={() => onDeleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-rose-400 transition-all p-1"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
