"use client";

import { useState } from "react";
import { X, Shuffle, Check } from "lucide-react";

const STYLES = [
  { id: "avataaars",           label: "Classic"    },
  { id: "adventurer",          label: "Adventure"  },
  { id: "pixel-art",           label: "Pixel"      },
  { id: "big-smile",           label: "Smile"      },
  { id: "lorelei",             label: "Elegant"    },
  { id: "notionists-neutral",  label: "Minimal"    },
  { id: "thumbs",              label: "Thumbs"     },
  { id: "fun-emoji",           label: "Emoji"      },
];

const SEEDS = ["felix", "luna", "orion", "nova", "zara", "kira", "echo", "milo", "sage", "rex"];

export function avatarUrl(style: string, seed: string) {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

interface AvatarPickerProps {
  currentStyle: string;
  currentSeed: string;
  onSave: (style: string, seed: string) => void;
  onClose: () => void;
}

export default function AvatarPicker({ currentStyle, currentSeed, onSave, onClose }: AvatarPickerProps) {
  const [style, setStyle] = useState(currentStyle);
  const [seed, setSeed] = useState(currentSeed);

  function randomSeed() {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    setSeed(Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join(""));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div
        className="w-full max-w-md rounded-t-3xl overflow-hidden"
        style={{ background: "#13131F", maxHeight: "90vh", overflowY: "auto" }}
      >
        {/* Handle + header */}
        <div className="px-5 pt-3 pb-4">
          <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "rgba(255,255,255,0.18)" }} />
          <div className="flex items-center justify-between">
            <span className="text-white font-semibold text-lg">Choose Avatar</span>
            <button onClick={onClose} className="p-2 rounded-full" style={{ background: "rgba(255,255,255,0.08)" }}>
              <X size={18} color="white" />
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="flex flex-col items-center pb-4">
          <div className="relative">
            <img
              src={avatarUrl(style, seed)}
              alt="avatar preview"
              width={100}
              height={100}
              className="rounded-full border-4"
              style={{ borderColor: "#7C3AED", background: "#1E1E2E" }}
            />
            <button
              onClick={randomSeed}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: "#7C3AED" }}
              title="Random avatar"
            >
              <Shuffle size={14} color="white" />
            </button>
          </div>
          <p className="text-xs mt-2" style={{ color: "rgba(255,255,255,0.4)" }}>Tap shuffle for a new look</p>
        </div>

        {/* Style grid */}
        <div className="px-5 pb-2">
          <p className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>Style</p>
          <div className="grid grid-cols-4 gap-2">
            {STYLES.map((s) => {
              const isSelected = s.id === style;
              return (
                <button
                  key={s.id}
                  onClick={() => setStyle(s.id)}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-2xl transition-all"
                  style={{
                    background: isSelected ? "rgba(124,58,237,0.25)" : "rgba(255,255,255,0.05)",
                    border: `1.5px solid ${isSelected ? "#7C3AED" : "transparent"}`,
                  }}
                >
                  <img
                    src={avatarUrl(s.id, seed)}
                    alt={s.label}
                    width={48}
                    height={48}
                    className="rounded-full"
                    style={{ background: "#1E1E2E" }}
                  />
                  <span className="text-[10px] leading-none" style={{ color: isSelected ? "#A78BFA" : "rgba(255,255,255,0.5)" }}>
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Seed presets */}
        <div className="px-5 py-4">
          <p className="text-xs font-semibold mb-3 uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.4)" }}>Variations</p>
          <div className="flex gap-2 flex-wrap">
            {SEEDS.map((s) => {
              const isSelected = s === seed;
              return (
                <button
                  key={s}
                  onClick={() => setSeed(s)}
                  className="w-11 h-11 rounded-full overflow-hidden transition-all"
                  style={{
                    border: `2px solid ${isSelected ? "#7C3AED" : "transparent"}`,
                    outline: isSelected ? "2px solid rgba(124,58,237,0.3)" : "none",
                    outlineOffset: "1px",
                  }}
                >
                  <img
                    src={avatarUrl(style, s)}
                    alt={s}
                    width={44}
                    height={44}
                    style={{ background: "#1E1E2E", width: "100%", height: "100%" }}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Save button */}
        <div className="px-5 pb-8">
          <button
            onClick={() => onSave(style, seed)}
            className="w-full h-13 rounded-2xl flex items-center justify-center gap-2 font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #7C3AED, #2563EB)", height: 52 }}
          >
            <Check size={18} />
            Save Avatar
          </button>
        </div>
      </div>
    </div>
  );
}
