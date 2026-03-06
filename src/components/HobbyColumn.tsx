import React, { useState } from 'react';
import { HobbyData, WishlistItem } from '../types';
import { Plus, CheckSquare, Square, Trash2, PenLine, Gift } from 'lucide-react';

interface HobbyColumnProps {
  data: HobbyData;
  onUpdateNotes: (notes: string) => void;
  onAddWishlistItem: (text: string) => void;
  onToggleWishlistItem: (id: string) => void;
  onDeleteWishlistItem: (id: string) => void;
}

export const HobbyColumn: React.FC<HobbyColumnProps> = ({ 
  data, 
  onUpdateNotes, 
  onAddWishlistItem, 
  onToggleWishlistItem, 
  onDeleteWishlistItem 
}) => {
  const [newWish, setNewWish] = useState('');

  const handleAddWish = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWish.trim()) {
      onAddWishlistItem(newWish);
      setNewWish('');
    }
  };

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Notes Section */}
      <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 flex-1 flex flex-col min-h-0 relative">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="w-2 h-8 bg-sky-500 rounded-full"></span>
            Creative Notes
          </h2>
        </div>
        <div className="flex-1 relative">
          <textarea
            value={data.notes}
            onChange={(e) => onUpdateNotes(e.target.value)}
            placeholder="Capture your ideas, dreams, and creative sparks here..."
            className="w-full h-full bg-black/20 border border-white/10 rounded-lg p-4 text-white/80 placeholder-white/30 focus:outline-none focus:border-sky-500/50 resize-none text-sm leading-relaxed custom-scrollbar"
          />
          <PenLine className="absolute bottom-4 right-4 text-white/10 pointer-events-none" size={24} />
        </div>
      </div>

      {/* Wishlist Section */}
      <div className="bg-white/5 backdrop-blur-md rounded-xl p-4 border border-white/10 flex-1 flex flex-col min-h-0">
        <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <Gift size={20} className="text-sky-400" />
          Wishlist
        </h2>
        
        <form onSubmit={handleAddWish} className="mb-3 flex gap-2">
          <input
            type="text"
            value={newWish}
            onChange={(e) => setNewWish(e.target.value)}
            placeholder="Add to wishlist..."
            className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/30 focus:outline-none focus:border-sky-500/50 text-sm"
          />
          <button
            type="submit"
            className="bg-sky-500/20 text-sky-300 p-2 rounded-lg hover:bg-sky-500/30 transition-colors"
          >
            <Plus size={18} />
          </button>
        </form>

        <div className="overflow-y-auto flex-1 space-y-2 pr-1 custom-scrollbar">
          {data.wishlist.length === 0 && (
            <div className="text-white/30 text-center py-4 italic text-xs">Make a wish!</div>
          )}
          {data.wishlist.map((item) => (
            <div
              key={item.id}
              className="group flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <button
                onClick={() => onToggleWishlistItem(item.id)}
                className="text-white/40 hover:text-sky-400 transition-colors"
              >
                {item.completed ? <CheckSquare size={18} className="text-sky-400" /> : <Square size={18} />}
              </button>
              <span className={`flex-1 text-sm ${item.completed ? 'line-through text-white/30' : 'text-white/80'}`}>
                {item.text}
              </span>
              <button
                onClick={() => onDeleteWishlistItem(item.id)}
                className="opacity-0 group-hover:opacity-100 text-white/30 hover:text-rose-400 transition-all"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
