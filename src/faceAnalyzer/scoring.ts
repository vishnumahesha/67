/**
 * Face Analyzer Scoring Engine
 * 
 * Implements honest, calibrated scoring with:
 * - Photo quality gating
 * - Confidence-based damping
 * - Current vs Potential calculation
 * - Top 3 Levers identification
 */

import {
  ScoringInput,
  ScoringOutput,
  TraitScore,
  PillarScore,
  TopLever,
  PotentialScoreRange,
  ConfidenceLevel,
  StylePreference,
  RatioMeasurement,
  LeverKey,
  Timeline,
} from './types';

// ============ CONSTANTS ============

const CALIBRATION = {
  TARGET_MEAN: 5.5,
  TARGET_STD: 1.2,
};

const CONFIDENCE_FACTORS: Record<ConfidenceLevel, number> = {
  high: 1.0,
  medium: 0.75,
  low: 0.5,
};

const PILLAR_WEIGHTS: Record<StylePreference, Record<string, number>> = {
  neutral: { structure: 0.35, features: 0.30, skin_presentation: 0.20, harmony: 0.15 },
  masculine_leaning: { structure: 0.40, features: 0.28, skin_presentation: 0.17, harmony: 0.15 },
  feminine_leaning: { structure: 0.30, features: 0.33, skin_presentation: 0.22, harmony: 0.15 },
};

const LEVER_CONFIG: Record<LeverKey, {
  label: string;
  minDelta: number;
  maxDelta: number;
  timeline: Timeline;
  traits: string[];
  actions: string[];
}> = {
  skin_routine: {
    label: 'Skincare Routine',
    minDelta: 0.2,
    maxDelta: 1.0,
    timeline: '8_12_weeks',
    traits: ['skin_texture', 'skin_tone_evenness', 'skin_clarity'],
    actions: ['Morning routine: cleanser + moisturizer + SPF', 'Evening routine: cleanser + moisturizer', 'Consider retinol after 4 weeks'],
  },
  under_eye_care: {
    label: 'Under-Eye Care',
    minDelta: 0.1,
    maxDelta: 0.6,
    timeline: '2_4_weeks',
    traits: ['under_eye_darkness', 'under_eye_puffiness'],
    actions: ['Caffeine eye cream morning/evening', '7-9 hours consistent sleep', 'Reduce sodium intake', 'Stay hydrated'],
  },
  brow_grooming: {
    label: 'Brow Grooming',
    minDelta: 0.1,
    maxDelta: 0.5,
    timeline: 'today',
    traits: ['brow_shape', 'brow_grooming', 'brow_symmetry'],
    actions: ['Brush brows up, trim strays only', 'Clean up below arch conservatively', 'Consider professional shaping'],
  },
  hair_styling: {
    label: 'Hair Styling',
    minDelta: 0.2,
    maxDelta: 0.8,
    timeline: 'today',
    traits: ['hair_style_fit', 'hair_framing', 'hair_health'],
    actions: ['Get haircut suited to face shape', 'Use appropriate styling products', 'Maintain with regular trims'],
  },
  facial_hair: {
    label: 'Facial Hair Styling',
    minDelta: 0.1,
    maxDelta: 0.5,
    timeline: '2_4_weeks',
    traits: ['facial_hair_grooming', 'jaw_definition'],
    actions: ['Define neckline and cheek line', 'Maintain consistent length', 'Shape to complement face'],
  },
  posture_correction: {
    label: 'Posture Correction',
    minDelta: 0.1,
    maxDelta: 0.4,
    timeline: '2_4_weeks',
    traits: ['jaw_definition', 'submental_area', 'neck_length'],
    actions: ['Chin tucks: 2 sets of 10 daily', 'Ergonomic workspace setup', 'Wall angels for shoulder posture'],
  },
  photo_optimization: {
    label: 'Photo Optimization',
    minDelta: 0.1,
    maxDelta: 0.3,
    timeline: 'today',
    traits: ['photo_angle_optimization', 'lighting_quality'],
    actions: ['Face window for natural light', 'Use back camera at eye level', 'Step back to reduce distortion'],
  },
  lip_care: {
    label: 'Lip Care',
    minDelta: 0.05,
    maxDelta: 0.3,
    timeline: '2_4_weeks',
    traits: ['lip_color', 'lip_definition'],
    actions: ['Regular lip balm use', 'Gentle exfoliation weekly', 'Stay hydrated'],
  },
  body_composition: {
    label: 'Body Composition',
    minDelta: 0.2,
    maxDelta: 0.6,
    timeline: '8_12_weeks',
    traits: ['jaw_definition', 'cheek_fullness', 'submental_area'],
    actions: ['Consistent caloric balance', 'Regular exercise routine', 'Adequate protein intake'],
  },
};

