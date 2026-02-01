/**
 * Face Analyzer Scoring Engine
 * Implements honest, calibrated scoring with confidence-aware dampening
 */

import type {
  PhotoQuality,
  PhotoIssue,
  ConfidenceLevel,
  Measurements,
  RatioMeasurement,
  SymmetryScore,
  Feature,
  FeatureKey,
  TopLever,
  LeverKey,
  Timeline,
  PotentialScoreRange,
  PillarScore,
  SexMode,
  StylePreference,
  ScoringInput,
  TraitScore,
  ScoringOutput,
  OverallScore,
  Fix,
  AppearanceProfile,
  HarmonyIndex,
  HarmonyComponent,
  RatioSignal,
} from './types';

// ============ CONSTANTS ============

const TARGET_MEAN = 5.5;
const TARGET_STD = 1.2;
const SCORE_MIN = 0;
const SCORE_MAX = 10;

// Photo quality thresholds
const QUALITY_BLOCK_BELOW = 0.35;
const QUALITY_HEAVY_DAMPEN_BELOW = 0.5;
const QUALITY_LIGHT_DAMPEN_BELOW = 0.7;

// Side-missing penalty for relevant traits
const SIDE_MISSING_WEIGHT_PENALTY = 0.5;
const SIDE_DEPENDENT_TRAITS = [
  'jaw_definition',
  'chin_projection',
  'posture',
  'gonial_angle',
  'cervicomental_angle',
  'facial_convexity',
  'nose_projection',
];

// ============ PHOTO QUALITY ============

interface PhotoQualityInput {
  brightness: number; // 0-1
  sharpness: number; // 0-1
  faceSize: number; // proportion of frame, 0-1
  headTilt: number; // degrees from level
  expressionNeutral: boolean;
  hairObstructing: boolean;
  glassesPresent: boolean;
  faceCount: number;
  sideProvided: boolean;
}

export function computePhotoQuality(inputs: Partial<PhotoQualityInput>): PhotoQuality {
  const issues: PhotoIssue[] = [];
  const warnings: string[] = [];
  let score = 1.0;

  // Brightness check
  const brightness = inputs.brightness ?? 0.5;
  if (brightness < 0.3) {
    issues.push('too_dark');
    score -= 0.2;
    warnings.push('Move to a brighter location');
  } else if (brightness > 0.85) {
    issues.push('harsh_shadows');
    score -= 0.1;
    warnings.push('Harsh lighting detected - try diffused light');
  }

  // Sharpness check
  const sharpness = inputs.sharpness ?? 0.7;
  if (sharpness < 0.5) {
    issues.push('blur');
    score -= 0.25;
    warnings.push('Image is blurry - hold steady or clean lens');
  }

  // Face size check (too close = wide angle distortion)
  const faceSize = inputs.faceSize ?? 0.4;
  if (faceSize > 0.6) {
    issues.push('too_close_wide_angle');
    score -= 0.15;
    warnings.push('Too close - step back to reduce lens distortion');
  }

  // Head tilt check
  const headTilt = inputs.headTilt ?? 0;
  if (Math.abs(headTilt) > 10) {
    issues.push('head_tilt');
    score -= 0.1;
    warnings.push('Keep head level for accurate measurements');
  }

  // Expression check
  if (inputs.expressionNeutral === false) {
    issues.push('expression_not_neutral');
    score -= 0.1;
    warnings.push('Try a neutral expression for best results');
  }

  // Hair obstruction
  if (inputs.hairObstructing) {
    issues.push('hair_obstructing');
    score -= 0.1;
    warnings.push('Move hair away from face');
  }

  // Glasses
  if (inputs.glassesPresent) {
    issues.push('glasses_obstructing');
    score -= 0.1;
    warnings.push('Remove glasses for more accurate analysis');
  }

  // Multiple faces
  const faceCount = inputs.faceCount ?? 1;
  if (faceCount > 1) {
    issues.push('multiple_faces');
    score -= 0.3;
    warnings.push('Only one face should be in frame');
  } else if (faceCount === 0) {
    score = 0;
    warnings.push('No face detected');
  }

  // Side photo missing (not a blocker, but noted)
  if (!inputs.sideProvided) {
    issues.push('side_missing');
    warnings.push('Side photo would improve jaw/chin analysis');
  }

  // Clamp score
  score = Math.max(0, Math.min(1, score));

  return {
    score,
    issues,
    canProceed: score >= QUALITY_BLOCK_BELOW,
    warnings,
  };
}

// ============ CALIBRATION ============

/**
 * Calibrate a raw score by dampening toward the target mean
 * when photo quality is low
 */
export function calibrateScore(rawScore: number, qualityScore: number): number {
  if (qualityScore >= QUALITY_LIGHT_DAMPEN_BELOW) {
    // Good quality - no dampening
    return clamp(rawScore, SCORE_MIN, SCORE_MAX);
  }

  // Calculate dampen factor based on quality
  let dampenFactor: number;
  if (qualityScore < QUALITY_HEAVY_DAMPEN_BELOW) {
    dampenFactor = 0.4;
  } else if (qualityScore < 0.6) {
    dampenFactor = 0.6;
  } else {
    dampenFactor = 0.8;
  }

  // Lerp toward mean
  const dampened = lerp(TARGET_MEAN, rawScore, dampenFactor);
  return clamp(dampened, SCORE_MIN, SCORE_MAX);
}

