import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { HabitCategory } from "@prisma/client";
import { subDays, format } from "date-fns";

export async function GET() {
  const since = format(subDays(new Date(), 365), "yyyy-MM-dd");

  const habits = await prisma.habit.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      logs: {
        where: { date: { gte: since } },
        select: { date: true },
        orderBy: { date: "asc" },
      },
    },
  });

  return NextResponse.json(habits);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, description, category, color, icon } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const habit = await prisma.habit.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      category: (category as HabitCategory) || "FITNESS",
      color: color || "#22c55e",
      icon: icon || "activity",
    },
    include: { logs: true },
  });

  return NextResponse.json(habit, { status: 201 });
}
