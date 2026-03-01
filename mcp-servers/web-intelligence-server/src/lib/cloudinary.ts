/**
 * Cloudinary Upload - CDN storage for screenshots
 * Uploads base64/buffer images to Cloudinary and returns public URLs
 */

import { v2 as cloudinary } from 'cloudinary';
import * as dotenv from 'dotenv';

dotenv.config();

// ─────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '';
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || '';

const CLOUDINARY_ENABLED =
  Boolean(CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET);

if (CLOUDINARY_ENABLED) {
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
  });
}

// ─────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────

export interface UploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

// ─────────────────────────────────────────────────────────────────
// Upload Functions
// ─────────────────────────────────────────────────────────────────

/**
 * Upload a screenshot buffer to Cloudinary
 * Returns the public URL
 */
export async function uploadScreenshot(
  buffer: Buffer,
  options: {
    filename?: string;
    folder?: string;
    tags?: string[];
  } = {}
): Promise<UploadResult> {
  if (!CLOUDINARY_ENABLED) {
    throw new Error(
      'Cloudinary not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.'
    );
  }

  const { filename = 'screenshot', folder = 'hive-os/screenshots', tags = [] } = options;

  try {
    // Convert buffer to base64 data URI
    const base64Image = `data:image/png;base64,${buffer.toString('base64')}`;

    const result = await cloudinary.uploader.upload(base64Image, {
      folder,
      public_id: generatePublicId(filename),
      tags: ['hive-os', 'screenshot', ...tags],
      resource_type: 'image',
      format: 'png',
      overwrite: false,
    });

    return {
      url: result.url,
      secureUrl: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (error: any) {
    throw new Error(`Failed to upload to Cloudinary: ${error.message}`);
  }
}

/**
 * Upload a base64 image string to Cloudinary
 */
export async function uploadBase64Image(
  base64Image: string,
  options: {
    filename?: string;
    folder?: string;
    tags?: string[];
  } = {}
): Promise<UploadResult> {
  if (!CLOUDINARY_ENABLED) {
    throw new Error('Cloudinary not configured');
  }

  const { filename = 'image', folder = 'hive-os/images', tags = [] } = options;

  try {
    // Ensure data URI format
    const dataURI = base64Image.startsWith('data:')
      ? base64Image
      : `data:image/png;base64,${base64Image}`;

    const result = await cloudinary.uploader.upload(dataURI, {
      folder,
      public_id: generatePublicId(filename),
      tags: ['hive-os', ...tags],
      resource_type: 'image',
      overwrite: false,
    });

    return {
      url: result.url,
      secureUrl: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (error: any) {
    throw new Error(`Failed to upload to Cloudinary: ${error.message}`);
  }
}

/**
 * Delete an image from Cloudinary
 */
export async function deleteImage(publicId: string): Promise<void> {
  if (!CLOUDINARY_ENABLED) {
    throw new Error('Cloudinary not configured');
  }

  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error: any) {
    throw new Error(`Failed to delete from Cloudinary: ${error.message}`);
  }
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────

/**
 * Generate a unique public ID for uploads
 */
function generatePublicId(filename: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const sanitized = filename
    .replace(/[^a-zA-Z0-9-_]/g, '-')
    .toLowerCase()
    .substring(0, 50);

  return `${sanitized}-${timestamp}-${random}`;
}

/**
 * Check if Cloudinary is configured
 */
export function isCloudinaryConfigured(): boolean {
  return CLOUDINARY_ENABLED;
}

/**
 * Get Cloudinary configuration status
 */
export function getCloudinaryStatus() {
  return {
    enabled: CLOUDINARY_ENABLED,
    cloudName: CLOUDINARY_CLOUD_NAME || 'Not configured',
    apiKey: CLOUDINARY_API_KEY ? 'Configured' : 'Not configured',
    apiSecret: CLOUDINARY_API_SECRET ? 'Configured' : 'Not configured',
  };
}
