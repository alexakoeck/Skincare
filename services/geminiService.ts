import { GoogleGenAI } from "@google/genai";
import { UserPreferences, Product } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

export const getRecommendations = async (preferences: UserPreferences, promptText: string): Promise<Product[]> => {
  const systemInstruction = `You are a JSON API endpoint. Your sole purpose is to act as an expert K-Beauty personal shopper and return a single JSON array.
  You MUST use the provided Google Search tool to find up to 5 skincare products from popular Korean e-commerce websites (like Olive Young, Coupang) based on the user's detailed profile and request.

  User Profile:
  - Skin Type: ${preferences.skinType}
  - Age: ${preferences.age}
  - Maximum Budget: ${preferences.budget.toLocaleString()} KRW
  - Preferred Delivery: ${preferences.delivery}
  
  User's Detailed Request: "${promptText}"
  
  Your goal is to provide highly relevant product recommendations that perfectly match all the user's criteria. For each product, provide a concise, personalized explanation for why it's a good fit.
  
  **CRITICAL URL REQUIREMENT**: For each product you recommend, the \`productUrl\` **MUST** be the direct source URL from your search results where you found the product's price. This is the most important rule. If you cannot find a verifiable source URL where the price is listed, do not include the product. The \`imageUrl\` must also be a direct, working link to the product's image. Do not invent or guess URLs.
  
  Your entire response MUST be a single, valid JSON array of objects. Do not include any other text, commentary, or markdown formatting like \`\`\`json.
  Each object must have the following properties: "productName", "brand", "price" (as a number), "imageUrl", "productUrl", "explanation".`;

  let responseText = '';
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro", // Using a more powerful model for better tool use and JSON adherence
      contents: "Find the top 5 k-beauty products based on the user profile and request provided in the system instruction. Respond with only the JSON array.",
      config: {
        systemInstruction,
        tools: [{googleSearch: {}}],
        temperature: 0, // Lower temperature for more deterministic and factual responses
      },
    });

    responseText = response.text.trim();
    
    // More robustly extract the JSON part of the response.
    // The model might still wrap it in markdown or add explanatory text.
    const jsonMatch = responseText.match(/\`\`\`json\s*([\s\S]*?)\s*\`\`\`|(\[[\s\S]*\])/);
    if (!jsonMatch) {
      console.error("No JSON array found in the model's response.", responseText);
      throw new Error("Response did not contain a valid JSON array.");
    }
    
    // Use the first captured group that is not undefined (either from markdown or a raw array)
    const jsonString = jsonMatch[1] || jsonMatch[2];
    const result = JSON.parse(jsonString);
    
    if (Array.isArray(result)) {
      return result.slice(0, 5);
    }
    
    return [];

  } catch (error) {
    console.error("Error fetching or parsing recommendations from Gemini API. Raw response text was:", responseText);
    console.error("Underlying error:", error);
    throw new Error("Failed to parse recommendations from the AI service.");
  }
};