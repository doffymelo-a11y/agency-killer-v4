#!/usr/bin/env node

/**
 * MCP Server for Google Veo-3
 * Provides video generation capabilities using Google's Vertex AI Veo API
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
import { Storage } from '@google-cloud/storage';
import * as dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';
import { GoogleAuth } from 'google-auth-library';

// Load environment variables
dotenv.config();

// Google Cloud Configuration
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || '';
const LOCATION = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1';
const ENDPOINT = `${LOCATION}-aiplatform.googleapis.com`;
const CREDENTIALS_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS || '';

// Cloudinary Configuration (CDN for video storage)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

// Initialize Google Cloud clients
const storage = new Storage({
  keyFilename: CREDENTIALS_PATH,
});
const auth = new GoogleAuth({
  keyFilename: CREDENTIALS_PATH,
  scopes: ['https://www.googleapis.com/auth/cloud-platform'],
});

// GCS Bucket for temporary video storage
const BUCKET_NAME = `${PROJECT_ID}-veo-temp`;
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
    name: 'generate_video',
    description: 'Generate a video using Google Veo-3. Supports text-to-video generation with various duration, quality, and style options.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'Text description of the video to generate. Be specific about actions, scenes, camera movements, and style.',
        },
        negative_prompt: {
          type: 'string',
          description: 'Text description of what to avoid in the video (optional)',
        },
        duration_seconds: {
          type: 'number',
          enum: [4, 8],
          description: 'Duration of the video in seconds (4 or 8)',
          default: 4,
        },
        aspect_ratio: {
          type: 'string',
          enum: ['16:9', '9:16', '1:1'],
          description: 'Aspect ratio of the generated video',
          default: '16:9',
        },
        resolution: {
          type: 'string',
          enum: ['720p', '1080p'],
          description: 'Video resolution',
          default: '1080p',
        },
        fps: {
          type: 'number',
          enum: [24, 30, 60],
          description: 'Frames per second',
          default: 30,
        },
        style: {
          type: 'string',
          enum: ['cinematic', 'animation', 'realistic', 'artistic'],
          description: 'Visual style of the video',
          default: 'realistic',
        },
        camera_motion: {
          type: 'string',
          enum: ['static', 'pan', 'zoom', 'tracking', 'dynamic'],
          description: 'Camera movement style',
          default: 'dynamic',
        },
        seed: {
          type: 'number',
          description: 'Random seed for reproducibility (optional)',
        },
      },
      required: ['prompt'],
    },
  },
  {
    name: 'extend_video',
    description: 'Extend an existing video by generating additional frames based on context.',
    inputSchema: {
      type: 'object',
      properties: {
        video_base64: {
          type: 'string',
          description: 'Base64-encoded source video (MP4 format)',
        },
        extend_duration: {
          type: 'number',
          enum: [2, 4, 8],
          description: 'Additional seconds to generate',
          default: 4,
        },
        direction: {
          type: 'string',
          enum: ['forward', 'backward'],
          description: 'Extend forward (after) or backward (before) the video',
          default: 'forward',
        },
        prompt: {
          type: 'string',
          description: 'Optional text guidance for the extension',
        },
      },
      required: ['video_base64'],
    },
  },
  {
    name: 'image_to_video',
    description: 'Generate a video from a static image using Veo-3.',
    inputSchema: {
      type: 'object',
      properties: {
        image_base64: {
          type: 'string',
          description: 'Base64-encoded source image',
        },
        prompt: {
          type: 'string',
          description: 'Text description of the desired motion and scene evolution',
        },
        duration_seconds: {
          type: 'number',
          enum: [4, 8],
          description: 'Duration of the video in seconds',
          default: 4,
        },
        camera_motion: {
          type: 'string',
          enum: ['static', 'pan', 'zoom', 'tracking', 'dynamic'],
          description: 'Camera movement style',
          default: 'dynamic',
        },
      },
      required: ['image_base64', 'prompt'],
    },
  },
  {
    name: 'interpolate_frames',
    description: 'Increase the frame rate of a video through AI-powered frame interpolation.',
    inputSchema: {
      type: 'object',
      properties: {
        video_base64: {
          type: 'string',
          description: 'Base64-encoded source video',
        },
        target_fps: {
          type: 'number',
          enum: [60, 120],
          description: 'Target frames per second',
          default: 60,
        },
      },
      required: ['video_base64'],
    },
  },
  {
    name: 'get_video_params',
    description: 'Get available parameters and limits for Veo-3 video generation.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// ─────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────

/**
 * Ensure GCS bucket exists for VEO video storage
 */
async function ensureBucketExists() {
  try {
    const bucket = storage.bucket(BUCKET_NAME);
    const [exists] = await bucket.exists();

    if (!exists) {
      console.error(`Creating GCS bucket: ${BUCKET_NAME}`);
      await storage.createBucket(BUCKET_NAME, {
        location: LOCATION,
        storageClass: 'STANDARD',
      });
      console.error(`Bucket created: ${BUCKET_NAME}`);
    }
  } catch (error: any) {
    console.error('Failed to ensure bucket exists:', error.message);
    // Continue anyway - bucket might exist but permissions issue
  }
}

