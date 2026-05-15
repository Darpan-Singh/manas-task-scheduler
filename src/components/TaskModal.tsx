"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Task, Category, Priority, CATEGORY_CONFIG } from "@/lib/types";
import { format } from "date-fns";
import { Calendar, Clock } from "lucide-react";

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (task: Partial<Task>) => Promise<void>;
  initial?: Task | null;
  defaultCategory?: Category;
}

// Convert ISO string → datetime-local input value (YYYY-MM-DDTHH:MM)
function toDatetimeLocal(iso: string): string {
  try {
    return format(new Date(iso), "yyyy-MM-dd'T'HH:mm");
  } catch {
    return "";
  }
}

export default function TaskModal({ open, onClose, onSave, initial, defaultCategory }: TaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>(defaultCategory || "TASKS");
  const [priority, setPriority] = useState<Priority>("MEDIUM");
  const [deadline, setDeadline] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (initial) {
      setTitle(initial.title);
      setDescription(initial.description || "");
      setCategory(initial.category);
      setPriority(initial.priority);
      setDeadline(initial.dueDate ? toDatetimeLocal(initial.dueDate) : "");
    } else {
      setTitle("");
      setDescription("");
      setCategory(defaultCategory || "TASKS");
      setPriority("MEDIUM");
      setDeadline("");
    }
  }, [initial, defaultCategory, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSave({
        title,
        description,
        category,
        priority,
        // Send as full ISO string so the server stores date + time
        dueDate: deadline ? new Date(deadline).toISOString() : null,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const catColor = CATEGORY_CONFIG[category].color;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-2xl max-h-[90svh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="px-5 pt-5 pb-3 shrink-0">
          <DialogTitle className="text-lg font-semibold">
            {initial ? "Edit Task" : "New Task"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto px-5 pb-5">
          {/* Title */}
          <input
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Task title *"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
          />

          {/* Description */}
          <textarea
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />

          {/* Category + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue>
                  {(val: string) => {
                    const cfg = CATEGORY_CONFIG[val as Category];
                    return cfg ? (
                      <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.color }} />
                        <span className="font-semibold">{cfg.label}</span>
                      </span>
                    ) : null;
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                  <SelectItem key={key} value={key}>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cfg.color }} />
                      <span className="font-semibold">{cfg.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="HIGH">🔴 High</SelectItem>
                <SelectItem value="MEDIUM">🟡 Medium</SelectItem>
                <SelectItem value="LOW">🟢 Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Deadline — date + time */}
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 px-1">
              <Calendar size={12} />
              Deadline (date &amp; time)
            </label>
            <div className="relative">
              <input
                type="datetime-local"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 pr-10"
                style={{ colorScheme: "light" }}
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
              {deadline && (
                <button
                  type="button"
                  onClick={() => setDeadline("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-semibold"
                >
                  Clear
                </button>
              )}
            </div>
            {deadline && (
              <p className="flex items-center gap-1 text-xs px-1" style={{ color: catColor }}>
                <Clock size={11} />
                Due {format(new Date(deadline), "EEE, MMM d 'at' h:mm a")}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 rounded-xl text-white"
              style={{ backgroundColor: catColor }}
              disabled={saving || !title.trim()}
            >
              {saving ? "Saving..." : initial ? "Update" : "Add Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
