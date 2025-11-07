import React, { forwardRef } from 'react';
import { HistoryEntry } from '../App';
import { TrashIcon, BookmarkIcon, BookmarkSolidIcon } from './icons';

interface HistoryItemProps {
  entry: HistoryEntry;
  onLoad: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
  onToggleBookmark: (id: string) => void;
  isFocused: boolean;
}

export const HistoryItem = forwardRef<HTMLDivElement, HistoryItemProps>(({ entry, onLoad, onDelete, onToggleBookmark, isFocused }, ref) => {
  const formattedDate = new Date(entry.createdAt).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  return (
    <div 
        ref={ref}
        className={`bg-slate-900/50 p-4 rounded-lg border border-slate-700 flex items-center justify-between hover:bg-slate-800/70 transition-all duration-200 ${isFocused ? 'ring-2 ring-cyan-500' : ''}`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-300 truncate">{entry.summaryText}</p>
        <p className="text-xs text-slate-500 mt-1">{formattedDate}</p>
      </div>
      <div className="flex items-center space-x-2 ml-4">
        <button
          onClick={() => onLoad(entry)}
          className="px-3 py-1 text-sm font-semibold text-cyan-300 bg-cyan-900/50 rounded-md hover:bg-cyan-800/70 transition-colors"
        >
          Load
        </button>
        <button
          onClick={() => onToggleBookmark(entry.id)}
          className={`p-2 rounded-full transition-colors ${entry.bookmarked ? 'text-yellow-400 hover:bg-yellow-900/50' : 'text-slate-400 hover:text-yellow-400 hover:bg-yellow-900/50'}`}
          aria-label={entry.bookmarked ? 'Remove bookmark' : 'Add bookmark'}
        >
            {entry.bookmarked ? <BookmarkSolidIcon className="w-4 h-4" /> : <BookmarkIcon className="w-4 h-4" />}
        </button>
        <button
          onClick={() => onDelete(entry.id)}
          className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-900/50 rounded-full transition-colors"
          aria-label="Delete summary"
        >
          <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});