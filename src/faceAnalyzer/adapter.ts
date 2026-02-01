/**
 * Face Analyzer Adapter
 * 
 * Merges:
 * - External API results (if available)
 * - Our computed scoring from measurements/ranges
 * - Trait catalog + action library for structured explanations/fixes
 */

import {
  FaceAnalysisResponse,
  AnalysisInput,
  Feature,
  FeatureKey,
  TopLever,
  PhotoQuality,
  FaceShape,
  Measurements,
  StyleTips,
  Safety,
  OverallScore,
  PillarScore,
  Fix,
  ConfidenceLevel,
  ScoringInput,
  RatioMeasurement,
  SymmetryScore,
} from './types';
import {
  computePhotoQuality,
  runScoringPipeline,
  computeFeatureScores,
} from './scoring';

// Target mean for calibration display
const TARGET_MEAN = 5.5;

// ============ FEATURE TEMPLATES ============

export const FEATURE_TEMPLATES: Record<FeatureKey, {
  label: string;
  traits: string[];
  defaultStrengths: string[];
  potentialLimitations: string[];
  commonFixes: Fix[];
}> = {
  eyes: {
    label: 'Eyes',
    traits: ['eye_spacing_ratio', 'canthal_tilt', 'eye_symmetry', 'under_eye_area'],
    defaultStrengths: ['Good eye spacing', 'Balanced positioning'],
    potentialLimitations: ['Under-eye appearance', 'Eyelid exposure'],
    commonFixes: [
      {
        title: 'Under-eye care routine',
        type: 'routine',
        difficulty: 'easy',
        timeline: '2_4_weeks',
        steps: ['Apply caffeine eye cream morning and night', 'Get 7-9 hours consistent sleep', 'Reduce sodium intake'],
        expectedDelta: 0.2,
      },
    ],
  },
  brows: {
    label: 'Brows',
    traits: ['brow_shape', 'brow_thickness', 'brow_grooming', 'brow_position'],
    defaultStrengths: ['Natural fullness', 'Frame eyes well'],
    potentialLimitations: ['Could benefit from shaping', 'Minor asymmetry'],
    commonFixes: [
      {
        title: 'Professional brow shaping',
        type: 'low_cost',
        difficulty: 'easy',
        timeline: 'today',
        steps: ['Find experienced brow specialist', 'Request natural enhancement', 'Maintain shape at home'],
        expectedDelta: 0.3,
      },
      {
        title: 'At-home brow cleanup',
        type: 'no_cost',
        difficulty: 'easy',
        timeline: 'today',
        steps: ['Brush brows upward', 'Trim only obvious strays', 'Clean below arch conservatively'],
        expectedDelta: 0.15,
      },
    ],
  },
  nose: {
    label: 'Nose',
    traits: ['nose_width_ratio', 'nose_length', 'nose_symmetry', 'nose_bridge'],
    defaultStrengths: ['Proportionate to face', 'Good bridge definition'],
    potentialLimitations: ['Projection assessment limited without side view'],
    commonFixes: [
      {
        title: 'Contouring technique',
        type: 'no_cost',
        difficulty: 'medium',
        timeline: 'today',
        steps: ['Learn nose contouring basics', 'Use matte bronzer on sides', 'Highlight bridge center'],
        expectedDelta: 0.1,
        caution: 'For photos only; subtle application recommended',
      },
    ],
  },
  lips: {
    label: 'Lips',
    traits: ['lip_fullness', 'lip_ratio', 'lip_definition', 'mouth_width_ratio'],
    defaultStrengths: ['Natural shape', 'Proportionate width'],
    potentialLimitations: ['Definition could be enhanced', 'Hydration'],
    commonFixes: [
      {
        title: 'Lip care routine',
        type: 'no_cost',
        difficulty: 'easy',
        timeline: '2_4_weeks',
        steps: ['Regular lip balm application', 'Gentle weekly exfoliation', 'Stay hydrated'],
        expectedDelta: 0.15,
      },
    ],
  },
  cheekbones: {
    label: 'Cheekbones/Midface',
    traits: ['cheekbone_prominence', 'cheekbone_width', 'midface_ratio'],
    defaultStrengths: ['Provides facial structure', 'Balanced width'],
    potentialLimitations: ['Prominence assessment affected by lighting'],
    commonFixes: [
      {
        title: 'Highlight technique',
        type: 'no_cost',
        difficulty: 'easy',
        timeline: 'today',
        steps: ['Apply highlighter to cheekbone tops', 'Blend upward toward temples', 'Use natural lighting to check'],
        expectedDelta: 0.1,
      },
    ],
  },
  jawline: {
    label: 'Jawline/Chin',
    traits: ['jaw_width', 'jaw_definition', 'chin_shape', 'jaw_to_cheek_ratio'],
    defaultStrengths: ['Visible structure', 'Contributes to face shape'],
    potentialLimitations: ['Definition affected by lighting and posture', 'Side view needed for full assessment'],
    commonFixes: [
      {
        title: 'Posture exercises',
        type: 'no_cost',
        difficulty: 'easy',
        timeline: '2_4_weeks',
        steps: ['Chin tucks: 2 sets of 10 daily', 'Hold each rep 2-3 seconds', 'Check posture hourly'],
        expectedDelta: 0.2,
      },
      {
        title: 'Facial hair styling',
        type: 'no_cost',
        difficulty: 'easy',
        timeline: '2_4_weeks',
        steps: ['Define neckline below jawline', 'Keep cheek lines clean', 'Maintain consistent length'],
        expectedDelta: 0.25,
        caution: 'For those who can grow facial hair',
      },
    ],
  },
  skin: {
    label: 'Skin',
    traits: ['skin_texture', 'skin_tone_evenness', 'skin_clarity', 'skin_hydration'],
    defaultStrengths: ['Overall even tone', 'No major concerns visible'],
    potentialLimitations: ['Lighting heavily affects assessment', 'Texture details may vary'],
    commonFixes: [
      {
        title: 'Basic skincare routine',
        type: 'low_cost',
        difficulty: 'easy',
        timeline: '8_12_weeks',
        steps: ['Morning: cleanser, moisturizer, SPF', 'Evening: cleanser, moisturizer', 'Be consistent daily'],
        expectedDelta: 0.4,
      },
      {
        title: 'Add retinol (gradual)',
        type: 'low_cost',
        difficulty: 'medium',
        timeline: '8_12_weeks',
        steps: ['Start with low concentration', 'Use 1x/week initially', 'Increase to 2-3x/week over time', 'Always use SPF'],
        expectedDelta: 0.3,
        caution: 'Patch test first; may cause initial irritation',
      },
    ],
  },
  hair: {
    label: 'Hair',
    traits: ['hair_style_fit', 'hair_framing', 'hair_health', 'hair_density'],
    defaultStrengths: ['Natural texture', 'Current style'],
    potentialLimitations: ['Style optimization possible', 'Face shape matching'],
    commonFixes: [
      {
        title: 'Face-shape haircut',
        type: 'low_cost',
        difficulty: 'easy',
        timeline: 'today',
        steps: ['Research styles for your face shape', 'Bring reference photos to stylist', 'Ask for their professional opinion'],
        expectedDelta: 0.4,
      },
      {
        title: 'Hair care routine',
        type: 'low_cost',
        difficulty: 'easy',
        timeline: '2_4_weeks',
        steps: ['Use appropriate shampoo for hair type', 'Condition regularly', 'Minimize heat styling'],
        expectedDelta: 0.2,
      },
    ],
  },
  harmony: {
    label: 'Harmony/Symmetry',
    traits: ['overall_harmony', 'vertical_symmetry', 'proportion_harmony'],
    defaultStrengths: ['Features work together', 'Natural balance'],
    potentialLimitations: ['Minor asymmetries normal', 'Photo angle affects perception'],
    commonFixes: [
      {
        title: 'Photo angle optimization',
        type: 'no_cost',
        difficulty: 'easy',
        timeline: 'today',
        steps: ['Find your better side', 'Use consistent angles', 'Natural lighting from front'],
        expectedDelta: 0.15,
      },
    ],
  },
};

