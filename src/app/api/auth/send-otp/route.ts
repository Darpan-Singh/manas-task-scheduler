import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendSms(phone: string, otp: string): Promise<void> {
  const apiKey = process.env.FAST2SMS_API_KEY;

  if (!apiKey) {
    console.log(`[OTP] Fast2SMS not configured — OTP for ${phone}: ${otp}`);
    throw new Error("SMS provider not configured");
  }

  const res = await fetch("https://www.fast2sms.com/dev/bulkV2", {
    method: "POST",
    headers: {
      authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      route: "q",
      numbers: phone,
      message: `Your Tasky OTP is ${otp}. Valid for 5 minutes. Do not share.`,
      flash: 0,
    }),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok || json?.return === false) {
    console.error(`[OTP] Fast2SMS error for ${phone}:`, json);
    throw new Error(json?.message?.[0] ?? "SMS send failed");
  }

  console.log(`[OTP] Fast2SMS sent to ${phone}:`, json?.request_id);
}

export async function POST(req: NextRequest) {
  const { phone } = await req.json();

  if (!phone || !/^[0-9]{10}$/.test(phone)) {
    return NextResponse.json({ error: "Enter a valid 10-digit mobile number" }, { status: 400 });
  }

  await prisma.otpCode.updateMany({
    where: { phone, used: false },
    data: { used: true },
  });

  const code    = generateCode();
  const expires = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.otpCode.create({ data: { phone, code, expires } });

  let smsSent = false;
  try {
    await sendSms(phone, code);
    smsSent = true;
  } catch (err) {
    console.error("[OTP] SMS failed, showing on-screen fallback:", err);
  }

  return NextResponse.json({ success: true, ...(!smsSent && { devOtp: code }) });
}
