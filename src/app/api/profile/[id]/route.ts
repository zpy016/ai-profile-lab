import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const profile = await prisma.profile.findUnique({
      where: { userId: id },
      include: {
        user: true,
        contentBlocks: { orderBy: { order: "asc" } },
        profileTags: { orderBy: { order: "asc" } },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: profile.id,
      userId: profile.userId,
      userName: profile.user.name,
      className: profile.user.className,
      userConfirmedIntro: profile.userConfirmedIntro,
      aiDeltaIntro: profile.aiDeltaIntro,
      introSource: profile.introSource,
      status: profile.status,
      hasUnconfirmedDelta: profile.hasUnconfirmedDelta,
      creationMethod: profile.creationMethod,
      imageUrl: profile.imageUrl,
      imageOutdated: profile.imageOutdated,
      publishedAt: profile.publishedAt,
      tags: profile.profileTags.map((t) => ({
        id: t.id,
        tagText: t.tagText,
        tagType: t.tagType,
        source: t.source,
        visibility: t.visibility,
        isDelta: t.isDelta,
      })),
      blocks: profile.contentBlocks.map((b) => ({
        id: b.id,
        category: b.category,
        content: b.content,
        visibility: b.visibility,
        source: b.source,
        order: b.order,
      })),
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
