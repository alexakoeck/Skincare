import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { PreferenceForm } from './components/PreferenceForm';
import { PromptInput } from './components/PromptInput';
import { ResultsDisplay } from './components/ResultsDisplay';
import { getRecommendations } from './services/geminiService';
import { UserPreferences, Product, SkinType, DeliveryOption } from './types';
import { translations } from './lib/translations';

export type Language = 'en' | 'ko';

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('en');
  const [preferences, setPreferences] = useState<UserPreferences>({
    skinType: SkinType.Combination,
    age: 25,
    budget: 30000,
    delivery: DeliveryOption.Online,
  });
  const [promptText, setPromptText] = useState<string>('');
  const [recommendations, setRecommendations] = useState<Product[] | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setRecommendations(null);
    try {
      const results = await getRecommendations(preferences, promptText, language);
      setRecommendations(results);
    } catch (err) {
      setError(translations.errorMessage[language]);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [preferences, promptText, language]);

  return (
    <div className="min-h-screen bg-pink-50 text-gray-800">
      <Header language={language} setLanguage={setLanguage} />
      <main className="container mx-auto p-4 md:p-8">
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-6 md:p-10 space-y-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-pink-800 mb-2">{translations.appSubtitle[language]}</h2>
            <p className="text-gray-600">
             {translations.appDescription[language]}
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <PreferenceForm preferences={preferences} setPreferences={setPreferences} language={language}/>
            <PromptInput promptText={promptText} setPromptText={setPromptText} language={language}/>
          </div>

          <div className="text-center">
            <button
              onClick={handleSearch}
              disabled={isLoading}
              className="w-full md:w-auto bg-pink-600 text-white font-bold py-3 px-12 rounded-full hover:bg-pink-700 transition-all duration-300 ease-in-out transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:scale-100 shadow-md"
            >
              {isLoading ? translations.searchButtonLoading[language] : translations.searchButton[language]}
            </button>
          </div>
        </div>

        <div className="mt-12">
          <ResultsDisplay
            isLoading={isLoading}
            error={error}
            recommendations={recommendations}
            language={language}
          />
        </div>
      </main>
      <footer className="text-center p-4 text-gray-500 text-sm mt-8">
        <p>&copy; 2024 K-Beauty Personal Shopper. All Rights Reserved.</p>
      </footer>
    </div>
  );
};

export default App;