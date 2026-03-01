# MCP Bridge Server

**HTTP Bridge for MCP Servers** - Allows n8n and other tools to call MCP servers via REST API.

## 🎯 Purpose

MCP (Model Context Protocol) servers use stdio for communication, which makes them incompatible with HTTP-based tools like n8n. This bridge server:

1. **Launches MCP servers** as child processes
2. **Communicates with them** via stdio (MCP protocol)
3. **Exposes their functions** via HTTP REST API
4. **Enables n8n workflows** to call MCP tools seamlessly

## 🏗️ Architecture

```
┌─────────┐      HTTP POST        ┌──────────────┐      stdio      ┌────────────────┐
│   n8n   │ ──────────────────> │ MCP Bridge   │ ─────────────> │  MCP Server    │
│ Workflow│                      │ (Express)    │                 │ (nano-banana)  │
└─────────┘ <────────────────── └──────────────┘ <───────────── └────────────────┘
              HTTP Response                          MCP Protocol
```

## 📦 Installation

### 1. Install Dependencies

```bash
cd /Users/azzedinezazai/Documents/Agency-Killer-V4/mcp-bridge
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env with your credentials
```

Required environment variables:

```env
PORT=3456
MCP_SERVERS_PATH=/Users/azzedinezazai/Documents/Agency-Killer-V4/mcp-servers

# Google Cloud (for Nano Banana Pro, VEO3)
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# Other API keys as needed...
```

### 3. Build MCP Servers

Make sure all MCP servers are built:

```bash
cd /Users/azzedinezazai/Documents/Agency-Killer-V4/mcp-servers/nano-banana-pro-server
npm install
npm run build

cd ../veo3-server
npm install
npm run build

# Repeat for all servers...
```

### 4. Start the Bridge

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm run build
npm start
```

The server will start on `http://localhost:3456`

## 🚀 API Endpoints

### Health Check

```bash
GET /health
```

Response:
```json
{
  "status": "ok",
  "service": "MCP Bridge Server",
  "version": "1.0.0",
  "uptime": 123.45
}
```

### List Available Servers

```bash
GET /api/servers
```

Response:
```json
{
  "success": true,
  "servers": [
    {
      "id": "nano-banana-pro",
      "name": "Nano Banana Pro",
      "path": "/path/to/nano-banana-pro-server"
    },
    {
      "id": "veo3",
      "name": "VEO3 Video Generation",
      "path": "/path/to/veo3-server"
    }
  ]
}
```

### Get Connection Status

```bash
GET /api/status
```

Response:
```json
{
  "success": true,
  "connections": {
    "nano-banana-pro": true,
    "veo3": false,
    "elevenlabs": false
  }
}
```

### List Tools for a Server

```bash
GET /api/:serverName/tools
```

Example:
```bash
GET /api/nano-banana-pro/tools
```

Response:
```json
{
  "success": true,
  "server": "nano-banana-pro",
  "tools": [
    {
      "name": "generate_image",
      "description": "Generate a 4K image using Google Nano Banana Pro",
      "inputSchema": {
        "type": "object",
        "properties": {
          "prompt": { "type": "string" },
          "resolution": { "type": "string" }
        }
      }
    }
  ]
}
```

### Call a Tool

```bash
POST /api/:serverName/call
```

**Request body:**
```json
{
  "tool": "generate_image",
  "arguments": {
    "prompt": "A beautiful sunset over mountains, cinematic lighting, 8k, highly detailed",
    "resolution": "2048x2048",
    "style_preset": "photorealistic",
    "quality_level": "high"
  }
}
```

**Response:**
```json
{
  "success": true,
  "server": "nano-banana-pro",
  "tool": "generate_image",
  "result": {
    "success": true,
    "images": [
      {
        "base64": "iVBORw0KGgoAAAANS...",
        "mime_type": "image/png",
        "resolution": "2048x2048",
        "index": 0
      }
    ],
    "metadata": {
      "model": "nano-banana-pro",
      "prompt": "A beautiful sunset...",
      "resolution": "2048x2048"
    }
  }
}
```

### MILO Shortcut (Image Generation)

```bash
POST /api/milo/generate-image
```

**Request body:**
```json
{
  "prompt": "A futuristic cityscape at night",
  "resolution": "2048x2048",
  "style_preset": "cyberpunk"
}
```

**Response:** Same as calling `generate_image` tool directly.

## 🔧 Usage in n8n

### 1. Replace ToolCode with HTTP Request

**Before (broken - n8n sandbox):**
```javascript
// This doesn't work in n8n ToolCode
const response = await fetch('...');
```

