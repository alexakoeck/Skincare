import React from 'react';
import { translations } from '../lib/translations';
import { Language } from '../App';

interface PromptInputProps {
  promptText: string;
  setPromptText: (text: string) => void;
  language: Language;
}

export const PromptInput: React.FC<PromptInputProps> = ({ promptText, setPromptText, language }) => {
  return (
    <div>
      <label htmlFor="prompt" className="block text-lg font-semibold text-gray-700 mb-2">
        {translations.promptLabel[language]}
      </label>
      <textarea
        id="prompt"
        name="prompt"
        rows={8}
        value={promptText}
        onChange={(e) => setPromptText(e.target.value)}
        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500 transition-shadow duration-200 shadow-sm bg-pink-50"
        placeholder={translations.promptPlaceholder[language]}
      />
    </div>
  );
};