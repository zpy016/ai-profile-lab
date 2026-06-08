import { NextRequest, NextResponse } from "next/server";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateImage, isVisualConfigured, buildImagePrompt } from "@/lib/volcano";
import prisma from "@/lib/prisma";

/**
 * POST /api/ai/generate-image
 * Generate a profile cover image.
 * Body: { prompt, userId, profileId }
 */
export async function POST(request: NextRequest) {
  try {
    const { prompt, userId, profileId } = await request.json();

    if (!prompt?.trim()) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const fullPrompt = buildImagePrompt(prompt);

    // Real image generation via Volcano Visual Intelligence
    if (isVisualConfigured()) {
      try {
        const imageUrl = await generateImage({
          prompt: fullPrompt,
          width: 1024,
          height: 576, // 16:9
        });

        // Save to profile if profileId provided
        if (profileId) {
          await prisma.profile.update({
            where: { id: profileId },
            data: {
              imageUrl,
              imageOutdated: false,
              imageHistory: JSON.stringify([]), // Could append old URL
            },
          });
        }

        // Log
        await prisma.aILog.create({
          data: {
            userId: userId || "test-user-001",
            action: "generate_image",
            input: fullPrompt,
            output: imageUrl.slice(0, 500),
            model: "volcano-visual",
            promptUsed: "image-generation",
            duration: 0,
            userModified: false,
          },
        });

        return NextResponse.json({ imageUrl, source: "ai" });
      } catch (apiError: any) {
        console.error("Visual API error:", apiError);
        // Fall through to placeholder
      }
    }

    // Placeholder fallback: generate a colored gradient placeholder
    const placeholderUrl = `data:image/svg+xml,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="576">
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#E8D5C4"/>
            <stop offset="25%" stop-color="#C49A6C"/>
            <stop offset="50%" stop-color="#9B4D4D"/>
            <stop offset="75%" stop-color="#4A6670"/>
            <stop offset="100%" stop-color="#2C3E50"/>
          </linearGradient>
        </defs>
        <rect width="1024" height="576" fill="url(#g)"/>
        <text x="512" y="300" text-anchor="middle" font-family="serif" font-size="24" fill="rgba(255,255,255,0.6)">AI 生成图片占位</text>
      </svg>`
    )}`;

    return NextResponse.json({
      imageUrl: placeholderUrl,
      source: "placeholder",
      note: "Visual Intelligence not configured or API error",
    });
  } catch (error) {
    console.error("Generate image error:", error);
    return NextResponse.json({ error: "Failed to generate image" }, { status: 500 });
  }
}