/**
 * Convert a z-score to 0-10 scale
 */
function zscoreToScore(z: number): number {
  // score = mean + (z * std * scaling_factor)
  const score = TARGET_MEAN + z * TARGET_STD * 1.5;
  return clamp(score, SCORE_MIN, SCORE_MAX);
}

/**
 * Calculate z-score from a value given reference mean and std
 */
function valueToZscore(value: number, refMean: number, refStd: number): number {
  if (refStd === 0) return 0;
  return (value - refMean) / refStd;
}

// ============ APPEARANCE-BASED WEIGHT SELECTION ============

const APPEARANCE_CONFIDENCE_THRESHOLD = 0.65;

/**
 * Determine style preference from appearance profile (confidence-gated)
 * Falls back to 'neutral' if confidence is too low
 */
export function getStylePreferenceFromAppearance(
  appearanceProfile?: AppearanceProfile,
  manualOverride?: SexMode
): StylePreference {
  // Manual override takes precedence
  if (manualOverride && manualOverride !== 'auto') {
    return manualOverride === 'male' ? 'masculine_leaning' : 'feminine_leaning';
  }

  // No appearance profile = neutral
  if (!appearanceProfile) {
    return 'neutral';
  }

  // Low confidence = neutral (don't influence scoring)
  if (appearanceProfile.confidence < APPEARANCE_CONFIDENCE_THRESHOLD) {
    return 'neutral';
  }

  // High confidence = use inferred presentation
  switch (appearanceProfile.presentation) {
    case 'male-presenting':
      return 'masculine_leaning';
    case 'female-presenting':
      return 'feminine_leaning';
    default:
      return 'neutral';
  }
}

// ============ HARMONY INDEX COMPUTATION ============

const GOLDEN_RATIO = 1.618;
const IDEAL_FACIAL_THIRDS = [0.33, 0.33, 0.34]; // Upper, middle, lower
const IDEAL_HORIZONTAL_FIFTHS = 0.20; // Each fifth should be ~20%

/**
 * Compute harmony index based on golden ratio and facial proportions
 */
