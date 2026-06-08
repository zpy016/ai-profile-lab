import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/admin/templates
 * List all prompt templates.
 */
export async function GET() {
  try {
    const templates = await prisma.promptTemplate.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(templates);
  } catch (error) {
    console.error("List templates error:", error);
    return NextResponse.json({ error: "Failed to list templates" }, { status: 500 });
  }
}

/**
 * POST /api/admin/templates
 * Save a new prompt template.
 * Body: { name, description?, config }
 */
export async function POST(request: NextRequest) {
  try {
    const { name, description = "", config } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    if (!config) {
      return NextResponse.json({ error: "config is required" }, { status: 400 });
    }

    const template = await prisma.promptTemplate.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        config: typeof config === "string" ? config : JSON.stringify(config),
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("Save template error:", error);
    return NextResponse.json({ error: "Failed to save template" }, { status: 500 });
  }
}
