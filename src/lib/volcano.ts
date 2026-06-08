/**
 * Volcano Engine API Client
 *
 * Two services:
 * 1. Volcano Ark (火山方舟) — LLM chat completions via Bearer Token
 * 2. Volcano Visual Intelligence (视觉智能) — Image generation via AK/SK signature
 */

import { createHmac, createHash } from "crypto";

/* ─────────────── Ark (LLM) Config ─────────────── */
const VOLC_API_KEY = process.env.VOLC_API_KEY || "";
const VOLC_BASE_URL = process.env.VOLC_BASE_URL || "https://ark.cn-beijing.volces.com/api/v3";
const VOLC_ENDPOINT_LLM = process.env.VOLC_ENDPOINT_LLM || "";

/* ─────────────── Visual (Image) Config ─────────────── */
const VOLC_ACCESSKEY = process.env.VOLC_ACCESSKEY || "";
const VOLC_SECRETKEY = process.env.VOLC_SECRETKEY || "";
const VOLC_REGION = process.env.VOLC_REGION || "cn-beijing";

/* ═══════════════════════════════════════════════════
   Ark — Chat Completion (OpenAI-compatible)
   ═══════════════════════════════════════════════════ */

export interface VolcanoChatParams {
  endpointId: string;
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export function isVolcanoConfigured(): boolean {
  return !!(VOLC_API_KEY && VOLC_ENDPOINT_LLM);
}

function getConfigError(): string {
  const missing: string[] = [];
  if (!VOLC_API_KEY) missing.push("VOLC_API_KEY");
  if (!VOLC_ENDPOINT_LLM) missing.push("VOLC_ENDPOINT_LLM");
  return `Volcano Ark not configured. Missing: ${missing.join(", ")}. Please set these in .env.local`;
}

export function getEndpointId(key: "llm" | "image"): string {
  if (key === "llm") return VOLC_ENDPOINT_LLM;
  return "";
}

export function getCurrentModel(): string {
  return "deepseek-v4-pro";
}

/** Non-streaming chat completion */
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
      Authorization: `Bearer ${VOLC_API_KEY}`,
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

/** Streaming chat completion */
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
      Authorization: `Bearer ${VOLC_API_KEY}`,
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Volcano Ark API error (${response.status}): ${errorText}`);
  }

  return response.body;
}

/* ═══════════════════════════════════════════════════
   Visual Intelligence — Image Generation (AK/SK)
   ═══════════════════════════════════════════════════ */

export function isVisualConfigured(): boolean {
  return !!(VOLC_ACCESSKEY && VOLC_SECRETKEY);
}

/* ── Volcano Engine OpenAPI Signature V4 ── */

function sha256Hex(data: string): string {
  return createHash("sha256").update(data, "utf8").digest("hex");
}

function hmacSha256(key: string | Buffer, data: string): Buffer {
  return createHmac("sha256", key).update(data, "utf8").digest();
}

function getDateTime(timestamp: number): { date: string; datetime: string } {
  const d = new Date(timestamp * 1000);
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}`;
  const datetime = `${date}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
  return { date, datetime };
}

/**
 * Sign a Volcano Engine OpenAPI request (Signature V4 variant).
 *
 * @param method     HTTP method
 * @param path       Canonical URI path
 * @param query      Query string (without leading ?)
 * @param headers    Headers object
 * @param body       Request body string
 * @param service    Service name (e.g. "cv")
 * @returns          Authorization header value
 */
export function signRequest(
  method: string,
  path: string,
  query: string,
  headers: Record<string, string>,
  body: string,
  service: string
): { authorization: string; signedHeaders: string; timestamp: number } {
  const timestamp = Math.floor(Date.now() / 1000);
  const { date, datetime } = getDateTime(timestamp);

  // 1. Body hash
  const payloadHash = sha256Hex(body);

  // 2. Canonical headers
  const canonicalHeadersArr: string[] = [];
  const signedHeadersArr: string[] = [];
  const lowerHeaders: Record<string, string> = {};

  for (const [k, v] of Object.entries(headers)) {
    const lk = k.toLowerCase().trim();
    lowerHeaders[lk] = v.trim();
  }
  // Ensure required headers
  lowerHeaders["host"] = lowerHeaders["host"] || "visual.volcengineapi.com";
  lowerHeaders["x-date"] = datetime;
  if (body) lowerHeaders["content-type"] = lowerHeaders["content-type"] || "application/json";

  const sortedKeys = Object.keys(lowerHeaders).sort();
  for (const k of sortedKeys) {
    canonicalHeadersArr.push(`${k}:${lowerHeaders[k]}\n`);
    signedHeadersArr.push(k);
  }
  const canonicalHeaders = canonicalHeadersArr.join("");
  const signedHeaders = signedHeadersArr.join(";");

  // 3. Canonical request
  const canonicalRequest = [
    method.toUpperCase(),
    path,
    query,
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join("\n");

  // 4. String to sign
  const algorithm = "HMAC-SHA256";
  const credentialScope = `${date}/${VOLC_REGION}/${service}/request`;
  const stringToSign = [
    algorithm,
    datetime,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  // 5. Signing key
  const kDate = hmacSha256(VOLC_SECRETKEY, date);
  const kRegion = hmacSha256(kDate, VOLC_REGION);
  const kService = hmacSha256(kRegion, service);
  const kSigning = hmacSha256(kService, "request");

  // 6. Signature
  const signature = hmacSha256(kSigning, stringToSign).toString("hex");

  // 7. Authorization
  const authorization = `${algorithm} Credential=${VOLC_ACCESSKEY}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return { authorization, signedHeaders, timestamp };
}