**After (works - HTTP Request node):**

1. Remove the ToolCode node
2. Add an **HTTP Request** node
3. Configure:
   - **Method:** POST
   - **URL:** `http://localhost:3456/api/nano-banana-pro/call`
   - **Body (JSON):**
     ```json
     {
       "tool": "generate_image",
       "arguments": {
         "prompt": "{{ $json.prompt }}",
         "resolution": "2048x2048"
       }
     }
     ```

### 2. Example n8n Workflow for MILO

```
┌─────────────────┐     ┌──────────────────┐     ┌────────────────────┐
│ When Executed   │ ──> │ Prepare Context  │ ──> │ HTTP Request       │
│ by Workflow     │     │ (Extract prompt) │     │ (Call Bridge)      │
└─────────────────┘     └──────────────────┘     └────────────────────┘
                                                           │
                                                           ▼
                                                  ┌────────────────────┐
                                                  │ Process Response   │
                                                  │ (Extract base64)   │
                                                  └────────────────────┘
```

**HTTP Request Node Configuration:**

- **URL:** `http://localhost:3456/api/milo/generate-image`
- **Method:** POST
- **Body:**
  ```json
  {
    "prompt": "{{ $('Prepare Context').item.json.prompt }}",
    "resolution": "2048x2048",
    "style_preset": "photorealistic",
    "quality_level": "high",
    "number_of_images": 1
  }
  ```

**Response Processing:**

The bridge returns the MCP result directly. Access the image:

```javascript
const result = $input.item.json;

if (result.success && result.images && result.images.length > 0) {
  const imageBase64 = result.images[0].base64;
  const mimeType = result.images[0].mime_type;

  return {
    image_base64: imageBase64,
    mime_type: mimeType,
    metadata: result.metadata
  };
}
```

## 🧪 Testing

### Test Health

```bash
curl http://localhost:3456/health
```

### Test MILO Image Generation

```bash
curl -X POST http://localhost:3456/api/milo/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A cute robot holding a sign that says HELLO WORLD",
    "resolution": "1024x1024",
    "style_preset": "digital_art"
  }'
```

### Test with jq (pretty output)

```bash
curl -X POST http://localhost:3456/api/milo/generate-image \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A sunset over mountains",
    "resolution": "1024x1024"
  }' | jq '.result.images[0].base64' | head -c 100
```

## 🛠️ Troubleshooting

### Bridge won't start

1. **Check MCP servers are built:**
   ```bash
   ls -la /Users/azzedinezazai/Documents/Agency-Killer-V4/mcp-servers/*/dist/index.js
   ```

2. **Check environment variables:**
   ```bash
   cat .env
   ```

3. **Check logs:**
   The bridge logs everything to console. Look for error messages.

### Tool call fails

1. **Check server is connected:**
   ```bash
   curl http://localhost:3456/api/status
   ```

2. **List available tools:**
   ```bash
   curl http://localhost:3456/api/nano-banana-pro/tools
   ```

3. **Verify arguments match schema:**
   Compare your arguments with the tool's `inputSchema`.

### Image generation returns error

1. **Check Google Cloud credentials:**
   ```bash
   echo $GOOGLE_APPLICATION_CREDENTIALS
   cat $GOOGLE_APPLICATION_CREDENTIALS | jq
   ```

2. **Verify project/location:**
   ```env
   GOOGLE_CLOUD_PROJECT=your-actual-project-id
   GOOGLE_CLOUD_LOCATION=us-central1
   ```

3. **Check quotas in GCP Console**

## 🔒 Security Notes

- **API Keys**: Never commit `.env` to git
- **Network**: Run behind firewall or VPN in production
- **Rate Limiting**: Consider adding rate limiting for production use
- **Authentication**: Add API key authentication if exposing publicly

## 📚 Available MCP Servers

- **nano-banana-pro**: Image generation (Gemini 3 Pro, 4K)
- **veo3**: Video generation (Google VEO3)
- **elevenlabs**: Text-to-speech, voice cloning
- **google-ads**: Google Ads campaign management
- **meta-ads**: Meta/Facebook ads management
- **gtm**: Google Tag Manager configuration
- **looker**: Analytics and reporting

## 🎯 Next Steps

1. ✅ Start the bridge server
2. ✅ Test with curl
3. ✅ Update n8n MILO workflow to use HTTP Request
4. ✅ Test image generation end-to-end
5. 🚀 Deploy to production

---

**Made with ❤️ by The Hive OS Team**
