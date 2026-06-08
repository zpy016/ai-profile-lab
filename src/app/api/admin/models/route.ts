import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/admin/models
 * Return available AI models (from config).
 */
export async function GET() {
  const models = [
    {
      id: "ep-20260608013645-vmmr2",
      name: "DeepSeek-V4-pro｜260425",
      provider: "volcano",
      type: "llm",
      description: "当前主力模型，推理能力强",
      isDefault: true,
    },
    {
      id: "deepseek-v4-lite",
      name: "DeepSeek-V4-lite",
      provider: "volcano",
      type: "llm",
      description: "更轻量，响应更快",
      isDefault: false,
    },
    {
      id: "doubao-pro-32k",
      name: "Doubao Pro 32K",
      provider: "volcano",
      type: "llm",
      description: "字节跳动自研，中文优化",
      isDefault: false,
    },
    {
      id: "doubao-lite",
      name: "Doubao Lite",
      provider: "volcano",
      type: "llm",
      description: "轻量快速，成本低",
      isDefault: false,
    },
  ];

  return NextResponse.json({ models });
}

/**
 * PUT /api/admin/models
 * Switch active model (stored in memory for POC; in production would persist).
 */
export async function PUT(request: NextRequest) {
  try {
    const { modelId } = await request.json();

    if (!modelId) {
      return NextResponse.json({ error: "modelId is required" }, { status: 400 });
    }

    // In POC, we just acknowledge the switch.
    // The actual endpoint used is controlled by VOLC_ENDPOINT_LLM env var.
    return NextResponse.json({
      success: true,
      modelId,
      note: "Model switch acknowledged. To actually change the endpoint, update VOLC_ENDPOINT_LLM in .env.local and restart the server.",
    });
  } catch (error) {
    console.error("Switch model error:", error);
    return NextResponse.json({ error: "Failed to switch model" }, { status: 500 });
  }
}
