import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, name: true, email: true, phone: true, image: true, avatarStyle: true, avatarSeed: true, createdAt: true },
  });

  return NextResponse.json(user);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, avatarStyle, avatarSeed, image } = body;

  const allowed = ["adventurer", "avataaars", "pixel-art", "big-smile", "lorelei", "notionists-neutral", "thumbs", "fun-emoji"];

  const data: Record<string, string> = {};
  if (typeof name === "string" && name.trim()) data.name = name.trim().slice(0, 50);
  if (typeof avatarStyle === "string" && allowed.includes(avatarStyle)) data.avatarStyle = avatarStyle;
  if (typeof avatarSeed === "string") data.avatarSeed = avatarSeed.slice(0, 30);
  if (typeof image === "string") data.image = image.slice(0, 2000);

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data,
    select: { id: true, name: true, email: true, phone: true, image: true, avatarStyle: true, avatarSeed: true },
  });

  return NextResponse.json(user);
}
