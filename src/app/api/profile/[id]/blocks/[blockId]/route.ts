import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * PUT /api/profile/[id]/blocks/[blockId]
 * Edit a content block.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; blockId: string }> }
) {
  try {
    const { id, blockId } = await params;
    const { content, category, visibility } = await request.json();

    const profile = await prisma.profile.findUnique({
      where: { userId: id },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {
      source: "user_edited",
    };
    if (content !== undefined) updateData.content = content;
    if (category !== undefined) updateData.category = category;
    if (visibility !== undefined) updateData.visibility = visibility;

    const block = await prisma.contentBlock.update({
      where: { id: blockId, profileId: profile.id },
      data: updateData,
    });

    // Mark profile dirty
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
    });
  } catch (error) {
    console.error("Edit block error:", error);
    return NextResponse.json({ error: "Failed to edit block" }, { status: 500 });
  }
}

/**
 * DELETE /api/profile/[id]/blocks/[blockId]
 * Delete a content block.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; blockId: string }> }
) {
  try {
    const { id, blockId } = await params;

    const profile = await prisma.profile.findUnique({
      where: { userId: id },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    await prisma.contentBlock.delete({
      where: { id: blockId, profileId: profile.id },
    });

    // Mark profile dirty
    await prisma.profile.update({
      where: { id: profile.id },
      data: { hasUnconfirmedDelta: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete block error:", error);
    return NextResponse.json({ error: "Failed to delete block" }, { status: 500 });
  }
}
