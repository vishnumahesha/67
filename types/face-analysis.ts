import { z } from 'zod';

// Feature keys - expanded categories
export const FEATURE_KEYS = [
  'skin',
  'eye_area',
  'eyebrows',
  'nose',
  'lips',
  'cheekbones',
  'jawline',
  'chin',
  'symmetry',
  'proportions',
  'neck_posture',
] as const;
export type FeatureKey = (typeof FEATURE_KEYS)[number];


// Fix types
export const FixTypeSchema = z.enum(['no_cost', 'low_cost', 'procedural']);
export type FixType = z.infer<typeof FixTypeSchema>;

export const DifficultySchema = z.enum(['easy', 'moderate', 'difficult']);
export type Difficulty = z.infer<typeof DifficultySchema>;

export const ImpactSchema = z.enum(['low', 'medium', 'high']);
export type Impact = z.infer<typeof ImpactSchema>;

export const ConfidenceSchema = z.enum(['low', 'medium', 'high']);
export type Confidence = z.infer<typeof ConfidenceSchema>;

export const DepthSchema = z.enum(['free', 'premium']);
export type Depth = z.infer<typeof DepthSchema>;

// ====== APPEARANCE PROFILE (Auto-inferred) ======
export const PresentationSchema = z.enum(['male-presenting', 'female-presenting', 'ambiguous']);
export type Presentation = z.infer<typeof PresentationSchema>;

export const AppearanceProfileSchema = z.object({
  presentation: PresentationSchema,
  confidence: z.number().min(0).max(1),
  ageRange: z.object({
    min: z.number(),
    max: z.number(),
  }).nullable().optional(),
  ageConfidence: z.number().min(0).max(1).nullable().optional(),
  dimorphismScore10: z.number().min(0).max(10), // How strongly features align with typical patterns
  masculinityFemininity: z.object({
    masculinity: z.number().min(0).max(100),
    femininity: z.number().min(0).max(100),
  }),
});
export type AppearanceProfile = z.infer<typeof AppearanceProfileSchema>;

// ====== HARMONY INDEX (Golden Ratio / Phi-inspired) ======
export const HarmonyIndexSchema = z.object({
  overall10: z.number().min(0).max(10),
  confidence: ConfidenceSchema.optional().default('medium'),
  components: z.object({
    facialSymmetry: z.object({ score10: z.number(), confidence: z.number(), note: z.string().optional() }).optional(),
    facialThirds: z.object({ score10: z.number(), confidence: z.number(), note: z.string().optional() }).optional(),
    horizontalFifths: z.object({ score10: z.number(), confidence: z.number(), note: z.string().optional() }).optional(),
    goldenRatioProximity: z.object({ score10: z.number(), confidence: z.number(), note: z.string().optional() }).optional(),
    eyeSpacing: z.object({ score10: z.number(), confidence: z.number(), note: z.string().optional() }).optional(),
    noseToMouthRatio: z.object({ score10: z.number(), confidence: z.number(), note: z.string().optional() }).optional(),
    jawToFaceRatio: z.object({ score10: z.number(), confidence: z.number(), note: z.string().optional() }).optional(),
  }).optional(),
  deviationNotes: z.array(z.string()).optional(),
});
export type HarmonyIndex = z.infer<typeof HarmonyIndexSchema>;

export const TimelineSchema = z.enum(['immediate', '2_weeks', '4_weeks', '8_weeks', '12_weeks', '6_months']);
export type Timeline = z.infer<typeof TimelineSchema>;

// Photo quality issues
export const PhotoQualityIssueSchema = z.enum([
  'too_dark',
  'too_bright',
  'not_centered',
  'low_resolution',
  'multiple_faces',
  'no_face_detected',
  'side_missing',
  'blurry',
  'heavy_filter',
  'angle_distortion',
  'inconsistent_lighting',
  'partial_face',
]);
export type PhotoQualityIssue = z.infer<typeof PhotoQualityIssueSchema>;

// Improvement delta - the key to "potential" scoring
export const ImprovementDeltaSchema = z.object({
  lever: z.string(), // e.g., "hair", "skin", "under_eye", "brows", "body_fat", "posture", "teeth"
  currentIssue: z.string(), // What's holding them back
  delta: z.number().min(0).max(2), // Realistic delta (0.1 to 1.0 typically)
  potentialGain: z.string(), // Description of improvement
  timeline: z.string(), // "2 weeks", "8 weeks", etc.
  difficulty: DifficultySchema,
  steps: z.array(z.string()),
});
export type ImprovementDelta = z.infer<typeof ImprovementDeltaSchema>;

