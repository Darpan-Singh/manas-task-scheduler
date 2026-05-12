import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: NextRequest) {
  const { phone } = await req.json();

  if (!phone || !/^\+?[0-9]{7,15}$/.test(phone.replace(/\s/g, ""))) {
    return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
  }

  // Invalidate old OTPs for this phone
  await prisma.otpCode.updateMany({
    where: { phone, used: false },
    data: { used: true },
  });

  const code = generateCode();
  const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  await prisma.otpCode.create({ data: { phone, code, expires } });

  // TODO: Replace with Twilio/Firebase SMS for production
  console.log(`[OTP] ${phone} → ${code}`);

  // In dev, return the OTP so it can be shown in the UI
  const isDev = process.env.NODE_ENV === "development";
  return NextResponse.json({ success: true, ...(isDev && { devOtp: code }) });
}
