import { NextRequest, NextResponse } from "next/server";
/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const prompts = await prisma.promptVersion.findMany({
      where: { isActive: true },
      orderBy: [{ promptKey: "asc" }, { version: "desc" }],
    });

    // Get the latest version for each key
    const latest: Record<string, any> = {};
    for (const p of prompts) {
      if (!latest[p.promptKey]) {
        latest[p.promptKey] = p;
      }
    }

    return NextResponse.json(Object.values(latest));
  } catch (error) {
    console.error("Error fetching prompts:", error);
    return NextResponse.json({ error: "Failed to fetch prompts" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { promptKey, content } = await request.json();

    if (!promptKey || !content) {
      return NextResponse.json({ error: "promptKey and content required" }, { status: 400 });
    }

    // Get current version
    const current = await prisma.promptVersion.findFirst({
      where: { promptKey, isActive: true },
      orderBy: { version: "desc" },
    });

    const newVersion = (current?.version || 1) + 1;

    // Deactivate old versions
    await prisma.promptVersion.updateMany({
      where: { promptKey, isActive: true },
      data: { isActive: false },
    });

    // Create new version
    const created = await prisma.promptVersion.create({
      data: {
        promptKey,
        content,
        version: newVersion,
        isActive: true,
      },
    });

    return NextResponse.json(created);
  } catch (error) {
    console.error("Error updating prompt:", error);
    return NextResponse.json({ error: "Failed to update prompt" }, { status: 500 });
  }
}
