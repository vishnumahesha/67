import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateEnhancementPrompt } from './providers/geminiText.js';
import { generateEnhancedImage } from './providers/imagen.js';
import { saveImage, getUploadsDir } from './providers/storage.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.warn('\n⚠️  WARNING: GEMINI_API_KEY not set!');
  console.warn('   Get your FREE key from: https://aistudio.google.com/apikey');
  console.warn('   Then create a .env file with: GEMINI_API_KEY=your_key\n');
}

const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// Serve uploaded images
app.use('/uploads', express.static(getUploadsDir()));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// THE HONESTY PATCH - enforces realistic, calibrated scoring
// UPDATED: Now includes appearance profile inference and harmony index
const SYSTEM_PROMPT = `You are a facial aesthetics analyzer. You must be HONEST and SPECIFIC without being harsh.
Output STRICT JSON ONLY. No markdown. No extra text. No code blocks.

===== CRITICAL SCORING RULES =====

1. USE REALISTIC DISTRIBUTION:
   - Average should be ~5.5/10
   - Most people (70%) should score 4.5-6.5
   - A 7.0 is ABOVE AVERAGE (top 30%) - not default
   - 8.0+ is RARE (top 15%)
   - 9.0+ is EXCEPTIONAL (top 5%)
   - NEVER give 7.0 to everything - that's score inflation

2. REQUIRE VARIANCE:
   - Different features should have DIFFERENT scores
   - Everyone has strengths (some 6-7s) and weaknesses (some 4-5s)
   - If all scores are within 0.5 of each other, you're doing it wrong
   - Example good distribution: skin 5.2, eyes 6.4, jaw 4.8, nose 5.9

3. PROVIDE EVIDENCE:
   - Every rating needs visible evidence/cues
   - "Good jawline" is NOT evidence
   - "Visible mandibular angle creating shadow, decent definition" IS evidence
   - If you can't see evidence, lower confidence

4. AUTO-INFER APPEARANCE PROFILE (new):
   - Analyze facial features to infer presentation
   - Output: male-presenting, female-presenting, or ambiguous
   - Confidence: 0-1 (how certain you are)
   - Age range estimate: {min, max} only if confidence >= 0.65
   - Dimorphism score: 0-10 (how strongly features align with typical patterns)
   - Masculinity/Femininity: two 0-100 values (can both be moderate for androgynous faces)
   - DO NOT use harsh language - this is informational only
   - If confidence is low, state "uncertain" and don't let it affect scoring heavily

5. COMPUTE HARMONY INDEX (Golden Ratio / Phi):
   - Analyze proportional harmony based on:
     * Facial symmetry (left/right balance)
     * Facial thirds (forehead:nose:chin ratio, ideal ~1:1:1)
     * Horizontal fifths (eye spacing, face divided into 5 equal parts)
     * Golden ratio proximity (1.618 for key ratios)
     * Eye spacing relative to eye width
     * Nose width relative to eye spacing
     * Mouth width relative to nose width
   - Compute deviation from "ideal" proportions
   - Score 0-10 based on harmony (closer to golden proportions = higher)
   - If measurements unreliable due to photo angle, lower confidence

6. COMPUTE POTENTIAL (this is key):
   - currentScore10: how they look NOW in these photos
   - potentialScore10: realistic after HIGH-ROI improvements
   - potentialRange: {min, max} for realistic range
   - Calculate: potentialScore = currentScore + sum(improvement_deltas)
   - Realistic deltas:
     * Hair fix: +0.2 to +0.8
     * Skin improvement: +0.2 to +1.0
     * Under-eye treatment: +0.1 to +0.6
     * Brow grooming: +0.1 to +0.5
     * Body composition (face): +0.2 to +0.8
     * Posture correction: +0.1 to +0.4
   - Cap potential at 10.0
   - ALWAYS identify top 3 levers with specific deltas

7. CONFIDENCE & LIMITATIONS:
   - If side photo missing: chin/nose projection = LOW confidence
   - If selfie angle: symmetry = LOW confidence (state this!)
   - If lighting uneven: cheekbone/jaw = MEDIUM confidence
   - Be transparent about what you can't assess

===== TONE RULES =====
- Neutral and constructive
- NO insults, NO "kind face" cope
- Frame weaknesses as "whatLimitsIt" not "flaws" or "imperfections"
- State facts without sugar-coating
- NEVER use harsh language about appearance profile

===== REQUIRED JSON STRUCTURE =====
{
  "appearanceProfile": {
    "presentation": "male-presenting|female-presenting|ambiguous",
    "confidence": 0.0-1.0,
    "ageRange": {"min": number, "max": number} or null (if confidence < 0.65),
    "ageConfidence": 0.0-1.0 or null,
    "dimorphismScore10": 0-10 (how strongly features align with typical patterns),
    "masculinityFemininity": {
      "masculinity": 0-100,
      "femininity": 0-100
    }
  },
  "photoQuality": {
    "score": 0-100,
    "issues": ["side_missing", "angle_distortion", etc],
    "assessmentLimitations": ["specific limitation 1", "specific limitation 2"]
  },
  "overall": {
    "currentScore10": HONEST_NUMBER (most people 4.5-6.5),
    "potentialScore10": currentScore + deltas (realistic),
    "potentialRange": {"min": number, "max": number},
    "ceilingScore10": null or number (premium only, theoretical max with procedures),
    "confidence": "low|medium|high",
    "summary": "2-3 sentence SPECIFIC summary about THIS person's face",
    "calibrationNote": "explain what the scores mean in context"
  },
  "harmonyIndex": {
    "overall10": 0-10 (based on golden ratio proximity),
    "confidence": "low|medium|high",
    "components": {
      "facialSymmetry": {"score10": number, "confidence": 0-1, "note": ""},
      "facialThirds": {"score10": number, "confidence": 0-1, "note": ""},
      "horizontalFifths": {"score10": number, "confidence": 0-1, "note": ""},
      "goldenRatioProximity": {"score10": number, "confidence": 0-1, "note": ""},
      "eyeSpacing": {"score10": number, "confidence": 0-1, "note": ""},
      "noseToMouthRatio": {"score10": number, "confidence": 0-1, "note": ""},
      "jawToFaceRatio": {"score10": number, "confidence": 0-1, "note": ""}
    },
    "deviationNotes": ["specific deviation 1", "specific deviation 2"]
  },
  "potential": {
    "totalPossibleGain": sum of all deltas,
    "deltas": [
      {
        "lever": "skin|hair|under_eye|brows|body_fat|posture",
        "currentIssue": "what's holding them back (specific)",
        "delta": realistic number (0.1-1.0),
        "potentialGain": "what improves",
        "timeline": "2 weeks|4 weeks|8 weeks|12 weeks",
        "difficulty": "easy|moderate|difficult",
        "steps": ["step1", "step2", "step3"]
      }
    ],
    "top3Levers": [
      { "lever": "name", "delta": number, "timeline": "X weeks", "priority": 1 },
      { "lever": "name", "delta": number, "timeline": "X weeks", "priority": 2 },
      { "lever": "name", "delta": number, "timeline": "X weeks", "priority": 3 }
    ],
    "timelineToFullPotential": "X-Y weeks with consistent effort"
  },
  "features": [
    {
      "key": "skin|eye_area|eyebrows|nose|lips|cheekbones|jawline|chin|neck_posture",
      "label": "Display Name",
      "rating10": HONEST number with variance,
      "confidence": "low|medium|high",
      "evidence": "WHY this rating - specific visible cues",
      "photoLimitations": ["limitation if any"],
      "strengths": ["specific strength 1", "specific strength 2"],
      "holdingBack": ["what's reducing the score"],
      "whyItMatters": "brief note on impact",
      "subFeatures": [
        {"name": "sub", "rating10": number, "note": "observation", "isStrength": bool, "evidence": "why"}
      ],
      "fixes": {
        "quickWins": [{"title": "", "type": "no_cost|low_cost", "difficulty": "easy", "timeline": "immediate|2 weeks", "expectedImpact": "", "steps": []}],
        "shortTerm": [{"title": "", "type": "no_cost|low_cost", "difficulty": "easy|moderate", "timeline": "2-4 weeks", "expectedImpact": "", "steps": []}],
        "mediumTerm": [{"title": "", "type": "no_cost|low_cost", "difficulty": "moderate|difficult", "timeline": "8-12 weeks", "expectedImpact": "", "steps": []}],
        "proOptions": [{"title": "", "type": "procedural", "difficulty": "easy", "timeline": "", "expectedImpact": "", "steps": []}]
      }
    }
  ],
  "harmony": {
    "rating10": number,
    "confidence": "medium",
    "evidence": "why this harmony score",
    "notes": ["specific observation 1", "specific observation 2"],
    "facialThirds": {
      "upper": {"assessment": "", "balance": ""},
      "middle": {"assessment": "", "balance": ""},
      "lower": {"assessment": "", "balance": ""},
      "overallBalance": ""
    }
  },
  "symmetry": {
    "rating10": number,
    "confidence": "low" (selfies distort this!),
    "photoLimitation": "Selfie angle creates 10-15% distortion",
    "evidence": "what you can observe",
    "notes": [],
    "asymmetries": [{"area": "", "description": "", "severity": "minimal|common|noticeable"}]
  },
  "hair": {
    "rating10": number,
    "confidence": "high",
    "evidence": "why this hair score",
    "notes": [],
    "suggestions": []
  },
  "safety": {
    "disclaimer": "Scores reflect aesthetic guidelines, not personal worth. Beauty is subjective.",
    "tone": "neutral",
    "scoringContext": "We use honest calibration: 5.5 is average, most people score 4.5-6.5. A 7+ is notably above average.",
    "appearanceProfileDisclaimer": "Appearance estimates based on this photo; lighting and angle can affect results."
  },
  "tier": {
    "isPremium": boolean,
    "depth": "free|premium"
  }
}

===== APPEARANCE PROFILE SCORING WEIGHTS =====
Based on inferred presentation (confidence >= 0.65), adjust scoring emphasis:
- Male-presenting: emphasize jawline definition, facial width, brow ridge
- Female-presenting: emphasize facial harmony, skin quality, eye area
- Ambiguous/low confidence: use neutral balanced weights

===== TIER DIFFERENCES =====
FREE tier:
- 6 core features: skin, eye_area, nose, lips, cheekbones, jawline
- 1-2 notes per feature
- No subFeatures array
- 3-5 total fixes
- No proOptions
- No ceilingScore10
- Basic harmonyIndex

PREMIUM tier:
- All features including: eyebrows, chin, neck_posture, detailed symmetry
- Full subFeatures arrays (3-5 per category)
- 10+ detailed fixes with timelines
- proOptions with procedural treatments (info only)
- ceilingScore10 with disclaimer
- Facial thirds analysis
- Full asymmetry breakdown
- Detailed harmonyIndex components`;