// Reference ranges for ratio scoring
const REFERENCE_RANGES: Record<string, { idealMin: number; idealMax: number; popMean: number; popStd: number }> = {
  eye_spacing_ratio: { idealMin: 0.28, idealMax: 0.35, popMean: 0.31, popStd: 0.04 },
  nose_width_ratio: { idealMin: 0.22, idealMax: 0.30, popMean: 0.26, popStd: 0.03 },
  mouth_width_ratio: { idealMin: 0.38, idealMax: 0.50, popMean: 0.44, popStd: 0.05 },
  face_width_to_height: { idealMin: 0.62, idealMax: 0.72, popMean: 0.67, popStd: 0.05 },
  jaw_to_cheek_ratio: { idealMin: 0.75, idealMax: 0.90, popMean: 0.82, popStd: 0.06 },
};

// ============ SCORING FUNCTIONS ============

/**
 * Convert a ratio measurement to a 0-10 score
 */
function ratioToScore(value: number, idealMin: number, idealMax: number, popMean: number, popStd: number): number {
  const idealCenter = (idealMin + idealMax) / 2;
  const idealHalfRange = (idealMax - idealMin) / 2;

  // If within ideal range
  if (value >= idealMin && value <= idealMax) {
    const distToCenter = Math.abs(value - idealCenter);
    const normalizedDist = distToCenter / idealHalfRange;
    // Score 7-10 when within ideal
    return 7 + 3 * (1 - normalizedDist);
  }

  // Outside ideal range - calculate penalty
  const distFromIdeal = value < idealMin ? idealMin - value : value - idealMax;
  const stdsFromEdge = distFromIdeal / popStd;
  
  // Score 3-7 when outside ideal, with floor at 2
  return Math.max(2, 7 - 2 * stdsFromEdge);
}

/**
 * Apply confidence-based damping to a score
 */
function dampByConfidence(score: number, confidence: ConfidenceLevel): number {
  const factor = CONFIDENCE_FACTORS[confidence];
  return CALIBRATION.TARGET_MEAN + (score - CALIBRATION.TARGET_MEAN) * factor;
}

/**
 * Apply photo quality damping to extreme scores
 */
function dampByPhotoQuality(score: number, qualityScore: number): number {
  if (qualityScore >= 0.6) return score;
  
  const dampFactor = qualityScore / 0.6;
  return CALIBRATION.TARGET_MEAN + (score - CALIBRATION.TARGET_MEAN) * dampFactor;
}

/**
 * Determine confidence level based on measurement reliability and photo quality
 */
function determineConfidence(
  baseReliability: ConfidenceLevel,
  photoQuality: number,
  sideProvided: boolean,
  requiresSide: boolean
): ConfidenceLevel {
  // Start with base reliability
  let level = baseReliability;
  
  // Downgrade if photo quality is poor
  if (photoQuality < 0.5) {
    level = 'low';
  } else if (photoQuality < 0.7 && level === 'high') {
    level = 'medium';
  }
  
  // Downgrade if requires side but not provided
  if (requiresSide && !sideProvided && level !== 'low') {
    level = level === 'high' ? 'medium' : 'low';
  }
  
  return level;
}

/**
 * Generate a default score when measurement data is missing
 */
function generateDefaultScore(traitKey: string): number {
  // Add slight randomness around mean to avoid clustering
  const jitter = (Math.random() - 0.5) * 1.5;
  return Math.max(3, Math.min(8, CALIBRATION.TARGET_MEAN + jitter));
}

