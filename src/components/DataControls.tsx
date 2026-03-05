import React, { useRef } from 'react';
import { Download, Upload } from 'lucide-react';
import { AppData } from '../types';

interface DataControlsProps {
  data: AppData;
  onImport: (data: AppData) => void;
}

export const DataControls: React.FC<DataControlsProps> = ({ data, onImport }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `core-life-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        // Basic validation could go here
        if (json.studies && json.sport && json.hobbies) {
          onImport(json);
        } else {
          alert("Invalid backup file format.");
        }
      } catch (error) {
        console.error("Import error:", error);
        alert("Failed to parse JSON file.");
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  return (
    <div className="fixed bottom-4 right-4 flex gap-2 z-50">
      <button
        onClick={handleExport}
        className="flex items-center gap-2 px-3 py-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg text-white/60 hover:text-white hover:bg-black/60 transition-all text-xs font-medium"
      >
        <Download size={14} /> Export JSON
      </button>
      <button
        onClick={handleImportClick}
        className="flex items-center gap-2 px-3 py-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg text-white/60 hover:text-white hover:bg-black/60 transition-all text-xs font-medium"
      >
        <Upload size={14} /> Import JSON
      </button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".json"
        className="hidden"
      />
    </div>
  );
};
