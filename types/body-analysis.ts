import { z } from 'zod';

// ============ CONFIDENCE & QUALITY ============

export const ConfidenceSchema = z.enum(['low', 'medium', 'high']);
export type Confidence = z.infer<typeof ConfidenceSchema>;

export const DepthSchema = z.enum(['free', 'premium']);
export type Depth = z.infer<typeof DepthSchema>;

export const DifficultySchema = z.enum(['easy', 'moderate', 'difficult']);
export type Difficulty = z.infer<typeof DifficultySchema>;

export const ImpactSchema = z.enum(['low', 'medium', 'high']);
export type Impact = z.infer<typeof ImpactSchema>;

// ============ APPEARANCE PRESENTATION ============

export type AppearancePresentation = 'male-presenting' | 'female-presenting';

export interface AppearanceProfile {
  presentation: AppearancePresentation;
  confidence: number;
  ageRange?: { min: number; max: number };
  ageConfidence?: number;
  photoLimitation?: string;
}

// ============ KIBBE BODY TYPE SYSTEM ============

export const KibbeTypeSchema = z.enum([
  'dramatic',
  'soft_dramatic',
  'natural',
  'soft_natural',
  'flamboyant_natural',
  'classic',
  'soft_classic',
  'dramatic_classic',
  'romantic',
  'theatrical_romantic',
  'gamine',
  'soft_gamine',
  'flamboyant_gamine',
]);
export type KibbeType = z.infer<typeof KibbeTypeSchema>;

export const KibbeMetadata: Record<KibbeType, { label: string; description: string; icon: string }> = {
  dramatic: {
    label: 'Dramatic',
    description: 'Sharp, angular bone structure with elongated vertical line. Strong, narrow features with minimal curves.',
    icon: '🔷',
  },
  soft_dramatic: {
    label: 'Soft Dramatic',
    description: 'Angular bone structure with soft, lush flesh. Tall with curves layered over a dramatic frame.',
    icon: '🌙',
  },
  natural: {
    label: 'Natural',
    description: 'Broad, blunt bone structure with moderate vertical. Athletic and relaxed appearance.',
    icon: '🌿',
  },
  soft_natural: {
    label: 'Soft Natural',
    description: 'Broad frame with soft edges. Slightly curvy over an athletic foundation.',
    icon: '🌸',
  },
  flamboyant_natural: {
    label: 'Flamboyant Natural',
    description: 'Tall with broad, blunt bones. Long limbs with a relaxed, open appearance.',
    icon: '🌾',
  },
  classic: {
    label: 'Classic',
    description: 'Perfectly balanced proportions. Moderate in all aspects with symmetrical features.',
    icon: '⚖️',
  },
  soft_classic: {
    label: 'Soft Classic',
    description: 'Balanced bone structure with slight softness. Moderate with subtle curves.',
    icon: '🎀',
  },
  dramatic_classic: {
    label: 'Dramatic Classic',
    description: 'Balanced bone structure with slight sharpness. Moderate with subtle angularity.',
    icon: '💎',
  },
  romantic: {
    label: 'Romantic',
    description: 'Small, delicate bones with very soft, rounded flesh. Curves dominate the silhouette.',
    icon: '🌹',
  },
  theatrical_romantic: {
    label: 'Theatrical Romantic',
    description: 'Delicate bones with slight sharpness, lush curves. Petite with dramatic flair.',
    icon: '✨',
  },
  gamine: {
    label: 'Gamine',
    description: 'Compact with a mix of yin and yang. Angular and soft features combined in a petite frame.',
    icon: '⭐',
  },
  soft_gamine: {
    label: 'Soft Gamine',
    description: 'Compact frame with more curves than angles. Youthful, with rounded features.',
    icon: '🍑',
  },
  flamboyant_gamine: {
    label: 'Flamboyant Gamine',
    description: 'Compact frame with more angles than curves. Sharp features in a petite package.',
    icon: '⚡',
  },
};

export interface KibbeAssessment {
  primaryType: KibbeType;
  secondaryType?: KibbeType;
  confidence: Confidence;
  yinYangBalance: {
    yin: number; // 0-100 (soft, curved, small)
    yang: number; // 0-100 (sharp, angular, large)
  };
  dominantTraits: string[];
  stylingNotes: string[];
  celebrityExamples?: string[];
}