app.post('/api/face/analyze', async (req, res) => {
  try {
    if (!GEMINI_API_KEY || !genAI) {
      return res.status(503).json({
        error: 'API key not configured',
        message: 'GEMINI_API_KEY not set. Get your FREE key from https://aistudio.google.com/apikey'
      });
    }

    // Gender is now optional - will be auto-inferred
    const { frontImage, sideImage, gender: genderOverride, premiumEnabled } = req.body;

    if (!frontImage) {
      return res.status(400).json({ error: 'Front image is required' });
    }

    const tier = premiumEnabled ? 'premium' : 'free';
    console.log(`Analyzing face - Tier: ${tier}, Side photo: ${!!sideImage}, Gender override: ${genderOverride || 'none'}`);

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const imageParts = [
      {
        inlineData: {
          data: frontImage,
          mimeType: 'image/jpeg',
        },
      },
    ];

    // FACE DETECTION CHECK - Verify image contains a human face before analyzing
    console.log('Checking for face in image...');
    const faceCheckPrompt = `Look at this image and determine if it contains a clear human face that can be analyzed.

Respond with ONLY a JSON object in this exact format:
{
  "hasFace": true or false,
  "reason": "brief explanation"
}

Rules:
- hasFace = true ONLY if there is a clear, visible human face (front-facing preferred)
- hasFace = false if: no face, animal, object, cartoon/drawing, very blurry, face completely obscured
- Be strict - we need a real human face to analyze`;

    const faceCheckResult = await model.generateContent([faceCheckPrompt, imageParts[0]]);
    const faceCheckResponse = await faceCheckResult.response;
    let faceCheckText = faceCheckResponse.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    try {
      const faceCheck = JSON.parse(faceCheckText);
      
      if (!faceCheck.hasFace) {
        console.log('No face detected:', faceCheck.reason);
        return res.status(400).json({
          error: 'No face detected',
          message: `This doesn't appear to be a face. ${faceCheck.reason || 'Please upload a clear photo of a human face.'}`,
          suggestion: 'Please upload a clear, front-facing photo of a human face for analysis.'
        });
      }
      console.log('Face detected, proceeding with analysis...');
    } catch (parseError) {
      // If we can't parse the face check, continue anyway (fail open)
      console.log('Face check parse failed, proceeding with analysis...');
    }

    if (sideImage) {
      imageParts.push({
        inlineData: {
          data: sideImage,
          mimeType: 'image/jpeg',
        },
      });
    }

    // Build the user prompt - gender is now auto-inferred
    const userPrompt = `${SYSTEM_PROMPT}

===== CURRENT ANALYSIS REQUEST =====
Tier: ${tier}
Side photo: ${sideImage ? 'YES - can assess chin projection' : 'NO - mark chin/nose projection as LOW confidence'}
${genderOverride ? `Gender override: ${genderOverride} (use this for scoring weights)` : 'Gender: AUTO-INFER from facial features (output in appearanceProfile)'}

===== IMPORTANT: APPEARANCE PROFILE =====
You MUST infer and output the "appearanceProfile" object:
- Analyze facial features to determine presentation (male-presenting/female-presenting/ambiguous)
- Provide confidence (0-1)
- Estimate age range ONLY if confidence >= 0.65
- Calculate dimorphism score (0-10)
- Calculate masculinity/femininity (both 0-100, can be moderate for androgynous)
- BE RESPECTFUL - this is informational, not judgmental

${tier === 'free' ? `
FREE TIER - Analyze these features only:
- skin, eye_area, nose, lips, cheekbones, jawline
- Plus harmony, symmetry, hair, harmonyIndex (basic)
- 1-2 notes per feature, no subFeatures
- 3-5 total improvement deltas
- No proOptions
` : `
PREMIUM TIER - Full analysis:
- All features: skin, eye_area, eyebrows, nose, lips, cheekbones, jawline, chin, neck_posture
- Full subFeatures breakdown (3-5 per category)
- 8-12 improvement deltas with detailed steps
- Include proOptions (procedural treatments)
- Include ceilingScore10
- Facial thirds analysis
- Full asymmetry details
- Full harmonyIndex with all components
`}

REMEMBER:
1. Be HONEST - most people score 4.5-6.5 overall
2. Create VARIANCE - different features get different scores
3. Provide EVIDENCE - cite specific visible cues
4. Calculate POTENTIAL - show realistic improvement path with deltas
5. Top 3 levers are the most important output - make them actionable
6. AUTO-INFER appearance profile - output in appearanceProfile object
7. Calculate HARMONY INDEX - based on golden ratio and facial proportions

Now analyze the photo and return ONLY the JSON object.`;

    const result = await model.generateContent([userPrompt, ...imageParts]);
    const response = await result.response;
    let text = response.text();

    // Clean up response
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw response:', text.substring(0, 500));
      throw new Error('Failed to parse AI response');
    }

    // POST-PROCESSING: Apply calibration curve to prevent score inflation
    parsedResponse = applyCalibration(parsedResponse);

    // Ensure appearance profile exists with fallback
    if (!parsedResponse.appearanceProfile) {
      parsedResponse.appearanceProfile = {
        presentation: 'ambiguous',
        confidence: 0.3,
        ageRange: null,
        ageConfidence: null,
        dimorphismScore10: 5.0,
        masculinityFemininity: { masculinity: 50, femininity: 50 }
      };
    }

    // Apply gender override if provided
    if (genderOverride) {
      parsedResponse.appearanceProfile.presentation = genderOverride === 'male' ? 'male-presenting' : 'female-presenting';
      parsedResponse.appearanceProfile.confidence = 1.0; // Manual override = full confidence
    }

    // Ensure harmony index exists
    if (!parsedResponse.harmonyIndex) {
      parsedResponse.harmonyIndex = {
        overall10: parsedResponse.harmony?.rating10 || 5.5,
        confidence: 'medium',
        components: {},
        deviationNotes: []
      };
    }

    // Ensure tier info is correct
    parsedResponse.tier = {
      isPremium: premiumEnabled,
      depth: tier
    };

    // Add side_missing if no side photo
    if (!sideImage && parsedResponse.photoQuality) {
      if (!parsedResponse.photoQuality.issues) {
        parsedResponse.photoQuality.issues = [];
      }
      if (!parsedResponse.photoQuality.issues.includes('side_missing')) {
        parsedResponse.photoQuality.issues.push('side_missing');
      }
      if (!parsedResponse.photoQuality.assessmentLimitations) {
        parsedResponse.photoQuality.assessmentLimitations = [];
      }
      parsedResponse.photoQuality.assessmentLimitations.push(
        'Chin projection cannot be accurately assessed without side profile'
      );
    }

    // Log appearance profile inference
    const ap = parsedResponse.appearanceProfile;
    console.log(`Appearance Profile: ${ap.presentation} (conf: ${ap.confidence?.toFixed(2)}), Age: ${ap.ageRange ? `${ap.ageRange.min}-${ap.ageRange.max}` : 'N/A'}`);
    console.log('Analysis complete - Current:', parsedResponse.overall?.currentScore10?.toFixed(1), 
                'Potential:', parsedResponse.overall?.potentialScore10?.toFixed(1),
                'Harmony:', parsedResponse.harmonyIndex?.overall10?.toFixed(1));
    res.json(parsedResponse);
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: error.message
    });
  }
});

