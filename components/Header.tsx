
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="text-center">
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
        News Audio Summarizer
      </h1>
      <p className="mt-3 text-lg md:text-xl text-slate-400 max-w-2xl mx-auto">
        Turn any news article into a concise audio summary for your commute.
      </p>
    </header>
  );
};
