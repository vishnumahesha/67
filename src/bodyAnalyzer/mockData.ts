/**
 * Body Analyzer Mock Data
 * Realistic mock responses for demo/testing
 */

import type { BodyAnalysisResponse, AppearancePresentation } from './types';

// ============ MOCK GENERATOR ============

export function getMockBodyAnalysisResult(input: {
  presentation: AppearancePresentation;
  sideProvided: boolean;
  isPremium: boolean;
}): BodyAnalysisResponse {
  const isMale = input.presentation === 'male-presenting';
  const baseScore = 5.2 + (Math.random() - 0.5) * 1.5; // 4.5-5.9 range

  return {
    analysisId: `ba_${Date.now()}_mock`,
    timestamp: new Date().toISOString(),
    version: '1.0.0',

    tier: {
      isPremium: input.isPremium,
      depth: input.isPremium ? 'premium' : 'free',
    },

    inputs: {
      presentation: input.presentation,
      sideProvided: input.sideProvided,
    },

    photoQuality: {
      score: input.sideProvided ? 82 : 68,
      issues: input.sideProvided ? [] : ['side_missing'],
      canProceed: true,
      warnings: input.sideProvided
        ? []
        : ['Side photo would significantly improve posture and proportion analysis'],
    },

    appearanceProfile: {
      presentation: input.presentation,
      confidence: 0.92,
      ageRange: { min: 22, max: 32 },
      ageConfidence: 0.7,
    },

    overall: {
      currentScore10: parseFloat(baseScore.toFixed(1)),
      potentialScoreRange: {
        min: parseFloat((baseScore + 0.8).toFixed(1)),
        max: parseFloat(Math.min(baseScore + 2.0, 8.5).toFixed(1)),
      },
      confidence: input.sideProvided ? 'medium' : 'low',
      summary: isMale
        ? 'Solid foundation with decent frame structure. Primary opportunities are improving body composition for better definition, building shoulder width for enhanced V-taper, and addressing forward posture.'
        : 'Good proportional balance with room for enhancement. Focus areas include waist definition, hip-to-waist ratio optimization, and posture improvement for better overall presentation.',
      calibrationNote:
        'Scores use realistic distribution where 5.5 is average. A 7+ is genuinely above average (top 30%). Potential assumes consistent effort over 12-16 weeks.',
    },

    pillarScores: [
      {
        key: 'proportions',
        score: 5.4,
        weight: 0.35,
        confidence: input.sideProvided ? 'medium' : 'low',
        contributingTraits: ['shoulder_to_waist', 'waist_to_hip', 'leg_to_torso'],
      },
      {
        key: 'composition',
        score: 4.8,
        weight: 0.30,
        confidence: 'medium',
        contributingTraits: ['body_fat', 'muscle_definition', 'distribution'],
      },
      {
        key: 'posture',
        score: input.sideProvided ? 5.0 : 5.5,
        weight: 0.20,
        confidence: input.sideProvided ? 'medium' : 'low',
        contributingTraits: ['spine_alignment', 'shoulder_position', 'pelvic_tilt'],
      },
      {
        key: 'symmetry',
        score: 6.2,
        weight: 0.15,
        confidence: 'medium',
        contributingTraits: ['left_right_balance', 'shoulder_height', 'hip_alignment'],
      },
    ],

    kibbeAssessment: {
      primaryType: isMale ? 'natural' : 'soft_natural',
      secondaryType: isMale ? 'soft_natural' : 'romantic',
      confidence: input.sideProvided ? 'medium' : 'low',
      yinYangBalance: {
        yin: isMale ? 35 : 55,
        yang: isMale ? 65 : 45,
      },
      dominantTraits: isMale
        ? ['Moderate frame width', 'Blunt bone structure', 'Relaxed musculature']
        : ['Soft edges over bone structure', 'Moderate curves', 'Slightly broad shoulders'],
      stylingNotes: isMale
        ? [
            'Opt for relaxed, unconstructed fits',
            'Natural fabrics like cotton and linen work well',
            'Avoid overly stiff or sharp tailoring',
            'Layering adds visual interest',
          ]
        : [
            'Soft, flowing silhouettes flatter your frame',
            'Embrace gentle curves in clothing lines',
            'Avoid sharp, angular cuts',
            'Natural waist definition enhances proportions',
          ],
      celebrityExamples: isMale
        ? ['Chris Hemsworth', 'Jason Momoa']
        : ['Jennifer Lopez', 'Scarlett Johansson'],
    },

    structuralRatios: {
      shoulderToWaist: {
        key: 'shoulderToWaist',
        label: 'Shoulder-to-Waist Ratio',
        value: isMale ? 1.38 : 1.32,
        idealMin: isMale ? 1.45 : 1.35,
        idealMax: isMale ? 1.60 : 1.50,
        percentile: 42,
        confidence: 'medium',
        note: isMale
          ? 'Below ideal range. Building delts and lats while cutting waist would improve significantly.'
          : 'Slightly below ideal. Shoulder development and waist definition can enhance this ratio.',
        status: 'below',
      },
      waistToHip: {
        key: 'waistToHip',
        label: 'Waist-to-Hip Ratio',
        value: isMale ? 0.92 : 0.78,
        idealMin: isMale ? 0.85 : 0.65,
        idealMax: isMale ? 0.95 : 0.75,
        percentile: isMale ? 55 : 38,
        confidence: 'medium',
        note: isMale
          ? 'Within acceptable range for male presentation.'
          : 'Slightly above ideal range. Core work and nutrition can optimize this.',
        status: isMale ? 'ideal' : 'above',
      },
      ...(isMale
        ? {
            chestToWaist: {
              key: 'chestToWaist',
              label: 'Chest-to-Waist Ratio',
              value: 1.18,
              idealMin: 1.15,
              idealMax: 1.30,
              confidence: 'medium' as const,
              note: 'Lower end of ideal range. Chest development can improve this.',
              status: 'ideal' as const,
            },
          }
        : {
            hipToWaist: {
              key: 'hipToWaist',
              label: 'Hip-to-Waist Ratio',
              value: 1.28,
              idealMin: 1.25,
              idealMax: 1.45,
              confidence: 'medium' as const,
              note: 'Lower end of ideal. Waist definition will enhance this naturally.',
              status: 'ideal' as const,
            },
          }),
      legToTorso: {
        key: 'legToTorso',
        label: 'Leg-to-Torso Ratio',
        value: 1.02,
        idealMin: 1.0,
        idealMax: 1.1,
        confidence: 'medium',
        note: 'Well balanced leg-to-torso proportions.',
        status: 'ideal',
      },
      armLengthProportionality: {
        key: 'armLengthProportionality',
        label: 'Arm Length Proportionality',
        value: 0.98,
        idealMin: 0.95,
        idealMax: 1.05,
        confidence: 'low',
        note: 'Arms appear proportional to body.',
        status: 'ideal',
      },
      shoulderWidthToHeadWidth: {
        key: 'shoulderWidthToHeadWidth',
        label: 'Shoulder Width to Head Width',
        value: isMale ? 2.4 : 2.3,
        idealMin: isMale ? 2.5 : 2.3,
        idealMax: isMale ? 3.0 : 2.8,
        confidence: 'medium',
        note: isMale
          ? 'Slightly narrow shoulders relative to head. Delt development will improve this.'
          : 'Within normal range for female presentation.',
        status: isMale ? 'below' : 'ideal',
      },
      frameSize: 'medium',
      frameSizeConfidence: 'medium',
    },

    posture: input.sideProvided
      ? {
          overall: {
            score10: 5.0,
            confidence: 'medium',
            summary:
              'Moderate postural issues detected. Forward head position and rounded shoulders are the primary concerns. These are correctable with targeted exercises.',
          },
          forwardHead: {
            issue: 'Forward Head Position',
            severity: 'mild',
            angleDegrees: 12,
            confidence: 'medium',
            note: 'Head positioned approximately 12 degrees forward of neutral alignment.',
            correction: 'Chin tucks and neck strengthening exercises',
          },
          roundedShoulders: {
            issue: 'Rounded Shoulders',
            severity: 'mild',
            angleDegrees: 18,
            confidence: 'medium',
            note: 'Shoulders rolled forward approximately 18 degrees.',
            correction: 'Face pulls, rear delt work, and chest stretching',
          },
          anteriorPelvicTilt: {
            issue: 'Anterior Pelvic Tilt',
            severity: 'none',
            confidence: 'medium',
            note: 'Pelvis appears neutrally aligned.',
          },
        }
      : undefined,

    bodyComposition: {
      visualBodyFatEstimate: {
        range: isMale ? { min: 18, max: 22 } : { min: 24, max: 28 },
        confidence: 'low',
        note: 'Visual estimate only. Actual body fat may vary.',
      },
      fatDistributionPattern: isMale ? 'mixed' : 'lower_dominant',
      muscleBalanceUpperLower: isMale ? 'upper_dominant' : 'balanced',
      leftRightSymmetry: {
        score: 0.88,
        confidence: 'medium',
        asymmetries: ['Minor shoulder height difference'],
      },
    },

    features: [
      {
        key: 'v_taper',
        label: 'V-Taper / Silhouette',
        rating10: isMale ? 4.8 : 5.2,
        confidence: 'medium',
        summary: isMale
          ? 'Shoulder-to-waist ratio is below ideal, limiting V-taper appearance. Building shoulder width and reducing waist will significantly improve this.'
          : 'Good natural silhouette with room for enhancement through waist definition.',
        strengths: isMale
          ? ['Frame structure supports improvement', 'No major skeletal limitations']
          : ['Natural hourglass tendency', 'Good hip-to-shoulder balance'],
        limitations: isMale
          ? ['Shoulders need more width', 'Waist definition lacking', 'Lat development needed']
          : ['Waist could be more defined', 'Upper body could be more balanced'],
        why: ['Based on shoulder-to-waist ratio measurement', 'Compared to ideal range for presentation'],
        evidence: isMale
          ? 'SWR of 1.38 vs ideal of 1.45-1.60'
          : 'SWR of 1.32 vs ideal of 1.35-1.50',
        fixes: [
          {
            title: isMale ? 'Shoulder Width Program' : 'Upper Body Toning',
            type: 'workout',
            difficulty: 'moderate',
            timeToSeeChange: '8-12 weeks',
            steps: isMale
              ? [
                  'Lateral raises 4x15-20, 3x per week',
                  'Overhead press 3x8-12, 2x per week',
                  'Wide-grip pull-ups or lat pulldowns 4x8-12',
                  'Face pulls every upper body day',
                ]
              : [
                  'Shoulder press 3x12-15',
                  'Lateral raises 3x15',
                  'Lat pulldowns for back width 3x12',
                  'Rear delt flyes 3x15',
                ],
            expectedDelta: 0.8,
          },
          {
            title: 'Waist Definition Protocol',
            type: 'nutrition',
            difficulty: 'moderate',
            timeToSeeChange: '8-12 weeks',
            steps: [
              'Calculate TDEE and create 300-500 calorie deficit',
              'Protein at 0.8-1g per lb bodyweight',
              'Avoid excessive sodium to reduce water retention',
              'Core strengthening without heavy oblique work',
            ],
            expectedDelta: 0.6,
          },
        ],
      },
      {
        key: 'body_composition',
        label: 'Body Composition',
        rating10: 4.6,
        confidence: 'low',
        summary:
          'Body fat level appears to be obscuring muscle definition. Reducing body fat would reveal existing muscle and improve overall appearance.',
        strengths: ['No extreme fat accumulation', 'Even distribution pattern'],
        limitations: ['Muscle definition not visible', 'Some soft tissue around midsection'],
        why: ['Visual assessment of muscle definition', 'Fat distribution pattern analysis'],
        fixes: [
          {
            title: 'Body Recomposition Protocol',
            type: 'nutrition',
            difficulty: 'moderate',
            timeToSeeChange: '10-14 weeks',
            steps: [
              'Moderate caloric deficit (300-500 cals)',
              'High protein (1g per lb bodyweight)',
              'Strength training to preserve muscle',
              '10,000+ steps daily',
              '2-3 cardio sessions per week',
            ],
            expectedDelta: 1.2,
          },
        ],
      },
      {
        key: 'posture',
        label: 'Posture & Alignment',
        rating10: input.sideProvided ? 5.0 : 5.5,
        confidence: input.sideProvided ? 'medium' : 'low',
        summary: input.sideProvided
          ? 'Mild forward head position and rounded shoulders detected. These are common and correctable issues.'
          : 'Cannot fully assess posture without side photo. Score is conservative estimate.',
        strengths: ['No severe postural deviations', 'Correctable with targeted exercises'],
        limitations: input.sideProvided
          ? ['Forward head position', 'Rounded shoulders', 'May affect frame appearance']
          : ['Side photo needed for accurate assessment'],
        why: input.sideProvided
          ? ['Measured forward head angle', 'Assessed shoulder position', 'Evaluated spine alignment']
          : ['Front photo only - limited posture visibility'],
        fixes: [
          {
            title: 'Posture Correction Routine',
            type: 'posture',
            difficulty: 'easy',
            timeToSeeChange: '4-6 weeks',
            steps: [
              'Chin tucks: 3x15, 3 times daily',
              'Wall angels: 2x10 daily',
              'Chest doorway stretch: 2x30sec each side',
              'Face pulls: 3x15 every workout',
            ],
            expectedDelta: 0.5,
          },
        ],
      },
      {
        key: 'symmetry',
        label: 'Body Symmetry',
        rating10: 6.2,
        confidence: 'medium',
        summary: 'Good overall symmetry with minor variations within normal range.',
        strengths: ['Well-balanced left/right', 'Proportional limbs', 'Even muscle development'],
        limitations: ['Minor shoulder height difference'],
        why: ['Visual assessment of bilateral symmetry', 'Shoulder line analysis'],
        fixes: [],
      },
    ],

    potential: {
      totalPossibleGain: { min: 0.8, max: 2.0 },
      top3Levers: [
        {
          lever: 'body_composition',
          title: 'Improve Body Composition',
          deltaMin: 0.4,
          deltaMax: 1.2,
          timeline: '10-14 weeks',
          priority: 1,
          impact: 'high',
          why: 'Reducing body fat reveals existing muscle and improves all visible metrics',
          actions: [
            'Caloric deficit of 300-500 calories',
            'Protein at 1g per lb bodyweight',
            'Strength training 3-4x per week',
            '10,000+ daily steps',
          ],
        },
        {
          lever: 'v_taper',
          title: isMale ? 'Build V-Taper' : 'Enhance Silhouette',
          deltaMin: 0.3,
          deltaMax: 1.0,
          timeline: '8-12 weeks',
          priority: 2,
          impact: 'high',
          why: isMale
            ? 'Building shoulder and lat width while cutting waist creates dramatic visual improvement'
            : 'Defining waist and toning upper body enhances natural curves',
          actions: isMale
            ? [
                'Lateral raises 3-4x per week',
                'Wide-grip pulldowns/pull-ups',
                'Overhead press variation',
                'Core work without heavy obliques',
              ]
            : [
                'Shoulder and back toning',
                'Core strengthening',
                'Lower body sculpting',
                'Targeted cardio',
              ],
        },
        {
          lever: 'posture',
          title: 'Fix Posture',
          deltaMin: 0.2,
          deltaMax: 0.5,
          timeline: '4-8 weeks',
          priority: 3,
          impact: 'medium',
          why: 'Better posture instantly makes you look taller, broader, and more confident',
          actions: [
            'Daily chin tucks and wall angels',
            'Face pulls every workout',
            'Chest stretches',
            'Ergonomic workspace setup',
          ],
        },
      ],
      timelineToFullPotential: '12-16 weeks with consistent effort',
      assumptions: [
        'Consistent training 3-4x per week',
        'Nutrition adherence 80%+',
        'Adequate sleep and recovery',
        'No underlying medical conditions',
      ],
      deltas: input.isPremium
        ? [
            {
              lever: 'Body Composition',
              currentIssue: 'Body fat obscuring muscle definition',
              delta: 1.2,
              potentialGain: 'Visible muscle definition, improved ratios',
              timeline: '10-14 weeks',
              difficulty: 'moderate',
              steps: ['Caloric deficit', 'High protein', 'Strength training', 'Daily activity'],
            },
            {
              lever: 'V-Taper Development',
              currentIssue: 'Shoulder-to-waist ratio below optimal',
              delta: 1.0,
              potentialGain: 'Improved frame appearance, better proportions',
              timeline: '8-12 weeks',
              difficulty: 'moderate',
              steps: ['Shoulder prioritization', 'Lat development', 'Waist definition'],
            },
            {
              lever: 'Posture Correction',
              currentIssue: 'Forward head and rounded shoulders',
              delta: 0.5,
              potentialGain: 'Better carriage, taller appearance',
              timeline: '4-8 weeks',
              difficulty: 'easy',
              steps: ['Daily corrective exercises', 'Strengthening weak areas'],
            },
          ]
        : [],
    },

    topLevers: [
      {
        lever: 'body_composition',
        title: 'Improve Body Composition',
        deltaMin: 0.4,
        deltaMax: 1.2,
        timeline: '10-14 weeks',
        priority: 1,
        impact: 'high',
        why: 'Reducing body fat reveals existing muscle and improves all visible metrics',
        actions: ['Caloric deficit', 'High protein', 'Strength training', 'Daily activity'],
      },
      {
        lever: 'v_taper',
        title: isMale ? 'Build V-Taper' : 'Enhance Silhouette',
        deltaMin: 0.3,
        deltaMax: 1.0,
        timeline: '8-12 weeks',
        priority: 2,
        impact: 'high',
        why: 'Building proportions creates significant visual improvement',
        actions: ['Targeted training', 'Core work', 'Nutrition optimization'],
      },
      {
        lever: 'posture',
        title: 'Fix Posture',
        deltaMin: 0.2,
        deltaMax: 0.5,
        timeline: '4-8 weeks',
        priority: 3,
        impact: 'medium',
        why: 'Better posture instantly improves appearance',
        actions: ['Daily corrective exercises', 'Workspace ergonomics'],
      },
    ],

    workoutPlan: {
      focusAreas: isMale
        ? ['Lateral delts', 'Lats', 'Upper chest', 'Rear delts', 'Core']
        : ['Glutes', 'Core', 'Back', 'Shoulders'],
      weeklyFrequency: '4 days per week',
      splitSuggestion: isMale
        ? 'Upper/Lower split with shoulder emphasis on upper days'
        : 'Full body 2x, Lower body 2x per week',
      exercises: isMale
        ? [
            {
              name: 'Lateral Raises',
              targetArea: 'Side delts',
              sets: '4',
              reps: '15-20',
              notes: 'Focus on controlled movement, slight lean forward',
              priority: 'essential',
            },
            {
              name: 'Wide-Grip Lat Pulldown',
              targetArea: 'Lats',
              sets: '4',
              reps: '10-12',
              notes: 'Full stretch at top, squeeze at bottom',
              priority: 'essential',
            },
            {
              name: 'Overhead Press',
              targetArea: 'Front/side delts',
              sets: '3',
              reps: '8-12',
              notes: 'Seated or standing, maintain core engagement',
              priority: 'essential',
            },
            {
              name: 'Face Pulls',
              targetArea: 'Rear delts, rotator cuff',
              sets: '3',
              reps: '15-20',
              notes: 'External rotation at end of movement',
              priority: 'essential',
            },
            {
              name: 'Incline Dumbbell Press',
              targetArea: 'Upper chest',
              sets: '3',
              reps: '10-12',
              notes: '30-45 degree incline',
              priority: 'recommended',
            },
            {
              name: 'Planks',
              targetArea: 'Core',
              sets: '3',
              reps: '30-60 sec',
              notes: 'Maintain neutral spine, engage glutes',
              priority: 'recommended',
            },
          ]
        : [
            {
              name: 'Hip Thrusts',
              targetArea: 'Glutes',
              sets: '4',
              reps: '12-15',
              notes: 'Pause at top, full hip extension',
              priority: 'essential',
            },
            {
              name: 'Romanian Deadlifts',
              targetArea: 'Hamstrings, glutes',
              sets: '3',
              reps: '10-12',
              notes: 'Hinge at hips, slight knee bend',
              priority: 'essential',
            },
            {
              name: 'Lat Pulldowns',
              targetArea: 'Back width',
              sets: '3',
              reps: '12-15',
              notes: 'Control the negative',
              priority: 'essential',
            },
            {
              name: 'Shoulder Press',
              targetArea: 'Shoulders',
              sets: '3',
              reps: '12-15',
              notes: 'Dumbbells or machine',
              priority: 'recommended',
            },
            {
              name: 'Dead Bugs',
              targetArea: 'Core',
              sets: '3',
              reps: '10 each side',
              notes: 'Lower back pressed to floor',
              priority: 'recommended',
            },
          ],
      cardioRecommendation: '3-4x per week: 30 min steady state or 20 min HIIT',
      mobilityWork: [
        'Hip flexor stretches',
        'Chest doorway stretch',
        'Cat-cow stretches',
        'Thoracic spine rotations',
      ],
      estimatedResultsTimeline: 'Visible changes in 6-8 weeks with consistent adherence',
    },

    stylingGuide: {
      kibbeStyleSummary: isMale
        ? 'As a Natural type, opt for relaxed, unconstructed fits that honor your broad frame. Avoid overly stiff or sharp tailoring.'
        : 'As a Soft Natural, embrace flowing silhouettes that accommodate your broad frame while highlighting soft curves.',
      silhouettePrinciple: isMale
        ? 'Relaxed fits with some structure - not boxy, not tight'
        : 'Soft, draped lines that flow over curves without clinging',
      colorAdvice: isMale
        ? ['Earth tones suit your natural energy', 'Deep, muted colors work well', 'Avoid neon or overly bright colors']
        : ['Soft, muted tones complement your features', 'Pastels and earth tones', 'Avoid harsh, stark contrasts'],
      patternAdvice: isMale
        ? ['Simple, unfussy patterns', 'Natural textures over busy prints', 'Subtle plaids or stripes']
        : ['Soft florals or abstract patterns', 'Watercolor-like prints', 'Avoid harsh geometric patterns'],
      fabricAdvice: isMale
        ? ['Natural fibers: cotton, linen, wool', 'Textured fabrics', 'Avoid shiny or stiff materials']
        : ['Soft, flowing fabrics', 'Matte finishes', 'Natural fibers that drape well'],
      clothingRecommendations: [
        {
          category: 'tops',
          recommendations: isMale
            ? [
                'Relaxed fit button-downs in linen or cotton',
                'Henley shirts',
                'Soft sweaters without structure',
                'V-necks that elongate',
              ]
            : [
                'Wrap tops that define waist',
                'Soft blouses with draping',
                'Boat necks to balance shoulders',
                'Flowing tunics',
              ],
          avoid: isMale
            ? ['Very fitted dress shirts', 'Stiff collars', 'Overly formal cuts']
            : ['Boxy, shapeless tops', 'Stiff fabrics', 'Sharp shoulder pads'],
          why: isMale
            ? 'Relaxed fits honor your Natural frame while still looking put-together'
            : 'Soft lines complement your Soft Natural essence',
        },
        {
          category: 'bottoms',
          recommendations: isMale
            ? [
                'Straight or relaxed fit jeans',
                'Chinos with room',
                'Avoid skinny fits',
                'Natural fiber trousers',
              ]
            : [
                'High-waisted styles that define waist',
                'A-line skirts',
                'Flowing wide-leg pants',
                'Soft denim',
              ],
          avoid: isMale
            ? ['Skinny jeans', 'Overly formal pleated trousers', 'Tight fits']
            : ['Stiff pencil skirts', 'Boxy shapes', 'Overly structured pants'],
          why: isMale
            ? 'Room in the leg balances your frame'
            : 'Flowing styles accommodate curves naturally',
        },
        {
          category: 'outerwear',
          recommendations: isMale
            ? [
                'Unstructured blazers',
                'Denim or canvas jackets',
                'Relaxed overcoats',
                'Field jackets',
              ]
            : [
                'Soft blazers without padding',
                'Wrap coats',
                'Waterfall cardigans',
                'Trench coats with soft belt',
              ],
          avoid: isMale
            ? ['Sharp, padded shoulders', 'Stiff suits', 'Overly fitted jackets']
            : ['Heavy, structured shoulders', 'Boxy shapes', 'Sharp tailoring'],
          why: 'Unconstructed pieces align with Natural type principles',
        },
      ],
      accessoryTips: isMale
        ? [
            'Natural materials: leather, wood, canvas',
            'Understated watches with leather bands',
            'Avoid flashy or ornate accessories',
            'Quality over quantity',
          ]
        : [
            'Soft, flowing scarves',
            'Organic-shaped jewelry',
            'Natural materials',
            'Avoid geometric or overly angular pieces',
          ],
      occasionSpecific: {
        casual: isMale
          ? ['Henley + relaxed jeans + leather boots']
          : ['Wrap top + flowing pants + sandals'],
        business: isMale
          ? ['Unstructured blazer + open-collar shirt + chinos']
          : ['Soft blazer + draped blouse + A-line skirt'],
        formal: isMale
          ? ['Textured suit in earth tone + no tie or loosened']
          : ['Flowing maxi dress + soft jewelry'],
      },
    },

    safety: {
      disclaimer:
        'This analysis is for entertainment and self-improvement purposes only. Results are approximate estimates based on photo analysis. Not medical advice. Consult a professional before starting any exercise or nutrition program.',
      tone: 'constructive',
      limitations: [
        'Photo quality affects accuracy',
        'Clothing can obscure true body lines',
        'Results are visual estimates only',
        'Individual results will vary',
      ],
      scoringContext:
        'Scores are calibrated to realistic distribution where 5.5 is average. A score of 7+ indicates genuinely above average (top 30%). Most people fall between 4.5-6.5.',
      ageGated: false,
    },
  };
}

export default {
  getMockBodyAnalysisResult,
};
