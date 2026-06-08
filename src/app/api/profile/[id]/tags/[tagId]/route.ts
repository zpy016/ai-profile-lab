import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * PUT /api/profile/[id]/tags/[tagId]
 * Update a tag: confirm (accept delta -> user_edited) or modify visibility.
 * DELETE equivalent is done by setting action: "delete" in body.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; tagId: string }> }
) {
  try {
    const { id, tagId } = await params;
    const { action, tagText, tagType, visibility, source } = await request.json();

    const profile = await prisma.profile.findUnique({
      where: { userId: id },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (action === "delete") {
      await prisma.profileTag.delete({
        where: { id: tagId, profileId: profile.id },
      });
      return NextResponse.json({ success: true, deleted: true });
    }

    const updateData: Record<string, unknown> = {};
    if (tagText !== undefined) updateData.tagText = tagText;
    if (tagType !== undefined) updateData.tagType = tagType;
    if (visibility !== undefined) updateData.visibility = visibility;
    if (source !== undefined) updateData.source = source;
    // Confirming a delta tag: clear isDelta, set source to user_edited
    if (action === "confirm") {
      updateData.isDelta = false;
      updateData.source = "user_edited";
    }

    const tag = await prisma.profileTag.update({
      where: { id: tagId, profileId: profile.id },
      data: updateData,
    });

    return NextResponse.json({
      id: tag.id,
      tagText: tag.tagText,
      tagType: tag.tagType,
      source: tag.source,
      isDelta: tag.isDelta,
      visibility: tag.visibility,
    });
  } catch (error) {
    console.error("Update tag error:", error);
    return NextResponse.json({ error: "Failed to update tag" }, { status: 500 });
  }
}
