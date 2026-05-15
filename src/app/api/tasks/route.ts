import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Category, Priority } from "@/lib/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") as Category | null;
  const spaceId = searchParams.get("spaceId");

  const tasks = await prisma.task.findMany({
    where: {
      ...(category ? { category } : {}),
      ...(spaceId ? { spaceId } : {}),
    },
    orderBy: [{ completed: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { title, description, category, priority, dueDate, spaceId } = body;

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const task = await prisma.task.create({
    data: {
      title: title.trim(),
      description: description?.trim() || null,
      category: (category as Category) || "TASKS",
      priority: (priority as Priority) || "MEDIUM",
      dueDate: dueDate ? new Date(dueDate) : null,
      spaceId: spaceId ?? null,
    },
  });

  return NextResponse.json(task, { status: 201 });
}
