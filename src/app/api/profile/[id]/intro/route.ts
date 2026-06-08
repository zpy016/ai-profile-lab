import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * PUT /api/profile/[id]/intro
 * Save/update the profile intro. Marks source as user_edited.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { intro, aiDelta = "", source = "user_edited" } = await request.json();

    const profile = await prisma.profile.findUnique({
      where: { userId: id },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const updated = await prisma.profile.update({
      where: { id: profile.id },
      data: {
        userConfirmedIntro: intro || "",
        aiDeltaIntro: aiDelta,
        introSource: source,
        hasUnconfirmedDelta: !!aiDelta,
      },
    });

    return NextResponse.json({
      userConfirmedIntro: updated.userConfirmedIntro,
      aiDeltaIntro: updated.aiDeltaIntro,
      introSource: updated.introSource,
      hasUnconfirmedDelta: updated.hasUnconfirmedDelta,
    });
  } catch (error) {
    console.error("Save intro error:", error);
    return NextResponse.json({ error: "Failed to save intro" }, { status: 500 });
  }
}