// ============ PHOTO QUALITY ============

export const BodyPhotoQualityIssueSchema = z.enum([
  'too_dark',
  'too_bright',
  'not_full_body',
  'baggy_clothes',
  'pose_inconsistent',
  'side_missing',
  'blurry',
  'angle_distortion',
  'inconsistent_lighting',
  'background_cluttered',
  'clothing_too_loose',
  'cropped_body_parts',
  'mirror_selfie_distortion',
]);
export type BodyPhotoQualityIssue = z.infer<typeof BodyPhotoQualityIssueSchema>;

export const BodyPhotoQualitySchema = z.object({
  score: z.number().min(0).max(100),
  issues: z.array(BodyPhotoQualityIssueSchema),
  canProceed: z.boolean(),
  warnings: z.array(z.string()),
});
export type BodyPhotoQuality = z.infer<typeof BodyPhotoQualitySchema>;

// ============ STRUCTURAL RATIOS (Science-Based) ============

export interface RatioMeasurement {
  key: string;
  label: string;
  value: number;
  idealMin: number;
  idealMax: number;
  percentile?: number;
  confidence: Confidence;
  note?: string;
  status: 'below' | 'ideal' | 'above';
}

export interface StructuralRatios {
  // Core ratios
  shoulderToWaist: RatioMeasurement; // SWR - key V-taper indicator
  waistToHip: RatioMeasurement; // WHR - health & aesthetics
  chestToWaist?: RatioMeasurement; // Male-presenting focus
  hipToWaist?: RatioMeasurement; // Female-presenting focus
  
  // Proportional ratios
  legToTorso: RatioMeasurement;
  armLengthProportionality: RatioMeasurement;
  shoulderWidthToHeadWidth: RatioMeasurement;
  
  // Frame
  frameSize: 'small' | 'medium' | 'large';
  frameSizeConfidence: Confidence;
}

// ============ POSTURE & ALIGNMENT ============

export interface PostureMeasurement {
  issue: string;
  severity: 'none' | 'mild' | 'moderate' | 'significant';
  angleDegrees?: number;
  confidence: Confidence;
  note: string;
  correction?: string;
}

export interface PostureAssessment {
  overall: {
    score10: number;
    confidence: Confidence;
    summary: string;
  };
  forwardHead?: PostureMeasurement;
  roundedShoulders?: PostureMeasurement;
  anteriorPelvicTilt?: PostureMeasurement;
  posteriorPelvicTilt?: PostureMeasurement;
  ribFlare?: PostureMeasurement;
  kneeLockout?: PostureMeasurement;
  stanceAsymmetry?: PostureMeasurement;
}

// ============ BODY COMPOSITION SIGNALS ============

export interface BodyComposition {
  visualBodyFatEstimate: {
    range: { min: number; max: number }; // e.g., 15-18%
    confidence: Confidence;
    note: string;
  };
  fatDistributionPattern: 'upper_dominant' | 'lower_dominant' | 'mixed' | 'even';
  muscleBalanceUpperLower: 'upper_dominant' | 'lower_dominant' | 'balanced';
  leftRightSymmetry: {
    score: number; // 0-1
    confidence: Confidence;
    asymmetries: string[];
  };
}

// ============ BODY FEATURES ============

export const BODY_FEATURE_KEYS = [
  'overall_aesthetics',
  'v_taper',
  'shoulder_development',
  'waist_definition',
  'hip_proportion',
  'leg_proportion',
  'posture',
  'symmetry',
  'muscle_balance',
  'body_composition',
] as const;
export type BodyFeatureKey = (typeof BODY_FEATURE_KEYS)[number];

export interface BodyFix {
  title: string;
  type: 'workout' | 'nutrition' | 'mobility' | 'routine' | 'posture' | 'styling';
  difficulty: Difficulty;
  timeToSeeChange: string;
  steps: string[];
  expectedDelta?: number;
  caution?: string;
}