export function computeHarmonyIndex(
  measurements: Measurements,
  photoQuality: PhotoQuality
): HarmonyIndex {
  const components: HarmonyIndex['components'] = {};
  const ratioSignals: RatioSignal[] = [];
  let totalScore = 0;
  let componentCount = 0;

  // 1. Facial Symmetry
  const symmetry = measurements.symmetry;
  const symmetryScore = symmetry.overall * 10;
  const symmetryDeviation = (1 - symmetry.overall) * 100;
  components.facialSymmetry = {
    score10: parseFloat(symmetryScore.toFixed(1)),
    deviationPct: parseFloat(symmetryDeviation.toFixed(1)),
    note: symmetryScore >= 7 ? 'Good bilateral symmetry' : 
          symmetryScore >= 5 ? 'Normal asymmetry levels' : 
          'Some asymmetry detected (may be photo angle)',
  };
  totalScore += symmetryScore;
  componentCount++;

  // 2. Eye Spacing Ratio (relative to face width)
  const eyeSpacing = measurements.ratios.find(r => r.key === 'eye_spacing_ratio');
  if (eyeSpacing) {
    const eyeIdealMin = 0.28;
    const eyeIdealMax = 0.35;
    const eyeStatus = eyeSpacing.value >= eyeIdealMin && eyeSpacing.value <= eyeIdealMax ? 'good' :
                      Math.abs(eyeSpacing.value - 0.315) < 0.05 ? 'ok' : 'off';
    const eyeScore = eyeStatus === 'good' ? 7.5 : eyeStatus === 'ok' ? 5.5 : 4.0;
    
    ratioSignals.push({
      key: 'eye_spacing',
      label: 'Eye Spacing',
      value: parseFloat(eyeSpacing.value.toFixed(3)),
      band: [eyeIdealMin, eyeIdealMax],
      status: eyeStatus,
      confidence: eyeSpacing.confidence,
    });
    
    totalScore += eyeScore;
    componentCount++;
  }

  // 3. Nose Width Ratio
  const noseWidth = measurements.ratios.find(r => r.key === 'nose_width_ratio');
  if (noseWidth) {
    const noseIdealMin = 0.22;
    const noseIdealMax = 0.30;
    const noseStatus = noseWidth.value >= noseIdealMin && noseWidth.value <= noseIdealMax ? 'good' :
                       Math.abs(noseWidth.value - 0.26) < 0.04 ? 'ok' : 'off';
    const noseScore = noseStatus === 'good' ? 7.0 : noseStatus === 'ok' ? 5.5 : 4.0;
    
    ratioSignals.push({
      key: 'nose_width',
      label: 'Nose Width',
      value: parseFloat(noseWidth.value.toFixed(3)),
      band: [noseIdealMin, noseIdealMax],
      status: noseStatus,
      confidence: noseWidth.confidence,
    });
    
    totalScore += noseScore;
    componentCount++;
  }

  // 4. Mouth Width Ratio
  const mouthWidth = measurements.ratios.find(r => r.key === 'mouth_width_ratio');
  if (mouthWidth) {
    const mouthIdealMin = 0.38;
    const mouthIdealMax = 0.50;
    const mouthStatus = mouthWidth.value >= mouthIdealMin && mouthWidth.value <= mouthIdealMax ? 'good' :
                        Math.abs(mouthWidth.value - 0.44) < 0.06 ? 'ok' : 'off';
    const mouthScore = mouthStatus === 'good' ? 7.0 : mouthStatus === 'ok' ? 5.5 : 4.0;
    
    ratioSignals.push({
      key: 'mouth_width',
      label: 'Mouth Width',
      value: parseFloat(mouthWidth.value.toFixed(3)),
      band: [mouthIdealMin, mouthIdealMax],
      status: mouthStatus,
      confidence: mouthWidth.confidence,
    });
    
    totalScore += mouthScore;
    componentCount++;
  }

  // 5. Jaw to Face Width (lower face proportion)
  const jawRatio = measurements.ratios.find(r => r.key === 'jaw_to_face_width_ratio' || r.key === 'jaw_to_cheek_ratio');
  if (jawRatio) {
    const jawIdealMin = 0.75;
    const jawIdealMax = 0.90;
    const jawStatus = jawRatio.value >= jawIdealMin && jawRatio.value <= jawIdealMax ? 'good' :
                      Math.abs(jawRatio.value - 0.82) < 0.08 ? 'ok' : 'off';
    const jawScore = jawStatus === 'good' ? 7.0 : jawStatus === 'ok' ? 5.5 : 4.0;
    
    ratioSignals.push({
      key: 'jaw_ratio',
      label: 'Jaw Proportion',
      value: parseFloat(jawRatio.value.toFixed(3)),
      band: [jawIdealMin, jawIdealMax],
      status: jawStatus,
      confidence: jawRatio.confidence,
    });
    
    totalScore += jawScore;
    componentCount++;
  }

  // 6. Face Width to Height (golden ratio proximity)
  const faceRatio = measurements.ratios.find(r => r.key === 'face_width_to_height');
  if (faceRatio) {
    // Ideal face ratio is often cited as ~1.618 (golden ratio) or ~0.62-0.72
    const idealRatio = 1 / GOLDEN_RATIO; // ~0.618
    const deviation = Math.abs(faceRatio.value - idealRatio);
    const goldenScore = deviation < 0.05 ? 8.0 : deviation < 0.10 ? 6.5 : deviation < 0.15 ? 5.0 : 4.0;
    
    components.goldenRatioProximity = {
      score10: parseFloat(goldenScore.toFixed(1)),
      deviationPct: parseFloat((deviation * 100).toFixed(1)),
      note: goldenScore >= 7 ? 'Close to golden ratio proportions' :
            goldenScore >= 5 ? 'Within normal proportional range' :
            'Proportions deviate from classical ideals',
    };
    
    totalScore += goldenScore;
    componentCount++;
  }

  // Calculate overall harmony score
  const rawHarmonyScore = componentCount > 0 ? totalScore / componentCount : 5.5;
  
  // Apply photo quality dampening
  const dampedScore = calibrateScore(rawHarmonyScore, photoQuality.score);
  
  // Determine overall confidence
  const lowConfidenceCount = ratioSignals.filter(r => r.confidence === 'low').length;
  const overallConfidence: ConfidenceLevel = 
    photoQuality.score < 0.5 || lowConfidenceCount > 2 ? 'low' :
    photoQuality.score < 0.7 || lowConfidenceCount > 0 ? 'medium' : 'high';

  return {
    score10: parseFloat(dampedScore.toFixed(1)),
    confidence: overallConfidence,
    components,
    ratioSignals: ratioSignals.slice(0, 5), // Max 5 signals
  };
}

// ============ SCORING METRICS TO TRAITS ============

interface ScoreMetricsInput {
  measurements: Measurements;
  photoQuality: PhotoQuality;
  sideProvided: boolean;
  sexMode?: SexMode;
  stylePreference: StylePreference;
  appearanceProfile?: AppearanceProfile;
}

interface TraitScoringResult {
  traitKey: string;
  score: number;
  confidence: ConfidenceLevel;
  notes: string[];
}

