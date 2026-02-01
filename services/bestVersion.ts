/**
 * Best Version API Service
 * Handles communication with the best-version generation endpoint
 */

import * as FileSystem from 'expo-file-system';
import { API_URL } from '@/constants';

export interface BestVersionResponse {
  resultImageUrl: string | null;
  changes: string[];
  imagenPrompt?: string;
  debug: {
    usedProvider: string;
    imageGenerationAvailable: boolean;
    fallbackMode: boolean;
  };
}

/**
 * Convert image URI to base64
 */
async function imageToBase64(uri: string): Promise<string> {
  try {
    if (uri.startsWith('data:image')) {
      return uri.split(',')[1];
    }

    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw new Error('Failed to process image');
  }
}

/**
 * Generate best version of a photo
 */
export async function generateBestVersion(
  imageUri: string,
  useDemo: boolean = false
): Promise<BestVersionResponse> {
  try {
    const imageBase64 = await imageToBase64(imageUri);

    const endpoint = useDemo ? '/api/best-version/demo' : '/api/best-version';

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageBase64,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Best version API error:', response.status, errorText);
      throw new Error(`Server error: ${response.status}`);
    }

    const data = await response.json();

    // Convert relative URL to full URL
    if (data.resultImageUrl && !data.resultImageUrl.startsWith('http')) {
      data.resultImageUrl = `${API_URL}${data.resultImageUrl}`;
    }

    return data;
  } catch (error) {
    console.error('Best version generation error:', error);

    // Return fallback response
    return {
      resultImageUrl: null,
      changes: [
        'Enhanced skin clarity and even tone',
        'Optimized lighting for a flattering look',
        'Refined hair styling',
        'Subtle grooming improvements',
        'Better color balance',
      ],
      debug: {
        usedProvider: 'fallback',
        imageGenerationAvailable: false,
        fallbackMode: true,
      },
    };
  }
}

/**
 * Check if best version service is available
 */
export async function checkBestVersionAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
    });
    return response.ok;
  } catch {
    return false;
  }
}
