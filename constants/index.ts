import { colors } from './theme';

// API configuration
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3002';

// App limits
export const FREE_SCAN_LIMIT = 3;
export const PREMIUM_SCAN_LIMIT = 100;

// Feature keys for iteration
export const FEATURE_KEYS = [
  'skin',
  'eye_area',
  'eyebrows',
  'nose',
  'lips',
  'cheekbones',
  'jawline',
  'chin',
  'neck_posture',
];

// Confidence level styling
export const CONFIDENCE_LABELS = {
  low: {
    label: 'Low Confidence',
    color: colors.warning,
    description: 'Photo quality or angle affects this assessment',
  },
  medium: {
    label: 'Medium Confidence',
    color: colors.secondary,
    description: 'Assessment is reasonable but could vary',
  },
  high: {
    label: 'High Confidence',
    color: colors.success,
    description: 'Clear visibility and good assessment conditions',
  },
} as const;

// Score context - what scores mean
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
} as const;

// Feature metadata with icons and descriptions
export const FEATURE_METADATA: Record<
  string,
  {
    key: string;
    label: string;
    icon: string;
    description: string;
    subFeatures?: string[];
    premiumOnly?: boolean;
    maxDelta?: number;
  }
> = {
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
    maxDelta: 0.2,
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
    maxDelta: 0.6,
  },
  jawline: {
    key: 'jawline',
    label: 'Jawline',
    icon: '💪',
    description: 'Definition and mandibular angle',
    subFeatures: ['Definition', 'Angle', 'Width', 'Symmetry'],
    maxDelta: 0.8,
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
    maxDelta: 0.2,
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
    maxDelta: 0.8,
  },
};

// Improvement lever deltas (min/max realistic gains)
export const IMPROVEMENT_LEVERS = {
  hair: { min: 0.2, max: 0.8, label: 'Hair styling' },
  skin: { min: 0.2, max: 1.0, label: 'Skin care' },
  under_eye: { min: 0.1, max: 0.6, label: 'Under-eye treatment' },
  brows: { min: 0.1, max: 0.5, label: 'Brow grooming' },
  body_fat: { min: 0.2, max: 0.8, label: 'Body composition' },
  posture: { min: 0.1, max: 0.4, label: 'Posture correction' },
  teeth: { min: 0.1, max: 0.6, label: 'Teeth/smile' },
  grooming: { min: 0.1, max: 0.4, label: 'General grooming' },
} as const;

// Photo quality issue descriptions
export const PHOTO_QUALITY_ISSUES = {
  too_dark: {
    icon: '🌙',
    title: 'Lighting too dark',
    description: 'Shadows may hide features',
    impact: 'Skin/contour assessment limited',
  },
  too_bright: {
    icon: '☀️',
    title: 'Overexposed',
    description: 'Too much light washing out details',
    impact: 'Feature definition unclear',
  },
  side_missing: {
    icon: '📷',
    title: 'Side photo missing',
    description: 'Cannot assess profile features',
    impact: 'Chin/nose projection unknown',
  },
  angle_distortion: {
    icon: '📐',
    title: 'Angle distortion',
    description: 'Selfie angle affects proportions',
    impact: 'Symmetry scores less reliable',
  },
  blurry: {
    icon: '🔍',
    title: 'Image blurry',
    description: 'Details not visible',
    impact: 'Texture/fine features unclear',
  },
  heavy_filter: {
    icon: '🎨',
    title: 'Filter detected',
    description: 'Beautification filters affect accuracy',
    impact: 'Skin/feature scores unreliable',
  },
  not_centered: {
    icon: '🎯',
    title: 'Not centered',
    description: 'Face not properly aligned',
    impact: 'Proportions may be skewed',
  },
  low_resolution: {
    icon: '📹',
    title: 'Low resolution',
    description: 'Image quality too low',
    impact: 'Fine details not assessable',
  },
  partial_face: {
    icon: '😶',
    title: 'Partial face',
    description: 'Some features cropped out',
    impact: 'Incomplete assessment',
  },
  multiple_faces: {
    icon: '👥',
    title: 'Multiple faces',
    description: 'More than one face detected',
    impact: 'Cannot determine subject',
  },
  inconsistent_lighting: {
    icon: '💡',
    title: 'Uneven lighting',
    description: 'One side brighter than other',
    impact: 'Symmetry assessment affected',
  },
} as const;

// Photo tips for capture screens
export const PHOTO_TIPS = {
  front: [
    'Face the camera directly',
    'Keep your expression neutral',
    'Ensure even lighting on both sides',
    'Remove glasses if possible',
    'Pull hair back from face',
  ],
  side: [
    'Turn head 90° to the side',
    'Keep chin parallel to ground',
    'Maintain same lighting as front photo',
    'Show full profile from forehead to chin',
  ],
};

// Fix type labels for ActionList
export const FIX_TYPE_LABELS = {
  no_cost: { label: 'Free', color: colors.success },
  low_cost: { label: 'Low Cost', color: colors.warning },
  procedural: { label: 'Professional', color: colors.primary },
} as const;

// Difficulty labels
export const DIFFICULTY_LABELS = {
  easy: { label: 'Easy', color: colors.success },
  moderate: { label: 'Moderate', color: colors.warning },
  difficult: { label: 'Challenging', color: colors.rose },
} as const;

// Impact labels
export const IMPACT_LABELS = {
  low: { label: 'Low Impact', color: colors.textMuted },
  medium: { label: 'Medium Impact', color: colors.warning },
  high: { label: 'High Impact', color: colors.success },
} as const;

// Simple issue messages for PhotoQualityWarnings component
export const QUALITY_ISSUE_MESSAGES: Record<string, string> = {
  too_dark: 'Lighting is too dark - shadows may hide features',
  too_bright: 'Image is overexposed - details washed out',
  side_missing: 'Side photo missing - chin/nose projection cannot be assessed',
  angle_distortion: 'Selfie angle detected - symmetry scores less reliable',
  blurry: 'Image is blurry - fine details not visible',
  heavy_filter: 'Beauty filter detected - scores may be unreliable',
  not_centered: 'Face not centered - proportions may be skewed',
  low_resolution: 'Low resolution - fine details not assessable',
  partial_face: 'Part of face cropped - incomplete assessment',
  multiple_faces: 'Multiple faces detected - cannot determine subject',
  inconsistent_lighting: 'Uneven lighting - symmetry assessment affected',
  no_face_detected: 'No face detected in image',
};

// Asymmetry severity labels
export const ASYMMETRY_LABELS = {
  minimal: {
    label: 'Minimal',
    note: 'Barely noticeable, within normal range',
  },
  common: {
    label: 'Common',
    note: 'Normal variation seen in most people',
  },
  noticeable: {
    label: 'Noticeable',
    note: 'More visible but still within normal range',
  },
} as const;

export * from './theme';
