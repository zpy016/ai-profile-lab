import { NextResponse } from "next/server";
import { chatCompletion, isVolcanoConfigured, getEndpointId } from "@/lib/volcano";

export async function GET() {
  let aiTest = null;
  let aiError = null;

  if (isVolcanoConfigured()) {
    try {
      const start = Date.now();
      const response = await chatCompletion({
        endpointId: getEndpointId("llm"),
        messages: [
          { role: "system", content: "你是助手" },
          { role: "user", content: "你好" },
        ],
        temperature: 0.7,
      });
      aiTest = {
        success: true,
        duration: Date.now() - start,
        responsePreview: response.slice(0, 100),
      };
    } catch (e: any) {
      aiError = {
        message: e.message,
        stack: e.stack?.split("\n").slice(0, 3),
      };
    }
  }

  return NextResponse.json({
    volcanoConfigured: isVolcanoConfigured(),
    envCheck: {
      hasApiKey: !!process.env.VOLC_API_KEY,
      hasEndpoint: !!process.env.VOLC_ENDPOINT_LLM,
    },
    aiTest,
    aiError,
  });
}
