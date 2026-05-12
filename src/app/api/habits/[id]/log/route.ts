import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const date = body.date || format(new Date(), "yyyy-MM-dd");

  const existing = await prisma.habit.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const log = await prisma.habitLog.upsert({
    where: { habitId_date: { habitId: id, date } },
    create: { habitId: id, date },
    update: { loggedAt: new Date() },
  });

  return NextResponse.json(log, { status: 201 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const date = body.date || format(new Date(), "yyyy-MM-dd");

  await prisma.habitLog.deleteMany({
    where: { habitId: id, date },
  });

  return NextResponse.json({ success: true });
}
