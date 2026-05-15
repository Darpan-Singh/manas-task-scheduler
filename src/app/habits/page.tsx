"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import HabitCard, { type HabitData } from "@/components/HabitCard";
import HabitModal from "@/components/HabitModal";
import HabitDetailModal from "@/components/HabitDetailModal";
import BottomNav from "@/components/BottomNav";

type ViewMode = "daily" | "weekly" | "monthly";
type CategoryFilter = "ALL" | "FITNESS" | "ART" | "HEALTH" | "LEARNING" | "MINDFULNESS";

const CATEGORY_CHIPS: { value: CategoryFilter; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "FITNESS", label: "🚴 Fitness" },
  { value: "ART", label: "🎨 Art" },
  { value: "HEALTH", label: "❤️ Health" },
  { value: "LEARNING", label: "📚 Learning" },
  { value: "MINDFULNESS", label: "🧘 Mindfulness" },
];

const VIEW_MODES: { value: ViewMode; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

export default function HabitsPage() {
  const [habits, setHabits] = useState<HabitData[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("daily");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<HabitData | null>(null);
  const [detailHabit, setDetailHabit] = useState<HabitData | null>(null);

  const fetchHabits = async () => {
    const res = await fetch("/api/habits");
    const data = await res.json();
    setHabits(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  const handleLog = async (id: string, date: string, done: boolean, value?: number) => {
    if (done) {
      await fetch(`/api/habits/${id}/log`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date }),
      });
    } else {
      await fetch(`/api/habits/${id}/log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, ...(value !== undefined ? { value } : {}) }),
      });
    }
    // Optimistic update
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h;
        if (done) {
          return { ...h, logs: h.logs.filter((l) => l.date !== date) };
        } else {
          return { ...h, logs: [...h.logs, { date, value: value ?? null }] };
        }
      })
    );
    // Keep detail modal in sync
    setDetailHabit((prev) => {
      if (!prev || prev.id !== id) return prev;
      if (done) return { ...prev, logs: prev.logs.filter((l) => l.date !== date) };
      return { ...prev, logs: [...prev.logs, { date, value: value ?? null }] };
    });
  };

  const handleSave = async (data: Partial<HabitData>) => {
    if (editing) {
      await fetch(`/api/habits/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } else {
      await fetch("/api/habits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    }
    setEditing(null);
    fetchHabits();
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/habits/${id}`, { method: "DELETE" });
    setHabits((prev) => prev.filter((h) => h.id !== id));
  };

  const filtered = habits.filter(
    (h) => categoryFilter === "ALL" || h.category === categoryFilter
  );

  return (
    <div className="page-enter min-h-screen bg-[#F7F8FA] max-w-md mx-auto pb-16">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b border-gray-100 px-5 py-4 flex items-center gap-3">
        <Link href="/" className="text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft size={22} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-black text-gray-900">Habit Tracker</h1>
        </div>
        <button
          onClick={() => { setEditing(null); setModalOpen(true); }}
          className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
        >
          <Plus size={20} className="text-gray-600" />
        </button>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORY_CHIPS.map((chip) => (
            <button
              key={chip.value}
              onClick={() => setCategoryFilter(chip.value)}
              className="flex-shrink-0 px-4 py-2 rounded-2xl text-sm font-medium border transition-all"
              style={
                categoryFilter === chip.value
                  ? { backgroundColor: "#1a1a1a", color: "white", borderColor: "#1a1a1a" }
                  : { backgroundColor: "white", color: "#6b7280", borderColor: "#e5e7eb" }
              }
            >
              {chip.label}
            </button>
          ))}
        </div>

        {/* View mode toggle */}
        <div className="flex gap-1 bg-gray-100 rounded-2xl p-1">
          {VIEW_MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => setViewMode(m.value)}
              className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all"
              style={
                viewMode === m.value
                  ? { backgroundColor: "white", color: "#1a1a1a", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }
                  : { color: "#9ca3af" }
              }
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Habit list */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl shimmer-light flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 rounded-full shimmer-light w-3/5" />
                    <div className="h-3 rounded-full shimmer-light w-2/5" />
                  </div>
                  <div className="w-16 h-6 rounded-full shimmer-light" />
                </div>
                <div className="flex gap-1.5">
                  {[...Array(7)].map((_, j) => (
                    <div key={j} className="flex-1 h-8 rounded-xl shimmer-light" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🌱</p>
            <p className="text-sm text-gray-500 font-medium">No habits yet</p>
            <p className="text-xs text-gray-400 mt-1">Tap + to create your first habit</p>
          </div>
        ) : (
          <div className="space-y-4 pb-8">
            {filtered.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                viewMode={viewMode}
                onLog={handleLog}
                onEdit={(h) => { setEditing(h); setModalOpen(true); }}
                onDelete={handleDelete}
                onOpen={(h) => setDetailHabit(h)}
              />
            ))}
          </div>
        )}
      </div>

      <HabitModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSave={handleSave}
        initial={editing}
      />

      <HabitDetailModal
        habit={detailHabit}
        open={!!detailHabit}
        onClose={() => setDetailHabit(null)}
        onLog={handleLog}
        onEdit={(h) => { setDetailHabit(null); setEditing(h); setModalOpen(true); }}
      />

      <BottomNav active="habits" dark={false} />
    </div>
  );
}
