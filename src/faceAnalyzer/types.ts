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

// ============ APPEARANCE PROFILE (Auto-Inferred) ============

export type AppearancePresentation = 'male-presenting' | 'female-presenting' | 'ambiguous';

export interface AppearanceProfile {
  /** Visual presentation classification */
  presentation: AppearancePresentation;
  /** Confidence in the presentation classification (0-1) */
  confidence: number;
  /** Estimated age range (only shown if confidence >= 0.4) */
  ageRange?: { min: number; max: number };
  /** Confidence in age estimate (0-1) */
  ageConfidence?: number;
  /** Sexual dimorphism score (0-10, where 5 is neutral/mixed) */
  dimorphismScore10?: number;
  /** Masculinity vs Femininity percentages */
  masculinityFemininity?: { masculinity: number; femininity: number };
  /** Face shape with confidence */
  faceShape?: { label: FaceShapeLabel; confidence: number };
  /** Photo limitation note if angle/lighting affects accuracy */
  photoLimitation?: string;
}

// ============ HARMONY INDEX (Golden Ratio Based) ============

export interface RatioSignal {
  key: string;
  label: string;
  value: number;
  band: [number, number]; // [idealMin, idealMax]
  status: 'good' | 'ok' | 'off';
  confidence: ConfidenceLevel;
}

export interface HarmonyComponent {
  score10: number;
  deviationPct?: number;
  note?: string;
}

export interface HarmonyIndex {
  /** Overall harmony score (0-10) */
  score10: number;
  /** Confidence in harmony assessment */
  confidence: ConfidenceLevel;
  /** Individual harmony components */
  components: {
    facialSymmetry?: HarmonyComponent;
    facialThirds?: HarmonyComponent & { idealDeviation?: string };
    horizontalFifths?: HarmonyComponent;
    goldenRatioProximity?: HarmonyComponent;
  };
  /** Key ratio signals (max 5) */
  ratioSignals?: RatioSignal[];
}

// ============ POTENTIAL RANGE ============

export interface PotentialRange {
  min: number;
  max: number;
  confidence: ConfidenceLevel;
  note?: string;
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
  potentialRange?: PotentialRange;

  // Shape classification
  faceShape: FaceShape;

  // Appearance Profile (auto-inferred from image)
  appearanceProfile?: AppearanceProfile;

  // Harmony Index (golden ratio / phi-based metrics)
  harmonyIndex?: HarmonyIndex;

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

/** @deprecated Use auto-inference via AppearanceProfile instead */
export type SexMode = 'male' | 'female' | 'auto';
export type StylePreference = 'neutral' | 'masculine_leaning' | 'feminine_leaning';

export interface AnalysisInput {
  frontImage: string; // base64
  sideImage?: string; // base64 (optional)
  /** @deprecated Prefer auto-detection. Only use for manual override. */
  sexMode?: SexMode;
  stylePreference?: StylePreference;
}

// ============ SCORING ENGINE TYPES ============

export interface ScoringInput {
  measurements: Measurements;
  photoQuality: PhotoQuality;
  sideProvided: boolean;
  /** @deprecated Use appearanceProfile for confidence-gated weights */
  sexMode?: SexMode;
  stylePreference: StylePreference;
  /** Auto-inferred appearance profile for confidence-gated weight selection */
  appearanceProfile?: AppearanceProfile;
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
