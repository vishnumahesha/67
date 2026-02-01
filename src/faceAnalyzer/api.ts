/**
 * Face Analyzer API
 * Handles communication with the LLM backend for face analysis
 */

import type {
  FaceAnalysisResponse,
  AnalysisInput,
  PhotoQuality,
  SexMode,
  StylePreference,
} from './types';
import { FACE_ANALYZER_SYSTEM_PROMPT, FACE_ANALYZER_USER_PROMPT_TEMPLATE } from './prompts/analyzerSystemPrompt';
import { computePhotoQuality } from './scoring';

// ============ CONFIGURATION ============

const API_CONFIG = {
  // Configure your LLM endpoint here
  endpoint: process.env.EXPO_PUBLIC_ANALYZER_API_URL || 'https://api.anthropic.com/v1/messages',
  apiKey: process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY || '',
  model: 'claude-sonnet-4-20250514',
  maxTokens: 4096,
};

// ============ TYPES ============

interface AnalyzerApiOptions {
  endpoint?: string;
  apiKey?: string;
  model?: string;
  timeout?: number;
}

interface LLMMessage {
  role: 'user' | 'assistant';
  content: string | LLMContentBlock[];
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
 * Analyze a face using the LLM backend
 */
export async function analyzeFace(
  input: AnalysisInput,
  options?: AnalyzerApiOptions
): Promise<FaceAnalysisResponse> {
  const config = { ...API_CONFIG, ...options };

  // Validate input
  if (!input.frontImage) {
    throw new Error('Front image is required');
  }

  // Extract base64 data from data URL if needed
  const frontBase64 = extractBase64(input.frontImage);
  const sideBase64 = input.sideImage ? extractBase64(input.sideImage) : undefined;

  // Estimate photo quality (basic check before sending to LLM)
  const photoQuality = computePhotoQuality({
    sideProvided: !!sideBase64,
    // Other quality checks would require image processing
    // For now, assume reasonable defaults
    brightness: 0.6,
    sharpness: 0.7,
    faceSize: 0.4,
    headTilt: 0,
    expressionNeutral: true,
    hairObstructing: false,
    glassesPresent: false,
    faceCount: 1,
  });

  // Build the prompt
  const userPrompt = FACE_ANALYZER_USER_PROMPT_TEMPLATE({
    sexMode: input.sexMode,
    stylePreference: input.stylePreference || 'neutral',
    tier: 'free', // or get from user subscription
    sideProvided: !!sideBase64,
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
  const response = await callLLM(
    config,
    FACE_ANALYZER_SYSTEM_PROMPT,
    contentBlocks
  );

  // Parse and validate response
  const result = parseAnalysisResponse(response);

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
  const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout

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

function parseAnalysisResponse(rawResponse: string): FaceAnalysisResponse {
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

    if (!parsed.topLevers || !Array.isArray(parsed.topLevers)) {
      throw new Error('Invalid response: missing topLevers array');
    }

    // Ensure safety field exists
    if (!parsed.safety) {
      parsed.safety = {
        disclaimer: 'This analysis is for entertainment and self-improvement purposes only.',
        tone: 'neutral',
        limitations: ['Photo quality affects accuracy', 'Results are approximate'],
      };
    }

    return parsed as FaceAnalysisResponse;
  } catch (error) {
    console.error('Failed to parse analysis response:', error);
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
  return `fa_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

// ============ MOCK API (for testing/demo) ============

/**
 * Generate mock analysis results for demo/testing
 */
export function getMockAnalysisResult(input: {
  sexMode: SexMode;
  sideProvided: boolean;
}): FaceAnalysisResponse {
  const baseScore = 5.5 + (Math.random() - 0.5) * 2; // 4.5 - 6.5 range

  return {
    analysisId: generateAnalysisId(),
    timestamp: new Date().toISOString(),
    version: '1.0.0',

    photoQuality: {
      score: 0.75,
      issues: input.sideProvided ? [] : ['side_missing'],
      canProceed: true,
      warnings: input.sideProvided ? [] : ['Side photo would improve jaw/chin analysis'],
    },

    overall: {
      currentScore10: parseFloat(baseScore.toFixed(1)),
      potentialScoreRange: {
        min: parseFloat((baseScore + 0.5).toFixed(1)),
        max: parseFloat(Math.min(baseScore + 1.8, 10).toFixed(1)),
        assumptions: [
          'Hair styling: +0.2 to +0.8',
          'Skincare routine: +0.2 to +0.6',
          'Brow grooming: +0.1 to +0.4',
        ],
      },
      confidence: input.sideProvided ? 'medium' : 'low',
      summary: 'Average facial harmony with clear opportunities for enhancement through presentation.',
      calibrationNote: 'Scores calibrated to realistic distribution (mean ~5.5). A 7+ is genuinely above average.',
    },

    pillarScores: [
      { key: 'structure', score: 5.4, weight: 0.35, confidence: 'medium', contributingTraits: ['face_shape', 'jaw'] },
      { key: 'features', score: 5.8, weight: 0.30, confidence: 'medium', contributingTraits: ['eyes', 'nose', 'lips'] },
      { key: 'skin_presentation', score: 5.2, weight: 0.20, confidence: 'medium', contributingTraits: ['skin', 'hair'] },
      { key: 'harmony', score: 5.6, weight: 0.15, confidence: 'medium', contributingTraits: ['symmetry', 'proportions'] },
    ],

    topLevers: [
      {
        lever: 'hair_styling',
        label: 'Hair Styling',
        deltaMin: 0.2,
        deltaMax: 0.8,
        why: 'High-impact quick change that can reframe face shape',
        timeline: 'today',
        priority: 1,
        actions: ['Get cut suited to face shape', 'Add volume at crown', 'Frame face appropriately'],
      },
      {
        lever: 'skin_routine',
        label: 'Skincare Routine',
        deltaMin: 0.2,
        deltaMax: 0.6,
        why: 'Improves overall presentation and skin clarity',
        timeline: '2_4_weeks',
        priority: 2,
        actions: ['AM: Cleanser, moisturizer, SPF', 'PM: Cleanser, moisturizer', 'Stay hydrated'],
      },
      {
        lever: 'brow_grooming',
        label: 'Brow Grooming',
        deltaMin: 0.1,
        deltaMax: 0.4,
        why: 'Well-groomed brows enhance eye area definition',
        timeline: 'today',
        priority: 3,
        actions: ['Clean up stray hairs', 'Define natural shape', 'Avoid over-plucking'],
      },
    ],

    faceShape: {
      label: 'oval',
      confidence: 'medium',
      description: 'Balanced proportions with slightly longer than wide face. Versatile for most hairstyles.',
    },

    measurements: {
      ratios: [
        { key: 'eye_spacing_ratio', value: 0.31, idealMin: 0.29, idealMax: 0.34, confidence: 'high', note: 'Within ideal range' },
        { key: 'nose_width_ratio', value: 0.25, idealMin: 0.22, idealMax: 0.28, confidence: 'medium', note: 'Well proportioned' },
        { key: 'mouth_width_ratio', value: 0.41, idealMin: 0.38, idealMax: 0.46, confidence: 'high', note: 'Within ideal range' },
        { key: 'jaw_to_face_ratio', value: 0.74, idealMin: 0.68, idealMax: 0.78, confidence: input.sideProvided ? 'medium' : 'low', note: input.sideProvided ? 'Good definition' : 'Side photo would improve accuracy' },
      ],
      symmetry: {
        overall: 0.86,
        eyeHeightDelta: 0.02,
        mouthCornerDelta: 0.01,
        noseDeviation: 0.01,
        confidence: 'medium',
        notes: ['Minor natural asymmetry detected', 'Well within normal range', 'Adds character rather than detracting'],
      },
    },

    features: [
      {
        key: 'eyes',
        label: 'Eyes',
        rating10: 6.2,
        confidence: 'high',
        summary: 'Well-proportioned eyes with good spacing and shape.',
        strengths: ['Good spacing relative to face width', 'Balanced eye size'],
        whatLimitsIt: ['Under-eye area could be brighter'],
        why: ['Eye spacing ratio within ideal range', 'Based on high-confidence measurements'],
        fixes: [
          {
            title: 'Under-Eye Care',
            type: 'routine',
            difficulty: 'easy',
            timeline: '2_4_weeks',
            steps: ['7-9 hours consistent sleep', 'Stay hydrated', 'Cold compress for puffiness'],
            expectedDelta: 0.3,
          },
        ],
      },
      {
        key: 'nose',
        label: 'Nose',
        rating10: 5.5,
        confidence: 'medium',
        summary: 'Average nose proportions that harmonize with face.',
        strengths: ['Width proportional to face'],
        whatLimitsIt: ['Slightly outside ideal range for some ratios'],
        why: ['Nose width ratio measurement', 'Front view assessment only'],
        fixes: [],
      },
      {
        key: 'jawline',
        label: 'Jawline',
        rating10: input.sideProvided ? 5.6 : 5.3,
        confidence: input.sideProvided ? 'medium' : 'low',
        summary: input.sideProvided
          ? 'Average jaw definition with room for enhancement.'
          : 'Limited assessment without side photo. Score is conservative.',
        strengths: ['Proportional to face width'],
        whatLimitsIt: input.sideProvided ? ['Could benefit from posture improvement'] : ['Side photo needed for accurate assessment'],
        why: [input.sideProvided ? 'Based on front and side measurements' : 'Front view only - conservative estimate'],
        fixes: [
          {
            title: 'Posture Improvement',
            type: 'no_cost',
            difficulty: 'medium',
            timeline: '2_4_weeks',
            steps: ['Chin tuck exercises: 2 sets of 10 daily', 'Reduce forward head position', 'Ergonomic workspace setup'],
            expectedDelta: 0.3,
          },
        ],
      },
      {
        key: 'skin',
        label: 'Skin',
        rating10: 5.2,
        confidence: 'low',
        summary: 'Skin assessment limited by photo quality. General care recommended.',
        strengths: ['No major concerns visible'],
        whatLimitsIt: ['Could benefit from consistent routine', 'Photo quality affects assessment'],
        why: ['Skin assessment heavily dependent on lighting', 'Conservative score due to photo limitations'],
        fixes: [
          {
            title: 'Basic Skincare Routine',
            type: 'routine',
            difficulty: 'easy',
            timeline: '2_4_weeks',
            steps: ['Gentle cleanser AM/PM', 'Moisturizer', 'SPF daily (AM only)'],
            expectedDelta: 0.5,
          },
        ],
      },
      {
        key: 'harmony',
        label: 'Harmony',
        rating10: 5.6,
        confidence: 'medium',
        summary: 'Good facial harmony with minor asymmetry within normal range.',
        strengths: ['Features work well together', 'Symmetry within normal range'],
        whatLimitsIt: ['Minor natural variations'],
        why: ['Composite of symmetry and proportion measurements'],
        fixes: [],
      },
    ],

    styleTips: {
      haircuts: [
        'Side-swept styles work well with your face shape',
        'Avoid completely flat styles - add some volume',
        'Medium length with texture is flattering',
      ],
      glasses: [
        'Rectangular or square frames complement oval faces',
        'Avoid frames wider than your face',
        'Consider lighter frames for a softer look',
      ],
      facialHair: input.sexMode === 'male' ? [
        'Clean stubble or short beard can enhance jaw definition',
        'Keep lines clean and well-maintained',
        'Avoid overly long or unkempt styles',
      ] : [],
      grooming: [
        'Keep brows groomed but natural-looking',
        'Maintain consistent skincare routine',
        'Stay hydrated for better skin appearance',
      ],
    },

    safety: {
      disclaimer: 'This analysis is for entertainment and self-improvement purposes only. Results are approximate and should not be taken as medical advice.',
      tone: 'neutral',
      limitations: [
        'Photo quality affects accuracy',
        'Results are approximate estimates',
        'Potential scores assume consistent effort',
      ],
    },
  };
}

export default {
  analyzeFace,
  getMockAnalysisResult,
};
