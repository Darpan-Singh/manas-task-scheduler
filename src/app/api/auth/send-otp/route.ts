import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function sendEmail(email: string, otp: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`[OTP] Resend not configured — OTP for ${email}: ${otp}`);
    throw new Error("Email provider not configured");
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Tasky <onboarding@resend.dev>",
      to: [email],
      subject: "Your Tasky sign-in code",
      html: `
        <div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:32px 24px;background:#fff">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px">
            <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#7C3AED,#2563EB);display:flex;align-items:center;justify-content:center">
              <span style="color:#fff;font-size:18px">✦</span>
            </div>
            <span style="font-size:20px;font-weight:900;color:#111">Tasky</span>
          </div>
          <p style="color:#374151;font-size:15px;margin-bottom:20px">Here is your sign-in code:</p>
          <div style="background:#F5F3FF;border-radius:16px;padding:24px;text-align:center;font-size:36px;font-weight:900;letter-spacing:10px;color:#7C3AED">${otp}</div>
          <p style="color:#9CA3AF;font-size:13px;margin-top:20px;line-height:1.6">
            Valid for <strong>5 minutes</strong>. Do not share this code with anyone.<br/>
            If you did not request this, you can safely ignore this email.
          </p>
        </div>
      `,
    }),
  });

  const json = await res.json().catch(() => null);
  if (!res.ok) {
    console.error(`[OTP] Resend error for ${email}:`, json);
    throw new Error(json?.message ?? "Email send failed");
  }

  console.log(`[OTP] Email sent to ${email}, id: ${json?.id}`);
}

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Enter a valid email address" }, { status: 400 });
  }

  // Invalidate any existing unused OTPs for this email
  await prisma.otpCode.updateMany({
    where: { phone: email, used: false },
    data: { used: true },
  });

  const code    = generateCode();
  const expires = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.otpCode.create({ data: { phone: email, code, expires } });

  let sent = false;
  try {
    await sendEmail(email, code);
    sent = true;
  } catch (err) {
    console.error("[OTP] Email failed, showing on-screen fallback:", err);
  }

  return NextResponse.json({ success: true, ...(!sent && { devOtp: code }) });
}
