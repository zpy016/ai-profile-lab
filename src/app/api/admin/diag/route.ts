import { NextResponse } from "next/server";
import { isVolcanoConfigured, isVisualConfigured } from "@/lib/volcano";

export async function GET() {
  return NextResponse.json({
    volcanoConfigured: isVolcanoConfigured(),
    visualConfigured: isVisualConfigured(),
    envCheck: {
      hasApiKey: !!process.env.VOLC_API_KEY,
      hasEndpoint: !!process.env.VOLC_ENDPOINT_LLM,
      hasAccessKey: !!process.env.VOLC_ACCESSKEY,
      hasSecretKey: !!process.env.VOLC_SECRETKEY,
    },
  });
}
