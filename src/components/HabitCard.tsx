"use client";

import { format } from "date-fns";
import { Activity, Pencil, Trash2, Check } from "lucide-react";
import HabitGrid from "./HabitGrid";

type ViewMode = "daily" | "weekly" | "monthly";

export interface HabitData {
  id: string;
  name: string;
  description: string | null;
  category: string;
  color: string;
  icon: string;
  logs: { date: string }[];
}

interface HabitCardProps {
  habit: HabitData;
  viewMode: ViewMode;
  onLog: (id: string, date: string, done: boolean) => void;
  onEdit: (habit: HabitData) => void;
  onDelete: (id: string) => void;
}

export default function HabitCard({ habit, viewMode, onLog, onEdit, onDelete }: HabitCardProps) {
  const today = format(new Date(), "yyyy-MM-dd");
  const loggedDates = habit.logs.map((l) => l.date);
  const doneToday = loggedDates.includes(today);

  const lightBg = habit.color + "18";

  // Streak count
  const logSet = new Set(loggedDates);
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (logSet.has(format(d, "yyyy-MM-dd"))) streak++;
    else if (i > 0) break;
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        {/* Icon box */}
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: lightBg }}
        >
          <Activity size={22} style={{ color: habit.color }} />
        </div>

        {/* Name + description */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 text-base leading-tight">{habit.name}</p>
          {habit.description && (
            <p className="text-xs text-gray-400 mt-0.5 truncate">{habit.description}</p>
          )}
          <p className="text-[10px] mt-0.5" style={{ color: habit.color }}>
            {streak > 0 ? `🔥 ${streak} day streak` : "Start your streak today!"}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => onEdit(habit)}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => onDelete(habit.id)}
            className="p-1.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} />
          </button>
          {/* Log today button */}
          <button
            onClick={() => onLog(habit.id, today, doneToday)}
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all active:scale-95"
            style={{
              backgroundColor: doneToday ? habit.color : lightBg,
              border: `2px solid ${habit.color}40`,
            }}
            title={doneToday ? "Unmark today" : "Mark done today"}
          >
            {doneToday ? (
              <Check size={18} className="text-white" strokeWidth={2.5} />
            ) : (
              <span className="text-lg leading-none" style={{ color: habit.color }}>+</span>
            )}
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="px-4 pb-4 overflow-x-auto">
        <HabitGrid loggedDates={loggedDates} color={habit.color} viewMode={viewMode} />
      </div>
    </div>
  );
}
