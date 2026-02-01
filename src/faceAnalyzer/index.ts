/**
 * Face Analyzer Module
 * 
 * Exports all types, scoring functions, and the main analyzer
 */

// Types
export * from './types';

// Scoring Engine
export {
  calculateScores,
  assessPhotoQuality,
  CALIBRATION,
  CONFIDENCE_FACTORS,
  PILLAR_WEIGHTS,
  LEVER_CONFIG,
  ratioToScore,
  dampByConfidence,
  dampByPhotoQuality,
  determineConfidence,
  calibrateScore,
} from './scoring';

// Adapter (main entry point)
export {
  analyzeface,
  FEATURE_TEMPLATES,
  STYLE_BY_FACE_SHAPE,
} from './adapter';