// Calibration function to prevent score inflation
function applyCalibration(response) {
  // If the AI gave inflated scores (mean > 6.5), compress them
  const features = response.features || [];
  const scores = features.map(f => f.rating10).filter(s => typeof s === 'number');
  
  if (scores.length > 0) {
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    // If mean is too high (above 6.5), apply compression
    if (mean > 6.5) {
      const compressionFactor = 6.0 / mean; // Target mean of ~6.0
      
      features.forEach(feature => {
        if (typeof feature.rating10 === 'number') {
          // Compress toward 5.5 (true average)
          const delta = feature.rating10 - 5.5;
          feature.rating10 = Math.round((5.5 + delta * compressionFactor) * 10) / 10;
          feature.rating10 = Math.max(1, Math.min(9.5, feature.rating10)); // Cap at 9.5
        }
        
        // Also compress subFeatures if they exist
        if (feature.subFeatures) {
          feature.subFeatures.forEach(sf => {
            if (typeof sf.rating10 === 'number') {
              const delta = sf.rating10 - 5.5;
              sf.rating10 = Math.round((5.5 + delta * compressionFactor) * 10) / 10;
              sf.rating10 = Math.max(1, Math.min(9.5, sf.rating10));
            }
          });
        }
      });
      
      // Also adjust overall scores
      if (response.overall) {
        if (typeof response.overall.currentScore10 === 'number' && response.overall.currentScore10 > 6.5) {
          const delta = response.overall.currentScore10 - 5.5;
          response.overall.currentScore10 = Math.round((5.5 + delta * compressionFactor) * 10) / 10;
        }
        if (typeof response.overall.potentialScore10 === 'number' && response.overall.potentialScore10 > 8.0) {
          response.overall.potentialScore10 = Math.min(8.5, response.overall.potentialScore10);
        }
      }
      
      // Adjust harmony/symmetry/hair
      if (response.harmony && response.harmony.rating10 > 7.0) {
        response.harmony.rating10 = Math.round((5.5 + (response.harmony.rating10 - 5.5) * compressionFactor) * 10) / 10;
      }
      if (response.symmetry && response.symmetry.rating10 > 7.0) {
        response.symmetry.rating10 = Math.round((5.5 + (response.symmetry.rating10 - 5.5) * compressionFactor) * 10) / 10;
      }
      if (response.hair && response.hair.rating10 > 7.0) {
        response.hair.rating10 = Math.round((5.5 + (response.hair.rating10 - 5.5) * compressionFactor) * 10) / 10;
      }
    }
  }
  
  // Ensure variance exists - if all scores are too close together, spread them out
  if (scores.length >= 4) {
    const variance = calculateVariance(scores);
    if (variance < 0.3) { // Too clustered
      console.log('Low variance detected, scores may be too similar');
      // Note: The AI should handle this, but we log it for debugging
    }
  }
  
  return response;
}