// Sub-feature schema (for premium deep-dive)
export const SubFeatureSchema = z.object({
  name: z.string(),
  rating10: z.number().min(0).max(10),
  note: z.string(),
  isStrength: z.boolean(),
  evidence: z.string().optional(), // WHY this rating - visible cues
});
export type SubFeature = z.infer<typeof SubFeatureSchema>;

// Fix schema with timeline
export const FixSchema = z.object({
  title: z.string(),
  type: FixTypeSchema,
  difficulty: DifficultySchema,
  timeline: z.string(), // "immediate", "2 weeks", "8 weeks", etc.
  expectedImpact: z.string(), // What changes
  steps: z.array(z.string()),
});
export type Fix = z.infer<typeof FixSchema>;

// Enhanced Feature schema with evidence-based ratings
export const FeatureSchema = z.object({
  key: z.string(),
  label: z.string(),
  rating10: z.number().min(0).max(10),
  confidence: ConfidenceSchema.optional().default('medium'),
  evidence: z.string().optional().default(''), // WHY this rating - specific visible cues
  photoLimitations: z.array(z.string()).optional(),
  strengths: z.array(z.string()).optional().default([]),
  holdingBack: z.array(z.string()).optional().default([]), // Renamed from "imperfections" - more neutral
  imperfections: z.array(z.string()).optional(), // Legacy field name
  whyItMatters: z.string().optional(),
  subFeatures: z.array(SubFeatureSchema).optional(),
  fixes: z.object({
    quickWins: z.array(FixSchema).optional(), // Today
    shortTerm: z.array(FixSchema).optional(), // 2-4 weeks
    mediumTerm: z.array(FixSchema).optional(), // 8-12 weeks
    proOptions: z.array(FixSchema).optional(), // Premium only, info-only
  }).optional().default({}),
  // Legacy fix format
  why: z.array(z.string()).optional(),
});
export type Feature = z.infer<typeof FeatureSchema>;

// Photo quality schema
export const PhotoQualitySchema = z.object({
  score: z.number().min(0).max(100),
  issues: z.array(PhotoQualityIssueSchema),
  assessmentLimitations: z.array(z.string()).optional(), // What we can't accurately assess
});
export type PhotoQuality = z.infer<typeof PhotoQualitySchema>;

// Overall rating schema - THE KEY CHANGE: current vs potential
export const OverallSchema = z.object({
  currentScore10: z.number().min(0).max(10).optional(), // How they look NOW
  potentialScore10: z.number().min(0).max(10).optional(), // Realistic potential (non-surgical)
  rating10: z.number().min(0).max(10).optional(), // Legacy field - use currentScore10 instead
  ceilingScore10: z.number().min(0).max(10).optional(), // Premium only, theoretical max
  confidence: ConfidenceSchema.optional().default('medium'),
  summary: z.string().optional().default(''),
  calibrationNote: z.string().optional(), // Explain the scoring context
}).transform((data) => ({
  ...data,
  // Ensure currentScore10 has a value (use rating10 as fallback)
  currentScore10: data.currentScore10 ?? data.rating10 ?? 5.5,
  // Ensure potentialScore10 has a value (add 1.5 to current as fallback)
  potentialScore10: data.potentialScore10 ?? (data.currentScore10 ?? data.rating10 ?? 5.5) + 1.5,
}));
export type Overall = z.infer<typeof OverallSchema>;

// Potential analysis - shows the path to improvement
export const PotentialSchema = z.object({
  totalPossibleGain: z.number().optional().default(1.5), // Sum of all deltas
  deltas: z.array(ImprovementDeltaSchema).optional().default([]),
  top3Levers: z.array(z.object({
    lever: z.string(),
    delta: z.number(),
    timeline: z.string(),
    priority: z.number(), // 1, 2, 3
  })).optional().default([]),
  timelineToFullPotential: z.string().optional().default('8-12 weeks'), // "12-16 weeks with consistent effort"
});
export type Potential = z.infer<typeof PotentialSchema>;