// Reference ranges by sex (simplified subset)
const REFERENCE_RANGES: Record<string, { male: { mean: number; std: number }; female: { mean: number; std: number } }> = {
  eye_spacing_ratio: { male: { mean: 0.32, std: 0.03 }, female: { mean: 0.31, std: 0.03 } },
  nose_width_ratio: { male: { mean: 0.26, std: 0.025 }, female: { mean: 0.24, std: 0.025 } },
  mouth_width_ratio: { male: { mean: 0.42, std: 0.035 }, female: { mean: 0.40, std: 0.035 } },
  jaw_to_face_width_ratio: { male: { mean: 0.78, std: 0.05 }, female: { mean: 0.72, std: 0.05 } },
  face_width_to_height: { male: { mean: 0.68, std: 0.05 }, female: { mean: 0.66, std: 0.05 } },
  symmetry_composite: { male: { mean: 0.85, std: 0.08 }, female: { mean: 0.86, std: 0.08 } },
};

export function scoreMetricsToTraits(input: ScoreMetricsInput): TraitScoringResult[] {
  const { measurements, photoQuality, sideProvided, sexMode, appearanceProfile } = input;
  const results: TraitScoringResult[] = [];

  // Determine effective sex mode for reference ranges
  // Use appearance profile if available and confident, otherwise fallback
  let effectiveSexMode: 'male' | 'female' = 'male'; // default
  
  if (sexMode && sexMode !== 'auto') {
    effectiveSexMode = sexMode;
  } else if (appearanceProfile && appearanceProfile.confidence >= APPEARANCE_CONFIDENCE_THRESHOLD) {
    effectiveSexMode = appearanceProfile.presentation === 'female-presenting' ? 'female' : 'male';
  }

  // Score each ratio measurement
  for (const ratio of measurements.ratios) {
    const ref = REFERENCE_RANGES[ratio.key];
    if (!ref) continue;

    const refData = ref[effectiveSexMode];
    const z = valueToZscore(ratio.value, refData.mean, refData.std);

    // Invert z for metrics where lower is better (deviation metrics)
    const isDeviationMetric = ratio.key.includes('deviation') || ratio.key.includes('delta');
    const adjustedZ = isDeviationMetric ? -Math.abs(z) : -Math.abs(z) + 1; // Closer to mean = better

    let rawScore = zscoreToScore(adjustedZ);

    // Bonus for being in ideal range
    const inIdealRange = ratio.value >= ratio.idealMin && ratio.value <= ratio.idealMax;
    if (inIdealRange) {
      rawScore = Math.min(SCORE_MAX, rawScore + 0.3);
    }

    // Apply calibration
    const finalScore = calibrateScore(rawScore, photoQuality.score);

    // Determine confidence
    let confidence: ConfidenceLevel = ratio.confidence;
    if (photoQuality.score < QUALITY_HEAVY_DAMPEN_BELOW) {
      confidence = 'low';
    } else if (photoQuality.score < QUALITY_LIGHT_DAMPEN_BELOW && confidence === 'high') {
      confidence = 'medium';
    }

    const notes: string[] = [];
    if (inIdealRange) {
      notes.push('Within ideal range');
    } else if (ratio.value < ratio.idealMin) {
      notes.push('Below typical range');
    } else {
      notes.push('Above typical range');
    }

    results.push({
      traitKey: ratio.key,
      score: parseFloat(finalScore.toFixed(1)),
      confidence,
      notes,
    });
  }

  // Score symmetry
  const symScore = measurements.symmetry.overall * 10;
  const calibratedSymScore = calibrateScore(symScore, photoQuality.score);

  let symConfidence: ConfidenceLevel = measurements.symmetry.confidence;
  if (photoQuality.issues.includes('head_tilt')) {
    symConfidence = 'low';
  }

  results.push({
    traitKey: 'symmetry',
    score: parseFloat(calibratedSymScore.toFixed(1)),
    confidence: symConfidence,
    notes: measurements.symmetry.notes,
  });

  return results;
}

// ============ OVERALL SCORE ============

interface OverallScoreInput {
  traitScores: TraitScoringResult[];
  photoQuality: PhotoQuality;
  sideProvided: boolean;
  stylePreference: StylePreference;
}

// Pillar weights by style preference
const PILLAR_WEIGHTS: Record<StylePreference, Record<string, number>> = {
  neutral: { structure: 0.35, features: 0.30, presentation: 0.20, harmony: 0.15 },
  masculine_leaning: { structure: 0.42, features: 0.28, presentation: 0.17, harmony: 0.13 },
  feminine_leaning: { structure: 0.30, features: 0.35, presentation: 0.22, harmony: 0.13 },
};

// Map traits to pillars
const TRAIT_TO_PILLAR: Record<string, string> = {
  face_width_to_height: 'structure',
  jaw_to_face_width_ratio: 'structure',
  eye_spacing_ratio: 'features',
  nose_width_ratio: 'features',
  mouth_width_ratio: 'features',
  symmetry: 'harmony',
};

