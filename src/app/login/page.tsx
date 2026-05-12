"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { Phone, ArrowRight, Shield, Sparkles } from "lucide-react";

const GOOGLE_ICON = (
  <svg width="20" height="20" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
    <path d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/>
    <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/>
    <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
  </svg>
);

type Step = "phone" | "otp";

export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();

  const [tab, setTab] = useState<"google" | "phone">("google");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<Step>("phone");
  const [devOtp, setDevOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "authenticated") router.replace("/profile");
  }, [status, router]);

  async function handleGoogleSignIn() {
    setLoading(true);
    await signIn("google", { callbackUrl: "/profile" });
  }

  async function handleSendOtp() {
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error || "Failed to send OTP"); return; }
    if (data.devOtp) setDevOtp(data.devOtp);
    setStep("otp");
  }

  async function handleVerifyOtp() {
    setError("");
    setLoading(true);
    const result = await signIn("credentials", { phone, otp, redirect: false });
    setLoading(false);
    if (result?.error) { setError("Invalid or expired OTP. Please try again."); return; }
    router.replace("/profile");
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5"
      style={{ background: "linear-gradient(160deg, #0A0A0F 0%, #12122A 50%, #0A0A0F 100%)" }}
    >
      {/* Logo */}
      <div className="mb-10 flex flex-col items-center gap-3">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #7C3AED, #2563EB)", boxShadow: "0 8px 32px rgba(124,58,237,0.4)" }}
        >
          <Sparkles size={28} color="white" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white tracking-tight">Manas</h1>
          <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>Your smart task companion</p>
        </div>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm">
        <div
          className="rounded-3xl p-6"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(20px)" }}
        >
          <h2 className="text-white text-xl font-semibold mb-1">Welcome back</h2>
          <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.4)" }}>Sign in to access your tasks & habits</p>

          {/* Tabs */}
          <div className="flex rounded-xl p-1 mb-6" style={{ background: "rgba(255,255,255,0.06)" }}>
            {(["google", "phone"] as const).map((t) => (
              <button
                key={t}
                onClick={() => { setTab(t); setStep("phone"); setError(""); }}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: tab === t ? "rgba(124,58,237,0.35)" : "transparent",
                  color: tab === t ? "#A78BFA" : "rgba(255,255,255,0.4)",
                }}
              >
                {t === "google" ? "Google" : "Phone"}
              </button>
            ))}
          </div>

          {tab === "google" ? (
            <button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 h-12 rounded-2xl font-semibold transition-all active:scale-95"
              style={{
                background: "white",
                color: "#1a1a1a",
                opacity: loading ? 0.7 : 1,
                boxShadow: "0 2px 16px rgba(0,0,0,0.25)",
              }}
            >
              {GOOGLE_ICON}
              Continue with Google
            </button>
          ) : (
            <div className="space-y-3">
              {step === "phone" ? (
                <>
                  <div className="flex gap-2">
                    <div
                      className="flex items-center px-3 rounded-xl text-sm font-medium"
                      style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.08)" }}
                    >
                      <Phone size={14} className="mr-1.5" />
                      +91
                    </div>
                    <input
                      type="tel"
                      placeholder="Phone number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className="flex-1 h-12 rounded-xl px-4 text-white text-sm outline-none"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
                    />
                  </div>
                  <button
                    onClick={handleSendOtp}
                    disabled={loading || phone.length < 7}
                    className="w-full h-12 rounded-2xl flex items-center justify-center gap-2 font-semibold text-white transition-all active:scale-95"
                    style={{
                      background: "linear-gradient(135deg, #7C3AED, #2563EB)",
                      opacity: loading || phone.length < 7 ? 0.5 : 1,
                    }}
                  >
                    {loading ? "Sending…" : "Send OTP"}
                    {!loading && <ArrowRight size={16} />}
                  </button>
                </>
              ) : (
                <>
                  {devOtp && (
                    <div
                      className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs"
                      style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)", color: "#34d399" }}
                    >
                      <Shield size={12} />
                      Dev mode — OTP: <strong>{devOtp}</strong>
                    </div>
                  )}
                  <div>
                    <p className="text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                      OTP sent to +91 {phone}
                      <button onClick={() => setStep("phone")} className="ml-2 underline" style={{ color: "#A78BFA" }}>Change</button>
                    </p>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="6-digit OTP"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="w-full h-12 rounded-xl px-4 text-white text-center text-xl tracking-[0.5em] outline-none"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", letterSpacing: "0.4em" }}
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={handleVerifyOtp}
                    disabled={loading || otp.length < 6}
                    className="w-full h-12 rounded-2xl flex items-center justify-center gap-2 font-semibold text-white transition-all active:scale-95"
                    style={{
                      background: "linear-gradient(135deg, #7C3AED, #2563EB)",
                      opacity: loading || otp.length < 6 ? 0.5 : 1,
                    }}
                  >
                    {loading ? "Verifying…" : "Verify & Sign In"}
                    {!loading && <ArrowRight size={16} />}
                  </button>
                </>
              )}
            </div>
          )}

          {error && (
            <p className="mt-3 text-xs text-center" style={{ color: "#f87171" }}>{error}</p>
          )}
        </div>

        <p className="text-center mt-4 text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
          By signing in you agree to our Terms & Privacy Policy
        </p>
      </div>
    </div>
  );
}
