"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Pencil, LogOut, ChevronLeft, Camera, Check, X } from "lucide-react";
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
      fetch("/api/profile")
        .then((r) => r.json())
        .then(setProfile);
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
    await update(); // refresh session token
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#0A0A0F" }}>
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const currentStyle = profile.avatarStyle || "avataaars";
  const currentSeed = profile.avatarSeed || "felix";
  const displayImage = profile.image || avatarUrl(currentStyle, currentSeed);
  const initials = (profile.name || profile.email || "U").slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen pb-24" style={{ background: "#0A0A0F" }}>
      {/* Header gradient */}
      <div
        className="relative h-48"
        style={{ background: "linear-gradient(160deg, #1a0a3a 0%, #0f1a3a 60%, #0A0A0F 100%)" }}
      >
        {/* Back button */}
        <Link
          href="/"
          className="absolute top-12 left-4 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.08)" }}
        >
          <ChevronLeft size={20} color="white" />
        </Link>

        <div className="absolute top-8 left-1/2 -translate-x-1/2 text-center">
          <h1 className="text-white font-semibold text-lg">Profile</h1>
        </div>

        {/* Avatar */}
        <div className="absolute -bottom-12 left-1/2 -translate-x-1/2">
          <div className="relative">
            <div
              className="w-24 h-24 rounded-full overflow-hidden"
              style={{ border: "3px solid #7C3AED", background: "#1E1E2E", boxShadow: "0 8px 32px rgba(124,58,237,0.4)" }}
            >
              {profile.image ? (
                <img src={profile.image} alt={initials} className="w-full h-full object-cover" />
              ) : (
                <img src={avatarUrl(currentStyle, currentSeed)} alt={initials} className="w-full h-full" />
              )}
            </div>
            <button
              onClick={() => setShowAvatarPicker(true)}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #7C3AED, #2563EB)", boxShadow: "0 2px 8px rgba(0,0,0,0.4)" }}
            >
              <Camera size={14} color="white" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 pt-16 space-y-5">
        {/* Name */}
        <div
          className="rounded-2xl px-5 py-4"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>Display Name</p>
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                ref={nameRef}
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false); }}
                maxLength={50}
                className="flex-1 bg-transparent text-white text-lg font-medium outline-none border-b"
                style={{ borderColor: "#7C3AED" }}
              />
              <button onClick={saveName} disabled={saving} className="p-1.5 rounded-lg" style={{ background: "rgba(124,58,237,0.3)" }}>
                <Check size={16} color="#A78BFA" />
              </button>
              <button onClick={() => setEditingName(false)} className="p-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.06)" }}>
                <X size={16} color="rgba(255,255,255,0.5)" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <span className="text-white text-lg font-medium">{profile.name || "Set your name"}</span>
              <button
                onClick={() => { setNameInput(profile.name || ""); setEditingName(true); }}
                className="p-1.5 rounded-lg"
                style={{ background: "rgba(255,255,255,0.06)" }}
              >
                <Pencil size={15} color="rgba(255,255,255,0.5)" />
              </button>
            </div>
          )}
        </div>

        {/* Contact info */}
        <div
          className="rounded-2xl px-5 py-4 space-y-3"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          {profile.email && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Email</p>
              <p className="text-white text-sm">{profile.email}</p>
            </div>
          )}
          {profile.phone && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>Phone</p>
              <p className="text-white text-sm">+91 {profile.phone}</p>
            </div>
          )}
        </div>

        {/* Avatar section */}
        <button
          onClick={() => setShowAvatarPicker(true)}
          className="w-full rounded-2xl px-5 py-4 flex items-center justify-between text-left"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
        >
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>Avatar</p>
            <p className="text-white text-sm">Change your avatar style</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden" style={{ background: "#1E1E2E" }}>
              <img src={avatarUrl(currentStyle, currentSeed)} alt="avatar" className="w-full h-full" />
            </div>
            <ChevronLeft size={18} color="rgba(255,255,255,0.3)" className="rotate-180" />
          </div>
        </button>

        {/* Sign out */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full rounded-2xl px-5 py-4 flex items-center gap-3"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)" }}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(239,68,68,0.15)" }}>
            <LogOut size={16} color="#f87171" />
          </div>
          <span className="text-sm font-medium" style={{ color: "#f87171" }}>Sign Out</span>
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
