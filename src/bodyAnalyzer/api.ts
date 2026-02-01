/**
 * Body Analyzer API
 * Handles communication with the LLM backend for body analysis
 */

import type { BodyAnalysisResponse, BodyAnalysisInput, BodyPhotoQuality } from './types';
import {
  BODY_ANALYZER_SYSTEM_PROMPT,
  BODY_ANALYZER_USER_PROMPT_TEMPLATE,
} from './prompts/bodyAnalyzerSystemPrompt';
import { computeBodyPhotoQuality } from './scoring';

// ============ CONFIGURATION ============

const API_CONFIG = {
  endpoint: process.env.EXPO_PUBLIC_ANALYZER_API_URL || 'https://api.anthropic.com/v1/messages',
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '',
  model: 'claude-sonnet-4-20250514',
  maxTokens: 8192,
};

// ============ TYPES ============

interface BodyAnalyzerApiOptions {
  endpoint?: string;
  apiKey?: string;
  model?: string;
  timeout?: number;
}

interface LLMContentBlock {
  type: 'text' | 'image';
  text?: string;
  source?: {
    type: 'base64';
    media_type: string;
    data: string;
  };
}

// ============ MAIN API FUNCTION ============

/**
 * Analyze a body using the LLM backend
 */
export async function analyzeBody(
  input: BodyAnalysisInput,
  options?: BodyAnalyzerApiOptions
): Promise<BodyAnalysisResponse> {
  const config = { ...API_CONFIG, ...options };

  // Validate input
  if (!input.frontImage) {
    throw new Error('Front image is required');
  }

  // Extract base64 data from data URL if needed
  const frontBase64 = extractBase64(input.frontImage);
  const sideBase64 = input.sideImage ? extractBase64(input.sideImage) : undefined;

  // Estimate photo quality
  const photoQuality = computeBodyPhotoQuality({
    sideProvided: !!sideBase64,
    brightness: 0.6, // Would need real image processing
    sharpness: 0.7,
    fullBodyVisible: true,
    clothingFit: 'fitted',
    poseNeutral: true,
  });

  // Build the prompt
  const userPrompt = BODY_ANALYZER_USER_PROMPT_TEMPLATE({
    presentation: input.presentation || 'male-presenting',
    sideProvided: !!sideBase64,
    height: input.height,
    weight: input.weight,
    age: input.age,
    isPremium: input.premiumEnabled || false,
    photoQualityScore: photoQuality.score,
    photoQualityIssues: photoQuality.issues,
  });

  // Build content blocks with images
  const contentBlocks: LLMContentBlock[] = [
    {
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/jpeg',
        data: frontBase64,
      },
    },
  ];

  if (sideBase64) {
    contentBlocks.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/jpeg',
        data: sideBase64,
      },
    });
  }

  contentBlocks.push({
    type: 'text',
    text: userPrompt,
  });

  // Make API call
  const response = await callLLM(config, BODY_ANALYZER_SYSTEM_PROMPT, contentBlocks);

  // Parse and validate response
  const result = parseBodyAnalysisResponse(response);

  // Add metadata
  result.analysisId = generateAnalysisId();
  result.timestamp = new Date().toISOString();
  result.version = '1.0.0';

  return result;
}

// ============ LLM CALL ============

async function callLLM(
  config: typeof API_CONFIG,
  systemPrompt: string,
  content: LLMContentBlock[]
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90000); // 90s timeout for body analysis

  try {
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.model,
        max_tokens: config.maxTokens,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content,
          },
        ],
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    // Extract text from response
    if (data.content && data.content[0] && data.content[0].text) {
      return data.content[0].text;
    }

    throw new Error('Unexpected API response format');
  } catch (error) {
    clearTimeout(timeout);

    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Analysis timed out. Please try again.');
    }

    throw error;
  }
}

// ============ RESPONSE PARSING ============

function parseBodyAnalysisResponse(rawResponse: string): BodyAnalysisResponse {
  // Clean up the response - remove any markdown code blocks if present
  let jsonString = rawResponse.trim();

  // Remove markdown code fences if present
  if (jsonString.startsWith('```json')) {
    jsonString = jsonString.slice(7);
  } else if (jsonString.startsWith('```')) {
    jsonString = jsonString.slice(3);
  }

  if (jsonString.endsWith('```')) {
    jsonString = jsonString.slice(0, -3);
  }

  jsonString = jsonString.trim();

  try {
    const parsed = JSON.parse(jsonString);

    // Validate required fields
    if (!parsed.overall || typeof parsed.overall.currentScore10 !== 'number') {
      throw new Error('Invalid response: missing overall.currentScore10');
    }

    if (!parsed.features || !Array.isArray(parsed.features)) {
      throw new Error('Invalid response: missing features array');
    }

    if (!parsed.kibbeAssessment || !parsed.kibbeAssessment.primaryType) {
      throw new Error('Invalid response: missing kibbeAssessment');
    }

    // Ensure safety field exists
    if (!parsed.safety) {
      parsed.safety = {
        disclaimer:
          'This analysis is for entertainment and self-improvement purposes only. Not medical advice.',
        tone: 'constructive',
        limitations: ['Photo quality affects accuracy', 'Results are approximate'],
        scoringContext: 'Scores calibrated where 5.5 is average, 7+ is above average.',
        ageGated: false,
      };
    }

    return parsed as BodyAnalysisResponse;
  } catch (error) {
    console.error('Failed to parse body analysis response:', error);
    console.error('Raw response:', rawResponse.slice(0, 500));
    throw new Error('Failed to parse analysis results. Please try again.');
  }
}

// ============ UTILITIES ============

function extractBase64(dataUrl: string): string {
  if (dataUrl.startsWith('data:')) {
    const commaIndex = dataUrl.indexOf(',');
    if (commaIndex !== -1) {
      return dataUrl.slice(commaIndex + 1);
    }
  }
  return dataUrl;
}

function generateAnalysisId(): string {
  return `ba_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

export default {
  analyzeBody,
};
