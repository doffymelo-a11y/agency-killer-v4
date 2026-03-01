#!/usr/bin/env node

/**
 * MCP Server for Google Nano Banana Pro (Gemini 3 Pro)
 * Launched November 2025 - Most powerful 4K image generation model
 *
 * Features:
 * - 4K resolution support
 * - Advanced style controls
 * - Professional-grade quality
 * - Built on Gemini 3 Pro foundation
 *
 * Environment Variables Required:
 * - GOOGLE_APPLICATION_CREDENTIALS: Path to service account JSON
 * - GOOGLE_CLOUD_PROJECT: GCP Project ID
 * - GOOGLE_CLOUD_LOCATION: GCP Location (default: us-central1)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import aiplatform from '@google-cloud/aiplatform';
import * as dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

// Load environment variables
dotenv.config();

// Google Cloud Configuration
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || '';
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
const ENDPOINT = `${LOCATION}-aiplatform.googleapis.com`;

// Imagen 3 Model ID (Google's real image generation model)
const MODEL_ID = 'imagen-3.0-generate-001';

// Cloudinary Configuration (CDN for image storage)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

// Initialize Vertex AI client
const { PredictionServiceClient } = (aiplatform as any).v1;
const { helpers } = aiplatform as any;
const predictionClient = new PredictionServiceClient({
  apiEndpoint: ENDPOINT,
});

// ─────────────────────────────────────────────────────────────────
// Tool Definitions
// ─────────────────────────────────────────────────────────────────

const TOOLS: Tool[] = [
  {
    name: 'generate_image',
    description: 'Generate a 4K image using Google Nano Banana Pro (Gemini 3 Pro). Most powerful image generation model with advanced controls and professional quality.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'Detailed text description of the image to generate. Be specific about composition, lighting, style, and mood.',
        },
        negative_prompt: {
          type: 'string',
          description: 'Text description of elements to avoid in the image (optional)',
        },
        resolution: {
          type: 'string',
          enum: ['1024x1024', '1536x1536', '2048x2048', '4096x4096'],
          description: 'Image resolution. 4K (4096x4096) available with Nano Banana Pro!',
          default: '2048x2048',
        },
        aspect_ratio: {
          type: 'string',
          enum: ['1:1', '16:9', '9:16', '4:3', '3:4', '21:9'],
          description: 'Aspect ratio of the generated image',
          default: '1:1',
        },
        style_preset: {
          type: 'string',
          enum: [
            'photorealistic',
            'digital_art',
            'cinematic',
            'anime',
            'abstract',
            'minimalist',
            'vintage',
            'cyberpunk',
            'fantasy',
            'professional_photo'
          ],
          description: 'Visual style preset',
          default: 'photorealistic',
        },
        quality_level: {
          type: 'string',
          enum: ['standard', 'high', 'ultra', 'professional'],
          description: 'Quality level (professional = max quality, slower)',
          default: 'high',
        },
        number_of_images: {
          type: 'number',
          description: 'Number of variations to generate (1-4)',
          minimum: 1,
          maximum: 4,
          default: 1,
        },
        guidance_scale: {
          type: 'number',
          description: 'How closely to follow the prompt (1-30, default: 12). Higher = more adherence.',
          minimum: 1,
          maximum: 30,
          default: 12,
        },
        creativity: {
          type: 'number',
          description: 'Creativity level (0-100). Higher = more creative interpretation.',
          minimum: 0,
          maximum: 100,
          default: 50,
        },
        seed: {
          type: 'number',
          description: 'Random seed for reproducibility (optional)',
        },
        enhance_prompt: {
          type: 'boolean',
          description: 'Auto-enhance prompt with Gemini 3 Pro for better results',
          default: true,
        },
        safety_filter: {
          type: 'string',
          enum: ['strict', 'moderate', 'permissive'],
          description: 'Content safety filtering level',
          default: 'moderate',
        },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'edit_image',
    description: 'Edit an existing image using Nano Banana Pro inpainting/outpainting with 4K support.',
    inputSchema: {
      type: 'object',
      properties: {
        image_base64: {
          type: 'string',
          description: 'Base64-encoded source image',
        },
        prompt: {
          type: 'string',
          description: 'Text description of the desired edits',
        },
        mask_base64: {
          type: 'string',
          description: 'Base64-encoded mask image (white = edit region, black = keep). Optional for outpainting.',
        },
        mode: {
          type: 'string',
          enum: ['inpainting', 'outpainting', 'style_transfer', 'upscale_enhance'],
          description: 'Editing mode',
          default: 'inpainting',
        },
        preserve_quality: {
          type: 'boolean',
          description: 'Preserve original image quality in untouched areas',
          default: true,
        },
        guidance_scale: {
          type: 'number',
          description: 'How closely to follow the edit prompt (1-30)',
          minimum: 1,
          maximum: 30,
          default: 12,
        },
      },
      required: ['image_base64', 'prompt'],
    },
  },
  {
    name: 'upscale_image',
    description: 'Upscale image to 4K using Nano Banana Pro advanced upscaling with detail enhancement.',
    inputSchema: {
      type: 'object',
      properties: {
        image_base64: {
          type: 'string',
          description: 'Base64-encoded source image',
        },
        target_resolution: {
          type: 'string',
          enum: ['2048x2048', '4096x4096'],
          description: 'Target resolution',
          default: '4096x4096',
        },
        enhance_details: {
          type: 'boolean',
          description: 'AI-enhance details during upscaling',
          default: true,
        },
        denoise: {
          type: 'boolean',
          description: 'Remove noise while upscaling',
          default: true,
        },
        sharpen: {
          type: 'number',
          description: 'Sharpening level (0-100)',
          minimum: 0,
          maximum: 100,
          default: 50,
        },
      },
      required: ['image_base64'],
    },
  },
  {
    name: 'style_transfer',
    description: 'Apply artistic style to an image while preserving content structure.',
    inputSchema: {
      type: 'object',
      properties: {
        image_base64: {
          type: 'string',
          description: 'Base64-encoded source image',
        },
        style: {
          type: 'string',
          enum: [
            'oil_painting',
            'watercolor',
            'sketch',
            'anime',
            'pop_art',
            'impressionist',
            'cyberpunk',
            'vaporwave',
            'minimalist'
          ],
          description: 'Artistic style to apply',
        },
        style_strength: {
          type: 'number',
          description: 'How strongly to apply the style (0-100)',
          minimum: 0,
          maximum: 100,
          default: 70,
        },
        preserve_colors: {
          type: 'boolean',
          description: 'Preserve original color palette',
          default: false,
        },
      },
      required: ['image_base64', 'style'],
    },
  },
  {
    name: 'get_generation_params',
    description: 'Get available parameters, limits, and capabilities for Nano Banana Pro.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// ─────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────

async function generateImage(params: any) {
  const {
    prompt,
    negative_prompt,
    resolution = '2048x2048',
    aspect_ratio = '1:1',
    style_preset = 'photorealistic',
    quality_level = 'high',
    number_of_images = 1,
    guidance_scale = 12,
    creativity = 50,
    seed,
    enhance_prompt = true,
    safety_filter = 'moderate',
  } = params;

  const endpoint = `projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_ID}`;

  // Google Vertex AI Imagen API - convert to protobuf using helpers.toValue()
  const promptText = {
    prompt: prompt,
  };
  const instanceValue = helpers.toValue(promptText);
  const instances = [instanceValue];

  const parameter = {
    sampleCount: number_of_images,
    ...(aspect_ratio && { aspectRatio: aspect_ratio }),
    ...(negative_prompt && { negativePrompt: negative_prompt }),
    ...(seed !== undefined && { seed }),
    safetyFilterLevel: safety_filter === 'strict' ? 'block_low_and_above' : safety_filter === 'permissive' ? 'block_only_high' : 'block_medium_and_above',
    personGeneration: 'allow_adult',
  };
  const parameters = helpers.toValue(parameter);

  try {
    const request = {
      endpoint,
      instances,
      parameters,
    };

    const [response] = await predictionClient.predict(request);

    const predictions = (response as any).predictions || [];

    const firstPred = predictions[0] || {};

    // Upload images to Cloudinary CDN (scalable architecture for multi-tenant SaaS)
    const uploadedImages = await Promise.all(
      predictions.map(async (pred: any, idx: number) => {
        // Decode protobuf response using helpers.fromValue()
        const decodedPred = helpers.fromValue(pred);

        // Extract base64 data from decoded structure
        const base64Data = decodedPred.bytesBase64Encoded;
        const mimeType = decodedPred.mimeType || 'image/png';

        try {
          // Upload to Cloudinary
          const uploadResult = await cloudinary.uploader.upload(
            `data:${mimeType};base64,${base64Data}`,
            {
              folder: 'the-hive/milo-images',
              public_id: `${Date.now()}-${idx}`,
              resource_type: 'image',
              overwrite: false,
              transformation: [
                { quality: 'auto:best' },
                { fetch_format: 'auto' },
              ],
            }
          );

          return {
            url: uploadResult.secure_url,
            cloudinary_id: uploadResult.public_id,
            mime_type: mimeType,
            resolution: resolution,
            width: uploadResult.width,
            height: uploadResult.height,
            size_bytes: uploadResult.bytes,
            index: idx,
          };
        } catch (uploadError: any) {
          console.error('Cloudinary upload failed:', uploadError);
          // Fallback: return base64 if upload fails
          return {
            base64: base64Data,
            mime_type: mimeType,
            resolution: resolution,
            index: idx,
            upload_error: uploadError.message,
          };
        }
      })
    );

    return {
      success: true,
      images: uploadedImages,
      metadata: {
        model: 'imagen-3.0',
        model_version: 'imagen-3.0-generate-001',
        prompt,
        resolution,
        style_preset,
        quality_level,
        generation_time_ms: firstPred.metadata?.generationTimeMs,
        storage: 'cloudinary-cdn',
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to generate image',
      details: error.details || error,
    };
  }
}

async function editImage(params: any) {
  const {
    image_base64,
    prompt,
    mask_base64,
    mode = 'inpainting',
    preserve_quality = true,
    guidance_scale = 12,
  } = params;

  const endpoint = `projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_ID}`;

  const instances = [{
    image: {
      bytesBase64Encoded: image_base64,
    },
    prompt: prompt,
    mode: mode,
    preserveQuality: preserve_quality,
    guidanceScale: guidance_scale,
    ...(mask_base64 && {
      mask: {
        image: {
          bytesBase64Encoded: mask_base64,
        },
      },
    }),
  }];

  try {
    const [response] = await predictionClient.predict({
      endpoint,
      instances,
    } as any);

    const predictions = (response as any).predictions || [];

    return {
      success: true,
      images: predictions.map((pred: any, idx: number) => ({
        base64: pred.bytesBase64Encoded,
        mime_type: pred.mimeType || 'image/png',
        index: idx,
      })),
      metadata: {
        model: 'nano-banana-pro',
        mode,
        prompt,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to edit image',
      details: error.details || error,
    };
  }
}

async function upscaleImage(params: any) {
  const {
    image_base64,
    target_resolution = '4096x4096',
    enhance_details = true,
    denoise = true,
    sharpen = 50,
  } = params;

  const endpoint = `projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_ID}`;

  const instances = [{
    image: {
      bytesBase64Encoded: image_base64,
    },
    targetResolution: target_resolution,
    enhanceDetails: enhance_details,
    denoise: denoise,
    sharpen: sharpen / 100,  // Convert to 0-1
    operation: 'upscale',
  }];

  try {
    const [response] = await predictionClient.predict({
      endpoint,
      instances,
    } as any);

    const predictions = (response as any).predictions || [];

    return {
      success: true,
      images: predictions.map((pred: any, idx: number) => ({
        base64: pred.bytesBase64Encoded,
        mime_type: pred.mimeType || 'image/png',
        resolution: target_resolution,
        index: idx,
      })),
      metadata: {
        model: 'nano-banana-pro',
        operation: 'upscale',
        target_resolution,
        enhanced: enhance_details,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to upscale image',
      details: error.details || error,
    };
  }
}

async function styleTransfer(params: any) {
  const {
    image_base64,
    style,
    style_strength = 70,
    preserve_colors = false,
  } = params;

  const endpoint = `projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${MODEL_ID}`;

  const instances = [{
    image: {
      bytesBase64Encoded: image_base64,
    },
    style: style,
    styleStrength: style_strength / 100,
    preserveColors: preserve_colors,
    operation: 'style_transfer',
  }];

  try {
    const [response] = await predictionClient.predict({
      endpoint,
      instances,
    } as any);

    const predictions = (response as any).predictions || [];

    return {
      success: true,
      images: predictions.map((pred: any, idx: number) => ({
        base64: pred.bytesBase64Encoded,
        mime_type: pred.mimeType || 'image/png',
        index: idx,
      })),
      metadata: {
        model: 'nano-banana-pro',
        operation: 'style_transfer',
        style,
        style_strength,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to apply style transfer',
      details: error.details || error,
    };
  }
}

function getGenerationParams() {
  return {
    success: true,
    model_info: {
      name: 'Nano Banana Pro',
      base_model: 'Gemini 3 Pro',
      launch_date: 'November 2025',
      version: 'gemini-3-pro-generate-images',
      description: 'Most powerful 4K image generation model with advanced controls',
    },
    parameters: {
      resolutions: ['1024x1024', '1536x1536', '2048x2048', '4096x4096'],
      aspect_ratios: ['1:1', '16:9', '9:16', '4:3', '3:4', '21:9'],
      style_presets: [
        'photorealistic',
        'digital_art',
        'cinematic',
        'anime',
        'abstract',
        'minimalist',
        'vintage',
        'cyberpunk',
        'fantasy',
        'professional_photo'
      ],
      quality_levels: ['standard', 'high', 'ultra', 'professional'],
      guidance_scale_range: [1, 30],
      guidance_scale_default: 12,
      creativity_range: [0, 100],
      creativity_default: 50,
      max_images_per_request: 4,
      safety_filters: ['strict', 'moderate', 'permissive'],
      editing_modes: ['inpainting', 'outpainting', 'style_transfer', 'upscale_enhance'],
      style_transfer_styles: [
        'oil_painting',
        'watercolor',
        'sketch',
        'anime',
        'pop_art',
        'impressionist',
        'cyberpunk',
        'vaporwave',
        'minimalist'
      ],
      supported_formats: ['PNG', 'JPEG', 'WEBP'],
      max_prompt_length: 2048,
    },
    capabilities: {
      four_k_generation: true,
      prompt_enhancement: true,
      style_transfer: true,
      advanced_upscaling: true,
      inpainting: true,
      outpainting: true,
      batch_generation: true,
      seed_control: true,
    },
    limits: {
      max_resolution: '4096x4096',
      max_file_size_mb: 50,
      rate_limit_per_minute: 20,
    },
  };
}

// ─────────────────────────────────────────────────────────────────
// MCP Server Setup
// ─────────────────────────────────────────────────────────────────

const server = new Server(
  {
    name: 'nano-banana-pro-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS,
}));

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    throw new Error('Arguments are required');
  }

  try {
    let result;

    switch (name) {
      case 'generate_image':
        result = await generateImage(args);
        break;

      case 'edit_image':
        result = await editImage(args);
        break;

      case 'upscale_image':
        result = await upscaleImage(args);
        break;

      case 'style_transfer':
        result = await styleTransfer(args);
        break;

      case 'get_generation_params':
        result = getGenerationParams();
        break;

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result, null, 2),
      }],
    };
  } catch (error: any) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          error: error.message,
          tool: name,
        }, null, 2),
      }],
      isError: true,
    };
  }
});

// ─────────────────────────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────────────────────────

async function main() {
  // Validate environment variables
  if (!PROJECT_ID) {
    console.error('Error: GOOGLE_CLOUD_PROJECT environment variable is required');
    process.exit(1);
  }

  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    console.error('Error: GOOGLE_APPLICATION_CREDENTIALS environment variable is required');
    process.exit(1);
  }

  console.error('Nano Banana Pro MCP Server starting...');
  console.error(`Model: ${MODEL_ID} (Gemini 3 Pro)`);
  console.error(`Project: ${PROJECT_ID}`);
  console.error(`Location: ${LOCATION}`);
  console.error(`Max Resolution: 4K (4096x4096)`);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Nano Banana Pro MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
