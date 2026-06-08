import { NextRequest, NextResponse } from "next/server";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { chatCompletion, isVolcanoConfigured, getEndpointId } from "@/lib/volcano";
import prisma from "@/lib/prisma";

/**
 * POST /api/ai/interview/analyze
 * Analyze interview conversation and extract structured content.
 * Returns: { tags, content_blocks, intro, delta_intro, dimensions_covered }
 */
export async function POST(request: NextRequest) {
  try {
    const { messages, userId } = await request.json();

    if (!messages?.length) {
      return NextResponse.json({ error: "Messages are required" }, { status: 400 });
    }

    // Build conversation text
    const conversation = messages
      .map((m: any) => `${m.type === "ai" ? "AI" : "用户"}: ${m.content}`)
      .join("\n");

    // Fetch active prompt
    const prompt = await prisma.promptVersion.findFirst({
      where: { promptKey: "interview_guide", isActive: true },
      orderBy: { version: "desc" },
    });

    const systemPrompt = `你是一位校友档案整理员。请从以下采访对话中提取结构化信息。
你需要覆盖四个维度：self_intro（自我介绍）、background（历史背景）、offer（能提供的）、need（具体需求）。

请以 JSON 格式输出：
{
  "tags": [{ "text": "标签文字", "type": "belong/offer/need/follow" }],
  "content_blocks": [{ "category": "self_intro/background/offer/need/custom", "content": "内容" }],
  "intro": "一段流畅的第三人称简介",
  "dimensions_covered": ["self_intro", "background"],
  "next_question": "如果有未覆盖的维度，提出下一个问题（30字以内）"
}`;

    const userPrompt = `以下是一段 AI 采访对话，请提取结构化信息：\n\n${conversation}`;

    let result: any = null;

    if (isVolcanoConfigured()) {
      try {
        const endpointId = getEndpointId("llm");
        const response = await chatCompletion({
          endpointId,
          messages: [
            { role: "system", content: prompt?.content || systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          maxTokens: 2048,
        });

        try {
          const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
          const jsonStr = jsonMatch ? jsonMatch[1] : response;
          result = JSON.parse(jsonStr.trim());
        } catch {
          result = {
            tags: [],
            content_blocks: [],
            intro: response.slice(0, 300),
            dimensions_covered: [],
            next_question: "能再多说一些吗？",
          };
        }

        // Log
        await prisma.aILog.create({
          data: {
            userId: userId || "test-user-001",
            action: "interview",
            input: conversation.slice(0, 2000),
            output: JSON.stringify(result),
            model: endpointId,
            promptUsed: prompt?.id || "default",
            duration: 0,
            userModified: false,
          },
        });
      } catch (apiError: any) {
        console.error("Volcano API error:", apiError);
      }
    }

    // Mock fallback
    if (!result) {
      result = {
        tags: [
          { text: "实验中学 2006", type: "belong" },
          { text: "清华计算机系", type: "belong" },
          { text: "AI 创业", type: "offer" },
          { text: "产品设计", type: "offer" },
          { text: "寻找技术合伙人", type: "need" },
        ],
        content_blocks: [
          { category: "self_intro", content: "AI 创业者，前大厂产品负责人，2006 年从实验中学毕业。" },
          { category: "background", content: "清华计算机系毕业，15 年互联网行业经验。" },
          { category: "offer", content: "AI 产品设计咨询、创业经验分享。" },
          { category: "need", content: "寻找技术合伙人（后端/算法方向）。" },
        ],
        intro: "张明远，2006 年从实验中学高三 3 班毕业，后进入清华大学计算机系。拥有 15 年互联网行业经验，曾在字节跳动和美团担任产品方向的核心职位。目前是一名 AI 创业者，专注于企业知识管理领域。",
        dimensions_covered: ["self_intro", "background", "offer", "need"],
        next_question: "",
      };
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Interview analyze error:", error);
    return NextResponse.json({ error: "Failed to analyze interview" }, { status: 500 });
  }
}