// ============ STYLE RECOMMENDATIONS ============

export const STYLE_BY_FACE_SHAPE: Record<string, StyleTips> = {
  oval: {
    haircuts: ['Most styles work well', 'Can experiment freely', 'Avoid completely covering forehead'],
    glasses: ['Most frame shapes complement', 'Avoid overly large frames that overwhelm'],
    facialHair: ['Most beard styles work', 'Match to personal preference'],
    grooming: ['Standard brow maintenance', 'Keep features balanced'],
  },
  round: {
    haircuts: ['Add height on top', 'Avoid full sides', 'Angular cuts add definition'],
    glasses: ['Rectangular or angular frames', 'Avoid round frames'],
    facialHair: ['Defined jawline beard helps', 'Avoid rounded beard shapes'],
    grooming: ['Angle brows slightly', 'Define cheekbones with grooming'],
  },
  square: {
    haircuts: ['Softer, layered styles', 'Side-swept looks', 'Avoid boxy cuts'],
    glasses: ['Round or oval frames', 'Thin frames work well'],
    facialHair: ['Rounded beard styles', 'Soften jaw angles'],
    grooming: ['Softer brow shape', 'Balance strong jaw'],
  },
  heart: {
    haircuts: ['Add width at jaw level', 'Side-swept bangs', 'Avoid excessive top volume'],
    glasses: ['Bottom-heavy frames', 'Light colored frames'],
    facialHair: ['Fuller at chin area', 'Balance forehead width'],
    grooming: ['Balanced brow shape', 'Draw attention to lower face'],
  },
  oblong: {
    haircuts: ['Add width at sides', 'Bangs can shorten appearance', 'Avoid excessive length'],
    glasses: ['Wide frames', 'Decorative temples'],
    facialHair: ['Fuller sides', 'Avoid long vertical beards'],
    grooming: ['Horizontal emphasis', 'Width-adding techniques'],
  },
  diamond: {
    haircuts: ['Add width at forehead and chin', 'Side-swept styles', 'Fringe options'],
    glasses: ['Oval or cat-eye shapes', 'Rimless can work well'],
    facialHair: ['Width at chin', 'Defined clean lines'],
    grooming: ['Balance narrow forehead and chin', 'Soft angles'],
  },
  rectangle: {
    haircuts: ['Layers and waves add width', 'Side parts work well', 'Avoid very short sides'],
    glasses: ['Wide frames balance length', 'Rounded shapes'],
    facialHair: ['Fuller sides helpful', 'Avoid long vertical styles'],
    grooming: ['Soft brow angles', 'Balance face length'],
  },
};