export interface BodyFeature {
  key: BodyFeatureKey | string;
  label: string;
  rating10: number;
  confidence: Confidence;
  summary: string;
  strengths: string[];
  limitations: string[];
  why: string[];
  evidence?: string;
  fixes: BodyFix[];
}

// ============ IMPROVEMENT LEVERS ============

export interface BodyTopLever {
  lever: string;
  title: string;
  deltaMin: number;
  deltaMax: number;
  timeline: string;
  priority: number;
  impact: Impact;
  why: string;
  actions: string[];
}

export interface BodyPotential {
  totalPossibleGain: { min: number; max: number };
  top3Levers: BodyTopLever[];
  timelineToFullPotential: string;
  assumptions: string[];
  deltas: Array<{
    lever: string;
    currentIssue: string;
    delta: number;
    potentialGain: string;
    timeline: string;
    difficulty: Difficulty;
    steps: string[];
  }>;
}

// ============ WORKOUT RECOMMENDATIONS ============

export interface ExerciseRecommendation {
  name: string;
  targetArea: string;
  sets: string;
  reps: string;
  notes: string;
  priority: 'essential' | 'recommended' | 'optional';
}

export interface WorkoutPlan {
  focusAreas: string[];
  weeklyFrequency: string;
  splitSuggestion: string;
  exercises: ExerciseRecommendation[];
  cardioRecommendation?: string;
  mobilityWork: string[];
  estimatedResultsTimeline: string;
}

// ============ STYLING RECOMMENDATIONS ============

export interface ClothingRecommendation {
  category: 'tops' | 'bottoms' | 'outerwear' | 'dresses' | 'suits' | 'accessories';
  recommendations: string[];
  avoid: string[];
  why: string;
}

export interface StylingGuide {
  kibbeStyleSummary: string;
  silhouettePrinciple: string;
  colorAdvice: string[];
  patternAdvice: string[];
  fabricAdvice: string[];
  clothingRecommendations: ClothingRecommendation[];
  accessoryTips: string[];
  occasionSpecific?: {
    casual: string[];
    business: string[];
    formal: string[];
  };
}

// ============ OVERALL SCORES ============

export interface BodyOverall {
  currentScore10: number;
  potentialScoreRange: { min: number; max: number };
  confidence: Confidence;
  summary: string;
  calibrationNote: string;
}

export interface BodyPillarScore {
  key: 'proportions' | 'composition' | 'posture' | 'symmetry';
  score: number;
  weight: number;
  confidence: Confidence;
  contributingTraits: string[];
}

// ============ SAFETY ============

export interface BodySafety {
  disclaimer: string;
  tone: 'neutral' | 'constructive';
  limitations: string[];
  scoringContext: string;
  ageGated: boolean;
}

// ============ TIER ============

export interface BodyTier {
  isPremium: boolean;
  depth: Depth;
}

// ============ MAIN RESPONSE ============

export interface BodyAnalysisResponse {
  // Meta
  analysisId: string;
  timestamp: string;
  version: string;

  // Tier
  tier: BodyTier;

  // Inputs received
  inputs: {
    presentation: AppearancePresentation;
    sideProvided: boolean;
    height?: string;
    weight?: string;
    age?: number;
  };

  // Quality gate
  photoQuality: BodyPhotoQuality;

  // Appearance profile (auto-inferred)
  appearanceProfile?: AppearanceProfile;

  // Core scores
  overall: BodyOverall;
  pillarScores: BodyPillarScore[];

  // Kibbe body typing
  kibbeAssessment: KibbeAssessment;

  // Scientific measurements
  structuralRatios: StructuralRatios;
  posture?: PostureAssessment;
  bodyComposition?: BodyComposition;

  // Feature breakdowns
  features: BodyFeature[];

  // Improvement potential
  potential: BodyPotential;
  topLevers: BodyTopLever[];

  // Recommendations
  workoutPlan: WorkoutPlan;
  stylingGuide: StylingGuide;

  // Safety
  safety: BodySafety;

  // Debug info (optional)
  debug?: {
    rawScores: Record<string, number>;
    calibrationApplied: boolean;
    dampingFactors: Record<string, number>;
  };
}

// ============ INPUT TYPES ============

