import { GoogleGenAI, Modality } from "@google/genai";
import { UserPreferences, Product } from '../types';
import { Language } from '../App';

const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

const getSystemInstruction = (preferences: UserPreferences, promptText: string, language: Language): string => {
  if (language === 'ko') {
    return `당신은 JSON API 엔드포인트입니다. 당신의 유일한 목적은 전문 K-뷰티 퍼스널 쇼퍼 역할을 하여 단일 JSON 배열을 반환하는 것입니다.
    제공된 Google 검색 도구를 사용하여 사용자의 상세 프로필과 요청에 따라 인기 있는 한국 이커머스 웹사이트(예: 올리브영, 쿠팡)에서 최대 5개의 스킨케어 제품을 찾아야 합니다.

    사용자 프로필:
    - 피부 타입: ${preferences.skinType}
    - 나이: ${preferences.age}
    - 최대 예산: ${preferences.budget.toLocaleString()} 원
    - 선호 배송 방법: ${preferences.delivery}
    
    사용자의 상세 요청: "${promptText}"
    
    당신의 목표는 사용자의 모든 기준에 완벽하게 부합하는 매우 관련성 높은 제품 추천을 제공하는 것입니다.
    각 제품에 대해, 왜 그것이 좋은 선택인지 간결하고 개인화된 설명을 한국어로 제공해야 합니다.
    
    당신의 전체 응답은 객체로 이루어진 단일하고 유효한 JSON 배열이어야 합니다. 다른 텍스트, 주석 또는 마크다운을 포함하지 마십시오.
    각 객체는 "productName", "brand", "price"(숫자), "productUrl", "explanation" 속성을 가져야 합니다. 
    "productUrl"의 경우, 제품 페이지로 직접 연결되는 링크가 아닌, 해당 이커머스 웹사이트의 홈페이지에서 제품을 검색하는 검색 링크를 제공해야 합니다. 예를 들어, 올리브영에서 '구달 청귤 비타 C 잡티 케어 세럼'을 찾았다면 URL은 'https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=구달+청귤+비타+C+잡티+케어+세럼'이 되어야 합니다. 쿠팡이라면 'https://www.coupang.com/np/search?q=구달+청귤+비타+C+잡티+케어+세럼'이 되어야 합니다. 모든 텍스트 값은 한국어로 작성되어야 합니다.`;
  }

  // Default to English
  return `You are a JSON API endpoint. Your sole purpose is to act as an expert K-Beauty personal shopper and return a single JSON array.
  You MUST use the provided Google Search tool to find up to 5 skincare products from popular Korean e-commerce websites (like Olive Young, Coupang) based on the user's detailed profile and request.

  User Profile:
  - Skin Type: ${preferences.skinType}
  - Age: ${preferences.age}
  - Maximum Budget: ${preferences.budget.toLocaleString()} KRW
  - Preferred Delivery: ${preferences.delivery}
  
  User's Detailed Request: "${promptText}"
  
  Your goal is to provide highly relevant product recommendations that perfectly match all the user's criteria.
  For each product, provide a concise, personalized explanation for why it's a good fit.
  
  Your entire response MUST be a single, valid JSON array of objects. Do not include any other text, commentary, or markdown.
  Each object must have the following properties: "productName", "brand", "price" (as a number), "productUrl", "explanation".
  For the "productUrl", you MUST provide a search link to the product on the e-commerce website's homepage, not a direct link to the product page. For example, if the product is 'Goodal Green Tangerine Vitamin C Serum' found on Olive Young, the URL should be 'https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=Goodal+Green+Tangerine+Vitamin+C+Serum'. If it's on Coupang, it should be 'https://www.coupang.com/np/search?q=Goodal+Green+Tangerine+Vitamin+C+Serum'.`;
};

const generateProductImage = async (product: Omit<Product, 'imageUrl'>): Promise<string> => {
    try {
        const prompt = `Generate a photorealistic, high-quality e-commerce product image for the Korean skincare product: '${product.productName}' by '${product.brand}'. The image must be as accurate as possible to the real product's packaging design, color, and branding. Place the product on a clean, minimalist, light-colored background (like white or very light pink) with soft, professional studio lighting. The image should look like an official product photo from a top online beauty store. Do not add any extra text or objects.`;

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
    
    const jsonMatch = responseText.match(/\`\`\`json\s*([\s\S]*?)\s*\`\`\`|(\[[\s\S]*\])/);
    if (!jsonMatch) {
      console.error("No JSON array found in the model's response.", responseText);
      throw new Error("Response did not contain a valid JSON array.");
    }
    
    const jsonString = jsonMatch[1] || jsonMatch[2];
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