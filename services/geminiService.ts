import { GoogleGenAI, Modality } from "@google/genai";
import { UserPreferences, Product, SkinType, DeliveryOption } from '../types';
import { Language } from '../App';

// FIX: Per coding guidelines, the API key must be sourced from `process.env.API_KEY`.
const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

const getSystemInstruction = (preferences: UserPreferences, promptText: string, language: Language): string => {
  if (language === 'ko') {
    const skinTypeTranslations: Record<SkinType, string> = {
      [SkinType.Dry]: '건성',
      [SkinType.Oily]: '지성',
      [SkinType.Combination]: '복합성',
      [SkinType.Sensitive]: '민감성',
    };

    const deliveryOptionTranslations: Record<DeliveryOption, string> = {
      [DeliveryOption.Online]: '온라인 배송',
      [DeliveryOption.InStore]: '매장 픽업',
    };

    return `당신은 JSON API 엔드포인트입니다. 당신의 유일한 목적은 전문 K-뷰티 퍼스널 쇼퍼 역할을 하여 단일 JSON 배열을 반환하는 것입니다.
    제공된 Google 검색 도구를 사용하여 사용자의 상세 프로필과 요청에 따라 **올리브영 (Olive Young)**에서 최대 5개의 스킨케어 제품을 찾아야 합니다.

    **매우 중요한 URL 규칙:**
    "productUrl" 필드에는 반드시 올리브영 (https://www.oliveyoung.co.kr/store/search/getSearchMain.do) 검색 링크를 만들어야 합니다. 이 URL의 검색어는 **반드시 공식 브랜드명과 제품명을 한글로** 사용해야 합니다.
    예를 들어, 제품이 '구달 청귤 비타 C 잡티 케어 세럼'이라면, productUrl은 "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=구달+청귤+비타+C+잡티+케어+세럼" 이어야 합니다. 검색어는 반드시 URL 인코딩된 한글이어야 합니다.

    사용자 프로필:
    - 피부 타입: ${skinTypeTranslations[preferences.skinType]}
    - 나이: ${preferences.age}
    - 최대 예산: ${preferences.budget.toLocaleString()} 원
    - 선호 배송 방법: ${deliveryOptionTranslations[preferences.delivery]}
    
    사용자의 상세 요청: "${promptText}"
    
    당신의 목표는 사용자의 모든 기준에 완벽하게 부합하는 매우 관련성 높은 제품 추천을 제공하는 것입니다.
    각 제품에 대해, 왜 그것이 좋은 선택인지 간결하고 개인화된 설명을 한국어로 제공해야 합니다. 검색 결과 자체는 응답에 포함하지 마세요.
    
    당신의 전체 응답은 객체로 이루어진 단일하고 유효한 JSON 배열이어야 합니다. 다른 텍스트, 주석 또는 마크다운을 포함하지 마십시오.
    각 객체는 "productName" (한글), "brand" (한글), "price"(숫자), "productUrl"(위에서 설명한 형식), "explanation" (한글) 속성을 가져야 합니다.`;
  }

  // Default to English
  return `You are a JSON API endpoint. Your sole purpose is to act as an expert K-Beauty personal shopper and return a single JSON array.
  You MUST use the provided Google Search tool to find up to 5 skincare products from **Olive Young** based on the user's detailed profile and request.

  **CRITICAL RULE FOR PRODUCT URL:**
  For the "productUrl" field, you MUST create a search link for the Korean Olive Young website (https://www.oliveyoung.co.kr/store/search/getSearchMain.do). The search query for this URL **MUST** use the official brand and product name in **Korean (Hangul)**, even though the rest of your response is in English.
  For example, if the product is 'Goodal Green Tangerine Vitamin C Serum', the productUrl should be: "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=구달+청귤+비타+C+잡티+케어+세럼". The search text MUST be URL-encoded Korean.

  User Profile:
  - Skin Type: ${preferences.skinType}
  - Age: ${preferences.age}
  - Maximum Budget: ${preferences.budget.toLocaleString()} KRW
  - Preferred Delivery: ${preferences.delivery}
  
  User's Detailed Request: "${promptText}"
  
  Your goal is to provide highly relevant product recommendations that perfectly match all the user's criteria.
  For each product, provide a concise, personalized explanation for why it's a good fit in English. Do not include the raw search results in your response.
  
  Your entire response MUST be a single, valid JSON array of objects. Do not include any other text, commentary, or markdown.
  Each object must have the following properties: "productName" (in English), "brand" (in English), "price" (as a number), "productUrl" (formatted as described above), "explanation" (in English).`;
};

const generateProductImage = async (product: Omit<Product, 'imageUrl'>): Promise<string> => {
    try {
        const prompt = `Create a photorealistic product photograph of the Korean skincare item: '${product.productName}' from the brand '${product.brand}'. The goal is maximum accuracy. The image must replicate the actual product's packaging, including logos, typography, colors, and container shape, as closely as possible to the real-world version sold in stores. The product should be presented against a simple, neutral background with professional studio lighting, suitable for a premium e-commerce website. Do not add any other elements to the image.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                const base64ImageBytes: string = part.inlineData.data;
                return `data:image/png;base64,${base64ImageBytes}`;
            }
        }
        return 'https://picsum.photos/300/300';
    } catch (error) {
        console.error(`Failed to generate image for ${product.productName}:`, error);
        return 'https://picsum.photos/300/300';
    }
};

/**
 * Gets K-Beauty recommendations from the Gemini API.
 */
export const getRecommendations = async (preferences: UserPreferences, promptText: string, language: Language): Promise<Product[]> => {
  const userInstruction = language === 'ko' 
    ? "시스템 지침에 제공된 사용자 프로필과 요청을 기반으로 상위 5개의 k-뷰티 제품을 찾아주세요. JSON 배열만으로 응답해주세요."
    : "Find the top 5 k-beauty products based on the user profile and request provided in the system instruction. Respond with only the JSON array.";

  let responseText = '';
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: userInstruction,
      config: {
        systemInstruction: getSystemInstruction(preferences, promptText, language),
        tools: [{googleSearch: {}}],
      },
    });
    
    responseText = response.text.trim();
    
    let jsonString = '';
    // This regex looks for a JSON block within markdown backticks
    const markdownMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/);

    if (markdownMatch && markdownMatch[1]) {
        jsonString = markdownMatch[1];
    } else {
        // If no markdown block is found, it assumes the JSON array is embedded somewhere in the text.
        // It finds the first '[' and the last ']' to extract the array.
        const startIndex = responseText.indexOf('[');
        const endIndex = responseText.lastIndexOf(']');

        if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
            jsonString = responseText.substring(startIndex, endIndex + 1);
        } else {
            // If no JSON-like structure is found, throw an error.
            console.error("No JSON array found in the model's response.", responseText);
            throw new Error("Response did not contain a valid JSON array.");
        }
    }
    
    const productsWithoutImages: Omit<Product, 'imageUrl'>[] = JSON.parse(jsonString).slice(0, 5);
    
    if (!Array.isArray(productsWithoutImages)) {
        return [];
    }

    const productsWithImages = await Promise.all(
        productsWithoutImages.map(async (product) => {
            const imageUrl = await generateProductImage(product);
            return { ...product, imageUrl };
        })
    );

    return productsWithImages;

  } catch (error) {
    console.error("Error fetching or parsing recommendations from Gemini API. Raw response text was:", responseText);
    console.error("Underlying error:", error);
    throw new Error("Failed to parse recommendations from the AI service.");
  }
};
