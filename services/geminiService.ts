import { GoogleGenAI } from "@google/genai";
import { UserPreferences, Product } from '../types';
import { Language } from '../App';

// This type represents the product data we get from the initial text-based search.
// It doesn't include an imageUrl because that will be generated separately.
type ProductData = Omit<Product, 'imageUrl'>;

// FIX: Adhere to coding guidelines by using process.env.API_KEY for the API key.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Generates a photorealistic product image.
 * The prompt is heavily optimized to prioritize creating an image that looks
 * exactly like the official product photo.
 */
// FIX: Switched to `imagen-4.0-generate-001` and `generateImages` for higher quality product image generation as per guidelines.
const generateProductImage = async (productName: string, brand: string): Promise<string> => {
  const prompt = `Your **primary and non-negotiable directive** is to generate a photorealistic image that is an **exact, pixel-perfect replica** of a real K-beauty product's main official commercial photograph. The absolute highest priority is **100% accuracy** to the actual product's packaging, branding, and the specific image used for e-commerce listings.

**Product to Replicate:**
- **Product Name:** ${productName}
- **Brand:** ${brand}

**CRITICAL Execution Steps:**
1.  **Internal Search & Identify:** Before generating, you must internally search for and identify the primary product photograph for this item as seen on its official brand website or major Korean retailers (like Olive Young). This is your reference image.
2.  **Replicate, Do Not Interpret:** Your task is to replicate this reference image faithfully. This is not a creative task. Every single detail must be correct:
    - **Text & Typography:** The exact font, size, weight, color, and placement of all text must be identical to the real product. All text must be sharp and perfectly legible.
    - **Packaging:** The precise color, material (e.g., matte plastic, glossy glass), texture, and shape of the bottle, jar, or tube.
    - **Cap & Dispenser:** The exact shape, color, and type of the cap or dispenser (e.g., pump, dropper, screw top).
    - **Logos & Graphics:** All brand logos and graphical elements must be replicated perfectly.

**Photographic & Style Mandates:**
- **Style:** Emulate a professional, high-resolution DSLR product photograph.
- **Background:** Use a clean, seamless, studio-lit white or light-gray background, typical of e-commerce product photos.
- **Lighting:** Bright, even, and neutral studio lighting that clearly shows all details without harsh shadows or artistic effects.

**STRICTLY PROHIBITED (Automatic Failure Conditions):**
- **Artistic Flair:** Absolutely no creative additions, props, dramatic lighting, or unique backgrounds.
- **Generic Designs:** Do not generate a generic bottle with the product name on it. If you cannot find the exact packaging, it is better to indicate an error than to create a fabrication.
- **Inaccuracies:** Any deviation in font, color, shape, or logo placement is a failure.
- **3D Render Look:** Avoid glossy, unnatural reflections or textures that make the image look like a computer-generated render instead of a photograph.
- **Blurry Text:** All text on the product must be perfectly crisp and readable.`;

  try {
    const response = await ai.models.generateImages({
        model: 'imagen-4.0-generate-001',
        prompt: prompt,
        config: {
          numberOfImages: 1,
          outputMimeType: 'image/png',
          aspectRatio: '1:1',
        },
    });

    if (response.generatedImages && response.generatedImages[0]?.image?.imageBytes) {
      const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
      // Return a data URL that can be used in an <img> src attribute
      return `data:image/png;base64,${base64ImageBytes}`;
    }
    
    console.warn(`Could not generate an image for ${productName}.`);
    return ''; // Return empty string, the UI will handle the fallback.
  } catch (error) {
    console.error(`Error generating image for ${productName}:`, error);
    return ''; // Return empty string on error.
  }
};

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
    
    **중요 가격 요구사항**: 반환하는 "price"는 해당 제품에 대해 한국 이커머스 웹사이트에서 직접 찾은 현재의 표준 정가(일시적인 할인가 아님)여야 합니다. 검색 도구를 사용하여 가격을 재확인하여 정확성을 극대화하십시오. 가격을 추정하거나 캐시된 가격을 사용하지 마십시오.

    **중요 URL 요구사항**: 추천하는 각 제품에 대해, 제품의 공식 한글 이름을 찾아야 합니다. 그런 다음, 이커머스 웹사이트의 홈페이지에 해당 한글 제품 이름에 대한 검색 쿼리를 추가하여 \`productUrl\`을 구성해야 합니다.
    
    예를 들어, 제품이 "Aestura Atobarrier365 Cream"이고 올리브영에서 찾았다면, 한글 이름은 "에스트라 아토베리어365 크림"입니다. 결과적인 \`productUrl\`은 "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=에스트라%20아토베리어365%20크림"이 되어야 합니다.
    
    당신의 전체 응답은 객체로 이루어진 단일하고 유효한 JSON 배열이어야 합니다. 다른 텍스트, 주석 또는 마크다운을 포함하지 마십시오.
    각 객체는 "productName", "brand", "price"(숫자), "productUrl", "explanation" 속성을 가져야 합니다. "imageUrl" 속성은 포함하지 마십시오. 모든 텍스트 값은 한국어로 작성되어야 합니다.`;
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
  
  **CRITICAL PRICE REQUIREMENT**: The "price" you return MUST be the current, standard list price (not a temporary sale price) found directly on the Korean e-commerce website for that product. Double-check the price using your search tool to ensure maximum accuracy. Do not estimate or use cached prices.

  **CRITICAL URL REQUIREMENT**: For each product you recommend, you MUST find the product's official name in Hangul (Korean). Then, you MUST construct the \`productUrl\` by taking the e-commerce website's homepage and appending a search query for that Hangul product name.
  
  For example, if the product is "Aestura Atobarrier365 Cream" and you find it on Olive Young, the Hangul name is "에스트라 아토베리어365 크림". The resulting \`productUrl\` MUST be "https://www.oliveyoung.co.kr/store/search/getSearchMain.do?query=에스트라%20아토베리어365%20크림".
  
  Your entire response MUST be a single, valid JSON array of objects. Do not include any other text, commentary, or markdown.
  Each object must have the following properties: "productName", "brand", "price" (as a number), "productUrl", "explanation". Do NOT include an "imageUrl" property.`;
};


/**
 * Main function to get recommendations. This version uses a two-step process:
 * 1. Get text-based product recommendations (details, URLs, explanations).
 * 2. Generate a custom, photorealistic image for each recommended product.
 */
export const getRecommendations = async (preferences: UserPreferences, promptText: string, language: Language): Promise<Product[]> => {
  const systemInstruction = getSystemInstruction(preferences, promptText, language);

  const userInstruction = language === 'ko' 
    ? "시스템 지침에 제공된 사용자 프로필과 요청을 기반으로 상위 5개의 k-뷰티 제품을 찾아주세요. JSON 배열만으로 응답해주세요."
    : "Find the top 5 k-beauty products based on the user profile and request provided in the system instruction. Respond with only the JSON array.";

  let responseText = '';
  try {
    // Step 1: Get product recommendations (text data only).
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: userInstruction,
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