// Harmony schema
export const HarmonySchema = z.object({
  rating10: z.number().min(0).max(10),
  confidence: ConfidenceSchema.optional().default('medium'),
  evidence: z.string().optional().default(''),
  notes: z.array(z.string()).optional().default([]),
  facialThirds: z.object({
    upper: z.object({ assessment: z.string(), balance: z.string() }),
    middle: z.object({ assessment: z.string(), balance: z.string() }),
    lower: z.object({ assessment: z.string(), balance: z.string() }),
    overallBalance: z.string(),
  }).optional(),
});
export type Harmony = z.infer<typeof HarmonySchema>;

// Hair schema
export const HairSchema = z.object({
  rating10: z.number().min(0).max(10),
  confidence: ConfidenceSchema.optional().default('high'),
  evidence: z.string().optional().default(''),
  notes: z.array(z.string()).optional().default([]),
  suggestions: z.array(z.string()).optional().default([]),
});
export type Hair = z.infer<typeof HairSchema>;

// Symmetry analysis
export const SymmetrySchema = z.object({
  rating10: z.number().min(0).max(10),
  confidence: ConfidenceSchema.optional().default('low'),
  photoLimitation: z.string().optional(),
  evidence: z.string().optional().default(''),
  notes: z.array(z.string()).optional().default([]),
  asymmetries: z.array(z.object({
    area: z.string(),
    description: z.string(),
    severity: z.enum(['minimal', 'common', 'noticeable']),
  })).optional(),
});
export type Symmetry = z.infer<typeof SymmetrySchema>;

// Safety schema
export const SafetySchema = z.object({
  disclaimer: z.string().optional().default('Results are estimates based on general aesthetic guidelines. Beauty is subjective.'),
  tone: z.enum(['neutral', 'constructive']).optional().default('neutral'),
  scoringContext: z.string().optional().default('We use honest calibration: 5.5 is average, most people score 4.5-6.5.'), // Explain what scores mean
  photoDisclaimer: z.string().optional(),
});
export type Safety = z.infer<typeof SafetySchema>;

// Tier schema
export const TierSchema = z.object({
  isPremium: z.boolean(),
  depth: DepthSchema,
});
export type Tier = z.infer<typeof TierSchema>;

// Full response schema - UPDATED with Appearance Profile + Harmony Index
export const FaceAnalysisResponseSchema = z.object({
  photoQuality: PhotoQualitySchema,
  overall: OverallSchema,
  potential: PotentialSchema,
  features: z.array(FeatureSchema),
  harmony: HarmonySchema,
  harmonyIndex: HarmonyIndexSchema.optional(), // New: Golden ratio / phi-based harmony
  symmetry: SymmetrySchema.optional(),
  hair: HairSchema,
  safety: SafetySchema,
  tier: TierSchema,
  appearanceProfile: AppearanceProfileSchema.optional(), // New: Auto-inferred profile
});
export type FaceAnalysisResponse = z.infer<typeof FaceAnalysisResponseSchema>;

// Request types - Gender removed, now auto-inferred
export type Gender = 'male' | 'female'; // Legacy, kept for backward compatibility

export interface AnalysisRequest {
  frontImage: string;
  sideImage?: string;
  // gender is now auto-inferred, not required
  genderOverride?: Gender; // Optional manual override (hidden advanced setting)
  premiumEnabled: boolean;
}

// Photo quality check result (client-side)
export interface PhotoQualityCheck {
  isValid: boolean;
  score: number;
  issues: PhotoQualityIssue[];
  warnings: string[];
}

// Scan history item
export interface ScanHistoryItem {
  id: string;
  timestamp: number;
  currentScore: number;
  potentialScore: number;
  frontImageUri: string;
  sideImageUri?: string;
}

// Feature metadata for UI
export interface FeatureMetadata {
  key: string;
  label: string;
  icon: string;
  description: string;
  subFeatures?: string[];
  premiumOnly?: boolean;
  maxDelta?: number; // Maximum realistic improvement possible
}

