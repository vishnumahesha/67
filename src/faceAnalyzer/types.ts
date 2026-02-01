/**
 * Face Analyzer Types
 * Comprehensive type definitions for the face analysis system
 */

// ============ CONFIDENCE & QUALITY ============

export type ConfidenceLevel = 'low' | 'medium' | 'high';

export type PhotoIssue =
  | 'too_dark'
  | 'harsh_shadows'
  | 'blur'
  | 'too_close_wide_angle'
  | 'head_tilt'
  | 'expression_not_neutral'
  | 'hair_obstructing'
  | 'glasses_obstructing'
  | 'multiple_faces'
  | 'side_missing';

export interface PhotoQuality {
  score: number; // 0.0 to 1.0
  issues: PhotoIssue[];
  canProceed: boolean;
  warnings: string[];
}

// ============ MEASUREMENTS ============

export interface RatioMeasurement {
  key: string;
  value: number;
  idealMin: number;
  idealMax: number;
  confidence: ConfidenceLevel;
  percentile?: number;
  note?: string;
}

export interface SymmetryScore {
  overall: number;
  eyeHeightDelta: number;
  mouthCornerDelta: number;
  noseDeviation: number;
  confidence: ConfidenceLevel;
  notes: string[];
}

export interface Measurements {
  ratios: RatioMeasurement[];
  symmetry: SymmetryScore;
  rawLandmarks?: Record<string, { x: number; y: number }>;
}

// ============ FACE SHAPE ============

export type FaceShapeLabel =
  | 'oval'
  | 'round'
  | 'square'
  | 'heart'
  | 'diamond'
  | 'oblong'
  | 'rectangle';

export interface FaceShape {
  label: FaceShapeLabel;
  confidence: ConfidenceLevel;
  secondaryShape?: FaceShapeLabel;
  description: string;
}

// ============ FEATURES ============

export type FeatureKey =
  | 'eyes'
  | 'brows'
  | 'nose'
  | 'lips'
  | 'cheekbones'
  | 'jawline'
  | 'skin'
  | 'hair'
  | 'harmony';

export interface Fix {
  title: string;
  type: 'no_cost' | 'low_cost' | 'routine' | 'lifestyle' | 'professional';
  difficulty: 'easy' | 'medium' | 'hard';
  timeline: 'today' | '2_4_weeks' | '8_12_weeks';
  steps: string[];
  expectedDelta?: number;
  caution?: string;
}

export interface Feature {
  key: FeatureKey;
  label: string;
  rating10: number;
  confidence: ConfidenceLevel;
  summary: string;
  strengths: string[];
  whatLimitsIt: string[];
  why: string[];
  fixes: Fix[];
  subTraits?: SubTrait[];
}

export interface SubTrait {
  key: string;
  name: string;
  score: number;
  confidence: ConfidenceLevel;
  note?: string;
}

// ============ POTENTIAL & LEVERS ============

export type LeverKey =
  | 'skin_routine'
  | 'under_eye_care'
  | 'brow_grooming'
  | 'hair_styling'
  | 'facial_hair'
  | 'posture_correction'
  | 'photo_optimization'
  | 'lip_care'
  | 'body_composition';

export type Timeline = 'today' | '2_4_weeks' | '8_12_weeks';

export interface TopLever {
  lever: LeverKey;
  label: string;
  deltaMin: number;
  deltaMax: number;
  why: string;
  timeline: Timeline;
  priority: number;
  actions: string[];
}

export interface PotentialScoreRange {
  min: number;
  max: number;
  assumptions: string[];
}

// ============ STYLE RECOMMENDATIONS ============

export interface StyleTips {
  haircuts: string[];
  glasses: string[];
  facialHair: string[];
  grooming: string[];
  colorPalette?: string[];
}

// ============ OVERALL SCORES ============

export interface OverallScore {
  currentScore10: number;
  potentialScoreRange: PotentialScoreRange;
  confidence: ConfidenceLevel;
  summary: string;
  calibrationNote: string;
}

export interface PillarScore {
  key: 'structure' | 'features' | 'skin_presentation' | 'harmony';
  score: number;
  weight: number;
  confidence: ConfidenceLevel;
  contributingTraits: string[];
}

// ============ SAFETY ============

export interface Safety {
  disclaimer: string;
  tone: 'neutral' | 'encouraging';
  limitations: string[];
}

// ============ MAIN RESPONSE ============

export interface FaceAnalysisResponse {
  // Meta
  analysisId: string;
  timestamp: string;
  version: string;

  // Quality gate
  photoQuality: PhotoQuality;

  // Core scores
  overall: OverallScore;
  pillarScores: PillarScore[];

  // Improvement potential
  topLevers: TopLever[];

  // Shape classification
  faceShape: FaceShape;

  // Detailed measurements
  measurements: Measurements;

  // Feature breakdowns
  features: Feature[];

  // Style recommendations
  styleTips: StyleTips;

  // Safety
  safety: Safety;

  // Debug info (optional, for development)
  debug?: {
    rawScores: Record<string, number>;
    calibrationApplied: boolean;
    dampingFactors: Record<string, number>;
  };
}

// ============ INPUT TYPES ============

export type SexMode = 'male' | 'female';
export type StylePreference = 'neutral' | 'masculine_leaning' | 'feminine_leaning';

export interface AnalysisInput {
  frontImage: string; // base64
  sideImage?: string; // base64 (optional)
  sexMode: SexMode;
  stylePreference?: StylePreference;
}

// ============ SCORING ENGINE TYPES ============

export interface ScoringInput {
  measurements: Measurements;
  photoQuality: PhotoQuality;
  sideProvided: boolean;
  sexMode: SexMode;
  stylePreference: StylePreference;
  externalApiResult?: Partial<FaceAnalysisResponse>;
}

export interface TraitScore {
  traitKey: string;
  rawScore: number;
  dampedScore: number;
  confidence: ConfidenceLevel;
  weight: number;
}

export interface ScoringOutput {
  traitScores: TraitScore[];
  pillarScores: PillarScore[];
  overallCurrent: number;
  overallPotential: PotentialScoreRange;
  topLevers: TopLever[];
  calibrationApplied: boolean;
}

// ============ UI STATE TYPES ============

export type ResultsTab = 'overview' | 'features' | 'measurements' | 'style';

export interface AnalysisState {
  status: 'idle' | 'capturing' | 'uploading' | 'analyzing' | 'complete' | 'error';
  progress: number;
  progressMessage: string;
  frontImage: string | null;
  sideImage: string | null;
  result: FaceAnalysisResponse | null;
  error: string | null;
}
