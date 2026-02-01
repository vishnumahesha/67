// ============================================
// PHOTO QUALITY ANALYZER
// Heuristics for food photo quality assessment
// ============================================

/**
 * Analyze photo quality from base64 image
 * This is a simplified heuristic version - in production would use actual image analysis
 * @param {string} base64Image - Base64 encoded image
 * @returns {Object} { score: number, issues: string[] }
 */
export function analyzePhotoQuality(base64Image) {
  const issues = [];
  let score = 1.0;
  
  // Check image size (base64 length correlates with image quality/size)
  const imageSize = base64Image.length;
  
  if (imageSize < 10000) {
    issues.push('too_small');
    score -= 0.3;
  } else if (imageSize < 50000) {
    // Medium quality, slight penalty
    score -= 0.1;
  }
  
  // Very large images are usually good quality
  if (imageSize > 500000) {
    score += 0.05; // Small bonus
  }
  
  // Check if it looks like a valid JPEG/PNG (basic check)
  if (!base64Image.match(/^\/9j|^iVBOR|^R0lGOD/)) {
    // Doesn't look like standard image header
    issues.push('invalid_format');
    score -= 0.2;
  }
  
  // Ensure score stays in bounds
  score = Math.max(0.3, Math.min(1.0, score));
  
  return {
    score,
    issues,
    sizeBytes: Math.round(imageSize * 0.75), // Approximate decoded size
  };
}

/**
 * Create quality assessment from AI response
 * @param {Object} aiQuality - Quality info from AI
 * @param {Object} heuristicQuality - Our heuristic quality
 * @returns {Object} Combined quality assessment
 */
export function combineQualityAssessments(aiQuality, heuristicQuality) {
  const allIssues = new Set([
    ...(aiQuality?.issues || []),
    ...(heuristicQuality?.issues || [])
  ]);
  
  // Weight AI assessment more heavily if available
  let finalScore;
  if (aiQuality?.score !== undefined) {
    finalScore = aiQuality.score * 0.7 + heuristicQuality.score * 0.3;
  } else {
    finalScore = heuristicQuality.score;
  }
  
  return {
    score: Math.round(finalScore * 100) / 100,
    issues: Array.from(allIssues),
  };
}

/**
 * Get quality message for user
 * @param {Object} quality - Quality assessment
 * @returns {string} User-friendly message
 */
export function getQualityMessage(quality) {
  if (quality.score >= 0.8) {
    return 'Great photo quality!';
  }
  
  if (quality.score >= 0.6) {
    if (quality.issues.includes('partial_view')) {
      return 'Try to capture all food items in the frame.';
    }
    if (quality.issues.includes('too_dark') || quality.issues.includes('shadows')) {
      return 'Better lighting would improve accuracy.';
    }
    return 'Photo quality is acceptable.';
  }
  
  // Low quality
  const messages = [];
  if (quality.issues.includes('too_dark')) messages.push('too dark');
  if (quality.issues.includes('blurry')) messages.push('blurry');
  if (quality.issues.includes('too_small')) messages.push('low resolution');
  if (quality.issues.includes('partial_view')) messages.push('food partially visible');
  
  if (messages.length > 0) {
    return `Photo is ${messages.join(', ')}. Consider retaking for better accuracy.`;
  }
  
  return 'Photo quality is low. Results may be less accurate.';
}

export default {
  analyzePhotoQuality,
  combineQualityAssessments,
  getQualityMessage
};
