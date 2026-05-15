"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { ArrowRight, Sparkles, ArrowLeft, Smartphone } from "lucide-react";
import type { ConfirmationResult, RecaptchaVerifier as RVType } from "firebase/auth";

const GOOGLE_ICON = (
  <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
    <path d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" fill="#FFC107"/>
    <path d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" fill="#FF3D00"/>
    <path d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" fill="#4CAF50"/>
    <path d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" fill="#1976D2"/>
  </svg>
);

type Tab  = "google" | "phone";
type Step = "phone" | "otp";

function OtpBoxes({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const digits = (value + "      ").slice(0, 6).split("");

  return (
    <div className="relative" onClick={() => inputRef.current?.focus()}>
      <input
        ref={inputRef}
        type="text"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        value={value}
        onChange={e => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
        autoFocus
        className="absolute inset-0 opacity-0 w-full h-full cursor-default"
        style={{ fontSize: "1px" }}
      />
      <div className="flex gap-2 justify-center pointer-events-none">
        {digits.map((d, i) => {
          const filled = i < value.length;
          const active = i === value.length;
          return (
            <div
              key={i}
              className="flex items-center justify-center text-xl font-bold text-white rounded-2xl transition-all"
              style={{
                width: "46px", height: "54px",
                background: filled ? "rgba(124,58,237,0.3)" : "rgba(255,255,255,0.08)",
                border: active ? "2px solid #A78BFA" : filled ? "2px solid rgba(124,58,237,0.6)" : "2px solid rgba(255,255,255,0.15)",
                boxShadow: active ? "0 0 16px rgba(124,58,237,0.4)" : "none",
              }}
            >
              {filled ? d : ""}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();

  const [tab,  setTab]  = useState<Tab>("google");
  const [phone, setPhone] = useState("");
  const [otp,   setOtp]   = useState("");
  const [step,  setStep]  = useState<Step>("phone");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const recaptchaRef    = useRef<RVType | null>(null);
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaDivRef = useRef<HTMLDivElement>(null);

  const firebaseReady = !!(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY !== "REPLACE"
  );

  useEffect(() => {
    if (status === "authenticated") router.replace("/profile");
  }, [status, router]);

  // Clean up reCAPTCHA on unmount
  useEffect(() => {
    return () => { recaptchaRef.current?.clear?.(); };
  }, []);

  async function handleGoogleSignIn() {
    setLoading(true);
    await signIn("google", { callbackUrl: "/profile" });
  }

  async function handleSendOtp() {
    setError("");
    setLoading(true);
    try {
      const { firebaseAuth } = await import("@/lib/firebase");
      const { RecaptchaVerifier, signInWithPhoneNumber } = await import("firebase/auth");

      // Clear old verifier
      recaptchaRef.current?.clear?.();
      recaptchaRef.current = new RecaptchaVerifier(firebaseAuth, "recaptcha-container", { size: "invisible" });

      const result = await signInWithPhoneNumber(firebaseAuth, `+91${phone}`, recaptchaRef.current);
      confirmationRef.current = result;
      setStep("otp");
    } catch (e: unknown) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "Failed to send OTP";
      setError(msg.includes("invalid-phone") ? "Invalid phone number" : msg.includes("too-many-requests") ? "Too many attempts. Try later." : "Failed to send OTP. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (!confirmationRef.current) return;
    setError("");
    setLoading(true);
    try {
      const credential = await confirmationRef.current.confirm(otp);
      const idToken = await credential.user.getIdToken();
      const result  = await signIn("firebase-phone", { idToken, redirect: false });
      if (result?.error) { setError("Verification failed. Try again."); return; }
      router.replace("/profile");
    } catch (e: unknown) {
      console.error(e);
      setError("Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{ background: "#080810" }}
    >
      {/* Glow blobs */}
      <div className="absolute top-[-100px] left-[-60px] w-64 h-64 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(124,58,237,0.25), transparent 70%)" }} />
      <div className="absolute bottom-[-80px] right-[-40px] w-56 h-56 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(37,99,235,0.2), transparent 70%)" }} />

      {/* Invisible reCAPTCHA mount point */}
      <div id="recaptcha-container" ref={recaptchaDivRef} />

      {/* Back */}
      <button onClick={() => router.push("/")}
        className="absolute top-5 left-5 flex items-center gap-1.5 text-sm font-medium z-10"
        style={{ color: "rgba(255,255,255,0.4)" }}
      >
        <ArrowLeft size={15} /> Home
      </button>

      {/* Logo */}
      <div className="mb-6 flex flex-col items-center gap-2 z-10">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #7C3AED, #2563EB)", boxShadow: "0 0 32px rgba(124,58,237,0.5)" }}>
          <Sparkles size={24} color="white" />
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">Tasky</h1>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Your smart task companion</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm z-10">
        <div className="rounded-3xl p-5"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.09)",
            backdropFilter: "blur(20px)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)",
          }}
        >
          {/* Tabs */}
          <div className="flex rounded-xl p-1 mb-5" style={{ background: "rgba(255,255,255,0.05)" }}>
            {(["google", "phone"] as Tab[]).map(t => (
              <button key={t}
                onClick={() => { setTab(t); setStep("phone"); setError(""); setOtp(""); }}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: tab === t ? "rgba(124,58,237,0.45)" : "transparent",
                  color: tab === t ? "#C4B5FD" : "rgba(255,255,255,0.35)",
                  boxShadow: tab === t ? "0 2px 10px rgba(124,58,237,0.3)" : "none",
                }}
              >
                {t === "google" ? "Google" : "Phone"}
              </button>
            ))}
          </div>

          {tab === "google" ? (
            <>
              <p className="text-white text-base font-bold mb-0.5">Sign in with Google</p>
              <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>Use your Google account to continue</p>
              <button onClick={handleGoogleSignIn} disabled={loading}
                className="w-full flex items-center justify-center gap-3 rounded-2xl font-semibold transition-all active:scale-[0.98]"
                style={{ height: "52px", background: "white", color: "#111", opacity: loading ? 0.7 : 1, boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}
              >
                {GOOGLE_ICON}
                {loading ? "Redirecting…" : "Continue with Google"}
              </button>
            </>
          ) : step === "phone" ? (
            <>
              <p className="text-white text-base font-bold mb-0.5">Enter your number</p>
              <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>We'll send a 6-digit code via SMS</p>

              <div className="flex items-center rounded-2xl mb-3 overflow-hidden"
                style={{ background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(255,255,255,0.12)" }}>
                <div className="flex items-center gap-1.5 px-4 shrink-0 border-r"
                  style={{ height: "52px", borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.55)" }}>
                  <Smartphone size={13} />
                  <span className="text-sm font-bold">+91</span>
                </div>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="10-digit number"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  className="flex-1 min-w-0 px-4 text-white text-sm font-medium outline-none bg-transparent placeholder:text-white/20"
                  style={{ height: "52px" }}
                />
              </div>

              <button onClick={handleSendOtp} disabled={loading || phone.length < 10}
                className="w-full rounded-2xl flex items-center justify-center gap-2 font-semibold text-white transition-all active:scale-[0.98]"
                style={{
                  height: "52px",
                  background: "linear-gradient(135deg, #7C3AED, #2563EB)",
                  opacity: loading || phone.length < 10 ? 0.45 : 1,
                  boxShadow: phone.length >= 10 ? "0 4px 20px rgba(124,58,237,0.45)" : "none",
                }}
              >
                {loading ? "Sending…" : "Send OTP"} {!loading && <ArrowRight size={16} />}
              </button>
            </>
          ) : (
            <>
              <p className="text-white text-base font-bold mb-0.5">Enter OTP</p>
              <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>
                Sent to +91 {phone} ·{" "}
                <button onClick={() => { setStep("phone"); setOtp(""); confirmationRef.current = null; }} style={{ color: "#A78BFA" }}>
                  Change
                </button>
              </p>

              <div className="mb-4">
                <OtpBoxes value={otp} onChange={setOtp} />
              </div>

              <button onClick={handleVerifyOtp} disabled={loading || otp.length < 6}
                className="w-full rounded-2xl flex items-center justify-center gap-2 font-semibold text-white transition-all active:scale-[0.98]"
                style={{
                  height: "52px",
                  background: "linear-gradient(135deg, #7C3AED, #2563EB)",
                  opacity: loading || otp.length < 6 ? 0.45 : 1,
                  boxShadow: otp.length >= 6 ? "0 4px 20px rgba(124,58,237,0.45)" : "none",
                }}
              >
                {loading ? "Verifying…" : "Verify & Sign In"} {!loading && <ArrowRight size={16} />}
              </button>
            </>
          )}

          {error && <p className="mt-3 text-xs text-center font-medium" style={{ color: "#f87171" }}>{error}</p>}
        </div>

        <p className="text-center mt-4 text-xs" style={{ color: "rgba(255,255,255,0.15)" }}>
          By signing in you agree to our Terms &amp; Privacy Policy
        </p>
      </div>
    </div>
  );
}
