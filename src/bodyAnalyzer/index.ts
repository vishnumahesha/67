/**
 * Body Analyzer Module
 * Science-based body indicators + Kibbe body typing
 */

// API
export { analyzeBody } from './api';
export { getMockBodyAnalysisResult } from './mockData';

// Scoring utilities
export {
  computeBodyPhotoQuality,
  dampenScore,
  calculateOverallScore,
  getConfidenceLevel,
  scoreRatio,
  calculatePotentialGain,
} from './scoring';

// Prompts
export {
  BODY_ANALYZER_SYSTEM_PROMPT,
  BODY_ANALYZER_USER_PROMPT_TEMPLATE,
} from './prompts/bodyAnalyzerSystemPrompt';

// Types
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
  BodyAnalyzerApiOptions,
} from './types';

export { KibbeMetadata, BODY_FEATURE_METADATA, BODY_SCORE_CONTEXT, IDEAL_RATIOS } from './types';
