"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Target, Zap, AlertTriangle, TrendingUp } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { CATEGORY_CONFIG } from "@/lib/types";
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

const CAT_COLORS = {
  TASKS: "#E05454",
  TESTS: "#2AACBF",
  PRACTISE: "#F0A500",
  REVISION: "#2BAE8E",
};

const PRIORITY_COLORS = { HIGH: "#EF4444", MEDIUM: "#F59E0B", LOW: "#10B981" };

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

  const pieData = categoryStats
    .filter((c) => c.total > 0)
    .map((c) => ({
      name: c.category,
      value: c.total,
      color: CAT_COLORS[c.category as keyof typeof CAT_COLORS],
    }));

  return (
    <div className="min-h-screen bg-[#0F1117] text-white max-w-md mx-auto pb-8">
      {/* Header */}
      <header className="flex items-center gap-3 px-5 py-4 sticky top-0 bg-[#0F1117] z-10 border-b border-white/5">
        <Link href="/" className="text-gray-400 hover:text-white transition-colors">
          <ArrowLeft size={22} />
        </Link>
        <div>
          <h1 className="text-base font-bold tracking-wide">Dashboard</h1>
          <p className="text-[10px] text-gray-500">Productivity Analytics</p>
        </div>
      </header>

      <div className="px-4 pt-4 space-y-5">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 gap-3">
          <KpiCard
            icon={<Target size={18} />}
            label="Completion Rate"
            value={`${summary.completionRate}%`}
            sub={`${summary.completedTasks} / ${summary.totalTasks} tasks`}
            color="#2AACBF"
          />
          <KpiCard
            icon={<Zap size={18} />}
            label="Day Streak"
            value={`${summary.streak}d`}
            sub="consecutive days"
            color="#F0A500"
          />
          <KpiCard
            icon={<AlertTriangle size={18} />}
            label="Overdue"
            value={summary.overdueTasks.toString()}
            sub="need attention"
            color="#E05454"
          />
          <KpiCard
            icon={<TrendingUp size={18} />}
            label="Total Tasks"
            value={summary.totalTasks.toString()}
            sub={`${summary.totalTasks - summary.completedTasks} remaining`}
            color="#2BAE8E"
          />
        </div>

        {/* 14-day completion trend */}
        <Section title="14-Day Activity" sub="completed vs created">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={dailyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 9, fill: "#6B7280" }}
                tickLine={false}
                interval={2}
              />
              <YAxis tick={{ fontSize: 9, fill: "#6B7280" }} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1A1D27", border: "none", borderRadius: 12, fontSize: 11 }}
                labelStyle={{ color: "#9CA3AF" }}
              />
              <Line
                type="monotone"
                dataKey="completed"
                stroke="#2AACBF"
                strokeWidth={2}
                dot={false}
                name="Completed"
              />
              <Line
                type="monotone"
                dataKey="created"
                stroke="#F0A500"
                strokeWidth={2}
                dot={false}
                strokeDasharray="4 2"
                name="Created"
              />
              <Legend
                wrapperStyle={{ fontSize: 10, color: "#9CA3AF" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Section>

        {/* Category breakdown bar */}
        <Section title="Category Breakdown" sub="pending vs completed">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart
              data={categoryStats}
              margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
              barSize={16}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
              <XAxis
                dataKey="category"
                tick={{ fontSize: 9, fill: "#6B7280" }}
                tickLine={false}
                tickFormatter={(v) => v.slice(0, 3)}
              />
              <YAxis tick={{ fontSize: 9, fill: "#6B7280" }} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1A1D27", border: "none", borderRadius: 12, fontSize: 11 }}
              />
              <Bar dataKey="completed" name="Completed" radius={[4, 4, 0, 0]}>
                {categoryStats.map((entry) => (
                  <Cell
                    key={entry.category}
                    fill={CAT_COLORS[entry.category as keyof typeof CAT_COLORS]}
                  />
                ))}
              </Bar>
              <Bar dataKey="pending" name="Pending" fill="#2A2D3A" radius={[4, 4, 0, 0]} />
              <Legend wrapperStyle={{ fontSize: 10, color: "#9CA3AF" }} />
            </BarChart>
          </ResponsiveContainer>
        </Section>

        {/* Distribution pie */}
        <Section title="Task Distribution" sub="by category">
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie
                  data={pieData.length > 0 ? pieData : [{ name: "No data", value: 1, color: "#2A2D3A" }]}
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {(pieData.length > 0 ? pieData : [{ color: "#2A2D3A" }]).map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: "#1A1D27", border: "none", borderRadius: 12, fontSize: 11 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2">
              {categoryStats.map((c) => (
                <div key={c.category} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: CAT_COLORS[c.category as keyof typeof CAT_COLORS] }}
                    />
                    <span className="text-[11px] text-gray-400">{c.category.slice(0, 3)}</span>
                  </div>
                  <span className="text-[11px] font-semibold text-white">{c.total}</span>
                </div>
              ))}
            </div>
          </div>
        </Section>

        {/* Priority overview */}
        <Section title="Priority Overview" sub="task distribution by urgency">
          <div className="space-y-3">
            {priorityStats.map((p) => {
              const pct = p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0;
              const color = PRIORITY_COLORS[p.priority as keyof typeof PRIORITY_COLORS];
              return (
                <div key={p.priority}>
                  <div className="flex justify-between mb-1">
                    <span className="text-xs text-gray-400">{p.priority}</span>
                    <span className="text-xs text-gray-400">{p.completed}/{p.total} · {pct}%</span>
                  </div>
                  <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Recent activity timeline */}
        <Section title="Recent Completions" sub="your latest wins">
          {recentActivity.length === 0 ? (
            <p className="text-xs text-gray-500 py-4 text-center">
              Complete tasks to see your timeline here!
            </p>
          ) : (
            <div className="relative pl-4">
              <div className="absolute left-1.5 top-0 bottom-0 w-px bg-white/10" />
              {recentActivity.map((item) => {
                const color = CAT_COLORS[item.category as keyof typeof CAT_COLORS];
                return (
                  <div key={item.id} className="relative flex items-start gap-3 pb-4">
                    <div
                      className="absolute -left-[3px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-[#0F1117]"
                      style={{ backgroundColor: color }}
                    />
                    <div className="pl-4">
                      <p className="text-xs font-medium text-white leading-snug">{item.title}</p>
                      <p className="text-[10px] text-gray-500 mt-0.5">
                        {item.category} ·{" "}
                        {item.completedAt
                          ? format(new Date(item.completedAt), "MMM d, h:mm a")
                          : ""}
                      </p>
                    </div>
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
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-1">
            Productivity Score
          </p>
          <p className="text-5xl font-bold text-white mb-1">
            {Math.min(100, Math.round(summary.completionRate * 0.6 + summary.streak * 4))}
          </p>
          <p className="text-xs text-gray-400">
            Based on completion rate + streak
          </p>
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
    </div>
  );
}

function KpiCard({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="bg-[#1A1D27] rounded-2xl p-4 border border-white/5">
      <div className="flex items-center gap-2 mb-2" style={{ color }}>
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          {label}
        </span>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-[10px] text-gray-500 mt-0.5">{sub}</p>
    </div>
  );
}

function Section({
  title,
  sub,
  children,
}: {
  title: string;
  sub: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#1A1D27] rounded-2xl p-4 border border-white/5">
      <div className="mb-3">
        <h2 className="text-sm font-semibold text-white">{title}</h2>
        <p className="text-[10px] text-gray-500">{sub}</p>
      </div>
      {children}
    </div>
  );
}