function calculateVariance(numbers) {
  const mean = numbers.reduce((a, b) => a + b, 0) / numbers.length;
  const squaredDiffs = numbers.map(n => Math.pow(n - mean, 2));
  return squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length;
}

// ====== BODY ANALYSIS ENDPOINT ======
const BODY_SYSTEM_PROMPT = `You are a body/physique aesthetics analyzer. You must be HONEST and SPECIFIC without being harsh.
Output STRICT JSON ONLY. No markdown. No extra text. No code blocks.

===== CRITICAL SCORING RULES =====

1. USE REALISTIC DISTRIBUTION:
   - Average should be ~5.5/10
   - Most people (70%) should score 4.5-6.5
   - A 7.0 is ABOVE AVERAGE (top 30%) - not default
   - 8.0+ is RARE (top 15%) - requires visible muscle development AND low body fat
   - NEVER give 7.0 to everything - that's score inflation

2. REQUIRE VARIANCE:
   - Different features should have DIFFERENT scores
   - Everyone has strengths (some 6-7s) and weaknesses (some 4-5s)
   - If all scores are within 0.5 of each other, you're doing it wrong

3. BODY FEATURE KEYS TO USE:
   - leanness: Body fat presentation, definition visibility
   - v_taper: Shoulder-to-waist ratio appearance
   - posture: Spine alignment, shoulder position, head carriage
   - upper_body_balance: Chest/back/shoulder development balance
   - lower_body_balance: Quad/hamstring/glute development
   - core_presentation: Midsection appearance, waist definition

4. COMPUTE POTENTIAL (this is key):
   - currentScore10: how they look NOW in these photos
   - potentialScore10: realistic after HIGH-ROI improvements
   - Realistic deltas:
     * Body fat reduction: +0.4 to +1.0
     * Shoulder/lat development: +0.3 to +0.8
     * Posture correction: +0.2 to +0.5
     * Core training: +0.1 to +0.4
   - Cap potential at 10.0

5. NO GENETICS SHAMING:
   - DON'T say "narrow clavicles" or "bad genetics"
   - DO say "Shoulder width appearance can be improved via delt/lat development + posture"
   - Frame things as actionable improvements

===== TONE RULES =====
- Neutral and constructive
- NO insults, NO harsh criticism
- Frame weaknesses as "areas for improvement" not "flaws"
- Focus on what CAN be changed

===== REQUIRED JSON STRUCTURE =====
{
  "tier": { "isPremium": boolean, "depth": "free|premium" },
  "inputs": { "gender": "male|female", "sideProvided": boolean },
  "photoQuality": {
    "score": 0-100,
    "issues": ["too_dark", "not_full_body", "baggy_clothes", "pose_inconsistent", "side_missing", "blurry"]
  },
  "overall": {
    "currentScore10": HONEST number (most people 4.5-6.5),
    "potentialScore10": currentScore + deltas (realistic),
    "confidence": "low|medium|high",
    "summary": "2-3 sentences about THIS person's physique",
    "calibrationNote": "explain scoring context"
  },
  "potential": {
    "totalPossibleGain": sum of deltas,
    "deltas": [
      {
        "lever": "body_fat|shoulders|lats|posture|core",
        "currentIssue": "specific issue",
        "delta": realistic number,
        "potentialGain": "what improves",
        "timeline": "X weeks",
        "difficulty": "easy|moderate|difficult",
        "steps": ["step1", "step2"]
      }
    ],
    "top3Levers": [
      { "lever": "name", "title": "Display Name", "delta": number, "timeline": "X weeks", "priority": 1, "impact": "high|medium|low", "why": "reason" }
    ],
    "timelineToFullPotential": "X-Y weeks"
  },
  "topLevers": [
    { "title": "string", "why": "string", "impact": "high|medium|low", "timeline": "string", "lever": "string", "delta": number }
  ],
  "features": [
    {
      "key": "leanness|v_taper|posture|upper_body_balance|lower_body_balance|core_presentation",
      "label": "Display Name",
      "rating10": number,
      "confidence": "low|medium|high",
      "evidence": "specific visible cues",
      "strengths": ["string"],
      "limitations": ["string"],
      "why": ["assessment notes"],
      "fixes": [
        {
          "title": "string",
          "type": "workout|nutrition|mobility|routine|posture",
          "difficulty": "easy|moderate|difficult",
          "timeToSeeChange": "string",
          "steps": ["string"]
        }
      ]
    }
  ],
  "measurements": {
    "shoulderToWaistRatio": { "value": number, "confidence": "low|medium|high", "note": "string" },
    "posture": {
      "forwardHead": { "value": number, "confidence": "low|medium|high", "note": "string" },
      "roundedShoulders": { "value": number, "confidence": "low|medium|high", "note": "string" }
    }
  },
  "poseOverlay": {
    "normalized": true,
    "keypoints": [{ "name": "string", "x": number, "y": number }],
    "keyLines": [{ "name": "string", "a": { "x": number, "y": number }, "b": { "x": number, "y": number } }],
    "renderHint": "free_keylines_only|full_overlay"
  },
  "planHooks": {
    "workoutFocus": ["delts", "lats", "posture"],
    "nutritionFocus": ["protein", "caloric_deficit"]
  },
  "safety": {
    "disclaimer": "Estimates vary with lighting/angle and clothing. This is guidance, not medical advice.",
    "tone": "neutral"
  }
}`;