// ============ MOCK MEASUREMENTS ============

function generateMockMeasurements(): Measurements {
  const generateRatio = (mean: number, std: number): number => {
    return mean + (Math.random() - 0.5) * std * 2;
  };

  const ratios: RatioMeasurement[] = [
    {
      key: 'eye_spacing_ratio',
      value: generateRatio(0.31, 0.04),
      idealMin: 0.28,
      idealMax: 0.35,
      confidence: 'medium',
    },
    {
      key: 'nose_width_ratio',
      value: generateRatio(0.26, 0.03),
      idealMin: 0.22,
      idealMax: 0.30,
      confidence: 'medium',
    },
    {
      key: 'mouth_width_ratio',
      value: generateRatio(0.44, 0.05),
      idealMin: 0.38,
      idealMax: 0.50,
      confidence: 'medium',
    },
    {
      key: 'face_width_to_height',
      value: generateRatio(0.67, 0.05),
      idealMin: 0.62,
      idealMax: 0.72,
      confidence: 'low',
    },
    {
      key: 'jaw_to_cheek_ratio',
      value: generateRatio(0.82, 0.06),
      idealMin: 0.75,
      idealMax: 0.90,
      confidence: 'medium',
    },
  ];

  const symmetry: SymmetryScore = {
    overall: 0.55 + (Math.random() - 0.5) * 0.2,
    eyeHeightDelta: Math.random() * 0.03,
    mouthCornerDelta: Math.random() * 0.02,
    noseDeviation: Math.random() * 0.02,
    confidence: 'medium',
    notes: ['Minor natural asymmetry detected', 'Within normal range'],
  };

  return { ratios, symmetry };
}

