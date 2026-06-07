import { NextRequest, NextResponse } from "next/server";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { chatCompletion, isVolcanoConfigured, getEndpointId } from "@/lib/volcano";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { text, userId } = await request.json();

    if (!text?.trim()) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Fetch active prompt
    const prompt = await prisma.promptVersion.findFirst({
      where: { promptKey: "extract_tags", isActive: true },
      orderBy: { version: "desc" },
    });

    const systemPrompt = prompt?.content || `你是一位校友档案整理员。请从以下自我介绍中提取标签...`;

    // If Volcano is configured, use real AI
    if (isVolcanoConfigured()) {
      try {
        const endpointId = getEndpointId("llm");
        const response = await chatCompletion({
          endpointId,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: text },
          ],
          temperature: 0.7,
        });

        // Try to parse JSON from response
        let parsed;
        try {
          // Extract JSON from possible markdown code blocks
          const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
          const jsonStr = jsonMatch ? jsonMatch[1] : response;
          parsed = JSON.parse(jsonStr.trim());
        } catch {
          // Fallback: return raw text as intro
          parsed = { intro: response, tags: [], content_blocks: [] };
        }

        // Log the AI call
        await prisma.aILog.create({
          data: {
            userId: userId || "test-user-001",
            action: "extract_tags",
            input: text,
            output: JSON.stringify(parsed),
            model: endpointId,
            promptUsed: prompt?.id || "default",
            duration: 0,
          },
        });

        return NextResponse.json(parsed);
      } catch (apiError: any) {
        console.error("Volcano API error:", apiError);
        // Fall through to mock response
      }
    }

    // Mock response for POC demo
    const mockResponse = {
      tags: [
        { text: "实验中学 2006", type: "belong" },
        { text: "清华计算机系", type: "belong" },
        { text: "AI 创业", type: "offer" },
        { text: "产品设计", type: "offer" },
        { text: "独立音乐", type: "follow" },
      ],
      intro: "前大厂产品负责人，现 AI 创业者。2006 年从实验中学毕业后，进入清华计算机系，之后在互联网行业深耕 15 年。2024 年创立 AI 初创公司，专注于企业知识管理领域。",
      delta_intro: "目前正在寻找技术合伙人，也希望能与校友们交流 AI 创业心得。",
      delta_tags: [
        { text: "寻找技术合伙人", type: "need" },
        { text: "海淀咖啡", type: "follow" },
      ],
      content_blocks: [
        { category: "self_intro", content: "AI 创业者，前大厂产品负责人，2006 年从实验中学毕业。" },
        { category: "background", content: "清华计算机系毕业，15 年互联网行业经验，字节跳动、美团。" },
        { category: "offer", content: "AI 产品设计咨询、创业经验分享、技术团队管理经验。" },
      ],
    };

    return NextResponse.json(mockResponse);
  } catch (error) {
    console.error("Extract tags error:", error);
    return NextResponse.json(
      { error: "Failed to extract tags" },
      { status: 500 }
    );
  }
}