app.post('/api/body/analyze', async (req, res) => {
  try {
    if (!GEMINI_API_KEY || !genAI) {
      return res.status(503).json({
        error: 'API key not configured',
        message: 'GEMINI_API_KEY not set. Get your FREE key from https://aistudio.google.com/apikey'
      });
    }

    const { frontImage, sideImage, gender, height, weight, gymAccess, goal, premiumEnabled } = req.body;

    if (!frontImage) {
      return res.status(400).json({ error: 'Front body image is required' });
    }

    const tier = premiumEnabled ? 'premium' : 'free';
    console.log(`Analyzing body - Gender: ${gender}, Tier: ${tier}, Side photo: ${!!sideImage}`);

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const imageParts = [
      {
        inlineData: {
          data: frontImage,
          mimeType: 'image/jpeg',
        },
      },
    ];

    // BODY DETECTION CHECK
    console.log('Checking for body in image...');
    const bodyCheckPrompt = `Look at this image and determine if it contains a human body that can be analyzed for physique/fitness.

Respond with ONLY a JSON object in this exact format:
{
  "hasBody": true or false,
  "isFullBody": true or false,
  "reason": "brief explanation"
}

Rules:
- hasBody = true if there is a visible human body (doesn't need to be full body)
- isFullBody = true if head to at least knees are visible
- hasBody = false if: no person, animal, object only, completely obscured`;

    const bodyCheckResult = await model.generateContent([bodyCheckPrompt, imageParts[0]]);
    const bodyCheckResponse = await bodyCheckResult.response;
    let bodyCheckText = bodyCheckResponse.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    try {
      const bodyCheck = JSON.parse(bodyCheckText);
      
      if (!bodyCheck.hasBody) {
        console.log('No body detected:', bodyCheck.reason);
        return res.status(400).json({
          error: 'No body detected',
          message: `This doesn't appear to show a body. ${bodyCheck.reason || 'Please upload a clear photo showing your body.'}`,
          suggestion: 'Please upload a clear photo showing your body from head to at least knees.'
        });
      }
      console.log('Body detected, proceeding with analysis...');
    } catch (parseError) {
      console.log('Body check parse failed, proceeding with analysis...');
    }

    if (sideImage) {
      imageParts.push({
        inlineData: {
          data: sideImage,
          mimeType: 'image/jpeg',
        },
      });
    }

    const userPrompt = `${BODY_SYSTEM_PROMPT}

===== CURRENT ANALYSIS REQUEST =====
Gender: ${gender}
Tier: ${tier}
Side photo: ${sideImage ? 'YES - can assess posture profile' : 'NO - mark posture as LOW confidence'}
Height: ${height || 'Not provided'}
Weight: ${weight || 'Not provided'}
Gym Access: ${gymAccess || 'Not provided'}
Goal: ${goal || 'Not provided'}

ANALYZE THESE 6 BODY FEATURES:
1. leanness - Body fat presentation
2. v_taper - Shoulder-to-waist ratio
3. posture - Alignment and carriage
4. upper_body_balance - Chest/back/shoulder balance
5. lower_body_balance - Lower body development
6. core_presentation - Midsection appearance

REMEMBER:
1. Be HONEST - most people score 4.5-6.5 overall
2. Create VARIANCE - different features get different scores
3. NO GENETICS SHAMING - focus on what can be improved
4. Top 3 levers should be actionable with realistic timelines

Now analyze the photo and return ONLY the JSON object.`;

    const result = await model.generateContent([userPrompt, ...imageParts]);
    const response = await result.response;
    let text = response.text();

    // Clean up response
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw response:', text.substring(0, 500));
      throw new Error('Failed to parse AI response');
    }

    // Apply calibration
    parsedResponse = applyBodyCalibration(parsedResponse);

    // Ensure tier info is correct
    parsedResponse.tier = {
      isPremium: premiumEnabled,
      depth: tier
    };

    // Add inputs
    parsedResponse.inputs = {
      gender,
      sideProvided: !!sideImage,
      height,
      weight,
      gymAccess,
      goal
    };

    // Add side_missing if no side photo
    if (!sideImage && parsedResponse.photoQuality) {
      if (!parsedResponse.photoQuality.issues) {
        parsedResponse.photoQuality.issues = [];
      }
      if (!parsedResponse.photoQuality.issues.includes('side_missing')) {
        parsedResponse.photoQuality.issues.push('side_missing');
      }
    }

    console.log('Body analysis complete - Current:', parsedResponse.overall?.currentScore10?.toFixed(1), 
                'Potential:', parsedResponse.overall?.potentialScore10?.toFixed(1));
    res.json(parsedResponse);
  } catch (error) {
    console.error('Body analysis error:', error);
    res.status(500).json({
      error: 'Body analysis failed',
      message: error.message
    });
  }
});

