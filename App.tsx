import React, { useState, useCallback, useEffect, useRef } from 'react';
import { generateSummary, generateSpeech, SummaryLength } from './services/geminiService';
import { AudioPlayer } from './components/AudioPlayer';
import { Header } from './components/Header';
import { ArticleInput } from './components/ArticleInput';
import { SummaryDisplay } from './components/SummaryDisplay';
import { LoaderIcon } from './components/icons';
import { HistoryList } from './components/HistoryList';

export interface HistoryEntry {
  id: string;
  summaryText: string;
  audioData: string;
  createdAt: string;
}

const App: React.FC = () => {
  const [articleText, setArticleText] = useState<string>('');
  const [summaryText, setSummaryText] = useState<string>('');
  const [audioData, setAudioData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [summaryLength, setSummaryLength] = useState<SummaryLength>('medium');

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
  };

  const handleDeleteHistory = (idToDelete: string) => {
    setHistory(prevHistory => prevHistory.filter(entry => entry.id !== idToDelete));
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-gray-900 text-slate-200 font-sans">
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
                <SummaryDisplay summary={summaryText} />
              </div>
            </div>
          )}
        </div>

        <div className="max-w-3xl mx-auto mt-8">
            <HistoryList
                history={history}
                onLoad={handleLoadHistory}
                onDelete={handleDeleteHistory}
                onClear={handleClearHistory}
            />
        </div>
      </main>
    </div>
  );
};

export default App;