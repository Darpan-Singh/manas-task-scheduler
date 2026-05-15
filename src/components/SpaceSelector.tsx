"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronDown, Plus, Trash2, Check } from "lucide-react";
import type { Space } from "@/lib/types";

interface SpaceSelectorProps {
  spaces: Space[];
  activeSpaceId: string | null;
  onSelectSpace: (id: string) => void;
  onCreateSpace: (name: string) => Space;
  onDeleteSpace: (id: string) => void;
}

export default function SpaceSelector({
  spaces,
  activeSpaceId,
  onSelectSpace,
  onCreateSpace,
  onDeleteSpace,
}: SpaceSelectorProps) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeSpace = spaces.find((s) => s.id === activeSpaceId) ?? spaces[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setCreating(false);
        setNewName("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (creating) setTimeout(() => inputRef.current?.focus(), 50);
  }, [creating]);

  const handleCreate = () => {
    if (!newName.trim()) return;
    const space = onCreateSpace(newName.trim());
    setNewName("");
    setCreating(false);
    onSelectSpace(space.id);
    setOpen(false);
  };

  const handleDelete = (space: Space) => {
    if (spaces.length <= 1) return;
    if (space.id === activeSpaceId) {
      const other = spaces.find((s) => s.id !== space.id);
      if (other) onSelectSpace(other.id);
    }
    onDeleteSpace(space.id);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 active:opacity-70 transition-opacity"
      >
        <span className="text-white font-bold text-xl">
          {activeSpace?.name ?? "My Tasks"}
        </span>
        <ChevronDown
          size={16}
          className={`text-white/50 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 w-56 rounded-2xl bg-[#13131C] border border-white/10 shadow-2xl z-50 overflow-hidden">
          <div className="py-1.5">
            {spaces.map((space) => (
              <div
                key={space.id}
                className="flex items-center justify-between px-3 py-0.5 hover:bg-white/5 transition-colors"
              >
                <button
                  onClick={() => { onSelectSpace(space.id); setOpen(false); }}
                  className="flex items-center gap-2 flex-1 py-2 text-left"
                >
                  <span className="w-4 flex-shrink-0 flex items-center justify-center">
                    {space.id === activeSpaceId && (
                      <Check size={13} className="text-blue-400" />
                    )}
                  </span>
                  <span className="text-sm font-medium text-white truncate">{space.name}</span>
                </button>
                {spaces.length > 1 && (
                  <button
                    onClick={() => handleDelete(space)}
                    className="p-1.5 text-white/20 hover:text-red-400 transition-colors rounded-lg flex-shrink-0"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="h-px bg-white/8" />

          <div className="p-2">
            {creating ? (
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate();
                    if (e.key === "Escape") { setCreating(false); setNewName(""); }
                  }}
                  placeholder="Space name"
                  maxLength={32}
                  className="flex-1 bg-white/8 text-white text-sm rounded-lg px-3 py-1.5 outline-none placeholder:text-white/30 focus:ring-1 focus:ring-blue-500/40 min-w-0"
                />
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim()}
                  className="text-xs font-bold text-blue-400 hover:text-blue-300 disabled:opacity-40 px-1 flex-shrink-0"
                >
                  Add
                </button>
              </div>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="w-full flex items-center gap-2 px-2 py-2 text-white/40 hover:text-white/70 transition-colors text-sm rounded-lg"
              >
                <Plus size={14} />
                <span>New space</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
