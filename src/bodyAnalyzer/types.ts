/**
 * Body Analyzer Types
 * Re-exports from main types + internal types
 */

export type {
  BodyAnalysisResponse,
  BodyAnalysisInput,
  BodyFeature,
  BodyFix,
  BodyTopLever,
  BodyPotential,
  BodyOverall,
  BodyPillarScore,
  BodyPhotoQuality,
  BodyPhotoQualityIssue,
  KibbeAssessment,
  KibbeType,
  StructuralRatios,
  PostureAssessment,
  BodyComposition,
  WorkoutPlan,
  StylingGuide,
  AppearancePresentation,
  Confidence,
  Difficulty,
  Impact,
} from '@/types/body-analysis';

export { KibbeMetadata, BODY_FEATURE_METADATA, BODY_SCORE_CONTEXT, IDEAL_RATIOS } from '@/types/body-analysis';

// ============ INTERNAL API TYPES ============

export interface BodyAnalyzerApiOptions {
  endpoint?: string;
  apiKey?: string;
  model?: string;
  timeout?: number;
}

export interface PhotoQualityInput {
  sideProvided: boolean;
  brightness?: number;
  sharpness?: number;
  fullBodyVisible?: boolean;
  clothingFit?: 'fitted' | 'loose' | 'very_loose';
  poseNeutral?: boolean;
}

export interface BodyScoringInput {
  ratios: Record<string, number>;
  photoQuality: { score: number; issues: string[] };
  sideProvided: boolean;
  presentation: 'male-presenting' | 'female-presenting';
  height?: string;
  weight?: string;
}
