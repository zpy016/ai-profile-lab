import { NextRequest, NextResponse } from "next/server";
/* eslint-disable @typescript-eslint/no-explicit-any */
import prisma from "@/lib/prisma";

/**
 * GET /api/admin/logs
 * Query AI processing logs with filters.
 * Query params: ?action=&userId=&hasModification=&page=&limit=
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || undefined;
    const userId = searchParams.get("userId") || undefined;
    const hasModification = searchParams.get("hasModification");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);

    const where: any = {};
    if (action) where.action = action;
    if (userId) where.userId = userId;
    if (hasModification === "true") where.userModified = true;
    if (hasModification === "false") where.userModified = false;

    const [logs, total] = await Promise.all([
      prisma.aILog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.aILog.count({ where }),
    ]);

    // Calculate stats
    const stats = {
      total,
      substantive: await prisma.aILog.count({ where: { ...where, modificationType: "substantive" } }),
      cosmetic: await prisma.aILog.count({ where: { ...where, modificationType: "cosmetic" } }),
      deltaRejected: await prisma.aILog.count({ where: { ...where, modificationType: "delta_rejected" } }),
    };

    return NextResponse.json({
      logs,
      stats,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Fetch logs error:", error);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}
