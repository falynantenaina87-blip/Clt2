import React, { useState } from 'react';
import { HobbyData, WishlistItem } from '../types';
import { Plus, CheckSquare, Square, Trash2, PenLine, Gift, Image as ImageIcon, X, Download } from 'lucide-react';
import { generateImage } from '../services/aiService';

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
  
  // Image Generator State
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [imagePrompt, setImagePrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const handleAddWish = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWish.trim()) {
      onAddWishlistItem(newWish);
      setNewWish('');
    }
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return;
    setIsGeneratingImage(true);
    setGeneratedImage(null);
    setImageError(null);

    try {
      const imgData = await generateImage(imagePrompt);
      setGeneratedImage(imgData);
    } catch (error: any) {
      console.error("Failed to generate image", error);
      setImageError("Failed to generate image. Please try again or check your quota.");
    } finally {
      setIsGeneratingImage(false);
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
          <button 
            onClick={() => setIsImageModalOpen(true)}
            className="flex items-center gap-2 text-xs font-medium bg-sky-500/20 text-sky-300 px-3 py-1.5 rounded-lg hover:bg-sky-500/30 transition-colors"
          >
            <ImageIcon size={16} />
            AI Image
          </button>
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

      {/* Image Generator Modal */}
      {isImageModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#1e293b] border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-white flex items-center gap-2 text-lg">
                <ImageIcon className="text-sky-400" size={24} />
                AI Image Generator
              </h3>
              <button onClick={() => setIsImageModalOpen(false)} className="text-white/50 hover:text-white transition-colors">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-4">
              <p className="text-sm text-white/60">
                Describe an image you want to create. Note: Images are not saved permanently to save storage.
              </p>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="A futuristic city at sunset, cyberpunk style..."
                  className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-sky-500/50"
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerateImage()}
                />
                <button
                  onClick={handleGenerateImage}
                  disabled={!imagePrompt.trim() || isGeneratingImage}
                  className="bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium px-6 rounded-xl transition-colors"
                >
                  Generate
                </button>
              </div>

              {imageError && (
                <div className="text-rose-400 text-sm bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
                  {imageError}
                </div>
              )}

              {isGeneratingImage && (
                <div className="flex flex-col items-center justify-center py-12 gap-4 bg-black/20 rounded-xl border border-white/5">
                  <div className="w-10 h-10 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm text-sky-300 animate-pulse">Painting your imagination...</p>
                </div>
              )}

              {generatedImage && !isGeneratingImage && (
                <div className="flex flex-col gap-4 animate-in fade-in">
                  <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/40 aspect-square flex items-center justify-center">
                    <img 
                      src={generatedImage} 
                      alt={imagePrompt} 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <a 
                    href={generatedImage} 
                    download={`ai-image-${Date.now()}.png`}
                    className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl transition-colors font-medium"
                  >
                    <Download size={18} />
                    Download Image
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
