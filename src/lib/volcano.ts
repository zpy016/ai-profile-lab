/**
 * Volcano Ark (火山方舟) API Client
 *
 * Uses Bearer Token authentication (ark-xxxxx format).
 * The API is OpenAI-compatible: POST /api/v3/chat/completions
 *
 * All configuration is read from environment variables — never hardcoded.
 */

const VOLC_API_KEY = process.env.VOLC_API_KEY || "";
const VOLC_BASE_URL = process.env.VOLC_BASE_URL || "https://ark.cn-beijing.volces.com/api/v3";
const VOLC_ENDPOINT_LLM = process.env.VOLC_ENDPOINT_LLM || "";
const VOLC_ENDPOINT_IMAGE = process.env.VOLC_ENDPOINT_IMAGE || "";

export interface VolcanoChatParams {
  endpointId: string;    // e.g., ep-2024xxxx
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface VolcanoImageParams {
  endpointId: string;
  prompt: string;
  width?: number;
  height?: number;
}

/**
 * Check if the Volcano Ark API key is configured.
 */
export function isVolcanoConfigured(): boolean {
  return !!(VOLC_API_KEY && VOLC_ENDPOINT_LLM);
}

function getConfigError(): string {
  const missing: string[] = [];
  if (!VOLC_API_KEY) missing.push("VOLC_API_KEY");
  if (!VOLC_ENDPOINT_LLM) missing.push("VOLC_ENDPOINT_LLM");
  return `Volcano Ark not configured. Missing: ${missing.join(", ")}. Please set these in .env.local`;
}

/**
 * Get the endpoint ID for LLM or Image generation.
 */
export function getEndpointId(key: "llm" | "image"): string {
  if (key === "llm") return VOLC_ENDPOINT_LLM;
  return VOLC_ENDPOINT_IMAGE;
}

/**
 * Non-streaming chat completion.
 * Returns the assistant's message content as a string.
 */
export async function chatCompletion(params: VolcanoChatParams): Promise<string> {
  if (!isVolcanoConfigured()) {
    throw new Error(getConfigError());
  }

  const url = `${VOLC_BASE_URL}/chat/completions`;

  const body = JSON.stringify({
    model: params.endpointId,
    messages: params.messages,
    temperature: params.temperature ?? 0.7,
    max_tokens: params.maxTokens ?? 2048,
    stream: false,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${VOLC_API_KEY}`,
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Volcano Ark API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

/**
 * Streaming chat completion.
 * Returns a ReadableStream of SSE data (OpenAI-compatible format).
 */
export async function chatCompletionStream(
  params: VolcanoChatParams
): Promise<ReadableStream<Uint8Array> | null> {
  if (!isVolcanoConfigured()) {
    throw new Error(getConfigError());
  }

  const url = `${VOLC_BASE_URL}/chat/completions`;

  const body = JSON.stringify({
    model: params.endpointId,
    messages: params.messages,
    temperature: params.temperature ?? 0.7,
    max_tokens: params.maxTokens ?? 2048,
    stream: true,
  });

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${VOLC_API_KEY}`,
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Volcano Ark API error (${response.status}): ${errorText}`);
  }

  return response.body;
}