export function computeOverallScore(input: OverallScoreInput): {
  currentScore10: number;
  confidence: ConfidenceLevel;
  summary: string;
  pillarScores: PillarScore[];
} {
  const { traitScores, photoQuality, sideProvided, stylePreference } = input;
  const weights = PILLAR_WEIGHTS[stylePreference];

  // Group scores by pillar
  const pillarScoreMap: Record<string, { scores: number[]; confidence: ConfidenceLevel[] }> = {
    structure: { scores: [], confidence: [] },
    features: { scores: [], confidence: [] },
    presentation: { scores: [], confidence: [] },
    harmony: { scores: [], confidence: [] },
  };

  for (const trait of traitScores) {
    const pillar = TRAIT_TO_PILLAR[trait.traitKey] || 'features';
    if (pillarScoreMap[pillar]) {
      pillarScoreMap[pillar].scores.push(trait.score);
      pillarScoreMap[pillar].confidence.push(trait.confidence);
    }
  }

  // Calculate pillar averages
  const pillarScores: PillarScore[] = [];
  let weightedSum = 0;
  let totalWeight = 0;

  for (const [pillarKey, data] of Object.entries(pillarScoreMap)) {
    if (data.scores.length === 0) continue;

    const avg = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;

    // Reduce weight for side-dependent traits if side missing
    let weight = weights[pillarKey] || 0.1;
    if (!sideProvided && pillarKey === 'structure') {
      weight *= SIDE_MISSING_WEIGHT_PENALTY;
    }

    // Determine pillar confidence
    const lowCount = data.confidence.filter((c) => c === 'low').length;
    const pillarConfidence: ConfidenceLevel =
      lowCount > data.confidence.length / 2 ? 'low' : lowCount > 0 ? 'medium' : 'high';

    pillarScores.push({
      key: pillarKey as PillarScore['key'],
      score: parseFloat(avg.toFixed(1)),
      weight,
      confidence: pillarConfidence,
      contributingTraits: [],
    });

    weightedSum += avg * weight;
    totalWeight += weight;
  }

  // Normalize
  const rawOverall = totalWeight > 0 ? weightedSum / totalWeight : TARGET_MEAN;
  const calibratedOverall = calibrateScore(rawOverall, photoQuality.score);
  const finalScore = parseFloat(calibratedOverall.toFixed(1));

  // Overall confidence
  const lowPillars = pillarScores.filter((p) => p.confidence === 'low').length;
  let overallConfidence: ConfidenceLevel = 'high';
  if (photoQuality.score < QUALITY_HEAVY_DAMPEN_BELOW || lowPillars >= 2) {
    overallConfidence = 'low';
  } else if (photoQuality.score < QUALITY_LIGHT_DAMPEN_BELOW || lowPillars >= 1) {
    overallConfidence = 'medium';
  }

  // Generate summary
  let summary: string;
  if (finalScore >= 7.5) {
    summary = 'Well above average facial harmony with strong features.';
  } else if (finalScore >= 6.5) {
    summary = 'Above average with good proportions and clear strengths.';
  } else if (finalScore >= 5.5) {
    summary = 'Average proportions with room for enhancement through presentation.';
  } else if (finalScore >= 4.5) {
    summary = 'Slightly below average with identifiable areas for improvement.';
  } else {
    summary = 'Below average with multiple opportunities for presentation improvements.';
  }

  return {
    currentScore10: finalScore,
    confidence: overallConfidence,
    summary,
    pillarScores,
  };
}

// ============ POTENTIAL SCORE ============

// Lever definitions with delta ranges
const LEVER_DEFINITIONS: Record<
  LeverKey,
  {
    label: string;
    minDelta: number;
    maxDelta: number;
    timeline: Timeline;
    actions: string[];
  }
> = {
  hair_styling: {
    label: 'Hair Styling',
    minDelta: 0.2,
    maxDelta: 0.8,
    timeline: 'today',
    actions: ['Get a cut suited to your face shape', 'Add volume where needed', 'Frame face appropriately'],
  },
  skin_routine: {
    label: 'Skincare Routine',
    minDelta: 0.2,
    maxDelta: 1.0,
    timeline: '2_4_weeks',
    actions: ['AM: Cleanser, moisturizer, SPF', 'PM: Cleanser, moisturizer', 'Stay hydrated'],
  },
  brow_grooming: {
    label: 'Brow Grooming',
    minDelta: 0.1,
    maxDelta: 0.5,
    timeline: 'today',
    actions: ['Clean up stray hairs', 'Define natural shape', 'Avoid over-plucking'],
  },
  under_eye_care: {
    label: 'Under-Eye Care',
    minDelta: 0.1,
    maxDelta: 0.6,
    timeline: '2_4_weeks',
    actions: ['7-9 hours consistent sleep', 'Reduce sodium', 'Stay hydrated', 'Cold compress for puffiness'],
  },
  posture_correction: {
    label: 'Posture Improvement',
    minDelta: 0.1,
    maxDelta: 0.5,
    timeline: '2_4_weeks',
    actions: ['Chin tucks: 2 sets of 10 daily', 'Reduce forward head position', 'Ergonomic workspace'],
  },
  photo_optimization: {
    label: 'Photo Technique',
    minDelta: 0.1,
    maxDelta: 0.4,
    timeline: 'today',
    actions: ['Face natural light source', 'Use back camera', 'Step back to reduce distortion'],
  },
  facial_hair: {
    label: 'Facial Hair Styling',
    minDelta: 0.1,
    maxDelta: 0.5,
    timeline: 'today',
    actions: ['Style to complement face shape', 'Maintain clean lines', 'Regular trimming'],
  },
  lip_care: {
    label: 'Lip Care',
    minDelta: 0.05,
    maxDelta: 0.2,
    timeline: 'today',
    actions: ['Keep lips hydrated', 'Use lip balm regularly'],
  },
  body_composition: {
    label: 'Body Composition',
    minDelta: 0.2,
    maxDelta: 0.8,
    timeline: '8_12_weeks',
    actions: ['Caloric awareness', 'Regular exercise', 'Adequate protein', 'Patience - 8-12 weeks minimum'],
  },
};