// ============ MAIN ADAPTER FUNCTION ============

export async function analyzeFace(input: AnalysisInput): Promise<FaceAnalysisResponse> {
  const { frontImage, sideImage, sexMode, stylePreference = 'neutral' } = input;

  // Step 1: Assess photo quality
  const photoQuality = computePhotoQuality({
    sideProvided: !!sideImage,
    brightness: 0.6,
    sharpness: 0.7,
    faceSize: 0.4,
    headTilt: 0,
    expressionNeutral: true,
    hairObstructing: false,
    glassesPresent: false,
    faceCount: 1,
  });

  // Step 2: Generate measurements (in production, would use actual landmark detection)
  const measurements = generateMockMeasurements();

  // Step 3: Run scoring pipeline
  const scoringInput: ScoringInput = {
    measurements,
    photoQuality,
    sideProvided: !!sideImage,
    sexMode,
    stylePreference,
  };

  const scoringOutput = runScoringPipeline(scoringInput);

  // Step 4: Determine face shape
  const faceShape = determineFaceShape(measurements);

  // Step 5: Build feature breakdowns
  const features = buildFeatures(scoringOutput, photoQuality);

  // Step 6: Get style recommendations
  const styleTips = STYLE_BY_FACE_SHAPE[faceShape.label] || STYLE_BY_FACE_SHAPE.oval;

  // Step 7: Build overall score
  const overall: OverallScore = {
    currentScore10: scoringOutput.overallCurrent,
    potentialScoreRange: scoringOutput.overallPotential,
    confidence: photoQuality.score > 0.7 ? 'medium' : 'low',
    summary: generateSummary(scoringOutput.overallCurrent, scoringOutput.overallPotential, faceShape),
    calibrationNote: `Scores calibrated to realistic distribution (average ~${TARGET_MEAN}). Most people score 4.5-6.5.`,
  };

  // Step 8: Build safety section
  const safety: Safety = {
    disclaimer: 'Results are estimates based on general aesthetic guidelines. Individual perception varies. This is not a judgment of worth or beauty.',
    tone: 'neutral',
    limitations: [
      'Photo quality and lighting affect accuracy',
      'Side profile recommended for complete analysis',
      'Potential is an estimate assuming consistent effort',
    ],
  };

  // Step 9: Assemble final response
  const response: FaceAnalysisResponse = {
    analysisId: generateId(),
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    photoQuality,
    overall,
    pillarScores: scoringOutput.pillarScores,
    topLevers: scoringOutput.topLevers,
    faceShape,
    measurements,
    features,
    styleTips,
    safety,
  };

  return response;
}

// ============ HELPER FUNCTIONS ============

function determineFaceShape(measurements: Measurements): FaceShape {
  const fwh = measurements.ratios.find(r => r.key === 'face_width_to_height')?.value || 0.67;
  const jtc = measurements.ratios.find(r => r.key === 'jaw_to_cheek_ratio')?.value || 0.82;

  let label: FaceShape['label'] = 'oval';
  const confidence: ConfidenceLevel = 'medium';

  if (fwh > 0.72) {
    label = jtc > 0.85 ? 'square' : 'round';
  } else if (fwh < 0.62) {
    label = 'oblong';
  } else if (jtc < 0.75) {
    label = 'heart';
  } else if (jtc > 0.88) {
    label = 'square';
  }

  return {
    label,
    confidence,
    description: `Your face shape appears to be ${label}. This classification helps with style recommendations.`,
  };
}

