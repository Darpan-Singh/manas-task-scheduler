import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json([], { status: 401 });

  const userId = session.user.id;
  let spaces = await prisma.space.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  if (spaces.length === 0) {
    const space = await prisma.space.create({ data: { name: "Personal", userId } });
    spaces = [space];
  }

  return NextResponse.json(spaces);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const space = await prisma.space.create({
    data: { name: name.trim(), userId: session.user.id },
  });

  return NextResponse.json(space, { status: 201 });
}
