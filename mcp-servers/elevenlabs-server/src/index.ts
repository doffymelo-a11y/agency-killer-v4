#!/usr/bin/env node

/**
 * MCP Server for ElevenLabs
 * Provides text-to-speech, voice cloning, and sound effects generation
 *
 * Environment Variables Required:
 * - ELEVENLABS_API_KEY: ElevenLabs API key
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import * as dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

// Load environment variables
dotenv.config();

// ElevenLabs API Configuration
const API_KEY = process.env.ELEVENLABS_API_KEY || '';
const BASE_URL = 'https://api.elevenlabs.io/v1';

// Cloudinary Configuration (CDN for audio storage)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || '',
  api_key: process.env.CLOUDINARY_API_KEY || '',
  api_secret: process.env.CLOUDINARY_API_SECRET || '',
});

// ─────────────────────────────────────────────────────────────────
// Tool Definitions
// ─────────────────────────────────────────────────────────────────

const TOOLS: Tool[] = [
  {
    name: 'text_to_speech',
    description: 'Convert text to speech using ElevenLabs. Supports multiple voices, languages, and quality settings.',
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'Text to convert to speech',
        },
        voice_id: {
          type: 'string',
          description: 'Voice ID to use (use list_voices to get available voices). Default: Rachel',
          default: '21m00Tcm4TlvDq8ikWAM',
        },
        model_id: {
          type: 'string',
          enum: ['eleven_monolingual_v1', 'eleven_multilingual_v2', 'eleven_turbo_v2'],
          description: 'TTS model to use',
          default: 'eleven_multilingual_v2',
        },
        stability: {
          type: 'number',
          description: 'Voice stability (0-1, default: 0.5)',
          minimum: 0,
          maximum: 1,
          default: 0.5,
        },
        similarity_boost: {
          type: 'number',
          description: 'Voice similarity boost (0-1, default: 0.75)',
          minimum: 0,
          maximum: 1,
          default: 0.75,
        },
        style: {
          type: 'number',
          description: 'Style exaggeration (0-1, default: 0)',
          minimum: 0,
          maximum: 1,
          default: 0,
        },
        use_speaker_boost: {
          type: 'boolean',
          description: 'Use speaker boost for clarity',
          default: true,
        },
      },
      required: ['text'],
    },
  },
  {
    name: 'list_voices',
    description: 'Get a list of available voices from ElevenLabs.',
    inputSchema: {
      type: 'object',
      properties: {
        show_legacy: {
          type: 'boolean',
          description: 'Include legacy voices',
          default: false,
        },
      },
    },
  },
  {
    name: 'clone_voice',
    description: 'Clone a voice from audio samples.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name for the cloned voice',
        },
        description: {
          type: 'string',
          description: 'Description of the voice',
        },
        files_base64: {
          type: 'array',
          description: 'Array of base64-encoded audio files (MP3 or WAV, min 1, max 25)',
          items: {
            type: 'string',
          },
          minItems: 1,
          maxItems: 25,
        },
        labels: {
          type: 'object',
          description: 'Optional labels for categorization',
          additionalProperties: {
            type: 'string',
          },
        },
      },
      required: ['name', 'files_base64'],
    },
  },
  {
    name: 'sound_effects',
    description: 'Generate sound effects from text description using ElevenLabs Sound Effects.',
    inputSchema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'Description of the sound effect to generate (e.g., "dog barking", "door creaking")',
        },
        duration_seconds: {
          type: 'number',
          description: 'Duration in seconds (0.5-22)',
          minimum: 0.5,
          maximum: 22,
          default: 3,
        },
        prompt_influence: {
          type: 'number',
          description: 'How closely to follow the text (0-1, default: 0.3)',
          minimum: 0,
          maximum: 1,
          default: 0.3,
        },
      },
      required: ['text'],
    },
  },
  {
    name: 'get_voice_params',
    description: 'Get available parameters and settings for ElevenLabs TTS.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
];

// ─────────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────────

async function textToSpeech(params: any) {
  const {
    text,
    voice_id = '21m00Tcm4TlvDq8ikWAM',  // Rachel
    model_id = 'eleven_multilingual_v2',
    stability = 0.5,
    similarity_boost = 0.75,
    style = 0,
    use_speaker_boost = true,
  } = params;

  const url = `${BASE_URL}/text-to-speech/${voice_id}`;

  const body = {
    text,
    model_id,
    voice_settings: {
      stability,
      similarity_boost,
      style,
      use_speaker_boost,
    },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': API_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail?.message || 'TTS request failed');
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    // Upload to Cloudinary CDN (scalable architecture for multi-tenant SaaS)
    try {
      const uploadResult = await cloudinary.uploader.upload(
        `data:audio/mpeg;base64,${base64Audio}`,
        {
          folder: 'the-hive/milo-audio',
          public_id: `${Date.now()}`,
          resource_type: 'video', // Cloudinary uses 'video' for audio files
          overwrite: false,
        }
      );

      return {
        success: true,
        audio: {
          url: uploadResult.secure_url,
          cloudinary_id: uploadResult.public_id,
          mime_type: 'audio/mpeg',
          format: uploadResult.format || 'mp3',
          size_bytes: uploadResult.bytes,
          duration: uploadResult.duration,
        },
        metadata: {
          voice_id,
          model_id,
          text_length: text.length,
          voice_settings: {
            stability,
            similarity_boost,
            style,
            use_speaker_boost,
          },
          storage: 'cloudinary-cdn',
        },
      };
    } catch (uploadError: any) {
      console.error('Cloudinary upload failed:', uploadError);
      // Fallback: return base64 if upload fails
      return {
        success: true,
        audio: {
          base64: base64Audio,
          mime_type: 'audio/mpeg',
          format: 'mp3',
          upload_error: uploadError.message,
        },
        metadata: {
          voice_id,
          model_id,
          text_length: text.length,
          voice_settings: {
            stability,
            similarity_boost,
            style,
            use_speaker_boost,
          },
        },
      };
    }
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to generate speech',
    };
  }
}

async function listVoices(params: any) {
  const { show_legacy = false } = params;

  const url = `${BASE_URL}/voices`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'xi-api-key': API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch voices');
    }

    const data: any = await response.json();
    const voices = data.voices || [];

    const filteredVoices = show_legacy
      ? voices
      : voices.filter((v: any) => !v.category || v.category !== 'legacy');

    return {
      success: true,
      voices: filteredVoices.map((voice: any) => ({
        voice_id: voice.voice_id,
        name: voice.name,
        category: voice.category,
        description: voice.description,
        labels: voice.labels,
        preview_url: voice.preview_url,
        available_for_tiers: voice.available_for_tiers,
        settings: voice.settings,
      })),
      total_count: filteredVoices.length,
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to list voices',
    };
  }
}

async function cloneVoice(params: any) {
  const {
    name,
    description,
    files_base64,
    labels,
  } = params;

  const url = `${BASE_URL}/voices/add`;

  try {
    // Create FormData for multipart upload
    const formData = new FormData();
    formData.append('name', name);
    if (description) formData.append('description', description);
    if (labels) formData.append('labels', JSON.stringify(labels));

    // Convert base64 files to blobs and append
    files_base64.forEach((fileBase64: string, idx: number) => {
      const buffer = Buffer.from(fileBase64, 'base64');
      const blob = new Blob([buffer]);
      formData.append('files', blob, `sample_${idx}.mp3`);
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail?.message || 'Voice cloning failed');
    }

    const data: any = await response.json();

    return {
      success: true,
      voice: {
        voice_id: data.voice_id,
        name: data.name,
        description: data.description,
      },
      message: 'Voice cloned successfully',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to clone voice',
    };
  }
}

async function soundEffects(params: any) {
  const {
    text,
    duration_seconds = 3,
    prompt_influence = 0.3,
  } = params;

  const url = `${BASE_URL}/sound-generation`;

  const body = {
    text,
    duration_seconds,
    prompt_influence,
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': API_KEY,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail?.message || 'Sound generation failed');
    }

    const audioBuffer = await response.arrayBuffer();
    const base64Audio = Buffer.from(audioBuffer).toString('base64');

    return {
      success: true,
      audio: {
        base64: base64Audio,
        mime_type: 'audio/mpeg',
        format: 'mp3',
        duration: duration_seconds,
      },
      metadata: {
        text,
        duration_seconds,
        prompt_influence,
      },
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Failed to generate sound effect',
    };
  }
}

function getVoiceParams() {
  return {
    success: true,
    parameters: {
      models: [
        {
          id: 'eleven_monolingual_v1',
          name: 'Eleven Monolingual v1',
          languages: ['English'],
          description: 'High quality English-only model',
        },
        {
          id: 'eleven_multilingual_v2',
          name: 'Eleven Multilingual v2',
          languages: ['29 languages'],
          description: 'Multilingual model with wide language support',
        },
        {
          id: 'eleven_turbo_v2',
          name: 'Eleven Turbo v2',
          languages: ['29 languages'],
          description: 'Fast, low-latency model',
        },
      ],
      voice_settings: {
        stability: {
          range: [0, 1],
          default: 0.5,
          description: 'Higher values = more consistent, lower = more variable',
        },
        similarity_boost: {
          range: [0, 1],
          default: 0.75,
          description: 'Higher values = closer to original voice',
        },
        style: {
          range: [0, 1],
          default: 0,
          description: 'Style exaggeration (0 = neutral)',
        },
        use_speaker_boost: {
          type: 'boolean',
          default: true,
          description: 'Boost clarity and quality',
        },
      },
      sound_effects: {
        duration_range: [0.5, 22],
        prompt_influence_range: [0, 1],
        default_duration: 3,
      },
      voice_cloning: {
        min_files: 1,
        max_files: 25,
        recommended_files: 3,
        file_formats: ['MP3', 'WAV'],
        min_duration_per_file: '30 seconds',
        recommended_duration: '1-3 minutes per file',
      },
      supported_formats: {
        input: ['Text'],
        output: ['MP3', 'MP3 (44.1kHz)'],
      },
    },
  };
}

// ─────────────────────────────────────────────────────────────────
// MCP Server Setup
// ─────────────────────────────────────────────────────────────────

const server = new Server(
  {
    name: 'elevenlabs-mcp-server',
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
      case 'text_to_speech':
        result = await textToSpeech(args);
        break;

      case 'list_voices':
        result = await listVoices(args);
        break;

      case 'clone_voice':
        result = await cloneVoice(args);
        break;

      case 'sound_effects':
        result = await soundEffects(args);
        break;

      case 'get_voice_params':
        result = getVoiceParams();
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
  if (!API_KEY) {
    console.error('Error: ELEVENLABS_API_KEY environment variable is required');
    process.exit(1);
  }

  console.error('ElevenLabs MCP Server starting...');
  console.error('API configured');

  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('ElevenLabs MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
