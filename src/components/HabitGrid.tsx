"use client";

import { useMemo } from "react";
import {
  startOfWeek, subWeeks, subMonths, format,
  eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval,
  startOfMonth, endOfMonth, isSameMonth,
} from "date-fns";

type ViewMode = "daily" | "weekly" | "monthly";

interface HabitGridProps {
  loggedDates: string[];
  color: string;
  viewMode: ViewMode;
}

export default function HabitGrid({ loggedDates, color, viewMode }: HabitGridProps) {
  const logSet = useMemo(() => new Set(loggedDates), [loggedDates]);

  const lightColor = color + "30";
  const today = format(new Date(), "yyyy-MM-dd");

  if (viewMode === "daily") {
    return <DailyGrid logSet={logSet} color={color} lightColor={lightColor} today={today} />;
  }
  if (viewMode === "weekly") {
    return <WeeklyGrid logSet={logSet} color={color} lightColor={lightColor} today={today} />;
  }
  return <MonthlyGrid logSet={logSet} color={color} lightColor={lightColor} today={today} />;
}

function DailyGrid({
  logSet, color, lightColor, today,
}: {
  logSet: Set<string>; color: string; lightColor: string; today: string;
}) {
  const now = new Date();
  // Build 70-day grid: 10 cols × 7 rows (columns = weeks, rows = days)
  const startDate = startOfWeek(subWeeks(now, 9), { weekStartsOn: 1 });
  const endDate = now;
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Pad to full weeks
  const cols: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    cols.push(days.slice(i, i + 7));
  }

  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

  return (
    <div className="flex gap-1 mt-3 overflow-x-auto pb-1">
      {/* Day labels */}
      <div className="flex flex-col gap-1 mr-0.5">
        {dayLabels.map((d, i) => (
          <div key={i} className="w-4 h-4 flex items-center justify-center text-[8px] text-gray-400">
            {i % 2 === 0 ? d : ""}
          </div>
        ))}
      </div>
      {/* Grid columns */}
      {cols.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-1">
          {week.map((day, di) => {
            const dateStr = format(day, "yyyy-MM-dd");
            const done = logSet.has(dateStr);
            const isToday = dateStr === today;
            const isFuture = dateStr > today;
            return (
              <div
                key={di}
                title={dateStr}
                className="w-4 h-4 rounded-sm transition-all"
                style={{
                  backgroundColor: isFuture
                    ? "transparent"
                    : done
                    ? color
                    : lightColor,
                  border: isToday ? `1.5px solid ${color}` : "none",
                  opacity: isFuture ? 0.2 : 1,
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

function WeeklyGrid({
  logSet, color, lightColor, today,
}: {
  logSet: Set<string>; color: string; lightColor: string; today: string;
}) {
  const now = new Date();
  const weeks = eachWeekOfInterval(
    { start: subWeeks(now, 15), end: now },
    { weekStartsOn: 1 }
  );

  return (
    <div className="flex flex-wrap gap-1.5 mt-3">
      {weeks.map((weekStart, i) => {
        const weekDays = eachDayOfInterval({
          start: weekStart,
          end: new Date(Math.min(+subWeeks(weekStart, -1) - 86400000, +now)),
        });
        const completedCount = weekDays.filter((d) =>
          logSet.has(format(d, "yyyy-MM-dd"))
        ).length;
        const pct = completedCount / 7;
        const weekLabel = format(weekStart, "MMM d");
        const isCurrent = format(now, "'W'w") === format(weekStart, "'W'w");

        return (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <div
              title={`Week of ${weekLabel}: ${completedCount}/7 days`}
              className="w-8 h-8 rounded-lg transition-all"
              style={{
                backgroundColor:
                  pct === 0 ? lightColor : pct === 1 ? color : color + Math.round(pct * 200).toString(16).padStart(2, "0"),
                border: isCurrent ? `2px solid ${color}` : "none",
              }}
            />
            <span className="text-[8px] text-gray-400">{format(weekStart, "M/d")}</span>
          </div>
        );
      })}
    </div>
  );
}

function MonthlyGrid({
  logSet, color, lightColor, today,
}: {
  logSet: Set<string>; color: string; lightColor: string; today: string;
}) {
  const now = new Date();
  const months = eachMonthOfInterval({ start: subMonths(now, 11), end: now });

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {months.map((monthStart, i) => {
        const days = eachDayOfInterval({
          start: startOfMonth(monthStart),
          end: endOfMonth(monthStart),
        });
        const completedCount = days.filter((d) =>
          logSet.has(format(d, "yyyy-MM-dd"))
        ).length;
        const pct = completedCount / days.length;
        const isCurrent = isSameMonth(monthStart, now);

        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <div
              title={`${format(monthStart, "MMM yyyy")}: ${completedCount}/${days.length} days`}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all"
              style={{
                backgroundColor:
                  pct === 0 ? lightColor : pct >= 0.7 ? color : color + "80",
                color: pct > 0.3 ? "white" : color,
                border: isCurrent ? `2px solid ${color}` : "none",
              }}
            >
              {completedCount}
            </div>
            <span className="text-[9px] text-gray-400">{format(monthStart, "MMM")}</span>
          </div>
        );
      })}
    </div>
  );
}