interface PotentialInput {
  currentScore: number;
  selectedLevers: LeverKey[];
  photoQuality: PhotoQuality;
}

export function computePotentialRange(input: PotentialInput): PotentialScoreRange {
  const { currentScore, selectedLevers, photoQuality } = input;

  let minDeltaSum = 0;
  let maxDeltaSum = 0;
  const assumptions: string[] = [];

  for (const leverKey of selectedLevers) {
    const lever = LEVER_DEFINITIONS[leverKey];
    if (!lever) continue;

    minDeltaSum += lever.minDelta;
    maxDeltaSum += lever.maxDelta;
    assumptions.push(`${lever.label}: +${lever.minDelta}-${lever.maxDelta}`);
  }

  // Cap total potential gain
  const maxTotalGain = 2.5;
  maxDeltaSum = Math.min(maxDeltaSum, maxTotalGain);
  minDeltaSum = Math.min(minDeltaSum, maxDeltaSum);

  // If photo quality is low, potential is more uncertain
  if (photoQuality.score < QUALITY_LIGHT_DAMPEN_BELOW) {
    assumptions.push('Note: Photo quality affects accuracy of potential estimate');
  }

  return {
    min: parseFloat(Math.min(currentScore + minDeltaSum, SCORE_MAX).toFixed(1)),
    max: parseFloat(Math.min(currentScore + maxDeltaSum, SCORE_MAX).toFixed(1)),
    assumptions,
  };
}

// ============ TOP LEVERS SELECTION ============

interface TopLeversInput {
  traitScores: TraitScoringResult[];
  photoQuality: PhotoQuality;
  sideProvided: boolean;
  sexMode: 'male' | 'female';
}

// Map low-scoring traits to relevant levers
const TRAIT_TO_LEVERS: Record<string, LeverKey[]> = {
  symmetry: ['photo_optimization', 'posture_correction'],
  jaw_to_face_width_ratio: ['posture_correction', 'body_composition', 'facial_hair'],
  eye_spacing_ratio: ['brow_grooming', 'photo_optimization'],
  nose_width_ratio: ['photo_optimization'],
  mouth_width_ratio: ['lip_care'],
  face_width_to_height: ['hair_styling'],
  skin_quality: ['skin_routine'],
  under_eye: ['under_eye_care'],
};

export function selectTopLevers(input: TopLeversInput): TopLever[] {
  const { traitScores, photoQuality, sideProvided } = input;

  // Score each lever based on trait deficiencies
  const leverScores: Map<LeverKey, { impact: number; reasons: string[] }> = new Map();

  // Initialize all levers
  for (const key of Object.keys(LEVER_DEFINITIONS) as LeverKey[]) {
    leverScores.set(key, { impact: 0, reasons: [] });
  }

  // Find traits that are below average (< 5.5) and map to levers
  for (const trait of traitScores) {
    if (trait.score < 5.5) {
      const deficit = 5.5 - trait.score;
      const relevantLevers = TRAIT_TO_LEVERS[trait.traitKey] || [];

      for (const leverKey of relevantLevers) {
        const current = leverScores.get(leverKey)!;
        current.impact += deficit;
        current.reasons.push(`Improve ${trait.traitKey.replace(/_/g, ' ')}`);
        leverScores.set(leverKey, current);
      }
    }
  }

  // Always recommend photo_optimization if quality is low
  if (photoQuality.score < QUALITY_LIGHT_DAMPEN_BELOW) {
    const photoLever = leverScores.get('photo_optimization')!;
    photoLever.impact += 2;
    photoLever.reasons.push('Photo quality can be improved');
    leverScores.set('photo_optimization', photoLever);
  }

  // Add hair_styling and skin_routine as baseline recommendations
  const hairLever = leverScores.get('hair_styling')!;
  hairLever.impact += 1.5;
  hairLever.reasons.push('High-impact quick change');
  leverScores.set('hair_styling', hairLever);

  const skinLever = leverScores.get('skin_routine')!;
  skinLever.impact += 1;
  skinLever.reasons.push('Improves overall presentation');
  leverScores.set('skin_routine', skinLever);

  // Reduce posture impact if side not provided
  if (!sideProvided) {
    const postureLever = leverScores.get('posture_correction')!;
    postureLever.impact *= 0.5;
    postureLever.reasons.push('(Limited assessment without side photo)');
    leverScores.set('posture_correction', postureLever);
  }

  // Sort by impact and select top 3
  const sortedLevers = Array.from(leverScores.entries())
    .sort((a, b) => b[1].impact - a[1].impact)
    .slice(0, 3);

  return sortedLevers.map(([key, data], index) => {
    const def = LEVER_DEFINITIONS[key];
    return {
      lever: key,
      label: def.label,
      deltaMin: def.minDelta,
      deltaMax: def.maxDelta,
      why: data.reasons[0] || 'General improvement opportunity',
      timeline: def.timeline,
      priority: index + 1,
      actions: def.actions,
    };
  });
}

