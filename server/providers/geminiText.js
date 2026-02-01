/**
 * Gemini Text Provider
 * Generates Imagen prompts and change descriptions using Gemini
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const SYSTEM_PROMPT = `You are an AI assistant that creates photo enhancement prompts. 
Given a person's photo, generate a detailed prompt for an AI image generator that will create 
an enhanced version of the same person.

CRITICAL RULES:
1. PRESERVE IDENTITY - Must be the same person, recognizable
2. NO ethnicity changes
3. NO age changes
4. NO bone structure changes (same face shape, same skull)
5. NO sexualized content
6. This is an ENHANCEMENT/EDIT, not a new person

ALLOWED IMPROVEMENTS:
- Skin clarity and texture (clear, healthy skin)
- Better lighting (soft, flattering light)
- Hair styling (well-groomed, styled nicely)
- Subtle grooming (clean eyebrows, neat facial hair if present)
- Improved posture/angle
- Better color grading
- Reduced under-eye darkness
- More balanced skin tone

OUTPUT FORMAT:
Return ONLY a JSON object with this structure:
{
  "imagenPrompt": "A detailed prompt for the image generator...",
  "changes": ["Change 1", "Change 2", "Change 3", "Change 4", "Change 5"]
}

The imagenPrompt should be 2-4 sentences describing the enhanced photo.
The changes should be 3-5 bullet points describing what was improved.`;

/**
 * Generate enhancement prompt using Gemini
 * @param {string} imageBase64 - Base64 encoded image
 * @param {string} apiKey - Gemini API key
 * @returns {Promise<{imagenPrompt: string, changes: string[]}>}
 */
export async function generateEnhancementPrompt(imageBase64, apiKey) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const userPrompt = `${SYSTEM_PROMPT}

Analyze this person's photo and create an enhancement prompt that will make them look 
their best while preserving their identity completely.

Focus on:
- What specific skin improvements would help?
- How could the lighting be better?
- What hair styling would enhance their look?
- Any grooming improvements?
- Better angles or composition?

Generate the JSON response now.`;

  try {
    const result = await model.generateContent([
      userPrompt,
      {
        inlineData: {
          data: imageBase64,
          mimeType: 'image/jpeg',
        },
      },
    ]);

    const response = await result.response;
    let text = response.text();
    
    // Clean up response
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const parsed = JSON.parse(text);
    
    // Validate structure
    if (!parsed.imagenPrompt || !Array.isArray(parsed.changes)) {
      throw new Error('Invalid response structure');
    }
    
    return {
      imagenPrompt: parsed.imagenPrompt,
      changes: parsed.changes.slice(0, 5), // Max 5 changes
    };
  } catch (error) {
    console.error('Gemini prompt generation error:', error);
    
    // Return fallback prompt
    return {
      imagenPrompt: 'A professional, well-lit portrait photo of the same person with clear, healthy skin, well-styled hair, and flattering natural lighting. The photo maintains the same identity while enhancing overall presentation.',
      changes: [
        'Enhanced skin clarity and even tone',
        'Improved lighting for a more flattering look',
        'Refined hair styling',
        'Subtle grooming improvements',
        'Better color balance and contrast',
      ],
    };
  }
}

export default { generateEnhancementPrompt };
