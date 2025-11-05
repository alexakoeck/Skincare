import React from 'react';
import { SparklesIcon } from './icons/SparklesIcon';
import { translations } from '../lib/translations';
import { Language } from '../App';

interface HeaderProps {
    language: Language;
    setLanguage: (language: Language) => void;
}

export const Header: React.FC<HeaderProps> = ({ language, setLanguage }) => {
  const commonButtonClass = "px-3 py-1 text-sm font-semibold rounded-md transition-colors duration-200";
  const activeButtonClass = "bg-pink-600 text-white";
  const inactiveButtonClass = "bg-transparent text-gray-600 hover:bg-pink-100";

  return (
    <header className="bg-white/80 backdrop-blur-sm sticky top-0 z-10 shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center">
            <SparklesIcon className="w-8 h-8 text-pink-500 mr-3" />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 tracking-tight">
              {translations.headerTitle[language]}
            </h1>
        </div>
        <div className="flex items-center space-x-2 border border-gray-300 p-1 rounded-lg">
           <button 
             onClick={() => setLanguage('en')}
             className={`${commonButtonClass} ${language === 'en' ? activeButtonClass : inactiveButtonClass}`}
           >
             English
           </button>
           <button 
             onClick={() => setLanguage('ko')}
             className={`${commonButtonClass} ${language === 'ko' ? activeButtonClass : inactiveButtonClass}`}
           >
             한국어
           </button>
        </div>
      </div>
    </header>
  );
};