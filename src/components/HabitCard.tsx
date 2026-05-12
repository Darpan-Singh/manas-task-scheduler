"use client";

import { useState } from "react";
import { format, subMonths, addMonths, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { Activity, Pencil, Trash2, Check, ChevronLeft, ChevronRight } from "lucide-react";
import HabitGrid, { type ViewMode } from "./HabitGrid";

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
  const logSet = new Set(loggedDates);
  const doneToday = logSet.has(today);
  const lightBg = habit.color + "18";

  // Month state (lifted here so card header can show it)
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const now = new Date();

  // Streak count
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (logSet.has(format(d, "yyyy-MM-dd"))) streak++;
    else if (i > 0) break;
  }

  // Monthly stats
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const monthCompleted = daysInMonth.filter((d) => logSet.has(format(d, "yyyy-MM-dd"))).length;
  const isCurrentMonth = format(selectedMonth, "yyyy-MM") === format(now, "yyyy-MM");
  const isFutureMonth = format(selectedMonth, "yyyy-MM") > format(now, "yyyy-MM");

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        {/* Icon */}
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: lightBg }}
        >
          <Activity size={22} style={{ color: habit.color }} />
        </div>

        {/* Name + context */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-lg leading-tight truncate">{habit.name}</p>

          {viewMode === "monthly" ? (
            /* Month picker inline */
            <div className="flex items-center gap-1 mt-0.5">
              <button
                onClick={() => setSelectedMonth((m) => subMonths(m, 1))}
                className="p-0.5 rounded hover:bg-gray-100 transition-colors"
              >
                <ChevronLeft size={13} className="text-gray-400" />
              </button>
              <span className="text-sm font-semibold" style={{ color: habit.color }}>
                {format(selectedMonth, "MMM yyyy")}
              </span>
              <button
                onClick={() => setSelectedMonth((m) => addMonths(m, 1))}
                disabled={isCurrentMonth}
                className="p-0.5 rounded hover:bg-gray-100 transition-colors disabled:opacity-30"
              >
                <ChevronRight size={13} className="text-gray-400" />
              </button>
              {!isFutureMonth && (
                <span className="text-xs text-gray-400 ml-1">
                  · {monthCompleted}/{daysInMonth.length} days
                </span>
              )}
            </div>
          ) : (
            <p className="text-xs font-semibold mt-0.5" style={{ color: habit.color }}>
              {streak > 0 ? `🔥 ${streak} day streak` : "Start your streak today!"}
            </p>
          )}
        </div>

        {/* Action buttons */}
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
          {/* Log today */}
          <button
            onClick={() => onLog(habit.id, today, doneToday)}
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-all active:scale-90"
            style={{
              backgroundColor: doneToday ? habit.color : lightBg,
              border: `2px solid ${habit.color}40`,
            }}
            title={doneToday ? "Unmark today" : "Mark done today"}
          >
            {doneToday ? (
              <Check size={18} className="text-white" strokeWidth={2.5} />
            ) : (
              <span className="text-xl leading-none font-light" style={{ color: habit.color }}>+</span>
            )}
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="px-4 pb-4 overflow-x-auto">
        <HabitGrid
          loggedDates={loggedDates}
          color={habit.color}
          viewMode={viewMode}
          selectedMonth={selectedMonth}
          onMonthChange={setSelectedMonth}
        />
      </div>
    </div>
  );
}
