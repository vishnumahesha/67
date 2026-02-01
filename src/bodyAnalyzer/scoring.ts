/**
 * Body Analyzer Scoring Utilities
 * Handles photo quality assessment and score calibration
 */

import type { BodyPhotoQuality, BodyPhotoQualityIssue } from './types';

// ============ PHOTO QUALITY COMPUTATION ============

interface PhotoQualityInput {
  sideProvided: boolean;
  brightness?: number; // 0-1
  sharpness?: number; // 0-1
  fullBodyVisible?: boolean;
  clothingFit?: 'fitted' | 'loose' | 'very_loose';
  poseNeutral?: boolean;
  mirrorSelfie?: boolean;
}

export function computeBodyPhotoQuality(input: PhotoQualityInput): BodyPhotoQuality {
  const issues: BodyPhotoQualityIssue[] = [];
  const warnings: string[] = [];
  let score = 100;

  // Check brightness
  if (input.brightness !== undefined) {
    if (input.brightness < 0.3) {
      issues.push('too_dark');
      score -= 25;
    } else if (input.brightness > 0.85) {
      issues.push('too_bright');
      score -= 15;
    }
  }

  // Check sharpness
  if (input.sharpness !== undefined && input.sharpness < 0.5) {
    issues.push('blurry');
    score -= 20;
  }

  // Check full body visibility
  if (input.fullBodyVisible === false) {
    issues.push('not_full_body');
    score -= 30;
    warnings.push('Full body visibility improves assessment accuracy');
  }

  // Check side photo
  if (!input.sideProvided) {
    issues.push('side_missing');
    score -= 15;
    warnings.push('Side photo would significantly improve posture and proportion analysis');
  }

  // Check clothing fit
  if (input.clothingFit === 'loose') {
    issues.push('baggy_clothes');
    score -= 15;
    warnings.push('Fitted clothing allows for more accurate body assessment');
  } else if (input.clothingFit === 'very_loose') {
    issues.push('clothing_too_loose');
    score -= 25;
    warnings.push('Very loose clothing significantly limits body assessment accuracy');
  }

  // Check pose
  if (input.poseNeutral === false) {
    issues.push('pose_inconsistent');
    score -= 10;
    warnings.push('A neutral standing pose provides the most accurate measurements');
  }

  // Check mirror selfie
  if (input.mirrorSelfie) {
    issues.push('mirror_selfie_distortion');
    score -= 10;
    warnings.push('Mirror selfies can cause slight distortion');
  }

  // Clamp score
  score = Math.max(0, Math.min(100, score));

  return {
    score,
    issues,
    canProceed: score >= 30,
    warnings,
  };
}

// ============ SCORE DAMPENING ============

/**
 * Dampen scores toward 5.5 based on photo quality
 */
export function dampenScore(rawScore: number, qualityScore: number): number {
  const mean = 5.5;
  let factor: number;

  if (qualityScore < 40) {
    factor = 0.4;
  } else if (qualityScore < 60) {
    factor = 0.6;
  } else if (qualityScore < 75) {
    factor = 0.8;
  } else {
    factor = 1.0;
  }

  // Lerp toward mean
  const dampened = mean + (rawScore - mean) * factor;
  return Math.round(dampened * 10) / 10;
}

/**
 * Calculate overall score from pillar scores
 */
export function calculateOverallScore(pillarScores: Array<{ score: number; weight: number }>): number {
  const totalWeight = pillarScores.reduce((sum, p) => sum + p.weight, 0);
  const weightedSum = pillarScores.reduce((sum, p) => sum + p.score * p.weight, 0);
  return Math.round((weightedSum / totalWeight) * 10) / 10;
}

/**
 * Get confidence level based on photo quality and side photo availability
 */
export function getConfidenceLevel(
  photoQuality: number,
  sideProvided: boolean
): 'low' | 'medium' | 'high' {
  if (photoQuality < 50) return 'low';
  if (!sideProvided && photoQuality < 70) return 'low';
  if (photoQuality < 70 || !sideProvided) return 'medium';
  return 'high';
}

// ============ RATIO SCORING ============

interface RatioRange {
  min: number;
  max: number;
  ideal?: number;
}

/**
 * Score a ratio based on ideal range
 */
export function scoreRatio(value: number, range: RatioRange): { score: number; status: 'below' | 'ideal' | 'above' } {
  const { min, max } = range;
  const mid = range.ideal || (min + max) / 2;
  
  if (value >= min && value <= max) {
    // Within ideal range - score 7-10 based on proximity to mid
    const distanceFromMid = Math.abs(value - mid);
    const maxDistance = (max - min) / 2;
    const proximityScore = 1 - (distanceFromMid / maxDistance);
    return {
      score: 7 + proximityScore * 3,
      status: 'ideal',
    };
  }

  if (value < min) {
    // Below range
    const deficit = min - value;
    const penaltyPerUnit = 3; // How much to penalize per unit below
    const score = Math.max(2, 7 - deficit * penaltyPerUnit);
    return { score, status: 'below' };
  }

  // Above range
  const excess = value - max;
  const penaltyPerUnit = 2; // Less penalty for being above
  const score = Math.max(3, 7 - excess * penaltyPerUnit);
  return { score, status: 'above' };
}

// ============ POTENTIAL CALCULATION ============

interface LeverInput {
  lever: string;
  currentScore: number;
  maxDelta: number;
  relevance: number; // 0-1, how relevant this lever is to the user
}

/**
 * Calculate potential gain from improvement levers
 */
export function calculatePotentialGain(levers: LeverInput[]): {
  totalMin: number;
  totalMax: number;
} {
  const MAX_TOTAL_GAIN = 2.5;

  // Sort by relevance and potential
  const sortedLevers = [...levers].sort(
    (a, b) => b.relevance * b.maxDelta - a.relevance * a.maxDelta
  );

  // Take top 5 levers
  const topLevers = sortedLevers.slice(0, 5);

  let totalMin = 0;
  let totalMax = 0;

  for (const lever of topLevers) {
    const minGain = lever.maxDelta * 0.3 * lever.relevance;
    const maxGain = lever.maxDelta * lever.relevance;
    totalMin += minGain;
    totalMax += maxGain;
  }

  // Apply diminishing returns and cap
  totalMin = Math.min(totalMin * 0.8, MAX_TOTAL_GAIN * 0.6);
  totalMax = Math.min(totalMax * 0.9, MAX_TOTAL_GAIN);

  return {
    totalMin: Math.round(totalMin * 10) / 10,
    totalMax: Math.round(totalMax * 10) / 10,
  };
}