export interface VolcanoImageParams {
  prompt: string;
  width?: number;
  height?: number;
  seed?: number;
}

/**
 * Generate image via Volcano Engine Visual Intelligence.
 *
 * Uses the CVProcess action (generic visual processing).
 * Falls back to placeholder if not configured or on error.
 */
export async function generateImage(params: VolcanoImageParams): Promise<string> {
  if (!isVisualConfigured()) {
    throw new Error("Visual Intelligence not configured. Missing VOLC_ACCESSKEY or VOLC_SECRETKEY.");
  }

  // Build request body for image generation
  // Volcano Engine CV API typically uses JSON body with specific service params
  const bodyObj: Record<string, unknown> = {
    req_key: "general_image_generation",
    prompt: params.prompt,
    width: params.width ?? 1024,
    height: params.height ?? 576, // 16:9
    seed: params.seed ?? -1,
    model_version: "general_v1.4",
  };

  const body = JSON.stringify(bodyObj);
  const host = "visual.volcengineapi.com";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Host: host,
  };

  const { authorization } = signRequest("POST", "/", "Action=CVProcess&Version=2022-08-31", headers, body, "cv");

  headers["Authorization"] = authorization;

  const response = await fetch(`https://${host}/?Action=CVProcess&Version=2022-08-31`, {
    method: "POST",
    headers,
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Visual API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  // The response format varies by service; typical success returns base64 or URL
  if (data.code !== undefined && data.code !== 10000 && data.code !== 0) {
    throw new Error(`Visual API business error: ${data.message || JSON.stringify(data)}`);
  }

  // Try common response fields
  const imageData =
    data.data?.image_urls?.[0] ||
    data.data?.image_base64 ||
    data.result?.image_urls?.[0] ||
    data.result?.image_base64 ||
    data.image_urls?.[0] ||
    data.image_base64;

  if (!imageData) {
    // Log full response for debugging
    console.error("Visual API response:", JSON.stringify(data, null, 2));
    throw new Error("No image data in response");
  }

  // If base64, convert to data URL
  if (typeof imageData === "string" && imageData.length > 200 && !imageData.startsWith("http")) {
    return `data:image/png;base64,${imageData}`;
  }

  return imageData;
}

/**
 * Helper: Generate a styled cover image prompt for alumni profile.
 * Prepends the locked style constraints.
 */
export function buildImagePrompt(userPrompt: string): string {
  const lockedPrefix =
    "abstract composition, muted morandi palette, no human face, no text, digital yearbook aesthetic, subtle geometric forms, warm nostalgic atmosphere";
  return `${lockedPrefix}. ${userPrompt}`;
}
