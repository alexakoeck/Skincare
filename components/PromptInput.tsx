
import React from 'react';

interface PromptInputProps {
  promptText: string;
  setPromptText: (text: string) => void;
}

export const PromptInput: React.FC<PromptInputProps> = ({ promptText, setPromptText }) => {
  return (
    <div>
      <label htmlFor="prompt" className="block text-lg font-semibold text-gray-700 mb-2">
        Detailed Request
      </label>
      <textarea
        id="prompt"
        name="prompt"
        rows={8}
        value={promptText}
        onChange={(e) => setPromptText(e.target.value)}
        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500 transition-shadow duration-200 shadow-sm"
        placeholder="Tell us more... e.g., 'a vitamin C serum without fragrance for sensitive skin' or 'a non-greasy sunscreen that works well under makeup and is fungal-acne safe.'"
      />
    </div>
  );
};
