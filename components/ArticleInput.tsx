import React, { useState, useEffect, useRef } from 'react';
import { LoaderIcon, SparklesIcon, MicrophoneIcon } from './icons';
import { SummaryLength } from '../services/geminiService';

// SpeechRecognition might not be on the window object type definition in all environments
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface ArticleInputProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: () => void;
  isLoading: boolean;
  length: SummaryLength;
  onLengthChange: (length: SummaryLength) => void;
}

const lengthOptions: { id: SummaryLength; label: string }[] = [
    { id: 'short', label: 'Short' },
    { id: 'medium', label: 'Medium' },
    { id: 'long', label: 'Long' },
];

export const ArticleInput: React.FC<ArticleInputProps> = ({ value, onChange, onSubmit, isLoading, length, onLengthChange }) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const recognitionRef = useRef<any | null>(null);
  const startTextRef = useRef('');

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => { // SpeechRecognitionEvent
        let finalTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }

        let interimTranscript = '';
        if (event.results.length > 0 && !event.results[event.results.length - 1].isFinal) {
          interimTranscript = event.results[event.results.length - 1][0].transcript;
        }

        const separator = startTextRef.current.trim() ? ' ' : '';
        const newText = (startTextRef.current + separator + finalTranscript + interimTranscript).trim();

        // Create a synthetic event to pass to the parent's onChange handler
        const syntheticEvent = {
          target: { value: newText },
        } as React.ChangeEvent<HTMLTextAreaElement>;
        onChange(syntheticEvent);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    }
  }, [onChange]);
  
  const handleToggleListen = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      startTextRef.current = value;
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.ctrlKey && event.key === 'Enter') {
      event.preventDefault();
      if (!isLoading && value) {
        onSubmit();
      }
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label htmlFor="article-input" className="block text-lg font-medium text-slate-300">
          Article Content
        </label>
         {isSpeechSupported && (
          <button
            type="button"
            onClick={handleToggleListen}
            disabled={isLoading}
            className={`flex items-center space-x-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 ${
              isListening
                ? 'bg-red-600 text-white animate-pulse'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
            aria-label={isListening ? 'Stop dictation' : 'Start dictation'}
          >
            <MicrophoneIcon className="w-4 h-4" />
            <span>{isListening ? 'Listening...' : 'Dictate'}</span>
          </button>
        )}
      </div>
      <textarea
        id="article-input"
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        placeholder="Paste article text here, use the dictate button, or press Ctrl+Enter to submit..."
        className="w-full h-48 p-4 bg-slate-900/70 border border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 transition-all duration-300 resize-y text-slate-200 placeholder-slate-500"
      />
      <div className="mt-4">
        <label className="block text-sm font-medium text-slate-400 mb-2">
            Summary Length:
        </label>
        <div className="flex items-center space-x-2 bg-slate-900/70 border border-slate-600 rounded-lg p-1 w-full">
            {lengthOptions.map((option) => (
                <button
                    key={option.id}
                    onClick={() => onLengthChange(option.id)}
                    disabled={isLoading}
                    className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 ${
                        length === option.id
                            ? 'bg-cyan-600 text-white shadow'
                            : 'bg-transparent text-slate-300 hover:bg-slate-700/50'
                    }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
      </div>
      <button
        onClick={onSubmit}
        disabled={isLoading || !value}
        className="mt-4 w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-cyan-500 transition-all duration-300 transform hover:scale-105 disabled:scale-100"
      >
        {isLoading ? (
          <>
            <LoaderIcon className="w-5 h-5 mr-3" />
            Generating...
          </>
        ) : (
           <>
            <SparklesIcon className="w-5 h-5 mr-3" />
            Generate Audio Summary
          </>
        )}
      </button>
    </div>
  );
};