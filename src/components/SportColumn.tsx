import React, { useState } from 'react';
import { WorkoutLog, Intensity } from '../types';
import { Dumbbell, Plus, Trash2, Activity } from 'lucide-react';

interface SportColumnProps {
  logs: WorkoutLog[];
  onAddLog: (log: Omit<WorkoutLog, 'id' | 'date'>) => void;
  onDeleteLog: (id: string) => void;
}

export const SportColumn: React.FC<SportColumnProps> = ({ logs, onAddLog, onDeleteLog }) => {
  const [exercise, setExercise] = useState('');
  const [details, setDetails] = useState('');
  const [intensity, setIntensity] = useState<Intensity>('medium');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (exercise.trim() && details.trim()) {
      onAddLog({ exercise, details, intensity });
      setExercise('');
      setDetails('');
      setIntensity('medium');
    }
  };

  const getIntensityColor = (intensity: Intensity) => {
    switch (intensity) {
      case 'high': return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'medium': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'low': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 flex-1 flex flex-col min-h-0">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span className="w-2 h-8 bg-rose-500 rounded-full"></span>
          Sport
        </h2>

        <form onSubmit={handleSubmit} className="mb-6 space-y-3 bg-white/5 p-3 rounded-lg border border-white/5">
          <input
            type="text"
            value={exercise}
            onChange={(e) => setExercise(e.target.value)}
            placeholder="Exercise (e.g. Running)"
            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-rose-500/50 text-sm"
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Details (e.g. 5km, 3x10)"
              className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-rose-500/50 text-sm"
            />
            <select
              value={intensity}
              onChange={(e) => setIntensity(e.target.value as Intensity)}
              className="bg-black/20 border border-white/10 rounded-lg px-2 text-white/70 text-xs focus:outline-none"
            >
              <option value="low">Low</option>
              <option value="medium">Med</option>
              <option value="high">High</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-rose-500/20 text-rose-300 py-2 rounded-lg hover:bg-rose-500/30 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
          >
            <Plus size={16} /> Log Workout
          </button>
        </form>

        <div className="overflow-y-auto flex-1 space-y-3 pr-1 custom-scrollbar">
           {logs.length === 0 && (
            <div className="text-white/30 text-center py-8 italic text-sm">No workouts logged yet. Get moving!</div>
          )}
          {logs.map((log) => (
            <div
              key={log.id}
              className="relative group bg-white/10 rounded-lg p-3 border border-white/5 hover:bg-white/15 transition-all"
            >
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-medium text-white text-sm flex items-center gap-2">
                  <Dumbbell size={14} className="text-rose-400" />
                  {log.exercise}
                </h4>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border uppercase tracking-wider ${getIntensityColor(log.intensity)}`}>
                  {log.intensity}
                </span>
              </div>
              <p className="text-white/60 text-xs mb-2">{log.details}</p>
              <div className="flex justify-between items-end">
                <span className="text-[10px] text-white/30 font-mono">
                  {new Date(log.date).toLocaleDateString()}
                </span>
                <button
                  onClick={() => onDeleteLog(log.id)}
                  className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-rose-400 transition-all p-1"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
