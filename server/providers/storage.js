/**
 * Storage Provider
 * Handles saving and serving generated images
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_DIR = path.join(__dirname, '..', 'uploads');

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

/**
 * Save a base64 image to the uploads folder
 * @param {string} base64Data - Base64 encoded image data
 * @param {string} prefix - Filename prefix
 * @returns {{filename: string, filepath: string, url: string}}
 */
export function saveImage(base64Data, prefix = 'best-version') {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  const filename = `${prefix}-${timestamp}-${randomId}.jpg`;
  const filepath = path.join(UPLOADS_DIR, filename);
  
  // Remove data URL prefix if present
  const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, '');
  
  // Write file
  fs.writeFileSync(filepath, cleanBase64, 'base64');
  
  return {
    filename,
    filepath,
    url: `/uploads/${filename}`,
  };
}

/**
 * Get the full path to an uploaded file
 * @param {string} filename
 * @returns {string}
 */
export function getFilePath(filename) {
  return path.join(UPLOADS_DIR, filename);
}

/**
 * Check if a file exists
 * @param {string} filename
 * @returns {boolean}
 */
export function fileExists(filename) {
  return fs.existsSync(path.join(UPLOADS_DIR, filename));
}

/**
 * Delete an uploaded file
 * @param {string} filename
 * @returns {boolean}
 */
export function deleteFile(filename) {
  try {
    const filepath = path.join(UPLOADS_DIR, filename);
    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

/**
 * Clean up old files (older than specified hours)
 * @param {number} maxAgeHours
 * @returns {number} Number of files deleted
 */
export function cleanupOldFiles(maxAgeHours = 24) {
  let deletedCount = 0;
  const now = Date.now();
  const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
  
  try {
    const files = fs.readdirSync(UPLOADS_DIR);
    
    for (const file of files) {
      const filepath = path.join(UPLOADS_DIR, file);
      const stats = fs.statSync(filepath);
      
      if (now - stats.mtimeMs > maxAgeMs) {
        fs.unlinkSync(filepath);
        deletedCount++;
      }
    }
  } catch (error) {
    console.error('Error cleaning up files:', error);
  }
  
  return deletedCount;
}

/**
 * Get uploads directory path
 * @returns {string}
 */
export function getUploadsDir() {
  return UPLOADS_DIR;
}

export default {
  saveImage,
  getFilePath,
  fileExists,
  deleteFile,
  cleanupOldFiles,
  getUploadsDir,
};
