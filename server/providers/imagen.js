/**
 * Imagen Provider
 * Handles AI image generation via Google's Imagen API
 * Updated to use latest available models
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
  
  // Method 1: Try Gemini 2.0 Flash Experimental with image output
  try {
    console.log('  → Trying gemini-2.0-flash-exp with image output...');
    const result = await tryGemini2FlashExp(originalImageBase64, prompt, apiKey);
    if (result.success) {
      console.log('  ✓ Success with gemini-2.0-flash-exp');
      return result;
    }
    console.log('  ✗ gemini-2.0-flash-exp failed:', result.error);
  } catch (error) {
    console.log('  ✗ gemini-2.0-flash-exp error:', error.message);
  }

  // Method 2: Try the image generation specific model
  try {
    console.log('  → Trying gemini-2.0-flash-exp-image-generation...');
    const result = await tryGeminiImageGeneration(originalImageBase64, prompt, apiKey);
    if (result.success) {
      console.log('  ✓ Success with gemini-2.0-flash-exp-image-generation');
      return result;
    }
    console.log('  ✗ gemini-2.0-flash-exp-image-generation failed:', result.error);
  } catch (error) {
    console.log('  ✗ gemini-2.0-flash-exp-image-generation error:', error.message);
  }

  // Method 3: Try Imagen 3 via REST API
  try {
    console.log('  → Trying Imagen 3 REST API...');
    const result = await tryImagen3Rest(originalImageBase64, prompt, apiKey);
    if (result.success) {
      console.log('  ✓ Success with Imagen 3');
      return result;
    }
    console.log('  ✗ Imagen 3 failed:', result.error);
  } catch (error) {
    console.log('  ✗ Imagen 3 error:', error.message);
  }

  // All methods failed - return fallback with detailed info
  console.log('  ⚠️ All image generation methods failed, using fallback');
  return {
    imageBase64: null,
    success: false,
    error: 'Image generation requires Gemini API with image output enabled. Currently showing enhancement plan.',
    provider: 'fallback',
    details: 'Free Gemini API does not include image generation. Upgrade to Vertex AI or wait for broader availability.',
  };
}

/**
 * Try using Gemini 2.0 Flash Experimental
 */
async function tryGemini2FlashExp(originalImageBase64, prompt, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    // Use the experimental model with image response modality
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      generationConfig: {
        responseModalities: ['text', 'image'],
      },
    });

    const editPrompt = `You are an expert photo editor. Edit this photo to create a subtly enhanced version.

ENHANCEMENT INSTRUCTIONS:
${prompt}

CRITICAL RULES:
- This MUST be the EXACT same person - clearly recognizable
- Do NOT change: face shape, bone structure, age, ethnicity, or identity
- Only improve: lighting, skin clarity, hair styling, grooming, color balance
- Make subtle, professional enhancements - not dramatic transformations
- The result should look like a professional photo of the same person

Generate an enhanced version of this photo now.`;

    const result = await model.generateContent([
      {
        inlineData: {
          data: originalImageBase64,
          mimeType: 'image/jpeg',
        },
      },
      editPrompt,
    ]);

    const response = await result.response;
    const candidates = response.candidates || [];
    
    for (const candidate of candidates) {
      const parts = candidate.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          return {
            imageBase64: part.inlineData.data,
            success: true,
            provider: 'gemini-2.0-flash-exp',
          };
        }
      }
    }
    
    return {
      imageBase64: null,
      success: false,
      error: 'No image in response - model may not support image output',
      provider: 'gemini-2.0-flash-exp',
    };
  } catch (error) {
    return {
      imageBase64: null,
      success: false,
      error: error.message || String(error),
      provider: 'gemini-2.0-flash-exp',
    };
  }
}

/**
 * Try using the dedicated image generation model
 */
async function tryGeminiImageGeneration(originalImageBase64, prompt, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  
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
- This is a subtle enhancement, not a transformation
- Output a single enhanced photo`;

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
    
    return {
      imageBase64: null,
      success: false,
      error: 'No image returned from model',
      provider: 'gemini-2.0-flash-exp-image-generation',
    };
  } catch (error) {
    return {
      imageBase64: null,
      success: false,
      error: error.message || String(error),
      provider: 'gemini-2.0-flash-exp-image-generation',
    };
  }
}

/**
 * Try using Imagen 3 via REST API
 */
async function tryImagen3Rest(originalImageBase64, prompt, apiKey) {
  try {
    // Try the standard Imagen endpoint
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
              prompt: `Professional photo editing: ${prompt}. Maintain the exact same person's identity, only enhance lighting, skin clarity, and presentation quality.`,
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
      return {
        imageBase64: null,
        success: false,
        error: `API error ${response.status}: ${errorText.slice(0, 200)}`,
        provider: 'imagen-3',
      };
    }

    const data = await response.json();
    
    if (data.predictions?.[0]?.bytesBase64Encoded) {
      return {
        imageBase64: data.predictions[0].bytesBase64Encoded,
        success: true,
        provider: 'imagen-3',
      };
    }
    
    return {
      imageBase64: null,
      success: false,
      error: 'No image in Imagen response',
      provider: 'imagen-3',
    };
  } catch (error) {
    return {
      imageBase64: null,
      success: false,
      error: error.message || String(error),
      provider: 'imagen-3',
    };
  }
}

export default { generateEnhancedImage };
