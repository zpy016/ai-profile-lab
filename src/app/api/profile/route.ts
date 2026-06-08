import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * POST /api/profile
 * Create a new profile for a user (or create user + profile if user doesn't exist).
 * Used by quick-create and interview flows.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, userName, className, creationMethod } = await request.json();

    const uid = userId || "test-user-001";
    const name = userName || "校友";
    const cls = className || "";
    const method = creationMethod || "quick";

    // Upsert user
    const user = await prisma.user.upsert({
      where: { id: uid },
      update: { name, className: cls },
      create: { id: uid, name, className: cls },
    });

    // Create profile
    const profile = await prisma.profile.create({
      data: {
        userId: user.id,
        status: "draft",
        creationMethod: method,
      },
    });

    return NextResponse.json({
      id: profile.id,
      userId: profile.userId,
      status: profile.status,
      creationMethod: profile.creationMethod,
    });
  } catch (error) {
    console.error("Create profile error:", error);
    return NextResponse.json({ error: "Failed to create profile" }, { status: 500 });
  }
}