export const FEATURE_METADATA: Record<string, FeatureMetadata> = {
  skin: {
    key: 'skin',
    label: 'Skin Quality',
    icon: '✨',
    description: 'Texture, clarity, and overall skin health',
    subFeatures: ['Texture', 'Clarity', 'Tone evenness', 'Under-eye area', 'Redness'],
    maxDelta: 1.0,
  },
  eye_area: {
    key: 'eye_area',
    label: 'Eye Area',
    icon: '👁️',
    description: 'Periorbital region and eye appearance',
    subFeatures: ['Under-eye darkness', 'Puffiness', 'Eye shape', 'Canthal tilt', 'Eyelid show'],
    maxDelta: 0.6,
  },
  eyebrows: {
    key: 'eyebrows',
    label: 'Eyebrows',
    icon: '🎯',
    description: 'Shape, grooming, and framing',
    subFeatures: ['Shape', 'Thickness', 'Symmetry', 'Grooming', 'Arch'],
    maxDelta: 0.5,
    premiumOnly: true,
  },
  nose: {
    key: 'nose',
    label: 'Nose',
    icon: '👃',
    description: 'Proportion, shape, and profile',
    subFeatures: ['Bridge', 'Tip', 'Width', 'Nostrils', 'Profile'],
    maxDelta: 0.2, // Minimal non-surgical improvement
  },
  lips: {
    key: 'lips',
    label: 'Lips',
    icon: '👄',
    description: 'Shape, fullness, and definition',
    subFeatures: ['Shape', 'Fullness', 'Symmetry', 'Definition', 'Hydration'],
    maxDelta: 0.3,
  },
  cheekbones: {
    key: 'cheekbones',
    label: 'Cheekbones',
    icon: '💎',
    description: 'Projection and facial contour',
    subFeatures: ['Prominence', 'Position', 'Definition'],
    maxDelta: 0.6, // Body fat changes can affect this
  },
  jawline: {
    key: 'jawline',
    label: 'Jawline',
    icon: '💪',
    description: 'Definition and mandibular angle',
    subFeatures: ['Definition', 'Angle', 'Width', 'Symmetry'],
    maxDelta: 0.8, // Posture + body fat
  },
  chin: {
    key: 'chin',
    label: 'Chin',
    icon: '📐',
    description: 'Projection and proportion',
    subFeatures: ['Projection', 'Height', 'Width'],
    maxDelta: 0.3,
    premiumOnly: true,
  },
  symmetry: {
    key: 'symmetry',
    label: 'Facial Symmetry',
    icon: '⚖️',
    description: 'Balance between left and right sides',
    maxDelta: 0.2, // Very limited non-surgical improvement
  },
  proportions: {
    key: 'proportions',
    label: 'Facial Proportions',
    icon: '📏',
    description: 'Facial thirds and measurements',
    premiumOnly: true,
    maxDelta: 0.2,
  },
  neck_posture: {
    key: 'neck_posture',
    label: 'Neck & Posture',
    icon: '🧘',
    description: 'Head position and neck angle',
    subFeatures: ['Forward head posture', 'Neck angle', 'Shoulder position'],
    maxDelta: 0.4,
    premiumOnly: true,
  },
  harmony: {
    key: 'harmony',
    label: 'Overall Harmony',
    icon: '🎭',
    description: 'How features work together',
    maxDelta: 0.5,
  },
  hair: {
    key: 'hair',
    label: 'Hair',
    icon: '💇',
    description: 'Style and face framing',
    subFeatures: ['Style', 'Condition', 'Face framing', 'Volume'],
    maxDelta: 0.8, // Hair can make a big difference
  },
};

// Score distribution context
export const SCORE_CONTEXT = {
  1: 'Significantly below average',
  2: 'Well below average',
  3: 'Below average',
  4: 'Slightly below average',
  5: 'Average',
  6: 'Slightly above average',
  7: 'Above average (top 30%)',
  8: 'Well above average (top 15%)',
  9: 'Exceptional (top 5%)',
  10: 'Near perfect (top 1%)',
};

// Lever types for potential calculation
export const IMPROVEMENT_LEVERS = {
  hair: { min: 0.2, max: 0.8, label: 'Hair styling' },
  skin: { min: 0.2, max: 1.0, label: 'Skin care' },
  under_eye: { min: 0.1, max: 0.6, label: 'Under-eye treatment' },
  brows: { min: 0.1, max: 0.5, label: 'Brow grooming' },
  body_fat: { min: 0.2, max: 0.8, label: 'Body composition' },
  posture: { min: 0.1, max: 0.4, label: 'Posture correction' },
  teeth: { min: 0.1, max: 0.6, label: 'Teeth/smile' },
  grooming: { min: 0.1, max: 0.4, label: 'General grooming' },
};
