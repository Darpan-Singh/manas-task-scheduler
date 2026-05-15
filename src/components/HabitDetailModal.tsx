"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  format, startOfWeek, subWeeks, eachDayOfInterval,
  startOfMonth, endOfMonth, isSameMonth, endOfWeek,
  addMonths, subMonths,
} from "date-fns";
import { X, ChevronLeft, ChevronRight, Pencil, Flame, Activity, CalendarDays } from "lucide-react";
import type { HabitData } from "./HabitCard";

interface Props {
  habit: HabitData | null;
  open: boolean;
  onClose: () => void;
  onLog: (id: string, date: string, done: boolean, value?: number) => void;
  onEdit: (habit: HabitData) => void;
}

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function HabitDetailModal({ habit, open, onClose, onLog, onEdit }: Props) {
  const [calMonth, setCalMonth] = useState(new Date());
  const [valuePrompt, setValuePrompt] = useState<string | null>(null);
  const [inputVal, setInputVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setCalMonth(new Date());
  }, [open]);

  useEffect(() => {
    if (valuePrompt) setTimeout(() => inputRef.current?.focus(), 80);
  }, [valuePrompt]);

  const logMap = useMemo(() => {
    if (!habit) return new Map<string, number | null>();
    const m = new Map<string, number | null>();
    for (const l of habit.logs) m.set(l.date, l.value ?? null);
    return m;
  }, [habit]);

  if (!open || !habit) return null;

  const today = format(new Date(), "yyyy-MM-dd");

  // Streak
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (logMap.has(format(d, "yyyy-MM-dd"))) streak++;
    else if (i > 0) break;
  }

  // Heatmap: last 18 weeks, Mon-start
  const heatEnd = new Date();
  const heatStart = startOfWeek(subWeeks(heatEnd, 17), { weekStartsOn: 1 });
  const heatDays = eachDayOfInterval({ start: heatStart, end: heatEnd });
  const heatWeeks: Date[][] = [];
  for (let i = 0; i < heatDays.length; i += 7) heatWeeks.push(heatDays.slice(i, i + 7));

  // Month labels for heatmap (show month name on first week of each month)
  const monthLabels: (string | null)[] = heatWeeks.map((week) => {
    const first = week.find((d) => d.getDate() <= 7);
    return first ? format(first, "MMM") : null;
  });

  // Calendar grid
  const monthStart = startOfMonth(calMonth);
  const monthEnd = endOfMonth(calMonth);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calDays = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const isCurrentMonth = format(calMonth, "yyyy-MM") === format(new Date(), "yyyy-MM");

  const handleDateTap = (date: string) => {
    if (date > today) return;
    if (logMap.has(date)) {
      onLog(habit.id, date, true);
    } else if (habit.targetUnit) {
      setValuePrompt(date);
      setInputVal("");
    } else {
      onLog(habit.id, date, false);
    }
  };

  const submitValue = () => {
    if (!valuePrompt) return;
    const val = parseFloat(inputVal);
    onLog(habit.id, valuePrompt, false, isNaN(val) ? undefined : val);
    setValuePrompt(null);
    setInputVal("");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      style={{ background: "rgba(0,0,0,0.65)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md flex flex-col overflow-hidden"
        style={{ background: "#111118", borderRadius: "24px 24px 0 0", maxHeight: "92svh" }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full" style={{ background: "#ffffff25" }} />
        </div>

        <div className="overflow-y-auto flex-1">
          {/* Header */}
          <div className="flex items-start gap-3 px-5 pt-3 pb-4">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ backgroundColor: habit.color + "22" }}
            >
              <Activity size={20} style={{ color: habit.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-lg leading-tight">{habit.name}</p>
              <p className="text-white/40 text-sm mt-0.5">{habit.description || "No Description"}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: "#ffffff15" }}
            >
              <X size={15} className="text-white/60" />
            </button>
          </div>

          {/* Heatmap */}
          <div className="px-4 pb-4 overflow-x-auto">
            {/* Month labels row */}
            <div className="flex gap-0.5 mb-1 ml-7">
              {heatWeeks.map((_, wi) => (
                <div key={wi} style={{ width: 11 }} className="flex-shrink-0">
                  <span className="text-[8px] text-white/25 font-medium">
                    {monthLabels[wi] ?? ""}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex gap-0.5" style={{ minWidth: "fit-content" }}>
              {/* Day-of-week labels */}
              <div className="flex flex-col gap-0.5 mr-1.5 flex-shrink-0">
                {DOW.map((d, i) => (
                  <div key={i} style={{ height: 11 }} className="flex items-center">
                    {i % 2 === 1
                      ? <span className="text-[8px] text-white/30 w-5 leading-none">{d.slice(0, 3)}</span>
                      : <span className="w-5" />
                    }
                  </div>
                ))}
              </div>
              {/* Week columns */}
              {heatWeeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-0.5">
                  {week.map((day, di) => {
                    const d = format(day, "yyyy-MM-dd");
                    const done = logMap.has(d);
                    const isT = d === today;
                    return (
                      <div
                        key={di}
                        className="rounded-sm flex-shrink-0"
                        style={{
                          width: 11, height: 11,
                          backgroundColor: done ? habit.color : habit.color + "20",
                          outline: isT ? `1.5px solid ${habit.color}` : "none",
                          outlineOffset: 1,
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Stats bar */}
          <div className="flex items-center gap-2 px-4 pb-4">
            <div className="h-9 flex-1 rounded-xl flex items-center justify-center px-3" style={{ background: "#ffffff0C" }}>
              <span className="text-xs font-semibold text-white/50">
                {streak > 0 ? `🔥 ${streak} day streak` : "No Streak Goal"}
              </span>
            </div>
            <div className="h-9 rounded-xl flex items-center gap-1.5 px-3 flex-shrink-0" style={{ background: "#ffffff0C" }}>
              <Flame size={12} className="text-white/35" />
              <span className="text-xs font-semibold text-white/50">{habit.logs.length}</span>
            </div>
            {habit.targetUnit && (
              <div className="h-9 rounded-xl flex items-center gap-1 px-3 flex-shrink-0" style={{ background: "#ffffff0C" }}>
                <span className="text-xs font-semibold text-white/50">
                  {habit.targetValue ? `${habit.targetValue} ${habit.targetUnit}` : habit.targetUnit}
                </span>
              </div>
            )}
            <button
              onClick={() => { onEdit(habit); onClose(); }}
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: "#ffffff0C" }}
            >
              <Pencil size={13} className="text-white/40" />
            </button>
          </div>

          {/* Calendar */}
          <div className="px-4 pb-4">
            {/* Day headers */}
            <div className="grid grid-cols-7 mb-2">
              {DOW.map((d) => (
                <div key={d} className="text-center">
                  <span className="text-xs font-semibold text-white/30">{d.slice(0, 3)}</span>
                </div>
              ))}
            </div>
            {/* Date grid */}
            <div className="grid grid-cols-7 gap-y-0.5">
              {calDays.map((day, i) => {
                const d = format(day, "yyyy-MM-dd");
                const inMonth = isSameMonth(day, calMonth);
                const done = logMap.has(d);
                const logVal = logMap.get(d);
                const isT = d === today;
                const future = d > today;

                if (!inMonth) return <div key={i} className="aspect-square" />;

                return (
                  <button
                    key={i}
                    onClick={() => handleDateTap(d)}
                    disabled={future}
                    className="aspect-square flex flex-col items-center justify-center rounded-full transition-all active:scale-90 relative"
                    style={{
                      backgroundColor: done ? habit.color + "CC" : "transparent",
                      outline: isT && !done ? `2px solid ${habit.color}` : "none",
                      outlineOffset: -2,
                      opacity: future ? 0.2 : 1,
                    }}
                  >
                    <span
                      className="text-sm font-medium leading-none"
                      style={{ color: done ? "white" : isT ? habit.color : "rgba(255,255,255,0.65)" }}
                    >
                      {format(day, "d")}
                    </span>
                    {done && logVal !== null && logVal !== undefined && habit.targetUnit && (
                      <span className="text-[7px] leading-none mt-0.5 text-white/70">
                        {logVal}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Month nav footer */}
        <div
          className="flex items-center justify-between px-4 py-3 flex-shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl"
            style={{ background: "#ffffff0C" }}
          >
            <CalendarDays size={14} className="text-white/40" />
            <span className="text-sm font-bold text-white/60">{format(calMonth, "MMMM yyyy")}</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCalMonth((m) => subMonths(m, 1))}
              className="w-10 h-10 rounded-2xl flex items-center justify-center"
              style={{ background: "#ffffff0C" }}
            >
              <ChevronLeft size={18} className="text-white/50" />
            </button>
            <button
              onClick={() => setCalMonth((m) => addMonths(m, 1))}
              disabled={isCurrentMonth}
              className="w-10 h-10 rounded-2xl flex items-center justify-center disabled:opacity-25"
              style={{ background: "#ffffff0C" }}
            >
              <ChevronRight size={18} className="text-white/50" />
            </button>
          </div>
        </div>
      </div>

      {/* Value input overlay */}
      {valuePrompt && (
        <div
          className="absolute inset-0 flex items-center justify-center px-6"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={(e) => e.target === e.currentTarget && setValuePrompt(null)}
        >
          <div className="w-full max-w-sm rounded-2xl p-5 shadow-2xl" style={{ background: "#1A1A28" }}>
            <p className="text-white font-bold text-base mb-0.5">Log {habit.name}</p>
            <p className="text-white/40 text-xs mb-4">
              {format(new Date(valuePrompt + "T00:00:00"), "MMMM d, yyyy")}
            </p>
            <div className="flex items-center gap-2 mb-3">
              <input
                ref={inputRef}
                type="number"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") submitValue(); if (e.key === "Escape") setValuePrompt(null); }}
                placeholder={`Enter ${habit.targetUnit}`}
                className="flex-1 rounded-xl px-4 py-3 text-sm text-white outline-none placeholder:text-white/30"
                style={{ background: "#ffffff0F" }}
              />
              <span className="text-white/40 text-sm font-semibold flex-shrink-0">{habit.targetUnit}</span>
            </div>
            {habit.targetValue && (
              <p className="text-white/25 text-xs mb-4">Target: {habit.targetValue} {habit.targetUnit}</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => setValuePrompt(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white/50"
                style={{ background: "#ffffff0F" }}
              >
                Cancel
              </button>
              <button
                onClick={submitValue}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ backgroundColor: habit.color }}
              >
                Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