export interface BodyAnalysisInput {
  frontImage: string; // base64
  sideImage?: string; // base64
  presentation?: AppearancePresentation;
  height?: string;
  weight?: string;
  age?: number;
  premiumEnabled?: boolean;
}

// ============ FEATURE METADATA ============

export interface BodyFeatureMetadata {
  key: string;
  label: string;
  icon: string;
  description: string;
  maxDelta?: number;
}

export const BODY_FEATURE_METADATA: Record<string, BodyFeatureMetadata> = {
  overall_aesthetics: {
    key: 'overall_aesthetics',
    label: 'Overall Body Aesthetics',
    icon: '✨',
    description: 'Combined assessment of proportions, composition, and presentation',
    maxDelta: 2.0,
  },
  v_taper: {
    key: 'v_taper',
    label: 'V-Taper / Silhouette',
    icon: '📐',
    description: 'Shoulder-to-waist ratio and upper body width creating the V shape',
    maxDelta: 1.2,
  },
  shoulder_development: {
    key: 'shoulder_development',
    label: 'Shoulder Frame',
    icon: '💪',
    description: 'Shoulder width, capping, and overall frame presentation',
    maxDelta: 0.8,
  },
  waist_definition: {
    key: 'waist_definition',
    label: 'Waist Definition',
    icon: '🎯',
    description: 'Waist tightness and midsection presentation',
    maxDelta: 1.0,
  },
  hip_proportion: {
    key: 'hip_proportion',
    label: 'Hip Proportion',
    icon: '⚖️',
    description: 'Hip width relative to waist and shoulders',
    maxDelta: 0.6,
  },
  leg_proportion: {
    key: 'leg_proportion',
    label: 'Leg Proportion',
    icon: '🦵',
    description: 'Leg length and development relative to torso',
    maxDelta: 0.4,
  },
  posture: {
    key: 'posture',
    label: 'Posture & Alignment',
    icon: '🧘',
    description: 'Spine alignment, shoulder position, and overall carriage',
    maxDelta: 0.8,
  },
  symmetry: {
    key: 'symmetry',
    label: 'Body Symmetry',
    icon: '🔄',
    description: 'Left-right balance and proportional harmony',
    maxDelta: 0.4,
  },
  muscle_balance: {
    key: 'muscle_balance',
    label: 'Muscle Balance',
    icon: '🏋️',
    description: 'Upper/lower and front/back muscle development balance',
    maxDelta: 0.8,
  },
  body_composition: {
    key: 'body_composition',
    label: 'Body Composition',
    icon: '🔥',
    description: 'Body fat distribution and muscle definition visibility',
    maxDelta: 1.5,
  },
};

// ============ SCORE CONTEXT ============

export const BODY_SCORE_CONTEXT: Record<number, string> = {
  1: 'Significantly below average',
  2: 'Well below average',
  3: 'Below average',
  4: 'Slightly below average',
  5: 'Average',
  6: 'Slightly above average',
  7: 'Above average (top 30%)',
  8: 'Well above average (top 15%)',
  9: 'Exceptional (top 5%)',
  10: 'Elite level (top 1%)',
};

// ============ IDEAL RATIO RANGES ============

export const IDEAL_RATIOS = {
  male: {
    shoulderToWaist: { min: 1.45, max: 1.60, ideal: 1.52 },
    waistToHip: { min: 0.85, max: 0.95, ideal: 0.90 },
    chestToWaist: { min: 1.15, max: 1.30, ideal: 1.22 },
    legToTorso: { min: 1.0, max: 1.1, ideal: 1.05 },
    shoulderToHead: { min: 2.5, max: 3.0, ideal: 2.75 },
  },
  female: {
    shoulderToWaist: { min: 1.35, max: 1.50, ideal: 1.42 },
    waistToHip: { min: 0.65, max: 0.75, ideal: 0.70 },
    hipToWaist: { min: 1.25, max: 1.45, ideal: 1.35 },
    legToTorso: { min: 1.0, max: 1.15, ideal: 1.08 },
    shoulderToHead: { min: 2.3, max: 2.8, ideal: 2.55 },
  },
};
