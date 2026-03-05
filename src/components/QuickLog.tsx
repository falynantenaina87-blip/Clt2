import React, { useState } from 'react';
import { Sparkles, Loader2, ArrowRight } from 'lucide-react';
import { parseLogInput } from '../services/aiService';

interface QuickLogProps {
  onAiAction: (action: any, rawInput?: string, errorMessage?: string) => void;
}

export const QuickLog: React.FC<QuickLogProps> = ({ onAiAction }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const result = await parseLogInput(input);
      if (result) {
        onAiAction(result, input);
        setInput('');
      }
    } catch (error: any) {
      console.error("AI Error:", error);
      
      let msg = error?.message || "Unknown error";
      
      // Try to parse JSON error message if present
      if (typeof msg === 'string' && msg.includes('{')) {
        try {
          // Extract JSON part if mixed with text
          const jsonMatch = msg.match(/\{.*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.error?.message) {
              msg = parsed.error.message;
            }
          }
        } catch (e) {
          // Ignore parsing error
        }
      }

      // User-friendly overrides
      if (msg.includes("Quota exceeded") || msg.includes("429")) {
        msg = "Daily limit reached. Please try again later.";
      } else if (msg.includes("API key")) {
        msg = "Invalid API Key. Please check settings.";
      }

      onAiAction(null, input, `AI Error: ${msg}`);
      setInput('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-8 relative z-20">
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        <form onSubmit={handleSubmit} className="relative flex items-center bg-gray-900/90 backdrop-blur-xl rounded-xl border border-white/10 p-1 shadow-2xl">
          <div className="pl-4 pr-2 text-indigo-400">
            <Sparkles size={20} />
          </div>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Quick Log with AI: 'Ran 5km', 'Study Math', 'Idea for app'..."
            className="flex-1 bg-transparent border-none text-white placeholder-white/40 focus:ring-0 px-2 py-3 text-base"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-3 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 size={20} className="animate-spin" /> : <ArrowRight size={20} />}
          </button>
        </form>
      </div>
    </div>
  );
};
