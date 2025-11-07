import React, { useState, useEffect, useRef } from 'react';
import { HistoryEntry } from '../App';
import { HistoryItem } from './HistoryItem';
import { ClockIcon } from './icons';

interface HistoryListProps {
  history: HistoryEntry[];
  onLoad: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ history, onLoad, onDelete, onClear }) => {
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    itemRefs.current = itemRefs.current.slice(0, history.length);
  }, [history]);
  
  useEffect(() => {
    if (focusedIndex !== -1 && itemRefs.current[focusedIndex]) {
        itemRefs.current[focusedIndex]?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
        });
    }
  }, [focusedIndex]);


  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (history.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setFocusedIndex(prev => (prev < history.length - 1 ? prev + 1 : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setFocusedIndex(prev => (prev > 0 ? prev - 1 : history.length - 1));
    } else if (event.key === 'Enter' && focusedIndex !== -1) {
      event.preventDefault();
      onLoad(history[focusedIndex]);
    }
  };


  if (history.length === 0) {
    return null; // Don't render anything if there's no history
  }

  return (
    <div 
        className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-8 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        ref={listRef}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-cyan-400 flex items-center">
            <ClockIcon className="w-6 h-6 mr-3" />
            Your History
        </h2>
        <button
          onClick={onClear}
          className="text-sm text-slate-400 hover:text-red-400 transition-colors"
        >
          Clear All
        </button>
      </div>
      <p className="text-sm text-slate-500 mb-4 -mt-2">Use Arrow Keys to navigate and Enter to load.</p>
      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        {history.map((entry, index) => (
          <HistoryItem
            key={entry.id}
            // FIX: Changed arrow function to use a block body. A ref callback must not return a value.
            ref={el => { itemRefs.current[index] = el; }}
            entry={entry}
            onLoad={onLoad}
            onDelete={onDelete}
            isFocused={index === focusedIndex}
          />
        ))}
      </div>
    </div>
  );
};