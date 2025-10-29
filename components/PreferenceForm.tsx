
import React from 'react';
import { UserPreferences, SkinType, DeliveryOption } from '../types';

interface PreferenceFormProps {
  preferences: UserPreferences;
  setPreferences: React.Dispatch<React.SetStateAction<UserPreferences>>;
}

export const PreferenceForm: React.FC<PreferenceFormProps> = ({ preferences, setPreferences }) => {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPreferences(prev => ({ ...prev, [name]: name === 'age' || name === 'budget' ? Number(value) : value }));
  };

  const handleRadioChange = (name: string, value: string) => {
    setPreferences(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-lg font-semibold text-gray-700 mb-2">Skin Type</label>
        <div className="grid grid-cols-2 gap-3">
          {Object.values(SkinType).map((type) => (
            <button
              key={type}
              onClick={() => handleRadioChange('skinType', type)}
              className={`px-4 py-2 text-sm rounded-full border-2 transition-colors duration-200 ${
                preferences.skinType === type
                  ? 'bg-pink-600 text-white border-pink-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-pink-400'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="age" className="block text-lg font-semibold text-gray-700 mb-2">Age</label>
          <input
            type="number"
            id="age"
            name="age"
            value={preferences.age}
            onChange={handleInputChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500"
            min="10"
            max="99"
          />
        </div>
         <div>
          <label htmlFor="delivery" className="block text-lg font-semibold text-gray-700 mb-2">Delivery</label>
            <select
                id="delivery"
                name="delivery"
                value={preferences.delivery}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-pink-500 focus:border-pink-500 bg-white"
            >
                {Object.values(DeliveryOption).map(option => (
                    <option key={option} value={option}>{option}</option>
                ))}
            </select>
        </div>
      </div>
      
      <div>
        <label htmlFor="budget" className="block text-lg font-semibold text-gray-700 mb-2">
          Max Budget: <span className="font-bold text-pink-600">{preferences.budget.toLocaleString()} KRW</span>
        </label>
        <input
          type="range"
          id="budget"
          name="budget"
          min="5000"
          max="100000"
          step="1000"
          value={preferences.budget}
          onChange={handleInputChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-pink-600"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>5,000</span>
          <span>100,000</span>
        </div>
      </div>
    </div>
  );
};
