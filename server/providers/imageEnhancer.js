/**
 * Image Enhancer
 * Applies real visual enhancements to photos using Sharp
 */

import sharp from 'sharp';

/**
 * Apply visual enhancements to a photo
 * @param {string} base64Image - Base64 encoded image
 * @param {object} options - Enhancement options
 * @returns {Promise<{base64: string, applied: string[]}>}
 */
export async function enhanceImage(base64Image, options = {}) {
  const {
    brightness = 1.05,      // Slight brightness boost
    contrast = 1.08,        // Subtle contrast increase
    saturation = 1.12,      // Color vibrancy boost
    sharpen = true,         // Sharpen details
    warmth = 5,             // Add warmth (shift toward yellow/orange)
    skinSmooth = true,      // Apply subtle smoothing
  } = options;

  const applied = [];
  
  try {
    // Remove data URL prefix if present
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    const inputBuffer = Buffer.from(base64Data, 'base64');
    
    // Get image metadata
    const metadata = await sharp(inputBuffer).metadata();
    
    // Start enhancement pipeline
    let pipeline = sharp(inputBuffer);
    
    // 1. Apply brightness and contrast adjustments
    if (brightness !== 1 || contrast !== 1) {
      pipeline = pipeline.modulate({
        brightness: brightness,
      }).linear(contrast, -(128 * (contrast - 1)));
      applied.push('Enhanced lighting and contrast');
    }
    
    // 2. Boost saturation for more vibrant colors
    if (saturation !== 1) {
      pipeline = pipeline.modulate({
        saturation: saturation,
      });
      applied.push('Improved color vibrancy');
    }
    
    // 3. Add warmth by shifting color temperature
    if (warmth > 0) {
      // Create a subtle warm tint
      pipeline = pipeline.tint({ r: 255, g: 250 - warmth, b: 240 - warmth * 2 });
      applied.push('Added natural warmth');
    }
    
    // 4. Apply sharpening
    if (sharpen) {
      pipeline = pipeline.sharpen({
        sigma: 0.8,
        m1: 0.5,
        m2: 0.3,
      });
      applied.push('Enhanced detail clarity');
    }
    
    // 5. Apply subtle smoothing (simulates skin enhancement)
    if (skinSmooth) {
      // Apply a very subtle blur then sharpen to smooth while keeping edges
      pipeline = pipeline
        .blur(0.3)
        .sharpen({ sigma: 0.5 });
      applied.push('Refined skin texture');
    }
    
    // 6. Normalize to ensure good exposure
    pipeline = pipeline.normalize();
    applied.push('Optimized overall exposure');
    
    // Output as high-quality JPEG
    const outputBuffer = await pipeline
      .jpeg({ quality: 92, mozjpeg: true })
      .toBuffer();
    
    const outputBase64 = outputBuffer.toString('base64');
    
    return {
      base64: outputBase64,
      applied,
      success: true,
    };
    
  } catch (error) {
    console.error('Image enhancement error:', error);
    return {
      base64: base64Image,
      applied: [],
      success: false,
      error: error.message,
    };
  }
}

/**
 * Apply "glow up" enhancements - more aggressive
 */
export async function applyGlowUp(base64Image) {
  return enhanceImage(base64Image, {
    brightness: 1.08,
    contrast: 1.12,
    saturation: 1.18,
    sharpen: true,
    warmth: 8,
    skinSmooth: true,
  });
}

/**
 * Apply subtle professional enhancements
 */
export async function applyProfessional(base64Image) {
  return enhanceImage(base64Image, {
    brightness: 1.03,
    contrast: 1.05,
    saturation: 1.05,
    sharpen: true,
    warmth: 3,
    skinSmooth: true,
  });
}

export default { enhanceImage, applyGlowUp, applyProfessional };