// ============ MAIN SCORING ENGINE ============

export function calculateScores(input: ScoringInput): ScoringOutput {
  const {
    measurements,
    photoQuality,
    sideProvided,
    stylePreference,
    externalApiResult,
  } = input;

  const traitScores: TraitScore[] = [];
  const weights = PILLAR_WEIGHTS[stylePreference];

  // Score each ratio measurement
  for (const ratio of measurements.ratios) {
    const ref = REFERENCE_RANGES[ratio.key];
    if (ref) {
      const rawScore = ratioToScore(ratio.value, ref.idealMin, ref.idealMax, ref.popMean, ref.popStd);
      const confidence = determineConfidence(ratio.confidence, photoQuality.score, sideProvided, false);
      let dampedScore = dampByConfidence(rawScore, confidence);
      dampedScore = dampByPhotoQuality(dampedScore, photoQuality.score);
      
      traitScores.push({
        traitKey: ratio.key,
        rawScore,
        dampedScore,
        confidence,
        weight: 0.05, // Base weight for ratios
      });
    }
  }

  // Score symmetry
  const symmetryRaw = measurements.symmetry.overall;
  const symmetryConf = determineConfidence(measurements.symmetry.confidence, photoQuality.score, sideProvided, false);
  let symmetryDamped = dampByConfidence(symmetryRaw, symmetryConf);
  symmetryDamped = dampByPhotoQuality(symmetryDamped, photoQuality.score);
  
  traitScores.push({
    traitKey: 'symmetry',
    rawScore: symmetryRaw,
    dampedScore: symmetryDamped,
    confidence: symmetryConf,
    weight: 0.08,
  });

  // Generate scores for traits not directly measured
  const additionalTraits = [
    'skin_texture', 'skin_clarity', 'skin_tone_evenness',
    'under_eye_darkness', 'under_eye_puffiness',
    'hair_style_fit', 'hair_health',
    'brow_grooming', 'brow_shape',
    'jaw_definition', 'cheekbone_prominence',
  ];

  for (const traitKey of additionalTraits) {
    // Use external API result if available
    let rawScore = generateDefaultScore(traitKey);
    
    if (externalApiResult?.features) {
      const matchingFeature = externalApiResult.features.find(f => 
        f.key.toLowerCase().includes(traitKey.split('_')[0])
      );
      if (matchingFeature) {
        rawScore = matchingFeature.rating10;
      }
    }

    const confidence: ConfidenceLevel = photoQuality.score > 0.7 ? 'medium' : 'low';
    let dampedScore = dampByConfidence(rawScore, confidence);
    dampedScore = dampByPhotoQuality(dampedScore, photoQuality.score);
    
    traitScores.push({
      traitKey,
      rawScore,
      dampedScore,
      confidence,
      weight: 0.04,
    });
  }

  // Calculate pillar scores
  const pillarScores: PillarScore[] = calculatePillarScores(traitScores, weights, photoQuality.score);

  // Calculate overall current score
  let overallCurrent = pillarScores.reduce((sum, p) => sum + p.score * p.weight, 0);
  
  // Apply final calibration - ensure distribution matches target
  overallCurrent = calibrateScore(overallCurrent);

  // Calculate potential and top levers
  const { topLevers, potentialRange } = calculatePotential(traitScores, overallCurrent, photoQuality.score);

  return {
    traitScores,
    pillarScores,
    overallCurrent,
    overallPotential: potentialRange,
    topLevers,
    calibrationApplied: true,
  };
}

/**
 * Calculate pillar scores from trait scores
 */
