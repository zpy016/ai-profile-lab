import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * POST /api/profile/[id]/tags
 * Create a new tag for a profile.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { tagText, tagType, source = "user_edited", visibility = "public", isDelta = false } = await request.json();

    if (!tagText?.trim()) {
      return NextResponse.json({ error: "tagText is required" }, { status: 400 });
    }

    if (!tagType?.trim()) {
      return NextResponse.json({ error: "tagType is required" }, { status: 400 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: id },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Get max order for this profile's tags
    const maxOrder = await prisma.profileTag.aggregate({
      where: { profileId: profile.id },
      _max: { order: true },
    });

    const tag = await prisma.profileTag.create({
      data: {
        profileId: profile.id,
        tagText: tagText.trim(),
        tagType,
        source,
        visibility,
        isDelta,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });

    return NextResponse.json({
      id: tag.id,
      tagText: tag.tagText,
      tagType: tag.tagType,
      source: tag.source,
      visibility: tag.visibility,
      isDelta: tag.isDelta,
      order: tag.order,
    });
  } catch (error) {
    console.error("Create tag error:", error);
    return NextResponse.json({ error: "Failed to create tag" }, { status: 500 });
  }
}
