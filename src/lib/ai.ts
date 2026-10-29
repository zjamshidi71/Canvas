import { createOpenRouter, OpenRouterProvider } from "@openrouter/ai-sdk-provider";

// ---------------------------------------------------------------------------
// Server-side AI model access via OpenRouter + the Vercel AI SDK.
//
// Teaching note:
//   OpenRouter is a single API (and a single key) in front of hundreds of
//   models — OpenAI, Anthropic, Google, Meta, Mistral… The Vercel AI SDK gives
//   us one consistent set of functions (generateText, streamText, …) no matter
//   which model sits behind it.
//
//   To try a different model, change AI_MODEL in .env.local and restart:
//     AI_MODEL=google/gemini-2.5-flash
//     AI_MODEL=openai/gpt-4o-mini
//     AI_MODEL=anthropic/claude-3.5-haiku
//   Browse model IDs (and prices) at https://openrouter.ai/models
//
//   OPENROUTER_API_KEY has NO "NEXT_PUBLIC_" prefix, so it never reaches the
//   browser. Only import this file from server code (API routes, Server
//   Actions). The client is created lazily so `next build` doesn't crash if
//   the key isn't set yet.
// ---------------------------------------------------------------------------
const DEFAULT_MODEL = "google/gemini-2.5-flash";

let openrouter: OpenRouterProvider | null = null;

export function getModel(modelId = process.env.AI_MODEL || DEFAULT_MODEL) {
  openrouter ??= createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY });
  return openrouter.chat(modelId);
}
