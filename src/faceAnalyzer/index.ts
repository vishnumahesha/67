/**
 * Face Analyzer Module
 * 
 * Exports all types, scoring functions, API, and prompts
 */

// Types
export * from './types';

// Scoring Engine
export {
  computePhotoQuality,
  calibrateScore,
  scoreMetricsToTraits,
  computeOverallScore,
  computePotentialRange,
  selectTopLevers,
  computeFeatureScores,
  runScoringPipeline,
} from './scoring';

// Adapter (high-level analysis function)
export {
  analyzeFace as analyzeWithAdapter,
  FEATURE_TEMPLATES,
  STYLE_BY_FACE_SHAPE,
} from './adapter';

// API (LLM-based analysis)
export {
  analyzeFace,
  getMockAnalysisResult,
} from './api';

// Prompts
export {
  FACE_ANALYZER_SYSTEM_PROMPT,
  FACE_ANALYZER_USER_PROMPT_TEMPLATE,
} from './prompts/analyzerSystemPrompt';