// ============ FEATURE SCORING ============

interface FeatureScoringInput {
  traitScores: TraitScoringResult[];
  photoQuality: PhotoQuality;
  sideProvided: boolean;
}

// Map traits to feature categories
const TRAIT_TO_FEATURE: Record<string, FeatureKey> = {
  eye_spacing_ratio: 'eyes',
  canthal_tilt: 'eyes',
  nose_width_ratio: 'nose',
  mouth_width_ratio: 'lips',
  jaw_to_face_width_ratio: 'jawline',
  face_width_to_height: 'harmony',
  symmetry: 'harmony',
};

export function computeFeatureScores(input: FeatureScoringInput): Feature[] {
  const { traitScores, photoQuality, sideProvided } = input;

  // Group traits by feature
  const featureGroups: Map<FeatureKey, TraitScoringResult[]> = new Map();

  for (const trait of traitScores) {
    const featureKey = TRAIT_TO_FEATURE[trait.traitKey];
    if (!featureKey) continue;

    const existing = featureGroups.get(featureKey) || [];
    existing.push(trait);
    featureGroups.set(featureKey, existing);
  }

  // Build feature objects
  const features: Feature[] = [];
  const featureLabels: Record<FeatureKey, string> = {
    eyes: 'Eyes',
    brows: 'Brows',
    nose: 'Nose',
    lips: 'Lips',
    cheekbones: 'Cheekbones',
    jawline: 'Jawline',
    skin: 'Skin',
    hair: 'Hair',
    harmony: 'Harmony',
  };

  for (const [key, traits] of featureGroups) {
    if (traits.length === 0) continue;

    const avgScore = traits.reduce((sum, t) => sum + t.score, 0) / traits.length;
    const calibratedScore = calibrateScore(avgScore, photoQuality.score);

    // Determine confidence
    const lowCount = traits.filter((t) => t.confidence === 'low').length;
    let confidence: ConfidenceLevel = 'high';
    if (lowCount > traits.length / 2) {
      confidence = 'low';
    } else if (lowCount > 0) {
      confidence = 'medium';
    }

    // Check if side-dependent
    const isSideDependent = key === 'jawline' || key === 'cheekbones';
    if (isSideDependent && !sideProvided) {
      confidence = 'low';
    }

    // Generate summary, strengths, limitations
    const strengths: string[] = [];
    const whatLimitsIt: string[] = [];
    const why: string[] = [];

    for (const trait of traits) {
      if (trait.score >= 6.5) {
        strengths.push(...trait.notes.filter((n) => n.includes('ideal') || n.includes('good')));
      } else if (trait.score < 5.0) {
        whatLimitsIt.push(...trait.notes);
      }
    }

    // Default strengths/limitations if empty
    if (strengths.length === 0 && calibratedScore >= 5.5) {
      strengths.push('Within normal proportions');
    }
    if (whatLimitsIt.length === 0 && calibratedScore < 5.5) {
      whatLimitsIt.push('Slightly outside ideal range');
    }

    why.push(`Based on ${traits.length} measurement(s)`);
    if (confidence === 'low') {
      why.push('Limited confidence due to photo quality or missing side view');
    }

    // Generate fixes
    const fixes: Fix[] = [];
    if (key === 'skin') {
      fixes.push({
        title: 'Basic Skincare Routine',
        type: 'routine',
        difficulty: 'easy',
        timeline: '2_4_weeks',
        steps: ['Gentle cleanser AM/PM', 'Moisturizer', 'SPF daily'],
        expectedDelta: 0.5,
      });
    }
    if (key === 'brows') {
      fixes.push({
        title: 'Brow Grooming',
        type: 'low_cost',
        difficulty: 'easy',
        timeline: 'today',
        steps: ['Clean up stray hairs', 'Define natural shape', 'Avoid over-thinning'],
        expectedDelta: 0.3,
      });
    }
    if (key === 'jawline' && !sideProvided) {
      fixes.push({
        title: 'Posture Improvement',
        type: 'no_cost',
        difficulty: 'medium',
        timeline: '2_4_weeks',
        steps: ['Chin tuck exercises', 'Reduce forward head', 'Strengthen neck'],
        expectedDelta: 0.3,
      });
    }

    const summary = generateFeatureSummary(key, calibratedScore);

    features.push({
      key,
      label: featureLabels[key],
      rating10: parseFloat(calibratedScore.toFixed(1)),
      confidence,
      summary,
      strengths: strengths.slice(0, 3),
      whatLimitsIt: whatLimitsIt.slice(0, 3),
      why: why.slice(0, 3),
      fixes,
    });
  }

  return features;
}

