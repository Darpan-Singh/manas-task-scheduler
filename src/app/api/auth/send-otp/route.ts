import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendSms(phone: string, otp: string): Promise<void> {
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from  = process.env.TWILIO_PHONE_NUMBER;

  if (!sid || !token || !from) {
    console.log(`[OTP] Twilio not configured — OTP for ${phone}: ${otp}`);
    throw new Error("SMS provider not configured");
  }

  const body = `Your Tasky OTP is ${otp}. Valid for 5 minutes. Do not share this code.`;
  const to   = `+91${phone}`;

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: to, From: from, Body: body }).toString(),
    }
  );

  const json = await res.json().catch(() => null);
  if (!res.ok || json?.status === "failed") {
    console.error(`[OTP] Twilio error for ${phone}:`, json);
    throw new Error(json?.message ?? "Twilio request failed");
  }

  console.log(`[OTP] Sent to ${to}, sid: ${json?.sid}`);
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
