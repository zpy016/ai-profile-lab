import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * POST /api/profile/[id]/publish
 * Publish a profile: status draft -> active, set publishedAt.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { tags, intro, blocks } = await request.json().catch(() => ({}));

    // Update profile status
    const profile = await prisma.profile.update({
      where: { userId: id },
      data: {
        status: "active",
        publishedAt: new Date(),
        hasUnconfirmedDelta: false,
        userConfirmedIntro: intro || undefined,
        aiDeltaIntro: "",
      },
    });

    // If tags provided, save them (mark non-delta as user_edited)
    if (tags && Array.isArray(tags) && tags.length > 0) {
      // Clear existing tags
      await prisma.profileTag.deleteMany({ where: { profileId: profile.id } });

      let order = 0;
      for (const t of tags) {
        await prisma.profileTag.create({
          data: {
            profileId: profile.id,
            tagText: t.text || t.tagText,
            tagType: t.type || t.tagType || "follow",
            source: t.source || (t.delta ? "ai" : "user_edited"),
            visibility: t.visibility || "public",
            isDelta: false,
            order: order++,
          },
        });
      }
    }

    // If blocks provided, save them
    if (blocks && Array.isArray(blocks) && blocks.length > 0) {
      await prisma.contentBlock.deleteMany({ where: { profileId: profile.id } });

      let order = 0;
      for (const b of blocks) {
        await prisma.contentBlock.create({
          data: {
            profileId: profile.id,
            category: b.category || "custom",
            title: b.title || "",
            content: b.content || b.text || "",
            visibility: b.visibility || "public",
            source: b.source || "user",
            order: order++,
          },
        });
      }
    }

    return NextResponse.json({
      id: profile.id,
      status: profile.status,
      publishedAt: profile.publishedAt,
    });
  } catch (error) {
    console.error("Publish profile error:", error);
    return NextResponse.json({ error: "Failed to publish profile" }, { status: 500 });
  }
}