async function generateVideo(params: any) {
  const {
    prompt,
    negative_prompt,
    duration_seconds = 4,
    aspect_ratio = '16:9',
    resolution = '1080p',
    fps = 30,
    style = 'realistic',
    camera_motion = 'dynamic',
    seed,
  } = params;

  const model = 'veo-2.0-generate-exp';  // Veo-2 model (Preview)
  const storageUri = `gs://${BUCKET_NAME}/veo-output/${Date.now()}`;

  try {
    // Step 0: Ensure GCS bucket exists
    await ensureBucketExists();

    // Step 1: Get access token
    const client = await auth.getClient();
    const accessToken = await client.getAccessToken();

    if (!accessToken.token) {
      throw new Error('Failed to get access token');
    }

    // Step 2: Launch predictLongRunning operation
    const launchUrl = `https://${ENDPOINT}/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${model}:predictLongRunning`;

    const launchResponse = await axios.post(
      launchUrl,
      {
        instances: [{ prompt }],
        parameters: {
          storageUri,
          sampleCount: 1,
          ...(negative_prompt && { negativePrompt: negative_prompt }),
          ...(aspect_ratio && { aspectRatio: aspect_ratio }),
          ...(seed !== undefined && { seed }),
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken.token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const operationName = launchResponse.data.name;
    console.error('VEO operation launched:', operationName);

    // Step 3: Poll operation status
    const pollUrl = `https://${ENDPOINT}/v1/projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${model}:fetchPredictOperation`;

    let done = false;
    let videoUri = '';
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes max (5s * 60)

    while (!done && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5s between polls
      attempts++;

      const pollResponse = await axios.post(
        pollUrl,
        { operationName },
        {
          headers: {
            'Authorization': `Bearer ${accessToken.token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      done = pollResponse.data.done || false;

      // Debug: Log full response structure when done
      if (done) {
        console.error('VEO operation completed. Full response:', JSON.stringify(pollResponse.data, null, 2));
      }

      if (done && pollResponse.data.response) {
        const predictions = pollResponse.data.response.predictions || [];
        console.error('Predictions:', JSON.stringify(predictions, null, 2));

        if (predictions.length > 0) {
          // Try different paths to find videoUri
          videoUri = predictions[0].videoUri ||
                     predictions[0].video_uri ||
                     (predictions[0].video && predictions[0].video.uri) ||
                     '';

          console.error('Extracted videoUri:', videoUri);
        }
      }

      console.error(`VEO poll attempt ${attempts}/${maxAttempts}, done: ${done}`);
    }

    if (!done) {
      throw new Error('Video generation timeout after 5 minutes');
    }

    if (!videoUri) {
      // Fallback: Try to find video in the storageUri we provided
      console.error('videoUri not found in predictions, checking storageUri folder...');

      const bucket = storage.bucket(BUCKET_NAME);
      const prefix = storageUri.replace(`gs://${BUCKET_NAME}/`, '');

      const [files] = await bucket.getFiles({ prefix });

      console.error(`Found ${files.length} files in ${prefix}`);

      if (files.length === 0) {
        throw new Error('Video URI not found in response and no files in storage');
      }

      // Use the first MP4 file found
      const videoFile = files.find(f => f.name.endsWith('.mp4'));
      if (!videoFile) {
        throw new Error('No MP4 file found in storage');
      }

      videoUri = `gs://${BUCKET_NAME}/${videoFile.name}`;
      console.error('Found video at:', videoUri);
    }

    console.error('Video generated at:', videoUri);

    // Step 4: Download video from GCS
    const bucket = storage.bucket(BUCKET_NAME);
    const fileName = videoUri.replace(`gs://${BUCKET_NAME}/`, '');
    const file = bucket.file(fileName);

    const [videoBuffer] = await file.download();
    const base64Video = videoBuffer.toString('base64');

    // Step 5: Upload to Cloudinary CDN
    const uploadResult = await cloudinary.uploader.upload(
      `data:video/mp4;base64,${base64Video}`,
      {
        folder: 'the-hive/milo-videos',
        public_id: `${Date.now()}`,
        resource_type: 'video',
        overwrite: false,
        transformation: [
          { quality: 'auto:best' },
          { fetch_format: 'auto' },
        ],
      }
    );

    // Step 6: Cleanup GCS file
    try {
      await file.delete();
    } catch (cleanupError) {
      console.error('Failed to cleanup GCS file:', cleanupError);
    }

    return {
      success: true,
      videos: [{
        url: uploadResult.secure_url,
        cloudinary_id: uploadResult.public_id,
        mime_type: 'video/mp4',
        duration: uploadResult.duration || duration_seconds,
        width: uploadResult.width,
        height: uploadResult.height,
        size_bytes: uploadResult.bytes,
        format: uploadResult.format,
        index: 0,
      }],
      metadata: {
        model: 'veo-2.0-generate-exp',
        prompt,
        duration_seconds,
        aspect_ratio,
        resolution,
        fps,
        style,
        storage: 'cloudinary-cdn',
        generation_time_seconds: attempts * 5,
      },
    };
  } catch (error: any) {
    console.error('VEO generation failed:', error);
    return {
      success: false,
      error: error.message || 'Failed to generate video',
      details: error.response?.data || error.details || error,
    };
  }
}

async function extendVideo(params: any) {
  const {
    video_base64,
    extend_duration = 4,
    direction = 'forward',
    prompt,
  } = params;

  const model = 'veo-2.0-generate-exp';
  const endpoint = `projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${model}`;

  const instances = [{
    video: {
      bytesBase64Encoded: video_base64,
    },
    extendDuration: extend_duration,
    direction: direction,
    ...(prompt && { prompt }),
  }];

  try {
    const [response] = await predictionClient.predict({
      endpoint,
      instances,
    } as any);

    const predictions = (response as any).predictions || [];

    return {
      success: true,
      videos: predictions.map((pred: any, idx: number) => ({
        base64: pred.bytesBase64Encoded,
        mime_type: pred.mimeType || 'video/mp4',
        index: idx,
      })),
      metadata: {
        model: 'veo-2.0-generate-exp',
        extend_duration,
        direction,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to extend video',
      details: error.details || error,
    };
  }
}

async function imageToVideo(params: any) {
  const {
    image_base64,
    prompt,
    duration_seconds = 4,
    camera_motion = 'dynamic',
  } = params;

  const model = 'veo-2.0-generate-exp';
  const endpoint = `projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${model}`;

  const instances = [{
    image: {
      bytesBase64Encoded: image_base64,
    },
    prompt: prompt,
    durationSeconds: duration_seconds,
    cameraMotion: camera_motion,
  }];

  try {
    const [response] = await predictionClient.predict({
      endpoint,
      instances,
    } as any);

    const predictions = (response as any).predictions || [];

    return {
      success: true,
      videos: predictions.map((pred: any, idx: number) => ({
        base64: pred.bytesBase64Encoded,
        mime_type: pred.mimeType || 'video/mp4',
        duration: duration_seconds,
        index: idx,
      })),
      metadata: {
        model: 'veo-2.0-generate-exp',
        mode: 'image-to-video',
        prompt,
        duration_seconds,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to generate video from image',
      details: error.details || error,
    };
  }
}

async function interpolateFrames(params: any) {
  const {
    video_base64,
    target_fps = 60,
  } = params;

  const model = 'veo-2.0-generate-exp';
  const endpoint = `projects/${PROJECT_ID}/locations/${LOCATION}/publishers/google/models/${model}`;

  const instances = [{
    video: {
      bytesBase64Encoded: video_base64,
    },
    targetFps: target_fps,
    operation: 'frame_interpolation',
  }];

  try {
    const [response] = await predictionClient.predict({
      endpoint,
      instances,
    } as any);

    const predictions = (response as any).predictions || [];

    return {
      success: true,
      videos: predictions.map((pred: any, idx: number) => ({
        base64: pred.bytesBase64Encoded,
        mime_type: pred.mimeType || 'video/mp4',
        fps: target_fps,
        index: idx,
      })),
      metadata: {
        model: 'veo-2.0-generate-exp',
        operation: 'frame_interpolation',
        target_fps,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to interpolate frames',
      details: error.details || error,
    };
  }
}

function getVideoParams() {
  return {
    success: true,
    parameters: {
      aspect_ratios: ['16:9', '9:16', '1:1'],
      durations: [4, 8],
      resolutions: ['720p', '1080p'],
      fps_options: [24, 30, 60],
      styles: ['cinematic', 'animation', 'realistic', 'artistic'],
      camera_motions: ['static', 'pan', 'zoom', 'tracking', 'dynamic'],
      interpolation_fps: [60, 120],
      extension_durations: [2, 4, 8],
      max_prompt_length: 1024,
      supported_formats: {
        input: ['MP4', 'PNG', 'JPEG'],
        output: ['MP4'],
      },
      model: 'veo-2.0-generate-exp',
      model_name: 'Veo-3',
    },
  };
}

// ─────────────────────────────────────────────────────────────────
// MCP Server Setup
// ─────────────────────────────────────────────────────────────────

const server = new Server(
  {
    name: 'veo3-mcp-server',
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
      case 'generate_video':
        result = await generateVideo(args);
        break;

      case 'extend_video':
        result = await extendVideo(args);
        break;

      case 'image_to_video':
        result = await imageToVideo(args);
        break;

      case 'interpolate_frames':
        result = await interpolateFrames(args);
        break;

      case 'get_video_params':
        result = getVideoParams();
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

  console.error('Veo-3 MCP Server starting...');
  console.error(`Project: ${PROJECT_ID}`);
  console.error(`Location: ${LOCATION}`);
  console.error(`Endpoint: ${ENDPOINT}`);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Veo-3 MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
