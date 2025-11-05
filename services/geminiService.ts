import { GoogleGenAI, Modality } from "@google/genai";
import { UserPreferences, Product } from '../types';

// This type represents the product data we get from the initial text-based search.
// It doesn't include an imageUrl because that will be generated separately.
type ProductData = Omit<Product, 'imageUrl'>;

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

/**
 * Generates a photorealistic product image.
 * The prompt is heavily optimized to prioritize creating an image that looks
 * exactly like the official product photo.
 */
const generateProductImage = async (productName: string, brand: string): Promise<string> => {
  const prompt = `Your task is to generate a photorealistic image that is a **faithful reproduction** of a real K-beauty product's official commercial photograph. The highest priority is accuracy to the actual product's packaging, branding, and common marketing imagery.

**Product to Replicate:**
- **Product Name:** ${productName}
- **Brand:** ${brand}

**Core Instructions:**
1.  **Find and Replicate:** First, visualize the most common, official product photo for this item. Your generated image must look exactly like it.
2.  **Extreme Accuracy:** Every detail must be correct: the exact font and placement of the text, the color and material of the bottle/jar/tube, the shape of the cap, and any logos.
3.  **Photorealistic Quality:** The final image must look like a high-resolution photograph taken with a professional DSLR camera, not a 3D render.

**Technical & Style Requirements:**
- **Lighting & Background:** Replicate the typical lighting for e-commerce product shots—usually bright, even, studio lighting on a clean, seamless white or light-gray background.
- **Focus & Detail:** The image must be razor-sharp, with all text clearly legible.

**AVOID:**
- **Artistic Interpretation:** Do not add your own creative flair, props, or dramatic backgrounds. The goal is replication, not interpretation.
- **Inaccuracies:** Do not guess the design. If you are not certain about the packaging, generate a classic, clean representation.
- **Looking Fake:** Avoid glossy, unnatural reflections that scream "computer-generated."`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
          responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        // Return a data URL that can be used in an <img> src attribute
        return `data:image/png;base64,${base64ImageBytes}`;
      }
    }
    
    console.warn(`Could not generate an image for ${productName}.`);
    return ''; // Return empty string, the UI will handle the fallback.
  } catch (error) {
    console.error(`Error generating image for ${productName}:`, error);
    return ''; // Return empty string on error.
  }
};

/**
 * Main function to get recommendations. This version uses a two-step process:
 * 1. Get text-based product recommendations (details, URLs, explanations).
 * 2. Generate a custom, photorealistic image for each recommended product.
 */
export const getRecommendations = async (preferences: UserPreferences, promptText: string): Promise<Product[]> => {
  const systemInstruction = `You are a JSON API endpoint. Your sole purpose is to act as an expert K-Beauty personal shopper and return a single JSON array.
  You MUST use the provided Google Search tool to find up to 5 skincare products from popular Korean e-commerce websites (like Olive Young, Coupang) based on the user's detailed profile and request.

  User Profile:
  - Skin Type: ${preferences.skinType}
  - Age: ${preferences.age}
  - Maximum Budget: ${preferences.budget.toLocaleString()} KRW
  - Preferred Delivery: ${preferences.delivery}
  
  User's Detailed Request: "${promptText}"
  
  Your goal is to provide highly relevant product recommendations that perfectly match all the user's criteria.
  For each product, provide a concise, personalized explanation for why it's a good fit.
  
  **CRITICAL URL REQUIREMENT**: For each product you recommend, you MUST find the product's official name in Hangul (Korean). Then, you MUST construct the \`productUrl\` by taking the e-commerce website's homepage and appending a search query for that Hangul product name.
  
  For example, if the product is "Aestura Atobarrier365 Cream" and you find it on Olive Young, the Hangul name is "에스트라 아토베리어365 크림". The resulting \`productUrl\` MUST be "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=에스트라%20아토베리어365%20크림".
  
  Your entire response MUST be a single, valid JSON array of objects. Do not include any other text, commentary, or markdown.
  Each object must have the following properties: "productName", "brand", "price" (as a number), "productUrl", "explanation". Do NOT include an "imageUrl" property.`;

  let responseText = '';
  try {
    // Step 1: Get product recommendations (text data only).
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: "Find the top 5 k-beauty products based on the user profile and request provided in the system instruction. Respond with only the JSON array.",
      config: {
        systemInstruction,
        tools: [{googleSearch: {}}],
        temperature: 0,
      },
    });

    responseText = response.text.trim();
    
    const jsonMatch = responseText.match(/\`\`\`json\s*([\s\S]*?)\s*\`\`\`|(\[[\s\S]*\])/);
    if (!jsonMatch) {
      console.error("No JSON array found in the model's response.", responseText);
      throw new Error("Response did not contain a valid JSON array.");
    }
    
    const jsonString = jsonMatch[1] || jsonMatch[2];
    const productsData: ProductData[] = JSON.parse(jsonString).slice(0, 5);
    
    if (!Array.isArray(productsData) || productsData.length === 0) {
        return [];
    }

    // Step 2: Generate an image for each product recommendation.
    const productsWithImagesPromises = productsData.map(async (productData): Promise<Product> => {
      const imageUrl = await generateProductImage(productData.productName, productData.brand);
      return {
        ...productData,
        imageUrl: imageUrl,
      };
    });

    // Step 3: Wait for all image generations to complete.
    const finalProducts = await Promise.all(productsWithImagesPromises);
    
    return finalProducts;

  } catch (error) {
    console.error("Error fetching or parsing recommendations from Gemini API. Raw response text was:", responseText);
    console.error("Underlying error:", error);
    throw new Error("Failed to parse recommendations from the AI service.");
  }
};