function generateFeatureSummary(key: FeatureKey, score: number): string {
  const summaries: Record<FeatureKey, Record<string, string>> = {
    eyes: {
      high: 'Well-proportioned eyes with good spacing and shape.',
      mid: 'Average eye proportions with minor variations.',
      low: 'Eye measurements outside typical ranges.',
    },
    brows: {
      high: 'Well-groomed brows that complement your face.',
      mid: 'Average brow shape and positioning.',
      low: 'Brows could benefit from grooming and shaping.',
    },
    nose: {
      high: 'Nose proportions harmonize well with facial width.',
      mid: 'Average nose proportions.',
      low: 'Nose measurements slightly outside ideal range.',
    },
    lips: {
      high: 'Well-proportioned lips relative to face.',
      mid: 'Average lip proportions.',
      low: 'Lip proportions could be enhanced with care.',
    },
    cheekbones: {
      high: 'Good cheekbone definition adds structure.',
      mid: 'Average cheekbone prominence.',
      low: 'Limited cheekbone assessment from photo.',
    },
    jawline: {
      high: 'Strong jawline definition.',
      mid: 'Average jaw proportions.',
      low: 'Jaw definition assessment limited; try side photo.',
    },
    skin: {
      high: 'Skin appears healthy and clear.',
      mid: 'Average skin presentation.',
      low: 'Skin could benefit from a consistent routine.',
    },
    hair: {
      high: 'Hair complements face shape well.',
      mid: 'Average hair-face harmony.',
      low: 'Hair styling could better complement your face.',
    },
    harmony: {
      high: 'Excellent facial harmony and symmetry.',
      mid: 'Average facial harmony.',
      low: 'Some asymmetry detected; may be photo angle.',
    },
  };

  const level = score >= 6.5 ? 'high' : score >= 4.5 ? 'mid' : 'low';
  return summaries[key]?.[level] || 'Feature scored based on available measurements.';
}

// ============ UTILITY FUNCTIONS ============

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// ============ MAIN SCORING PIPELINE ============

export interface ScoringOutputExtended extends ScoringOutput {
  harmonyIndex?: HarmonyIndex;
}

export function runScoringPipeline(input: ScoringInput): ScoringOutputExtended {
  const { measurements, photoQuality, sideProvided, sexMode, stylePreference, appearanceProfile } = input;

  // Determine effective style preference from appearance (confidence-gated)
  const effectiveStylePreference = getStylePreferenceFromAppearance(appearanceProfile, sexMode);

  // Step 1: Score metrics to traits
  const traitScores = scoreMetricsToTraits({
    measurements,
    photoQuality,
    sideProvided,
    sexMode,
    stylePreference: effectiveStylePreference,
    appearanceProfile,
  });

  // Step 2: Compute overall score
  const overall = computeOverallScore({
    traitScores,
    photoQuality,
    sideProvided,
    stylePreference: effectiveStylePreference,
  });

  // Step 3: Select top levers (use 'male' as default if no sexMode)
  const effectiveSexMode: 'male' | 'female' = 
    sexMode && sexMode !== 'auto' ? sexMode :
    appearanceProfile?.presentation === 'female-presenting' ? 'female' : 'male';
    
  const topLevers = selectTopLevers({
    traitScores,
    photoQuality,
    sideProvided,
    sexMode: effectiveSexMode,
  });

  // Step 4: Compute potential range
  const selectedLeverKeys = topLevers.map((l) => l.lever);
  const potentialRange = computePotentialRange({
    currentScore: overall.currentScore10,
    selectedLevers: selectedLeverKeys,
    photoQuality,
  });

  // Step 5: Compute harmony index
  const harmonyIndex = computeHarmonyIndex(measurements, photoQuality);

  // Convert trait scores to TraitScore format
  const formattedTraitScores: TraitScore[] = traitScores.map((t) => ({
    traitKey: t.traitKey,
    rawScore: t.score,
    dampedScore: calibrateScore(t.score, photoQuality.score),
    confidence: t.confidence,
    weight: 1, // Simplified
  }));

  return {
    traitScores: formattedTraitScores,
    pillarScores: overall.pillarScores,
    overallCurrent: overall.currentScore10,
    overallPotential: potentialRange,
    topLevers,
    calibrationApplied: photoQuality.score < QUALITY_LIGHT_DAMPEN_BELOW,
    harmonyIndex,
  };
}

export default {
  computePhotoQuality,
  calibrateScore,
  scoreMetricsToTraits,
  computeOverallScore,
  computePotentialRange,
  selectTopLevers,
  computeFeatureScores,
  runScoringPipeline,
  computeHarmonyIndex,
  getStylePreferenceFromAppearance,
};
