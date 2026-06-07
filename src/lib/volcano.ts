/**
 * Volcano Engine (火山引擎) API Client
 *
 * Uses the Bearer token / signature v4 auth for Volcengine API Gateway.
 * All configuration is read from environment variables — never hardcoded.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

const VOLC_ACCESSKEY = process.env.VOLC_ACCESSKEY || "";
const VOLC_SECRETKEY = process.env.VOLC_SECRETKEY || "";
const VOLC_REGION = process.env.VOLC_REGION || "cn-beijing";

export interface VolcanoChatParams {
  endpointId: string;    // LLM endpoint ID (e.g., ep-2024xxxx)
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

function isConfigured(): boolean {
  return !!(VOLC_ACCESSKEY && VOLC_SECRETKEY);
}

function getConfigError(): string {
  const missing: string[] = [];
  if (!VOLC_ACCESSKEY) missing.push("VOLC_ACCESSKEY");
  if (!VOLC_SECRETKEY) missing.push("VOLC_SECRETKEY");
  return `Volcano Engine not configured. Missing: ${missing.join(", ")}. Please set these in .env.local`;
}

/**
 * Simple HMAC-SHA256 signing for Volcano Engine API.
 * In production, use the official Volcengine SDK.
 */
async function signRequest(
  method: string,
  path: string,
  query: string,
  body: string,
  timestamp: string
): Promise<string> {
  // For POC, use a simplified signing or skip if not strictly required
  // The real implementation would use AWS Signature V4 compatible signing
  // This is a placeholder for when real keys are plugged in
  const encoder = new TextEncoder();

  // Build canonical request
  const canonicalHeaders = `host:open.volcengineapi.com\nx-date:${timestamp}\n`;
  const signedHeaders = "host;x-date";
  const hashedPayload = await sha256Hex(body);

  const canonicalRequest = [
    method,
    path,
    query,
    canonicalHeaders,
    signedHeaders,
    hashedPayload,
  ].join("\n");

  const credentialScope = `${timestamp.substring(0, 8)}/${VOLC_REGION}/Service/volcengineapi/request`;
  const hashedCanonicalRequest = await sha256Hex(canonicalRequest);

  const stringToSign = [
    "HMAC-SHA256",
    timestamp,
    credentialScope,
    hashedCanonicalRequest,
  ].join("\n");

  // Derive signing key
  const kDate = await hmacSha256(encoder.encode(VOLC_SECRETKEY), encoder.encode(timestamp.substring(0, 8)));
  const kRegion = await hmacSha256(new Uint8Array(kDate), encoder.encode(VOLC_REGION));
  const kService = await hmacSha256(new Uint8Array(kRegion), encoder.encode("Service"));
  const kSigning = await hmacSha256(new Uint8Array(kService), encoder.encode("volcengineapi/request"));

  const signature = await hmacSha256Hex(new Uint8Array(kSigning), encoder.encode(stringToSign));

  return `HMAC-SHA256 Credential=${VOLC_ACCESSKEY}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
}

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hash = await crypto.subtle.digest("SHA-256", data as any);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacSha256(key: Uint8Array, data: Uint8Array): Promise<ArrayBuffer> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cryptoKey = await crypto.subtle.importKey("raw", key as any, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return crypto.subtle.sign("HMAC", cryptoKey, data as any);
}

async function hmacSha256Hex(key: Uint8Array, data: Uint8Array): Promise<string> {
  const sig = await hmacSha256(key, data);
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function chatCompletion(params: VolcanoChatParams): Promise<string> {
  if (!isConfigured()) {
    throw new Error(getConfigError());
  }

  const endpoint = `https://open.volcengineapi.com`;
  const path = `/api/v1/endpoint/${params.endpointId}/chat/completions`;
  const timestamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");

  const body = JSON.stringify({
    messages: params.messages,
    temperature: params.temperature ?? 0.7,
    max_tokens: params.maxTokens ?? 2048,
    stream: params.stream ?? false,
  });

  const authorization = await signRequest("POST", path, "", body, timestamp);

  const response = await fetch(`${endpoint}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": authorization,
      "X-Date": timestamp,
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Volcano API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

export async function chatCompletionStream(
  params: VolcanoChatParams
): Promise<ReadableStream<Uint8Array> | null> {
  if (!isConfigured()) {
    throw new Error(getConfigError());
  }

  const endpoint = `https://open.volcengineapi.com`;
  const path = `/api/v1/endpoint/${params.endpointId}/chat/completions`;
  const timestamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");

  const body = JSON.stringify({
    messages: params.messages,
    temperature: params.temperature ?? 0.7,
    max_tokens: params.maxTokens ?? 2048,
    stream: true,
  });

  const authorization = await signRequest("POST", path, "", body, timestamp);

  const response = await fetch(`${endpoint}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": authorization,
      "X-Date": timestamp,
    },
    body,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Volcano API error (${response.status}): ${errorText}`);
  }

  return response.body;
}

// Check if Volcano is configured (for graceful degradation)
export function isVolcanoConfigured(): boolean {
  return isConfigured();
}

export function getEndpointId(key: "llm" | "image"): string {
  if (key === "llm") return process.env.VOLC_ENDPOINT_LLM || "";
  return process.env.VOLC_ENDPOINT_IMAGE || "";
}
