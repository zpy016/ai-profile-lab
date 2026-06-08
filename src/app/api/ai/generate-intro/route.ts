import { NextRequest, NextResponse } from "next/server";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { chatCompletion, isVolcanoConfigured, getEndpointId } from "@/lib/volcano";
import prisma from "@/lib/prisma";

/**
 * POST /api/ai/generate-intro
 * Generate or incrementally update a profile intro based on content blocks.
 * Returns: { intro, delta_intro, delta_tags }
 */
export async function POST(request: NextRequest) {
  try {
    const { blocks, existingIntro, introSource, userId } = await request.json();

    if (!blocks?.length) {
      return NextResponse.json({ error: "Blocks are required" }, { status: 400 });
    }

    // Build prompt from blocks
    const blocksText = blocks
      .map((b: any) => `[${b.category}] ${b.content}`)
      .join("\n");

    // Fetch active prompt
    const prompt = await prisma.promptVersion.findFirst({
      where: { promptKey: "generate_intro", isActive: true },
      orderBy: { version: "desc" },
    });

    let systemPrompt = prompt?.content || `你是一位克制得体的档案撰写人，为2006届实验中学毕业的同学撰写个人简介。
请使用第三人称，语气温和体面，不超过200字。
避免空洞的形容词，注重具体的事实和经历。
保持「数字纪念册」的克制怀旧文风。`;

    // Build user prompt
    let userPrompt = `请根据以下内容撰写一段个人简介：\n\n${blocksText}\n\n`;

    if (existingIntro) {
      userPrompt += `现有简介（用户已确认，不可修改）：\n${existingIntro}\n\n`;
      userPrompt += `请仅在现有简介末尾追加新的增量内容，不要修改现有文字。如果现有简介已经完整，则返回空增量。`;
    }

    userPrompt += `\n请以 JSON 格式输出：{ "intro": "完整简介（含增量）", "delta": "仅增量部分（如无则空字符串）" }`;

    let result: { intro: string; delta: string } = { intro: "", delta: "" };

    // Real AI
    if (isVolcanoConfigured()) {
      try {
        const endpointId = getEndpointId("llm");
        const response = await chatCompletion({
          endpointId,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.6,
          maxTokens: 1024,
        });

        // Parse JSON
        try {
          const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
          const jsonStr = jsonMatch ? jsonMatch[1] : response;
          const parsed = JSON.parse(jsonStr.trim());
          result.intro = parsed.intro || parsed.introduction || response;
          result.delta = parsed.delta || parsed.delta_intro || "";
        } catch {
          // Fallback: treat full response as intro
          result.intro = response;
          result.delta = "";
        }

        // Log
        await prisma.aILog.create({
          data: {
            userId: userId || "test-user-001",
            action: "generate_intro",
            input: userPrompt.slice(0, 2000),
            output: JSON.stringify(result),
            model: endpointId,
            promptUsed: prompt?.id || "default",
            duration: 0,
            userModified: false,
          },
        });
      } catch (apiError: any) {
        console.error("Volcano API error:", apiError);
        // Fall through to mock
      }
    }

    // Mock fallback if real AI failed or not configured
    if (!result.intro) {
      result = {
        intro: "前大厂产品负责人，现 AI 创业者。2006 年从实验中学毕业后，进入清华计算机系，之后在互联网行业深耕 15 年。2024 年创立 AI 初创公司，专注于企业知识管理领域。",
        delta: "目前正在寻找志同道合的技术合伙人，也希望能与校友们交流 AI 创业心得。",
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Generate intro error:", error);
    return NextResponse.json({ error: "Failed to generate intro" }, { status: 500 });
  }
}