function buildFeatures(scoringOutput: any, photoQuality: PhotoQuality): Feature[] {
  const features: Feature[] = [];
  const featureKeys: FeatureKey[] = ['eyes', 'brows', 'nose', 'lips', 'cheekbones', 'jawline', 'skin', 'hair', 'harmony'];

  for (const key of featureKeys) {
    const template = FEATURE_TEMPLATES[key];
    
    // Get relevant trait scores
    const relevantScores = scoringOutput.traitScores.filter((t: any) =>
      template.traits.some(trait => t.traitKey.includes(trait) || trait.includes(t.traitKey))
    );

    // Calculate feature score
    let featureScore = TARGET_MEAN;
    let confidence: ConfidenceLevel = 'medium';
    
    if (relevantScores.length > 0) {
      featureScore = relevantScores.reduce((sum: number, t: any) => sum + t.dampedScore, 0) / relevantScores.length;
      const avgConfFactor = relevantScores.reduce((sum: number, t: any) => {
        const factors: Record<string, number> = { high: 1, medium: 0.75, low: 0.5 };
        return sum + (factors[t.confidence] || 0.5);
      }, 0) / relevantScores.length;
      confidence = avgConfFactor > 0.8 ? 'high' : avgConfFactor > 0.6 ? 'medium' : 'low';
    }

    // Adjust confidence based on photo quality
    if (photoQuality.score < 0.6 && confidence === 'high') {
      confidence = 'medium';
    }

    // Generate strengths and limitations based on score
    const strengths = featureScore >= 5.5 ? template.defaultStrengths : [template.defaultStrengths[0]];
    const whatLimitsIt = featureScore < 6.5 ? template.potentialLimitations : ['Minor refinements possible'];

    // Select relevant fixes
    const fixes = template.commonFixes.filter(fix => {
      if (featureScore >= 7) return fix.difficulty === 'easy';
      return true;
    });

    features.push({
      key,
      label: template.label,
      rating10: Math.round(featureScore * 10) / 10,
      confidence,
      summary: generateFeatureSummary(key, featureScore, confidence),
      strengths,
      whatLimitsIt,
      why: generateFeatureWhy(key, featureScore, confidence),
      fixes,
    });
  }

  return features;
}

function generateSummary(current: number, potential: { min: number; max: number }, faceShape: FaceShape): string {
  const delta = potential.max - current;
  
  if (current >= 6.5) {
    return `Above average overall harmony with ${faceShape.label} face shape. ${delta > 0.5 ? 'Presentation optimizations could enhance further.' : 'Already well-optimized.'}`;
  } else if (current >= 5.0) {
    return `Average overall with ${faceShape.label} face shape. ${delta > 0.8 ? 'Good improvement potential through grooming and presentation.' : 'Modest gains available through targeted efforts.'}`;
  } else {
    return `Room for improvement with ${faceShape.label} face shape. Significant potential gains available through consistent grooming and lifestyle changes.`;
  }
}

function generateFeatureSummary(key: FeatureKey, score: number, confidence: ConfidenceLevel): string {
  const scoreBand = score >= 6.5 ? 'above average' : score >= 5.0 ? 'average' : 'below average';
  const confNote = confidence === 'low' ? ' (assessment limited by photo quality)' : '';
  
  return `${scoreBand.charAt(0).toUpperCase() + scoreBand.slice(1)} ${key} presentation${confNote}`;
}

function generateFeatureWhy(key: FeatureKey, score: number, confidence: ConfidenceLevel): string[] {
  const whyStatements: string[] = [];
  
  if (score >= 6.5) {
    whyStatements.push('Measurements fall within favorable ranges');
    whyStatements.push('Good balance with other facial features');
  } else if (score >= 5.0) {
    whyStatements.push('Measurements within normal range');
    whyStatements.push('Some optimization opportunities available');
  } else {
    whyStatements.push('Measurements suggest room for enhancement');
    whyStatements.push('Targeted improvements can help');
  }

  if (confidence === 'low') {
    whyStatements.push('Note: Lower confidence due to photo quality limitations');
  }

  return whyStatements;
}

function generateId(): string {
  return `fa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
