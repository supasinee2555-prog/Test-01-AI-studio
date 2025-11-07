import React from 'react';
import { HistoryEntry } from '../App';
import { HistoryList } from './HistoryList';
import { CloseIcon, ClockIcon } from './icons';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  history: HistoryEntry[];
  onLoad: (entry: HistoryEntry) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
  onToggleBookmark: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, history, onLoad, onDelete, onClear, onToggleBookmark }) => {
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-30 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      ></div>

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-full max-w-sm bg-slate-900/80 backdrop-blur-lg border-r border-slate-700 shadow-2xl z-40 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sidebar-title"
      >
        <div className="flex flex-col h-full">
          <header className="flex items-center justify-between p-4 border-b border-slate-700 flex-shrink-0">
            <h2 id="sidebar-title" className="text-xl font-bold text-cyan-400 flex items-center">
              <ClockIcon className="w-6 h-6 mr-3" />
              History
            </h2>
            <div className="flex items-center space-x-2">
                {history.length > 0 && (
                    <button
                        onClick={onClear}
                        className="text-sm text-slate-400 hover:text-red-400 transition-colors"
                    >
                        Clear All
                    </button>
                )}
                <button
                    onClick={onClose}
                    className="p-2 rounded-full text-slate-400 hover:bg-slate-700 transition-colors"
                    aria-label="Close sidebar"
                >
                    <CloseIcon className="w-6 h-6" />
                </button>
            </div>
          </header>
          <div className="flex-grow overflow-y-auto p-4">
            {history.length > 0 ? (
                <>
                    <p className="text-sm text-slate-500 mb-4 px-2">Use Arrow Keys to navigate and Enter to load.</p>
                    <HistoryList
                        history={history}
                        onLoad={onLoad}
                        onDelete={onDelete}
                        onToggleBookmark={onToggleBookmark}
                    />
                </>
            ) : (
                <div className="text-center text-slate-500 mt-8 px-4">
                    <ClockIcon className="w-12 h-12 mx-auto text-slate-600" />
                    <p className="mt-4">Your generated summaries will appear here.</p>
                </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};