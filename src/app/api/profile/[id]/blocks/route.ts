import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * POST /api/profile/[id]/blocks
 * Add a new content block to a profile.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { category, content, visibility = "public", source = "user" } = await request.json();

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    // Find profile by userId
    const profile = await prisma.profile.findUnique({
      where: { userId: id },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Get max order
    const maxOrder = await prisma.contentBlock.aggregate({
      where: { profileId: profile.id },
      _max: { order: true },
    });

    const block = await prisma.contentBlock.create({
      data: {
        profileId: profile.id,
        category: category || "custom",
        title: "",
        content: content.trim(),
        visibility,
        source,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });

    // Mark profile as dirty (has unconfirmed changes)
    await prisma.profile.update({
      where: { id: profile.id },
      data: { hasUnconfirmedDelta: true },
    });

    return NextResponse.json({
      id: block.id,
      category: block.category,
      content: block.content,
      visibility: block.visibility,
      source: block.source,
      order: block.order,
    });
  } catch (error) {
    console.error("Add block error:", error);
    return NextResponse.json({ error: "Failed to add block" }, { status: 500 });
  }
}
