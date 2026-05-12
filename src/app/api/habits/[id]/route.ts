import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { HabitCategory } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const { name, description, category, color, icon } = body;

  const existing = await prisma.habit.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const habit = await prisma.habit.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(category !== undefined && { category: category as HabitCategory }),
      ...(color !== undefined && { color }),
      ...(icon !== undefined && { icon }),
    },
    include: { logs: { select: { date: true } } },
  });

  return NextResponse.json(habit);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const existing = await prisma.habit.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.habit.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
