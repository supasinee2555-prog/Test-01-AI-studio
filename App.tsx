import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateSummary, generateSpeech, SummaryLength } from './services/geminiService';
import { AudioPlayer } from './components/AudioPlayer';
import { Header } from './components/Header';
import { ArticleInput } from './components/ArticleInput';
import { SummaryDisplay } from './components/SummaryDisplay';
import { LoaderIcon, MenuIcon } from './components/icons';
import { Sidebar } from './components/Sidebar';

export interface HistoryEntry {
  id: string;
  summaryText: string;
  audioData: string;
  createdAt: string;
  bookmarked: boolean;
}

// Helper to safely decode Base64 to UTF-8 strings
const b64_to_utf8 = (str: string): string => {
    return decodeURIComponent(escape(window.atob(str)));
};

const App: React.FC = () => {
  const [articleText, setArticleText] = useState<string>('');
  const [summaryText, setSummaryText] = useState<string>('');
  const [audioData, setAudioData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [summaryLength, setSummaryLength] = useState<SummaryLength>('medium');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const audioPlayerRef = useRef<{ togglePlayback: () => void }>(null);

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('audioSummaryHistory');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error("Failed to load history from localStorage", error);
    }
  }, []);
  
  // Effect to load shared data from URL hash
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#data=')) {
      try {
        const encodedData = hash.substring(6);
        const decodedString = b64_to_utf8(encodedData);
        const data = JSON.parse(decodedString);

        if (data.s && data.a) {
          setSummaryText(data.s);
          setAudioData(data.a);
        }
      } catch (e) {
        console.error("Failed to parse shared data from URL hash", e);
        setError("Could not load the shared summary. The link may be corrupted.");
      } finally {
        // Clean up the URL
        window.history.replaceState(null, '', ' ');
      }
    }
  }, []);


  useEffect(() => {
    try {
      localStorage.setItem('audioSummaryHistory', JSON.stringify(history));
    } catch (error) {
      console.error("Failed to save history to localStorage", error);
    }
  }, [history]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' && audioData) {
        const target = event.target as HTMLElement;
        // Prevent toggling playback when focused on inputs or buttons
        if (target.tagName !== 'TEXTAREA' && target.tagName !== 'BUTTON') {
          event.preventDefault();
          audioPlayerRef.current?.togglePlayback();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [audioData]);


  const handleGenerateSummary = useCallback(async () => {
    if (!articleText.trim()) {
      setError('Please paste an article first.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSummaryText('');
    setAudioData(null);

    try {
      const summary = await generateSummary(articleText, summaryLength);
      setSummaryText(summary);

      const audio = await generateSpeech(summary);
      setAudioData(audio);

      const newEntry: HistoryEntry = {
        id: Date.now().toString(),
        summaryText: summary,
        audioData: audio,
        createdAt: new Date().toISOString(),
        bookmarked: false,
      };
      setHistory(prevHistory => [newEntry, ...prevHistory]);

    } catch (e) {
      console.error(e);
      setError('Failed to generate audio summary. Please check the console for details.');
    } finally {
      setIsLoading(false);
    }
  }, [articleText, summaryLength]);

  const handleLoadHistory = (entry: HistoryEntry) => {
    setSummaryText(entry.summaryText);
    setAudioData(entry.audioData);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsSidebarOpen(false); // Close sidebar after loading an item
  };

  const handleDeleteHistory = (idToDelete: string) => {
    setHistory(prevHistory => prevHistory.filter(entry => entry.id !== idToDelete));
  };

  const handleToggleBookmark = (idToToggle: string) => {
    setHistory(prevHistory =>
      prevHistory.map(entry =>
        entry.id === idToToggle ? { ...entry, bookmarked: !entry.bookmarked } : entry
      )
    );
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-900 text-slate-200 font-sans">
       <button
        onClick={() => setIsSidebarOpen(true)}
        className="fixed top-4 left-4 z-20 p-2 bg-slate-800/60 backdrop-blur-sm rounded-full text-slate-300 hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500"
        aria-label="Open history sidebar"
      >
        <MenuIcon className="w-6 h-6" />
      </button>

      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        history={history}
        onLoad={handleLoadHistory}
        onDelete={handleDeleteHistory}
        onClear={handleClearHistory}
        onToggleBookmark={handleToggleBookmark}
      />

      <main className="container mx-auto px-4 py-8 md:py-12">
        <Header />
        
        <div className="max-w-3xl mx-auto mt-8">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-8 border border-slate-700">
            <ArticleInput
              value={articleText}
              onChange={(e) => setArticleText(e.target.value)}
              onSubmit={handleGenerateSummary}
              isLoading={isLoading}
              length={summaryLength}
              onLengthChange={setSummaryLength}
            />

            {error && (
              <div className="mt-4 text-center text-red-400 bg-red-900/50 p-3 rounded-lg">
                {error}
              </div>
            )}
          </div>

          {isLoading && (
            <div className="flex flex-col items-center justify-center mt-8 p-8 bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700">
              <LoaderIcon className="w-12 h-12" />
              <p className="mt-4 text-lg text-slate-400 animate-pulse">Generating your audio summary...</p>
              <p className="text-sm text-slate-500 mt-1">This may take a moment.</p>
            </div>
          )}

          {!isLoading && summaryText && (
            <div className="mt-8 space-y-8">
              {audioData && (
                 <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-8 border border-slate-700">
                  <h2 className="text-2xl font-bold text-cyan-400 mb-4">Listen to Summary</h2>
                  <AudioPlayer ref={audioPlayerRef} audioData={audioData} />
                </div>
              )}
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-6 md:p-8 border border-slate-700">
                <SummaryDisplay summary={summaryText} audioData={audioData} />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;