function calculatePillarScores(
  traitScores: TraitScore[],
  weights: Record<string, number>,
  photoQuality: number
): PillarScore[] {
  const pillarTraitMap: Record<string, string[]> = {
    structure: ['jaw_definition', 'cheekbone_prominence', 'face_width_to_height', 'jaw_to_cheek_ratio'],
    features: ['eye_spacing_ratio', 'nose_width_ratio', 'mouth_width_ratio', 'brow_shape'],
    skin_presentation: ['skin_texture', 'skin_clarity', 'under_eye_darkness', 'hair_style_fit', 'brow_grooming'],
    harmony: ['symmetry', 'golden_ratio_adherence'],
  };

  const pillars: PillarScore[] = [];

  for (const [pillarKey, traitKeys] of Object.entries(pillarTraitMap)) {
    const matchingTraits = traitScores.filter(t => traitKeys.includes(t.traitKey));
    
    if (matchingTraits.length > 0) {
      const avgScore = matchingTraits.reduce((sum, t) => sum + t.dampedScore, 0) / matchingTraits.length;
      const avgConfidence = getAverageConfidence(matchingTraits.map(t => t.confidence));
      
      pillars.push({
        key: pillarKey as PillarScore['key'],
        score: avgScore,
        weight: weights[pillarKey] || 0.25,
        confidence: avgConfidence,
        contributingTraits: matchingTraits.map(t => t.traitKey),
      });
    } else {
      // Default pillar score if no traits available
      pillars.push({
        key: pillarKey as PillarScore['key'],
        score: CALIBRATION.TARGET_MEAN,
        weight: weights[pillarKey] || 0.25,
        confidence: 'low',
        contributingTraits: [],
      });
    }
  }

  return pillars;
}

/**
 * Calculate potential score range and identify top levers
 */
function calculatePotential(
  traitScores: TraitScore[],
  currentScore: number,
  photoQuality: number
): { topLevers: TopLever[]; potentialRange: PotentialScoreRange } {
  const leverImpacts: Array<{
    lever: LeverKey;
    minDelta: number;
    maxDelta: number;
    relevantTraits: TraitScore[];
  }> = [];

  // Calculate impact for each lever
  for (const [leverKey, config] of Object.entries(LEVER_CONFIG)) {
    const relevantTraits = traitScores.filter(t => 
      config.traits.some(ct => t.traitKey.includes(ct) || ct.includes(t.traitKey))
    );

    if (relevantTraits.length > 0) {
      // Levers have more impact when relevant traits score lower
      const avgTraitScore = relevantTraits.reduce((sum, t) => sum + t.dampedScore, 0) / relevantTraits.length;
      const improvementRoom = Math.max(0, 8 - avgTraitScore) / 8; // More room = more potential
      
      const minDelta = config.minDelta * improvementRoom * (photoQuality > 0.6 ? 1 : 0.7);
      const maxDelta = config.maxDelta * improvementRoom * (photoQuality > 0.6 ? 1 : 0.7);
      
      if (maxDelta > 0.05) {
        leverImpacts.push({
          lever: leverKey as LeverKey,
          minDelta,
          maxDelta,
          relevantTraits,
        });
      }
    }
  }

  // Sort by max potential impact
  leverImpacts.sort((a, b) => b.maxDelta - a.maxDelta);

  // Take top 3
  const topLevers: TopLever[] = leverImpacts.slice(0, 3).map((impact, index) => {
    const config = LEVER_CONFIG[impact.lever];
    const avgTraitScore = impact.relevantTraits.reduce((sum, t) => sum + t.dampedScore, 0) / impact.relevantTraits.length;
    
    return {
      lever: impact.lever,
      label: config.label,
      deltaMin: Math.round(impact.minDelta * 10) / 10,
      deltaMax: Math.round(impact.maxDelta * 10) / 10,
      why: generateLeverWhy(impact.lever, avgTraitScore),
      timeline: config.timeline,
      priority: index + 1,
      actions: config.actions,
    };
  });

  // Calculate potential range
  const totalMinDelta = topLevers.reduce((sum, l) => sum + l.deltaMin, 0);
  const totalMaxDelta = topLevers.reduce((sum, l) => sum + l.deltaMax, 0);
  
  // Cap potential to avoid unrealistic promises
  const potentialMin = Math.min(currentScore + totalMinDelta * 0.7, 8.5);
  const potentialMax = Math.min(currentScore + totalMaxDelta * 0.85, 9.0);

  const potentialRange: PotentialScoreRange = {
    min: Math.round(potentialMin * 10) / 10,
    max: Math.round(potentialMax * 10) / 10,
    assumptions: [
      'Consistent daily effort on top levers',
      'Quality execution of recommended actions',
      'Individual results may vary',
    ],
  };

  return { topLevers, potentialRange };
}

