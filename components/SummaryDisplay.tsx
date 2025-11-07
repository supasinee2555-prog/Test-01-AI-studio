import React, { useState, useCallback } from 'react';
import { ShareIcon } from './icons';

interface SummaryDisplayProps {
  summary: string;
  audioData: string | null;
}

// Helper to safely encode UTF-8 strings to Base64
const utf8_to_b64 = (str: string): string => {
    return btoa(unescape(encodeURIComponent(str)));
};

export const SummaryDisplay: React.FC<SummaryDisplayProps> = ({ summary, audioData }) => {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(() => {
    if (!summary || !audioData) return;

    // Encode the summary and audio data to be included in the URL
    const dataToShare = {
      s: summary,
      a: audioData,
    };
    // Use the safe encoder to support all characters
    const encodedData = utf8_to_b64(JSON.stringify(dataToShare));
    
    // Construct the shareable URL using a hash
    const shareUrl = `${window.location.origin}${window.location.pathname}#data=${encodedData}`;

    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
    }).catch(err => {
      console.error('Failed to copy URL:', err);
      alert('Failed to copy URL. Please copy it manually from the address bar.');
    });
  }, [summary, audioData]);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-cyan-400">Text Summary</h2>
        {audioData && (
           <button
            onClick={handleShare}
            className="flex items-center space-x-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-slate-800 bg-slate-700 text-slate-300 hover:bg-slate-600"
            aria-label="Share summary"
          >
            <ShareIcon className="w-4 h-4" />
            <span>{copied ? 'Copied!' : 'Share'}</span>
          </button>
        )}
      </div>
      <div className="prose prose-invert prose-p:text-slate-300 prose-p:leading-relaxed max-w-none">
        {summary.split('\n').map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
};