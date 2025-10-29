
import React from 'react';
import { SparklesIcon } from './icons/SparklesIcon';

export const Header: React.FC = () => {
  return (
    <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-center">
        <SparklesIcon className="w-8 h-8 text-pink-500 mr-3" />
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">
          K-Beauty Personal Shopper
        </h1>
      </div>
    </header>
  );
};