// Calibration function for body analysis
function applyBodyCalibration(response) {
  const features = response.features || [];
  const scores = features.map(f => f.rating10).filter(s => typeof s === 'number');
  
  if (scores.length > 0) {
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    if (mean > 6.5) {
      const compressionFactor = 6.0 / mean;
      
      features.forEach(feature => {
        if (typeof feature.rating10 === 'number') {
          const delta = feature.rating10 - 5.5;
          feature.rating10 = Math.round((5.5 + delta * compressionFactor) * 10) / 10;
          feature.rating10 = Math.max(1, Math.min(9.5, feature.rating10));
        }
      });
      
      if (response.overall) {
        if (typeof response.overall.currentScore10 === 'number' && response.overall.currentScore10 > 6.5) {
          const delta = response.overall.currentScore10 - 5.5;
          response.overall.currentScore10 = Math.round((5.5 + delta * compressionFactor) * 10) / 10;
        }
        if (typeof response.overall.potentialScore10 === 'number' && response.overall.potentialScore10 > 8.0) {
          response.overall.potentialScore10 = Math.min(8.5, response.overall.potentialScore10);
        }
      }
    }
  }
  
  return response;
}

// ====== BEST VERSION GENERATOR ENDPOINT ======
app.post('/api/best-version', async (req, res) => {
  try {
    if (!GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'API key not configured',
        message: 'GEMINI_API_KEY not set. Get your FREE key from https://aistudio.google.com/apikey'
      });
    }

    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image is required' });
    }

    console.log('🎨 Best Version Generator - Starting...');

    // Step 1: Generate enhancement prompt using Gemini
    console.log('  → Generating enhancement prompt...');
    const promptResult = await generateEnhancementPrompt(image, GEMINI_API_KEY);
    console.log('  ✓ Enhancement prompt generated');
    console.log('  → Changes:', promptResult.changes);

    // Step 2: Try to generate enhanced image
    console.log('  → Attempting image generation...');
    const imageResult = await generateEnhancedImage(
      image,
      promptResult.imagenPrompt,
      GEMINI_API_KEY
    );

    let resultImageUrl = null;
    let usedProvider = 'fallback';

    if (imageResult.success && imageResult.imageBase64) {
      // Save the generated image
      console.log(`  ✓ Image generated via ${imageResult.provider}`);
      const saved = saveImage(imageResult.imageBase64);
      resultImageUrl = saved.url;
      usedProvider = imageResult.provider;
    } else {
      console.log('  ⚠️ Image generation not available, using fallback mode');
      // In fallback mode, save the original image and return enhancement plan
      const saved = saveImage(image, 'original');
      resultImageUrl = saved.url;
      usedProvider = 'fallback';
    }

    console.log('🎨 Best Version Generator - Complete');

    res.json({
      resultImageUrl,
      changes: promptResult.changes,
      imagenPrompt: promptResult.imagenPrompt,
      debug: {
        usedProvider,
        imageGenerationAvailable: imageResult.success,
        fallbackMode: !imageResult.success,
      }
    });

  } catch (error) {
    console.error('Best Version Generator error:', error);
    res.status(500).json({
      error: 'Generation failed',
      message: error.message
    });
  }
});

// Demo fallback endpoint - always returns mock data
app.post('/api/best-version/demo', async (req, res) => {
  const { image } = req.body;
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Save original as result (demo mode)
  let resultImageUrl = null;
  if (image) {
    const saved = saveImage(image, 'demo');
    resultImageUrl = saved.url;
  }
  
  res.json({
    resultImageUrl,
    changes: [
      'Enhanced skin clarity with improved texture and even tone',
      'Optimized lighting for a more flattering appearance',
      'Refined hair styling for better face framing',
      'Subtle under-eye brightening',
      'Improved overall color balance and warmth'
    ],
    debug: {
      usedProvider: 'demo',
      imageGenerationAvailable: false,
      fallbackMode: true,
    }
  });
});

app.listen(PORT, () => {
  console.log(`\n✨ Aesthetics Analyzer server running on port ${PORT}`);
  console.log(`   Health check: http://localhost:${PORT}/health`);
  console.log(`   Face analysis: POST http://localhost:${PORT}/api/face/analyze`);
  console.log(`   Body analysis: POST http://localhost:${PORT}/api/body/analyze`);
  console.log(`   Best Version: POST http://localhost:${PORT}/api/best-version\n`);
  console.log('📊 Scoring calibration active - honest scores, no inflation');
});
