"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Home, BarChart2, Flame, Target, Zap, AlertTriangle, TrendingUp } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { CATEGORY_CONFIG, type Category } from "@/lib/types";
import { format } from "date-fns";

interface DashboardData {
  summary: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
    completionRate: number;
    streak: number;
  };
  categoryStats: Array<{
    category: string;
    total: number;
    completed: number;
    pending: number;
    overdue: number;
  }>;
  dailyData: Array<{ date: string; completed: number; created: number }>;
  priorityStats: Array<{ priority: string; total: number; completed: number }>;
  recentActivity: Array<{
    id: string;
    title: string;
    category: string;
    completedAt: string;
  }>;
}

// Maps the raw DB enum to the display label shown on the home screen
function categoryLabel(cat: string): string {
  return CATEGORY_CONFIG[cat as Category]?.label ?? cat;
}

function categoryColor(cat: string): string {
  return CATEGORY_CONFIG[cat as Category]?.color ?? "#6B7280";
}

const PRIORITY_DISPLAY: Record<string, { label: string; color: string }> = {
  HIGH:   { label: "High",   color: "#EF4444" },
  MEDIUM: { label: "Medium", color: "#F59E0B" },
  LOW:    { label: "Low",    color: "#10B981" },
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); });
  }, []);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-[#0F1117] flex items-center justify-center">
        <div className="text-gray-400 text-sm animate-pulse">Loading analytics...</div>
      </div>
    );
  }

  const { summary, categoryStats, dailyData, priorityStats, recentActivity } = data;

  // Enrich category stats with readable labels for charts
  const enrichedCategoryStats = categoryStats.map((c) => ({
    ...c,
    displayName: categoryLabel(c.category),
    color: categoryColor(c.category),
  }));

  const pieData = enrichedCategoryStats
    .filter((c) => c.total > 0)
    .map((c) => ({ name: c.displayName, value: c.total, color: c.color }));

  const streakDays = summary.streak;
  const streakText = streakDays === 1 ? "1 day" : `${streakDays} days`;

  return (
    <div className="min-h-screen bg-[#0F1117] text-white max-w-md mx-auto pb-8">
      {/* Header */}
      <header className="px-5 pt-5 pb-3 sticky top-0 bg-[#0F1117] z-10 border-b border-white/5">
        <h1 className="text-xl font-black tracking-wide text-white">Stats</h1>
        <p className="text-xs text-gray-500">Productivity Analytics</p>
      </header>

      <div className="px-4 pt-4 space-y-5">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3">
          <KpiCard
            icon={<Target size={18} />}
            label="Completion Rate"
            value={`${summary.completionRate}%`}
            sub={`${summary.completedTasks} of ${summary.totalTasks} done`}
            color="#2AACBF"
          />
          <KpiCard
            icon={<Zap size={18} />}
            label="Current Streak"
            value={streakText}
            sub="days completed in a row"
            color="#F0A500"
          />
          <KpiCard
            icon={<AlertTriangle size={18} />}
            label="Overdue"
            value={summary.overdueTasks.toString()}
            sub="tasks past their due date"
            color="#E05454"
          />
          <KpiCard
            icon={<TrendingUp size={18} />}
            label="Total Tasks"
            value={summary.totalTasks.toString()}
            sub={`${summary.totalTasks - summary.completedTasks} still to do`}
            color="#2BAE8E"
          />
        </div>

        {/* 14-day activity trend */}
        <Section title="14-Day Activity" sub="Tasks completed vs created each day">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={dailyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: "#6B7280" }}
                tickLine={false}
                interval={2}
              />
              <YAxis
                tick={{ fontSize: 10, fill: "#6B7280" }}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "#1A1D27", border: "none", borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: "#9CA3AF" }}
              />
              <Line type="monotone" dataKey="completed" stroke="#2AACBF" strokeWidth={2.5} dot={false} name="Completed" />
              <Line type="monotone" dataKey="created" stroke="#F0A500" strokeWidth={2} dot={false} strokeDasharray="5 3" name="Created" />
              <Legend wrapperStyle={{ fontSize: 11, color: "#9CA3AF" }} />
            </LineChart>
          </ResponsiveContainer>
        </Section>

        {/* Quadrant breakdown */}
        <Section title="Quadrant Breakdown" sub="Completed vs still pending per quadrant">
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={enrichedCategoryStats}
              margin={{ top: 5, right: 5, left: -20, bottom: 20 }}
              barSize={18}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
              <XAxis
                dataKey="displayName"
                tick={{ fontSize: 10, fill: "#9CA3AF" }}
                tickLine={false}
                angle={-15}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fontSize: 10, fill: "#6B7280" }} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1A1D27", border: "none", borderRadius: 12, fontSize: 12 }}
                formatter={(value, name) => [value, name === "completed" ? "Completed" : "Pending"]}
                labelFormatter={(label) => `Quadrant: ${label}`}
              />
              <Bar dataKey="completed" name="Completed" radius={[4, 4, 0, 0]}>
                {enrichedCategoryStats.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
              <Bar dataKey="pending" name="Pending" fill="#2A2D3A" radius={[4, 4, 0, 0]} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#9CA3AF" }} />
            </BarChart>
          </ResponsiveContainer>
        </Section>

        {/* Distribution donut */}
        <Section title="Task Distribution" sub="Total tasks per quadrant">
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={130} height={130}>
              <PieChart>
                <Pie
                  data={pieData.length > 0 ? pieData : [{ name: "No tasks yet", value: 1, color: "#2A2D3A" }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={38}
                  outerRadius={62}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {(pieData.length > 0 ? pieData : [{ color: "#2A2D3A" }]).map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#1A1D27", border: "none", borderRadius: 12, fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2.5">
              {enrichedCategoryStats.map((c) => (
                <div key={c.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="text-sm font-medium text-gray-300">{c.displayName}</span>
                  </div>
                  <span className="text-sm font-bold text-white">{c.total}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Priority breakdown */}
        <Section title="Priority Breakdown" sub="Completion rate by priority level">
          <div className="space-y-4">
            {priorityStats.map((p) => {
              const pct = p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0;
              const disp = PRIORITY_DISPLAY[p.priority] ?? { label: p.priority, color: "#6B7280" };
              return (
                <div key={p.priority}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-sm font-semibold text-gray-200">{disp.label} Priority</span>
                    <span className="text-sm text-gray-400">
                      {p.completed} of {p.total} done ({pct}%)
                    </span>
                  </div>
                  <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: disp.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Recent completions timeline */}
        <Section title="Recent Completions" sub="Your latest finished tasks">
          {recentActivity.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">
              Complete tasks to see your timeline here!
            </p>
          ) : (
            <div className="relative pl-5">
              <div className="absolute left-2 top-0 bottom-0 w-px bg-white/10" />
              {recentActivity.map((item) => {
                const color = categoryColor(item.category);
                const label = categoryLabel(item.category);
                return (
                  <div key={item.id} className="relative pb-4">
                    <div
                      className="absolute -left-[11px] top-1.5 w-3 h-3 rounded-full border-2 border-[#0F1117]"
                      style={{ backgroundColor: color }}
                    />
                    <p className="text-sm font-semibold text-white leading-snug">{item.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {label} ·{" "}
                      {item.completedAt
                        ? format(new Date(item.completedAt), "MMM d, h:mm a")
                        : ""}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

        {/* Productivity score */}
        <div
          className="rounded-2xl p-5 text-center"
          style={{
            background: "linear-gradient(135deg, #1A2A3A 0%, #0F2030 100%)",
            border: "1px solid #2AACBF30",
          }}
        >
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">
            Productivity Score
          </p>
          <p className="text-6xl font-black text-white mb-1">
            {Math.min(100, Math.round(summary.completionRate * 0.6 + summary.streak * 4))}
          </p>
          <p className="text-sm text-gray-400">Based on completion rate and streak</p>
          <div className="mt-3 h-2 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, Math.round(summary.completionRate * 0.6 + summary.streak * 4))}%`,
                background: "linear-gradient(90deg, #2AACBF, #2BAE8E)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Nav */}
      <nav className="sticky bottom-0 flex items-center bg-[#0F1117] border-t border-white/5 mt-5">
        <Link href="/" className="flex-1 flex flex-col items-center gap-1 py-3">
          <Home size={20} className="text-white/40" />
          <span className="text-[11px] font-semibold text-white/40">Home</span>
        </Link>
        <div className="flex-1 flex flex-col items-center gap-1 py-3">
          <BarChart2 size={20} className="text-[#2AACBF]" />
          <span className="text-[11px] font-bold text-[#2AACBF]">Stats</span>
        </div>
        <Link href="/habits" className="flex-1 flex flex-col items-center gap-1 py-3">
          <Flame size={20} className="text-white/40" />
          <span className="text-[11px] font-semibold text-white/40">Habits</span>
        </Link>
      </nav>
    </div>
  );
}

function KpiCard({
  icon, label, value, sub, color,
}: {
  icon: React.ReactNode; label: string; value: string; sub: string; color: string;
}) {
  return (
    <div className="bg-[#1A1D27] rounded-2xl p-4 border border-white/5">
      <div className="flex items-center gap-2 mb-2" style={{ color }}>
        {icon}
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{label}</span>
      </div>
      <p className="text-2xl font-bold text-white leading-tight">{value}</p>
      <p className="text-xs text-gray-500 mt-1">{sub}</p>
    </div>
  );
}

function Section({
  title, sub, children,
}: {
  title: string; sub: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-[#1A1D27] rounded-2xl p-4 border border-white/5">
      <div className="mb-3">
        <h2 className="text-base font-bold text-white">{title}</h2>
        <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
      </div>
      {children}
    </div>
  );
}
