"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { HabitData } from "./HabitCard";

const COLORS = [
  { label: "Green", value: "#22c55e" },
  { label: "Purple", value: "#a855f7" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Orange", value: "#f97316" },
  { label: "Pink", value: "#ec4899" },
  { label: "Teal", value: "#14b8a6" },
  { label: "Red", value: "#ef4444" },
  { label: "Amber", value: "#f59e0b" },
];

const CATEGORIES = [
  { value: "FITNESS", label: "🚴 Fitness" },
  { value: "ART", label: "🎨 Art" },
  { value: "HEALTH", label: "❤️ Health" },
  { value: "LEARNING", label: "📚 Learning" },
  { value: "MINDFULNESS", label: "🧘 Mindfulness" },
];

interface HabitModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<HabitData>) => Promise<void>;
  initial?: HabitData | null;
}

export default function HabitModal({ open, onClose, onSave, initial }: HabitModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("FITNESS");
  const [color, setColor] = useState("#22c55e");
  const [targetUnit, setTargetUnit] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) {
      setName(initial.name);
      setDescription(initial.description || "");
      setCategory(initial.category);
      setColor(initial.color);
      setTargetUnit(initial.targetUnit || "");
      setTargetValue(initial.targetValue != null ? String(initial.targetValue) : "");
    } else {
      setName("");
      setDescription("");
      setCategory("FITNESS");
      setColor("#22c55e");
      setTargetUnit("");
      setTargetValue("");
    }
  }, [initial, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        name, description, category, color,
        targetUnit: targetUnit.trim() || null,
        targetValue: targetValue ? parseFloat(targetValue) : null,
      } as any);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="mx-4 rounded-2xl max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit Habit" : "New Habit"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
            placeholder="Habit name *"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoFocus
          />
          <textarea
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
          <Select value={category} onValueChange={(v) => v && setCategory(v)}>
            <SelectTrigger className="rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Target (optional) */}
          <div className="space-y-1">
            <p className="text-xs text-gray-500 px-1">Target (optional)</p>
            <div className="grid grid-cols-2 gap-2">
              <input
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Unit (steps, min…)"
                value={targetUnit}
                onChange={(e) => setTargetUnit(e.target.value)}
                maxLength={20}
              />
              <input
                type="number"
                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                placeholder="Goal value"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                min={0}
              />
            </div>
          </div>

          {/* Color picker */}
          <div>
            <p className="text-xs text-gray-500 mb-2">Habit color</p>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                  style={{
                    backgroundColor: c.value,
                    outline: color === c.value ? `3px solid ${c.value}` : "none",
                    outlineOffset: "2px",
                  }}
                  title={c.label}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-xl text-white"
              style={{ backgroundColor: color }}
              disabled={saving || !name.trim()}
            >
              {saving ? "Saving..." : initial ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
