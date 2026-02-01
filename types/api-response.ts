/**
 * Face Analyzer API Response Schema
 * This is the contract between the server and the UI
 */

export interface FaceAnalysisResponse {
  photoQuality: PhotoQuality;
  overall: OverallScore;
  topLevers: TopLever[];
  faceShape: FaceShape;
  measurements: Measurements;
  features: Feature[];
  styleTips: StyleTips;
  safety: Safety;
}

export interface PhotoQuality {
  score: number; // 0.0 to 1.0
  issues: PhotoIssue[];
}

export type PhotoIssue = 
  | "too_dark"
  | "harsh_shadows"
  | "blur"
  | "too_close_wide_angle"
  | "head_tilt"
  | "expression_not_neutral"
  | "hair_obstructing"
  | "glasses_obstructing"
  | "multiple_faces"
  | "side_missing";

export interface OverallScore {
  currentScore10: number; // 0.0 to 10.0
  potentialScoreRange: {
    min: number;
    max: number;
  };
  confidence: ConfidenceLevel;
  summary: string;
}

export type ConfidenceLevel = "low" | "medium" | "high";

export interface TopLever {
  lever: LeverType;
  deltaMin: number;
  deltaMax: number;
  why: string;
  timeline: Timeline;
}

export type LeverType = 
  | "hair"
  | "skin"
  | "brows"
  | "under_eye"
  | "posture"
  | "presentation_photos";

export type Timeline = "today" | "2_4_weeks" | "8_12_weeks";

export interface FaceShape {
  label: FaceShapeLabel;
  confidence: ConfidenceLevel;
}

export type FaceShapeLabel = 
  | "oval"
  | "round"
  | "square"
  | "heart"
  | "diamond"
  | "oblong";

export interface Measurements {
  ratios: RatioMeasurement[];
  symmetry: SymmetryScore;
}

export interface RatioMeasurement {
  key: string;
  value: number;
  confidence: ConfidenceLevel;
  note?: string;
}

export interface SymmetryScore {
  score: number;
  confidence: ConfidenceLevel;
  notes: string[];
}

export interface Feature {
  key: FeatureKey;
  rating10: number;
  confidence: ConfidenceLevel;
  strengths: string[];
  whatLimitsIt: string[];
  why: string[];
  fixes: Fix[];
}

export type FeatureKey = 
  | "eyes"
  | "brows"
  | "nose"
  | "lips"
  | "cheekbones"
  | "jawline"
  | "skin"
  | "hair"
  | "harmony"
  | "symmetry"
  | "posture";

export interface Fix {
  title: string;
  type: FixType;
  difficulty: Difficulty;
  timeline: Timeline;
  steps: string[];
}

export type FixType = "no_cost" | "low_cost" | "routine";
export type Difficulty = "easy" | "medium" | "hard";

export interface StyleTips {
  haircuts: string[];
  glasses: string[];
  grooming: string[];
}

export interface Safety {
  disclaimer: string;
  tone: "neutral" | "encouraging";
}

/**
 * Example response for reference:
 */
export const exampleResponse: FaceAnalysisResponse = {
  photoQuality: { score: 0.75, issues: ["side_missing"] },
  
  overall: {
    currentScore10: 5.8,
    potentialScoreRange: { min: 6.8, max: 7.4 },
    confidence: "medium",
    summary: "Good facial harmony with room for improvement in presentation areas."
  },
  
  topLevers: [
    { lever: "skin", deltaMin: 0.3, deltaMax: 0.8, why: "Skin texture could be improved", timeline: "8_12_weeks" },
    { lever: "hair", deltaMin: 0.2, deltaMax: 0.5, why: "Hairstyle could better complement face shape", timeline: "today" },
    { lever: "brows", deltaMin: 0.1, deltaMax: 0.3, why: "Brow grooming could enhance eye area", timeline: "today" }
  ],
  
  faceShape: { label: "oval", confidence: "medium" },
  
  measurements: {
    ratios: [
      { key: "eye_spacing_ratio", value: 0.32, confidence: "high", note: "Within ideal range" },
      { key: "nose_width_ratio", value: 0.28, confidence: "medium" }
    ],
    symmetry: { score: 7.2, confidence: "medium", notes: ["Minor asymmetry in brow height"] }
  },
  
  features: [
    {
      key: "eyes",
      rating10: 6.5,
      confidence: "high",
      strengths: ["Good symmetry", "Positive canthal tilt"],
      whatLimitsIt: ["Under-eye darkness"],
      why: ["Eyes show good shape and spacing"],
      fixes: [
        { title: "Under-eye care", type: "routine", difficulty: "easy", timeline: "2_4_weeks", steps: ["Caffeine eye cream", "8hrs sleep", "Hydration"] }
      ]
    }
  ],
  
  styleTips: {
    haircuts: ["Medium length with volume on top suits oval face"],
    glasses: ["Rectangular or square frames balance face length"],
    grooming: ["Keep brows natural but groomed", "Clean up neckline"]
  },
  
  safety: {
    disclaimer: "Results are estimates based on general aesthetic guidelines. Individual perception varies.",
    tone: "neutral"
  }
};
