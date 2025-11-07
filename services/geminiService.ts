import { Product, UserPreferences } from '../types';
import { Language } from '../App';

/**
 * Gets K-Beauty recommendations by calling our secure serverless API endpoint.
 */
export const getRecommendations = async (preferences: UserPreferences, promptText: string, language: Language): Promise<Product[]> => {
  try {
    const response = await fetch('/api/getRecommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ preferences, promptText, language }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred on the server.' }));
        console.error("API Error:", errorData.message);
        throw new Error(`Failed to fetch recommendations from the server: ${response.statusText}`);
    }

    const products: Product[] = await response.json();
    return products;
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    // Re-throw a more user-friendly error. The component will handle displaying the message.
    throw new Error("Failed to communicate with the recommendation service.");
  }
};
