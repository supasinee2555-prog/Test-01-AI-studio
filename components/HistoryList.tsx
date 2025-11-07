import React, { useState, useEffect, useRef } from 'react';
import { HistoryEntry } from '../App';
import { HistoryItem } from './HistoryItem';

interface HistoryListProps {
  history: HistoryEntry[];
  onLoad: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
  onToggleBookmark: (id: string) => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({ history, onLoad, onDelete, onToggleBookmark }) => {
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const listRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    // Reset focus when history changes
    setFocusedIndex(-1);
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
    return null;
  }

  return (
    <div 
        className="focus:outline-none"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        ref={listRef}
        autoFocus // Auto-focus for keyboard navigation when it appears
    >
      <div className="space-y-4">
        {history.map((entry, index) => (
          <HistoryItem
            key={entry.id}
            ref={el => { itemRefs.current[index] = el; }}
            entry={entry}
            onLoad={onLoad}
            onDelete={onDelete}
            onToggleBookmark={onToggleBookmark}
            isFocused={index === focusedIndex}
          />
        ))}
      </div>
    </div>
  );
};