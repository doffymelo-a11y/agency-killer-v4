/**
 * Cloudinary Upload Helper
 * Simple helper to upload screenshots and files to Cloudinary
 */

// Cloudinary configuration
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'your-cloud-name';
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'unsigned-preset';

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  bytes: number;
}

/**
 * Upload a file (image/screenshot) to Cloudinary
 * @param file File object from input type="file"
 * @param folder Optional folder in Cloudinary
 * @param maxSize Optional max file size in bytes (default 5MB for screenshots)
 * @returns Cloudinary upload result with secure_url
 */
export async function uploadToCloudinary(
  file: File,
  folder?: string,
  maxSize: number = 5 * 1024 * 1024
): Promise<CloudinaryUploadResult> {
  // Validate file
  if (!file) {
    throw new Error('No file provided');
  }

  // Validate file size
  if (file.size > maxSize) {
    const sizeMB = (maxSize / (1024 * 1024)).toFixed(0);
    throw new Error(`File size exceeds ${sizeMB}MB limit`);
  }

  // Validate file type (images only for image upload)
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed');
  }

  // Prepare form data
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  if (folder) {
    formData.append('folder', folder);
  }

  // Add tags for organization
  formData.append('tags', 'support-ticket,screenshot');

  // Upload to Cloudinary
  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

  try {
    const response = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Upload failed');
    }

    const result = await response.json();

    return {
      secure_url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      width: result.width || 0,
      height: result.height || 0,
      bytes: result.bytes,
    };
  } catch (error: any) {
    console.error('[Cloudinary] Upload error:', error);
    throw new Error(`Failed to upload screenshot: ${error.message}`);
  }
}

/**
 * Upload any file type to Cloudinary (PDFs, documents, etc.)
 * @param file File object from input type="file"
 * @param folder Optional folder in Cloudinary
 * @param maxSize Optional max file size in bytes (default 10MB)
 * @returns Cloudinary upload result with secure_url
 */
export async function uploadFileToCloudinary(
  file: File,
  folder?: string,
  maxSize: number = 10 * 1024 * 1024
): Promise<CloudinaryUploadResult> {
  // Validate file
  if (!file) {
    throw new Error('No file provided');
  }

  // Validate file size
  if (file.size > maxSize) {
    const sizeMB = (maxSize / (1024 * 1024)).toFixed(0);
    throw new Error(`File size exceeds ${sizeMB}MB limit`);
  }

  // Validate file type (allow common document types + images)
  const validTypes = [
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    // Text/Logs
    'text/plain',
    'text/csv',
    'application/json',
    'application/xml',
    'text/xml',
    // Archives (for log bundles)
    'application/zip',
    'application/x-zip-compressed',
  ];

  if (!validTypes.includes(file.type)) {
    throw new Error('Invalid file type. Allowed: images, PDFs, documents, text files, JSON, XML, ZIP');
  }

  // Prepare form data
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

  if (folder) {
    formData.append('folder', folder);
  }

  // Add tags for organization
  formData.append('tags', 'support-ticket,attachment');

  // Determine resource type (image vs raw)
  const resourceType = file.type.startsWith('image/') ? 'image' : 'raw';

  // Upload to Cloudinary
  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;

  try {
    const response = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Upload failed');
    }

    const result = await response.json();

    return {
      secure_url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      width: result.width || 0,
      height: result.height || 0,
      bytes: result.bytes,
    };
  } catch (error: any) {
    console.error('[Cloudinary] File upload error:', error);
    throw new Error(`Failed to upload file: ${error.message}`);
  }
}

/**
 * Upload screenshot from support ticket form
 * @param file Screenshot file
 * @returns Secure URL for the uploaded screenshot
 */
export async function uploadScreenshot(file: File): Promise<string> {
  const result = await uploadToCloudinary(file, 'support-screenshots');
  return result.secure_url;
}

/**
 * Generate Cloudinary transformation URL
 * @param url Original Cloudinary URL
 * @param transformations Cloudinary transformations (e.g., 'w_400,h_300,c_fill')
 * @returns Transformed URL
 */
export function getTransformedUrl(url: string, transformations: string): string {
  if (!url || !url.includes('cloudinary.com')) {
    return url;
  }

  // Insert transformations into URL
  // Example: https://res.cloudinary.com/cloud/image/upload/v123/file.jpg
  // Becomes: https://res.cloudinary.com/cloud/image/upload/w_400,h_300/v123/file.jpg
  const parts = url.split('/upload/');
  if (parts.length !== 2) return url;

  return `${parts[0]}/upload/${transformations}/${parts[1]}`;
}

/**
 * Get thumbnail URL for a screenshot
 * @param url Original screenshot URL
 * @returns Thumbnail URL (400x300)
 */
export function getScreenshotThumbnail(url: string): string {
  return getTransformedUrl(url, 'w_400,h_300,c_fill');
}

/**
 * Format file size for display
 * @param bytes File size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}
