import { NextRequest, NextResponse } from "next/server";
import { chatCompletionStream, isVolcanoConfigured, getEndpointId } from "@/lib/volcano";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!messages?.length) {
      return NextResponse.json({ error: "Messages required" }, { status: 400 });
    }

    // Fetch active interview prompt
    const prompt = await prisma.promptVersion.findFirst({
      where: { promptKey: "interview_guide", isActive: true },
      orderBy: { version: "desc" },
    });

    const systemPrompt = prompt?.content || "你是实验中学2006届校友的AI采访助手...";

    // If Volcano is configured, stream real AI
    if (isVolcanoConfigured()) {
      try {
        const endpointId = getEndpointId("llm");
        const stream = await chatCompletionStream({
          endpointId,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          temperature: 0.7,
          stream: true,
        });

        if (stream) {
          return new Response(stream, {
            headers: {
              "Content-Type": "text/event-stream",
              "Cache-Control": "no-cache",
              Connection: "keep-alive",
            },
          });
        }
      } catch (apiError) {
        console.error("Volcano streaming error:", apiError);
      }
    }

    // Mock SSE stream for POC
    const encoder = new TextEncoder();
    const mockResponse = "了解！最后一个维度——你目前在寻找什么？无论是工作机会、合作伙伴，还是其他校友能帮上忙的事情，都可以说说。";

    const stream = new ReadableStream({
      async start(controller) {
        for (let i = 0; i < mockResponse.length; i++) {
          const chunk = JSON.stringify({
            choices: [{ delta: { content: mockResponse[i] } }],
          });
          controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
          await new Promise((r) => setTimeout(r, 30));
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Interview error:", error);
    return NextResponse.json(
      { error: "Interview failed" },
      { status: 500 }
    );
  }
}
