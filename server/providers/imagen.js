/**
 * Imagen Provider
 * Handles AI image generation via Google's Imagen API
 * Supports both Vertex AI and AI Studio approaches
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Generate enhanced image using Gemini's image generation capabilities
 * Falls back gracefully if unavailable
 * @param {string} originalImageBase64 - Base64 encoded original image
 * @param {string} prompt - Enhancement prompt
 * @param {string} apiKey - API key
 * @returns {Promise<{imageBase64: string|null, success: boolean, error?: string, provider: string}>}
 */
export async function generateEnhancedImage(originalImageBase64, prompt, apiKey) {
  
  // Try Gemini 2.0 Flash with image generation (experimental)
  try {
    const result = await tryGeminiImageEdit(originalImageBase64, prompt, apiKey);
    if (result.success) {
      return result;
    }
  } catch (error) {
    console.log('Gemini image edit not available:', error);
  }

  // Try Imagen 3 via AI Studio (if available)
  try {
    const result = await tryImagen3(originalImageBase64, prompt, apiKey);
    if (result.success) {
      return result;
    }
  } catch (error) {
    console.log('Imagen 3 not available:', error);
  }

  // All methods failed - return fallback
  return {
    imageBase64: null,
    success: false,
    error: 'Image generation not available - showing enhancement plan instead',
    provider: 'fallback',
  };
}

/**
 * Try using Gemini 2.0 Flash for image editing
 */
async function tryGeminiImageEdit(originalImageBase64, prompt, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Try gemini-2.0-flash-exp-image-generation if available
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp-image-generation',
      generationConfig: {
        responseModalities: ['Text', 'Image'],
      },
    });

    const editPrompt = `Edit this photo to create an enhanced version of the same person.

Enhancement instructions:
${prompt}

CRITICAL RULES:
- Keep the EXACT same person - must be clearly recognizable
- Do NOT change face shape, bone structure, age, or ethnicity
- Only improve: lighting, skin clarity, hair styling, grooming, color balance
- This is a subtle enhancement, not a transformation`;

    const result = await model.generateContent([
      editPrompt,
      {
        inlineData: {
          data: originalImageBase64,
          mimeType: 'image/jpeg',
        },
      },
    ]);

    const response = await result.response;
    const parts = response.candidates?.[0]?.content?.parts || [];
    
    for (const part of parts) {
      if (part.inlineData?.data) {
        return {
          imageBase64: part.inlineData.data,
          success: true,
          provider: 'gemini-2.0-flash-exp-image-generation',
        };
      }
    }
    
    throw new Error('No image in response');
  } catch (error) {
    return {
      imageBase64: null,
      success: false,
      error: String(error),
      provider: 'gemini-image-edit',
    };
  }
}

/**
 * Try using Imagen 3 via AI Studio
 */
async function tryImagen3(originalImageBase64, prompt, apiKey) {
  // Imagen 3 through AI Studio uses a different endpoint
  // This requires the imagegeneration model
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instances: [
            {
              prompt: `Photo editing: ${prompt}. Keep the same person, only enhance lighting, skin, and presentation.`,
              image: {
                bytesBase64Encoded: originalImageBase64,
              },
            },
          ],
          parameters: {
            sampleCount: 1,
            aspectRatio: '1:1',
            safetyFilterLevel: 'block_some',
            personGeneration: 'allow_adult',
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Imagen API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (data.predictions?.[0]?.bytesBase64Encoded) {
      return {
        imageBase64: data.predictions[0].bytesBase64Encoded,
        success: true,
        provider: 'imagen-3',
      };
    }
    
    throw new Error('No image in Imagen response');
  } catch (error) {
    return {
      imageBase64: null,
      success: false,
      error: String(error),
      provider: 'imagen-3',
    };
  }
}

export default { generateEnhancedImage };
