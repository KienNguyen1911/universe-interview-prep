# Cloudflare Worker Integration Guide

## Overview
This project now uses **Cloudflare Workers AI API** for generating content. The frontend makes API calls to your Cloudflare Worker endpoint at:
```
https://wild-night-bbfd.ngkient1911.workers.dev/
```

The worker uses Cloudflare's built-in AI models (no external API keys needed for the worker itself).

## Frontend Setup (React App)
The frontend (`src/lib/gemini.ts`) communicates with your Cloudflare Worker via HTTP requests:
- `POST /detect-role` - Detects the job role from a plan
- `POST /generate-content` - Generates interview preparation content

## Deploying Your Own Cloudflare Worker

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Wrangler
```bash
npm install -g wrangler
wrangler login
```

### 3. Configure wrangler.toml
The `wrangler.toml` file already includes the AI binding configuration. If you need to customize:

```toml
name = "universe-interview-prep"
main = "src/worker.ts"
compatibility_date = "2024-01-01"
type = "service"

[env.production]
routes = [
  { pattern = "your-domain.com/*", zone_id = "your-zone-id" }
]

[[env.production.bindings]]
binding = "AI"
type = "ai"

[build]
command = "npm run build"
cwd = "./"
```

### 4. Deploy to Cloudflare
```bash
npm run deploy
```

Or with environment:
```bash
wrangler deploy --env production
```

## Project Structure
- `src/App.tsx` - React frontend (interview prep UI)
- `src/lib/gemini.ts` - AI API client (calls Cloudflare Worker)
- `src/worker.ts` - Cloudflare Worker entry point using Cloudflare AI API
- `wrangler.toml` - Cloudflare Workers configuration with AI binding

## API Endpoints

### Detect Role
**POST** `/detect-role`

Request:
```json
{
  "prompt": "Your interview preparation plan..."
}
```

Response:
```json
{
  "result": "Senior Frontend Developer"
}
```

### Generate Content
**POST** `/generate-content`

Request:
```json
{
  "system": "Optional system prompt...",
  "prompt": "Interview preparation prompt..."
}
```

Response:
```json
{
  "result": "Generated markdown content..."
}
```

## Available Models
The worker uses `@cf/meta/llama-3-8b-instruct` by default. You can change this in the `Env` interface or set the `AI_MODEL` environment variable.

Other available models (may vary):
- `@cf/meta/llama-3-8b-instruct`
- `@cf/gpt-3.5-turbo`
- `@cf/mistral/mistral-7b-instruct-v0.2`
- And more: check Cloudflare's AI models documentation

## CORS
Both endpoints have CORS enabled for all origins to allow cross-origin requests from your frontend.

## Error Handling
The worker validates:
- Only POST requests are accepted
- Required fields (`prompt`) must be present
- Invalid JSON returns a 400 error
- Missing endpoints return a 404 error
- All errors return proper HTTP status codes

## Notes
- The Cloudflare Worker uses `env.AI.run()` for efficient on-device AI inference
- No API keys are needed on the client side
- Environment variables are managed through Cloudflare Worker bindings
- The frontendworker communication is optimized for low latency

## Troubleshooting
- **CORS errors**: Ensure the `Access-Control-Allow-Origin` headers are set correctly (they're set to `*` in the worker)
- **Model not found**: Verify the model identifier in `src/worker.ts`
- **Undefined AI binding**: Ensure `wrangler.toml` has the `[env.production.bindings]` section with `type = "ai"`
