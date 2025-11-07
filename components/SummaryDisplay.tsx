
import React from 'react';

interface SummaryDisplayProps {
  summary: string;
}

export const SummaryDisplay: React.FC<SummaryDisplayProps> = ({ summary }) => {
  return (
    <div>
      <h2 className="text-2xl font-bold text-cyan-400 mb-4">Text Summary</h2>
      <div className="prose prose-invert prose-p:text-slate-300 prose-p:leading-relaxed max-w-none">
        {summary.split('\n').map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </div>
  );
};
