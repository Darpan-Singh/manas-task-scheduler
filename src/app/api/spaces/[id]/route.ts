import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const space = await prisma.space.findUnique({ where: { id } });
  if (!space || space.userId !== session.user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updated = await prisma.space.update({ where: { id }, data: { name: name.trim() } });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const space = await prisma.space.findUnique({ where: { id } });
  if (!space || space.userId !== session.user.id)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  const count = await prisma.space.count({ where: { userId: session.user.id } });
  if (count <= 1)
    return NextResponse.json({ error: "Cannot delete last space" }, { status: 400 });

  await prisma.space.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
