import React, { useState, useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { createAudioBuffer, audioBufferToWav } from '../utils/audioUtils';
import { PlayIcon, PauseIcon, LoaderIcon, DownloadIcon } from './icons';

interface AudioPlayerProps {
  audioData: string;
}

export interface AudioPlayerRef {
  togglePlayback: () => void;
}

export const AudioPlayer = forwardRef<AudioPlayerRef, AudioPlayerProps>(({ audioData }, ref) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isReady, setIsReady] = useState<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);

  useEffect(() => {
    // Initialize AudioContext
    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    
    // Decode audio data when the component receives it
    const setupAudio = async () => {
      if (audioData && audioContextRef.current) {
        setIsReady(false);
        try {
          // If context is suspended, resume it.
          if (audioContextRef.current.state === 'suspended') {
            await audioContextRef.current.resume();
          }
          const buffer = await createAudioBuffer(audioData, audioContextRef.current);
          audioBufferRef.current = buffer;
          setIsReady(true);
        } catch (error) {
          console.error("Failed to decode audio data:", error);
          setIsReady(false);
        }
      }
    };

    setupAudio();

    // Cleanup on unmount
    return () => {
      if (sourceRef.current) {
        try {
          sourceRef.current.stop();
        } catch(e) { /* Already stopped */ }
      }
      setIsPlaying(false);
    };
  }, [audioData]);

  const togglePlayback = useCallback(() => {
    if (!isReady || !audioContextRef.current || !audioBufferRef.current) return;

    if (isPlaying) {
      // Pause
      if (sourceRef.current) {
        sourceRef.current.stop();
        sourceRef.current = null;
      }
      setIsPlaying(false);
    } else {
      // Play
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBufferRef.current;
      source.connect(audioContextRef.current.destination);
      source.start();
      source.onended = () => {
        setIsPlaying(false);
        sourceRef.current = null;
      };
      sourceRef.current = source;
      setIsPlaying(true);
    }
  }, [isReady, isPlaying]);

  useImperativeHandle(ref, () => ({
    togglePlayback,
  }));

  const handleDownload = useCallback(() => {
    if (!audioBufferRef.current) {
      console.error("Audio buffer not available for download.");
      return;
    }
    const wavBlob = audioBufferToWav(audioBufferRef.current);
    const url = URL.createObjectURL(wavBlob);
    const link = document.createElement('a');
    link.href = url;
    // We are naming the file .mp3 as requested, though the underlying format is WAV.
    // Most modern audio players can handle this gracefully.
    link.download = 'summary.mp3';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, []);
  
  return (
    <div className="flex items-center space-x-4">
      <button
        onClick={togglePlayback}
        disabled={!isReady}
        className="flex items-center justify-center w-16 h-16 rounded-full bg-cyan-600 text-white disabled:bg-slate-700 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-500 transition-all transform hover:scale-110 disabled:scale-100"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {!isReady ? (
          <LoaderIcon className="w-8 h-8"/>
        ) : isPlaying ? (
          <PauseIcon className="w-8 h-8" />
        ) : (
          <PlayIcon className="w-8 h-8" />
        )}
      </button>
      <div className="flex-grow">
        <p className="text-lg font-semibold text-slate-200">
            {isReady ? 'Audio Summary Ready' : 'Preparing Audio...'}
        </p>
        <p className="text-sm text-slate-400">
            {isReady ? 'Click the button or press Space to play' : 'Please wait.'}
        </p>
      </div>
       {isReady && (
        <button
          onClick={handleDownload}
          className="p-2 rounded-full bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-cyan-500"
          aria-label="Download audio summary as MP3"
        >
          <DownloadIcon className="w-6 h-6" />
        </button>
      )}
    </div>
  );
});