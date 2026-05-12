"use client";

import { useMemo, useState } from "react";
import {
  startOfMonth, endOfMonth, eachDayOfInterval,
  startOfWeek, endOfWeek, format, addMonths, subMonths,
  isSameMonth, isToday, subWeeks, addWeeks,
  eachDayOfInterval as eachDay,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type ViewMode = "daily" | "weekly" | "monthly";

interface HabitGridProps {
  loggedDates: string[];
  color: string;
  viewMode: ViewMode;
  selectedMonth?: Date;
  onMonthChange?: (month: Date) => void;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function HabitGrid({
  loggedDates, color, viewMode, selectedMonth: controlledMonth, onMonthChange,
}: HabitGridProps) {
  const logSet = useMemo(() => new Set(loggedDates), [loggedDates]);
  const [internalMonth, setInternalMonth] = useState(new Date());
  const [selectedWeek, setSelectedWeek] = useState(new Date());

  const selectedMonth = controlledMonth ?? internalMonth;
  const setSelectedMonth = onMonthChange ?? setInternalMonth;

  if (viewMode === "daily") return <DailyGrid logSet={logSet} color={color} />;
  if (viewMode === "weekly") return (
    <WeeklyView
      logSet={logSet}
      color={color}
      selectedWeek={selectedWeek}
      onPrev={() => setSelectedWeek((w) => subWeeks(w, 1))}
      onNext={() => setSelectedWeek((w) => addWeeks(w, 1))}
    />
  );
  return (
    <MonthlyView
      logSet={logSet}
      color={color}
      selectedMonth={selectedMonth}
      onPrev={() => setSelectedMonth(subMonths(selectedMonth, 1))}
      onNext={() => setSelectedMonth(addMonths(selectedMonth, 1))}
    />
  );
}

// ─── Daily: contribution graph (10 weeks × 7 days) ───────────────────────────
function DailyGrid({ logSet, color }: { logSet: Set<string>; color: string }) {
  const now = new Date();
  const start = startOfWeek(subWeeks(now, 9), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end: now });

  // Group into weeks (columns of 7)
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  const today = format(now, "yyyy-MM-dd");

  return (
    <div className="mt-3">
      <div className="flex gap-1.5">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1.5">
            {week.map((day, di) => {
              const d = format(day, "yyyy-MM-dd");
              const done = logSet.has(d);
              const isT = d === today;
              return (
                <div
                  key={di}
                  title={d}
                  className="rounded-md"
                  style={{
                    width: 14,
                    height: 14,
                    backgroundColor: done ? color : color + "28",
                    outline: isT ? `2px solid ${color}` : "none",
                    outlineOffset: 1,
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Weekly: show 7 days of the selected week as large squares ────────────────
function WeeklyView({
  logSet, color, selectedWeek, onPrev, onNext,
}: {
  logSet: Set<string>;
  color: string;
  selectedWeek: Date;
  onPrev: () => void;
  onNext: () => void;
}) {
  const start = startOfWeek(selectedWeek, { weekStartsOn: 1 });
  const end = endOfWeek(selectedWeek, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start, end });
  const today = format(new Date(), "yyyy-MM-dd");
  const isFuture = (d: Date) => format(d, "yyyy-MM-dd") > today;
  const weekLabel = `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`;
  const completed = days.filter((d) => logSet.has(format(d, "yyyy-MM-dd"))).length;

  return (
    <div className="mt-3">
      {/* Week navigator */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={onPrev} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
          <ChevronLeft size={16} className="text-gray-400" />
        </button>
        <div className="text-center">
          <p className="text-xs font-semibold text-gray-300">{weekLabel}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">{completed} of 7 days completed</p>
        </div>
        <button
          onClick={onNext}
          disabled={format(start, "yyyy-MM-dd") >= format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd")}
          className="p-1 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30"
        >
          <ChevronRight size={16} className="text-gray-400" />
        </button>
      </div>

      {/* 7 day squares */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day, i) => {
          const d = format(day, "yyyy-MM-dd");
          const done = logSet.has(d);
          const isT = d === today;
          const future = isFuture(day);
          return (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-[9px] font-bold text-gray-500 uppercase">
                {DAY_LABELS[i].slice(0, 2)}
              </span>
              <div
                className="w-full aspect-square rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: future ? color + "10" : done ? color : color + "28",
                  outline: isT ? `2px solid ${color}` : "none",
                  outlineOffset: 1,
                }}
              >
                <span
                  className="text-[11px] font-bold"
                  style={{ color: done ? "white" : future ? color + "50" : color + "80" }}
                >
                  {format(day, "d")}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Monthly: full calendar grid for selected month ───────────────────────────
export function MonthlyView({
  logSet, color, selectedMonth, onPrev, onNext,
}: {
  logSet: Set<string>;
  color: string;
  selectedMonth: Date;
  onPrev: () => void;
  onNext: () => void;
}) {
  const now = new Date();
  const today = format(now, "yyyy-MM-dd");
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  // Pad to full weeks (Mon start)
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const allDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const completedCount = daysInMonth.filter((d) => logSet.has(format(d, "yyyy-MM-dd"))).length;
  const totalDays = daysInMonth.length;
  const pct = Math.round((completedCount / totalDays) * 100);

  const isFutureDay = (d: Date) => format(d, "yyyy-MM-dd") > today;
  const isCurrentMonth = isSameMonth(selectedMonth, now);
  const isFutureMonth = format(monthStart, "yyyy-MM") > format(now, "yyyy-MM");

  return (
    <div className="mt-3">
      {/* Month navigator */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={onPrev} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
          <ChevronLeft size={15} className="text-gray-400" />
        </button>
        <div className="text-center">
          <p className="text-sm font-bold text-gray-200">{format(selectedMonth, "MMMM yyyy")}</p>
          {!isFutureMonth && (
            <p className="text-[10px] text-gray-500 mt-0.5">
              {completedCount} of {totalDays} days · {pct}%
            </p>
          )}
        </div>
        <button
          onClick={onNext}
          disabled={isCurrentMonth}
          className="p-1.5 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-30"
        >
          <ChevronRight size={15} className="text-gray-400" />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center">
            <span className="text-[9px] font-bold text-gray-600 uppercase">{d.slice(0, 1)}</span>
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {allDays.map((day, i) => {
          const d = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, selectedMonth);
          const done = logSet.has(d);
          const isT = d === today;
          const future = isFutureDay(day);

          if (!inMonth) {
            return <div key={i} style={{ aspectRatio: "1" }} />;
          }

          return (
            <div
              key={i}
              title={format(day, "MMMM d")}
              className="rounded-lg flex items-center justify-center"
              style={{
                aspectRatio: "1",
                backgroundColor: future
                  ? color + "12"
                  : done
                  ? color
                  : color + "2A",
                outline: isT ? `2px solid ${color}` : "none",
                outlineOffset: 1,
                opacity: future ? 0.5 : 1,
              }}
            >
              <span
                className="text-[10px] font-semibold leading-none"
                style={{
                  color: done ? "white" : future ? color + "60" : color + "90",
                }}
              >
                {format(day, "d")}
              </span>
            </div>
          );
        })}
      </div>

      {/* Month stats bar */}
      {!isFutureMonth && totalDays > 0 && (
        <div className="mt-3">
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: color + "25" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{ width: `${pct}%`, backgroundColor: color }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