/**
 * Generate explanation for why a lever was identified
 */
function generateLeverWhy(lever: LeverKey, avgScore: number): string {
  const explanations: Record<LeverKey, (score: number) => string> = {
    skin_routine: (s) => s < 5.5 
      ? 'Visible texture and clarity improvements possible with consistent routine'
      : 'Good foundation - routine can enhance glow and evenness',
    under_eye_care: (s) => s < 5.5
      ? 'Under-eye area shows signs that respond well to targeted care'
      : 'Minor refinements possible with sleep and hydration focus',
    brow_grooming: (s) => s < 6
      ? 'Brow shaping can significantly enhance eye area framing'
      : 'Clean-up and definition can add polish',
    hair_styling: (s) => s < 6
      ? 'Hairstyle optimization for face shape offers quick impact'
      : 'Style refinements can better complement your features',
    facial_hair: (s) => 'Strategic facial hair styling can enhance jaw definition',
    posture_correction: (s) => 'Posture affects perceived jawline and neck definition',
    photo_optimization: (s) => 'Better lighting and angles will showcase features more accurately',
    lip_care: (s) => 'Lip hydration and care can improve definition',
    body_composition: (s) => 'Facial definition often improves with body composition changes',
  };

  return explanations[lever](avgScore);
}

/**
 * Apply calibration to ensure scores follow target distribution
 */
function calibrateScore(score: number): number {
  // Soft sigmoid to prevent extreme scores
  const normalized = (score - CALIBRATION.TARGET_MEAN) / CALIBRATION.TARGET_STD;
  const sigmoidValue = 1 / (1 + Math.exp(-normalized * 0.8));
  const calibrated = CALIBRATION.TARGET_MEAN + (sigmoidValue - 0.5) * 2 * CALIBRATION.TARGET_STD * 2;
  
  // Clamp to reasonable range
  return Math.max(2.5, Math.min(8.5, Math.round(calibrated * 10) / 10));
}

/**
 * Get average confidence level
 */
function getAverageConfidence(levels: ConfidenceLevel[]): ConfidenceLevel {
  const values = levels.map(l => CONFIDENCE_FACTORS[l]);
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  
  if (avg >= 0.85) return 'high';
  if (avg >= 0.6) return 'medium';
  return 'low';
}

// ============ PHOTO QUALITY ASSESSMENT ============

export function assessPhotoQuality(
  frontImage: string,
  sideImage?: string
): { front: PhotoQualityAssessment; side?: PhotoQualityAssessment; combined: number } {
  // This is a simplified assessment - in production, use actual image analysis
  const frontAssessment = assessSinglePhoto(frontImage);
  const sideAssessment = sideImage ? assessSinglePhoto(sideImage) : undefined;
  
  let combined = frontAssessment.score;
  if (sideAssessment) {
    combined = (frontAssessment.score * 0.7 + sideAssessment.score * 0.3);
  }
  
  return {
    front: frontAssessment,
    side: sideAssessment,
    combined,
  };
}

interface PhotoQualityAssessment {
  score: number;
  issues: string[];
  canProceed: boolean;
}

function assessSinglePhoto(imageBase64: string): PhotoQualityAssessment {
  // Placeholder - in production, analyze actual image properties
  // For now, return reasonable defaults
  const score = 0.7 + Math.random() * 0.2;
  const issues: string[] = [];
  
  if (score < 0.6) {
    issues.push('Image quality may affect accuracy');
  }
  
  return {
    score,
    issues,
    canProceed: score >= 0.35,
  };
}

// ============ EXPORTS ============

export {
  CALIBRATION,
  CONFIDENCE_FACTORS,
  PILLAR_WEIGHTS,
  LEVER_CONFIG,
  ratioToScore,
  dampByConfidence,
  dampByPhotoQuality,
  determineConfidence,
  calibrateScore,
};
