"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Pencil, LogOut, ChevronLeft, Camera, Check, X, Mail, Phone, Sparkles } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import AvatarPicker, { avatarUrl } from "@/components/AvatarPicker";
import Link from "next/link";

interface ProfileData {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  image: string | null;
  avatarStyle: string;
  avatarSeed: string;
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-4 py-3.5 px-5">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.2)" }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>{label}</p>
        <p className="text-white text-sm font-medium truncate">{value}</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/profile").then(r => r.json()).then(setProfile);
    }
  }, [status]);

  useEffect(() => {
    if (editingName && nameRef.current) nameRef.current.focus();
  }, [editingName]);

  async function saveField(data: Partial<ProfileData>) {
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const updated = await res.json();
    setProfile(updated);
    await update();
    setSaving(false);
  }

  async function saveName() {
    if (!nameInput.trim()) { setEditingName(false); return; }
    await saveField({ name: nameInput.trim() } as Partial<ProfileData>);
    setEditingName(false);
  }

  async function saveAvatar(style: string, seed: string) {
    await saveField({ avatarStyle: style, avatarSeed: seed } as Partial<ProfileData>);
    setShowAvatarPicker(false);
  }

  if (status === "loading" || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#080810" }}>
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const currentStyle = profile.avatarStyle || "avataaars";
  const currentSeed = profile.avatarSeed || "felix";
  const displayImage = profile.image || avatarUrl(currentStyle, currentSeed);
  const displayName = profile.name || "Unnamed";

  return (
    <div className="min-h-screen pb-24 relative" style={{ background: "#080810" }}>

      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-60px] left-[-60px] w-72 h-72 rounded-full opacity-25"
          style={{ background: "radial-gradient(circle, #7C3AED, transparent 70%)" }} />
        <div className="absolute top-[-40px] right-[-40px] w-56 h-56 rounded-full opacity-15"
          style={{ background: "radial-gradient(circle, #2563EB, transparent 70%)" }} />
      </div>

      {/* Header */}
      <div className="relative pt-14 pb-20 flex flex-col items-center">
        <Link
          href="/"
          className="absolute top-12 left-4 w-9 h-9 rounded-full flex items-center justify-center z-10"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
        >
          <ChevronLeft size={18} color="rgba(255,255,255,0.7)" />
        </Link>

        <p className="text-white/40 text-xs uppercase tracking-widest font-semibold mb-6">My Profile</p>

        {/* Avatar */}
        <div className="relative">
          {/* Glow ring */}
          <div
            className="absolute inset-0 rounded-full blur-xl opacity-60"
            style={{ background: "linear-gradient(135deg, #7C3AED, #2563EB)", transform: "scale(1.3)" }}
          />
          <div
            className="relative w-28 h-28 rounded-full overflow-hidden"
            style={{ border: "3px solid rgba(124,58,237,0.8)", boxShadow: "0 8px 40px rgba(124,58,237,0.5)" }}
          >
            <img src={displayImage} alt={displayName} className="w-full h-full object-cover" />
          </div>
          <button
            onClick={() => setShowAvatarPicker(true)}
            className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #7C3AED, #2563EB)", boxShadow: "0 4px 12px rgba(0,0,0,0.5)" }}
          >
            <Camera size={15} color="white" />
          </button>
        </div>

        {/* Name */}
        <div className="mt-4 flex items-center gap-2">
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                ref={nameRef}
                type="text"
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false); }}
                maxLength={50}
                className="bg-transparent text-white text-xl font-bold outline-none border-b text-center"
                style={{ borderColor: "#7C3AED", minWidth: "140px" }}
              />
              <button onClick={saveName} disabled={saving}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "rgba(124,58,237,0.4)" }}>
                <Check size={14} color="#A78BFA" />
              </button>
              <button onClick={() => setEditingName(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.07)" }}>
                <X size={14} color="rgba(255,255,255,0.4)" />
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-white text-xl font-bold">{displayName}</h2>
              <button
                onClick={() => { setNameInput(profile.name || ""); setEditingName(true); }}
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "rgba(255,255,255,0.07)" }}
              >
                <Pencil size={12} color="rgba(255,255,255,0.4)" />
              </button>
            </>
          )}
        </div>

        {(profile.email || profile.phone) && (
          <p className="text-xs mt-1 font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>
            {profile.email || `+91 ${profile.phone}`}
          </p>
        )}
      </div>

      {/* Cards */}
      <div className="px-4 space-y-3 relative z-10">

        {/* Contact info */}
        {(profile.email || profile.phone) && (
          <div
            className="rounded-2xl overflow-hidden divide-y"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            {profile.email && (
              <InfoRow
                icon={<Mail size={16} color="#A78BFA" />}
                label="Email"
                value={profile.email}
              />
            )}
            {profile.phone && (
              <InfoRow
                icon={<Phone size={16} color="#A78BFA" />}
                label="Phone"
                value={`+91 ${profile.phone}`}
              />
            )}
          </div>
        )}

        {/* Avatar picker */}
        <button
          onClick={() => setShowAvatarPicker(true)}
          className="w-full rounded-2xl px-5 py-4 flex items-center justify-between text-left transition-all active:scale-[0.98]"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.2)" }}
            >
              <Sparkles size={16} color="#A78BFA" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>Avatar</p>
              <p className="text-white text-sm font-medium">Change your avatar</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden" style={{ border: "1.5px solid rgba(124,58,237,0.4)" }}>
              <img src={avatarUrl(currentStyle, currentSeed)} alt="avatar" className="w-full h-full" />
            </div>
            <ChevronLeft size={16} color="rgba(255,255,255,0.2)" className="rotate-180" />
          </div>
        </button>

        {/* Sign out */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full rounded-2xl px-5 py-4 flex items-center gap-4 transition-all active:scale-[0.98]"
          style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)" }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(239,68,68,0.15)" }}
          >
            <LogOut size={16} color="#f87171" />
          </div>
          <span className="text-sm font-semibold" style={{ color: "#f87171" }}>Sign Out</span>
        </button>
      </div>

      {showAvatarPicker && (
        <AvatarPicker
          currentStyle={currentStyle}
          currentSeed={currentSeed}
          onSave={saveAvatar}
          onClose={() => setShowAvatarPicker(false)}
        />
      )}

      <BottomNav active="profile" dark />
    </div>
  );
}
