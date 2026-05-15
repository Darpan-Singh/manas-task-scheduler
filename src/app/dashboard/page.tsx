"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Target, Zap, AlertTriangle,
  TrendingUp, Clock, CalendarClock, CheckCircle2,
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { CATEGORY_CONFIG, type Category } from "@/lib/types";
import { format } from "date-fns";

/* ─── Types ────────────────────────────────────────────────── */
interface UpcomingDeadline {
  id: string; title: string; category: string; priority: string;
  dueDate: string; isOverdue: boolean; isDueToday: boolean; isDueSoon: boolean;
}
interface DashboardData {
  summary: {
    totalTasks: number; completedTasks: number; overdueTasks: number;
    completionRate: number; streak: number;
    tasksWithDeadline: number; dueToday: number; dueSoon: number;
  };
  categoryStats: Array<{ category: string; total: number; completed: number; pending: number; overdue: number }>;
  dailyData: Array<{ date: string; completed: number; created: number }>;
  priorityStats: Array<{ priority: string; total: number; completed: number }>;
  recentActivity: Array<{ id: string; title: string; category: string; completedAt: string }>;
  upcomingDeadlines: UpcomingDeadline[];
}

/* ─── Helpers ──────────────────────────────────────────────── */
const catLabel  = (c: string) => CATEGORY_CONFIG[c as Category]?.label ?? c;
const catColor  = (c: string) => CATEGORY_CONFIG[c as Category]?.color ?? "#6B7280";
const PRIORITY: Record<string, { label: string; color: string }> = {
  HIGH:   { label: "High",   color: "#F87171" },
  MEDIUM: { label: "Medium", color: "#FBBF24" },
  LOW:    { label: "Low",    color: "#34D399" },
};

/* ─── Score ring (SVG arc) ─────────────────────────────────── */
function ScoreRing({ score }: { score: number }) {
  const r = 54, cx = 70, cy = 70;
  const circ = 2 * Math.PI * r;
  const dashoffset = circ - (score / 100) * circ * 0.75; // 270° arc
  return (
    <svg width={140} height={140} className="-rotate-[135deg]">
      {/* Track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#1E2035" strokeWidth={10}
        strokeDasharray={`${circ * 0.75} ${circ * 0.25}`} strokeLinecap="round" />
      {/* Fill */}
      <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth={10}
        stroke="url(#scoreGrad)" strokeLinecap="round"
        strokeDasharray={`${circ * 0.75} ${circ * 0.25}`}
        strokeDashoffset={dashoffset}
        style={{ transition: "stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)" }}
      />
      <defs>
        <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#2AACBF" />
          <stop offset="100%" stopColor="#2BAE8E" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ─── Custom tooltip ───────────────────────────────────────── */
const GlassTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(10,10,20,0.92)", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 12, padding: "8px 12px", backdropFilter: "blur(12px)",
    }}>
      <p style={{ color: "#9CA3AF", fontSize: 10, marginBottom: 4 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color, fontSize: 12, fontWeight: 600 }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
};

/* ─── Main page ────────────────────────────────────────────── */
export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetch("/api/dashboard").then(r => r.json()).then(setData);
  }, []);

  if (!data) return (
    <div className="page-enter min-h-screen max-w-md mx-auto flex flex-col pb-16" style={{ background: "#06060F" }}>
      {/* Header skeleton */}
      <div className="px-5 pt-8 pb-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl shimmer flex-shrink-0" />
          <div className="space-y-1.5">
            <div className="h-2.5 w-16 rounded-full shimmer" />
            <div className="h-6 w-24 rounded-xl shimmer" />
          </div>
        </div>
        {/* Score card skeleton */}
        <div className="rounded-3xl p-5" style={{ background: "#0E1628", border: "1px solid rgba(42,172,191,0.1)" }}>
          <div className="flex items-center gap-5">
            <div className="w-[140px] h-[140px] rounded-full shimmer flex-shrink-0" />
            <div className="flex-1 space-y-4">
              <div className="space-y-1.5">
                <div className="h-2 w-20 rounded-full shimmer" />
                <div className="h-8 w-16 rounded-xl shimmer" />
                <div className="h-1 rounded-full shimmer" />
              </div>
              <div className="flex gap-4">
                {[1,2,3].map(i => (
                  <div key={i} className="space-y-1">
                    <div className="h-2 w-10 rounded-full shimmer" />
                    <div className="h-5 w-8 rounded shimmer" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* KPI grid skeleton */}
      <div className="px-4 space-y-3">
        <div className="grid grid-cols-2 gap-2.5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl p-3.5" style={{ background: "#0C0C1A", border: "1px solid rgba(255,255,255,0.04)" }}>
              <div className="h-2.5 w-20 rounded-full shimmer mb-2" />
              <div className="h-8 w-12 rounded-xl shimmer" />
              <div className="h-2 w-16 rounded-full shimmer mt-1.5" />
            </div>
          ))}
        </div>
        {/* Section skeletons */}
        {[180, 150, 200].map((h, i) => (
          <div key={i} className="rounded-3xl overflow-hidden" style={{ background: "#0A0A18", border: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="h-px w-full shimmer" />
            <div className="px-4 pt-4 pb-4 space-y-3">
              <div className="h-4 w-32 rounded-full shimmer" />
              <div className="rounded-xl shimmer" style={{ height: h }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const { summary, categoryStats, dailyData, priorityStats, recentActivity, upcomingDeadlines } = data;
  const score = Math.min(100, Math.round(summary.completionRate * 0.6 + summary.streak * 4));
  const enriched = categoryStats.map(c => ({ ...c, displayName: catLabel(c.category), color: catColor(c.category) }));
  const pieData = enriched.filter(c => c.total > 0).map(c => ({ name: c.displayName, value: c.total, color: c.color }));

  return (
    <div className="page-enter min-h-screen max-w-md mx-auto flex flex-col pb-16" style={{ background: "#06060F" }}>

      {/* ── Hero header ──────────────────────────────────────── */}
      <div className="relative overflow-hidden px-5 pt-8 pb-6">
        {/* Ambient glow */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full opacity-10 pointer-events-none"
          style={{ background: "radial-gradient(circle, #2AACBF 0%, transparent 70%)" }} />

        <div className="flex items-center gap-3 mb-5">
          <Link href="/"
            className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors hover:bg-white/10"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <ArrowLeft size={18} className="text-white/70" />
          </Link>
          <div>
            <p className="text-[10px] font-bold tracking-[0.25em] text-white/25 uppercase leading-none">Analytics</p>
            <h1 className="text-2xl font-black text-white leading-tight">Stats</h1>
          </div>
        </div>

        {/* Score card */}
        <div className="rounded-3xl p-5 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg,#0E1628 0%,#091320 100%)", border: "1px solid rgba(42,172,191,0.15)" }}>
          {/* Corner glow */}
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-10 -translate-y-1/2 translate-x-1/2 pointer-events-none"
            style={{ background: "radial-gradient(circle,#2AACBF,transparent)" }} />

          <div className="flex items-center gap-5">
            {/* Ring */}
            <div className="relative flex-shrink-0">
              <ScoreRing score={score} />
              <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ rotate: "0deg" }}>
                <span className="text-3xl font-black text-white leading-none">{score}</span>
                <span className="text-[9px] font-bold text-[#2AACBF] tracking-widest uppercase mt-0.5">Score</span>
              </div>
            </div>

            {/* Right stats */}
            <div className="flex-1 space-y-3">
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-widest">Completion</p>
                <p className="text-2xl font-black text-white">{summary.completionRate}<span className="text-sm font-normal text-white/40">%</span></p>
                <div className="h-1 rounded-full mt-1.5 overflow-hidden bg-white/5">
                  <div className="h-full rounded-full" style={{ width: `${summary.completionRate}%`, background: "linear-gradient(90deg,#2AACBF,#2BAE8E)" }} />
                </div>
              </div>
              <div className="flex gap-4">
                <div>
                  <p className="text-[9px] text-white/25 uppercase tracking-wider">Done</p>
                  <p className="text-base font-bold text-white">{summary.completedTasks}</p>
                </div>
                <div>
                  <p className="text-[9px] text-white/25 uppercase tracking-wider">Streak</p>
                  <p className="text-base font-bold text-[#F0A500]">{summary.streak}d</p>
                </div>
                <div>
                  <p className="text-[9px] text-white/25 uppercase tracking-wider">Overdue</p>
                  <p className="text-base font-bold text-[#F87171]">{summary.overdueTasks}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Scrollable content ───────────────────────────────── */}
      <div className="flex-1 px-4 space-y-3 pb-4">

        {/* KPI grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { icon: <Target size={14}/>, label: "Total Tasks",      value: summary.totalTasks,           sub: `${summary.totalTasks - summary.completedTasks} remaining`, color: "#2AACBF" },
            { icon: <Zap size={14}/>,    label: "Current Streak",   value: `${summary.streak} days`,     sub: "in a row",                                                 color: "#F0A500" },
            { icon: <Clock size={14}/>,  label: "Due Today",        value: summary.dueToday,             sub: "tasks today",                                              color: "#a78bfa" },
            { icon: <AlertTriangle size={14}/>, label: "Overdue",   value: summary.overdueTasks,         sub: "past deadline",                                            color: "#F87171" },
            { icon: <CalendarClock size={14}/>, label: "Deadlines", value: summary.tasksWithDeadline,    sub: "tasks with date",                                          color: "#6366f1" },
            { icon: <TrendingUp size={14}/>, label: "Completed",    value: summary.completedTasks,       sub: `of ${summary.totalTasks} total`,                           color: "#34D399" },
          ].map((k, i) => (
            <div key={i} className="rounded-2xl p-3.5 relative overflow-hidden"
              style={{ background: "#0C0C1A", border: `1px solid ${k.color}20` }}>
              <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-[0.07] -translate-y-1/2 translate-x-1/2 pointer-events-none"
                style={{ background: k.color }} />
              <div className="flex items-center gap-1.5 mb-2" style={{ color: k.color }}>
                {k.icon}
                <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">{k.label}</span>
              </div>
              <p className="text-2xl font-black text-white leading-none">{k.value}</p>
              <p className="text-[10px] text-white/25 mt-1">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Upcoming deadlines */}
        {upcomingDeadlines.length > 0 && (
          <Section title="Upcoming Deadlines" accent="#a78bfa">
            <div className="space-y-2">
              {upcomingDeadlines.map(item => {
                const color = catColor(item.category);
                const due = new Date(item.dueDate);
                const hasTime = due.getHours() !== 0 || due.getMinutes() !== 0;
                const dateStr = hasTime ? format(due, "MMM d 'at' h:mm a") : format(due, "MMM d");
                const badge = item.isOverdue
                  ? { text: "Overdue", color: "#F87171" }
                  : item.isDueToday ? { text: "Today", color: "#FBBF24" }
                  : item.isDueSoon  ? { text: "Soon",  color: "#a78bfa" }
                  : null;

                return (
                  <div key={item.id} className="flex items-center gap-3 p-3 rounded-2xl"
                    style={{ background: `${color}0D`, border: `1px solid ${color}18` }}>
                    <div className="w-0.5 self-stretch rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{item.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-bold" style={{ color }}>{catLabel(item.category)}</span>
                        <span className="text-[10px] text-white/25 flex items-center gap-0.5">
                          <Clock size={9}/>{dateStr}
                        </span>
                      </div>
                    </div>
                    {badge && (
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0"
                        style={{ background: `${badge.color}20`, color: badge.color }}>
                        {badge.text}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </Section>
        )}

        {/* Activity area chart */}
        <Section title="14-Day Activity" accent="#2AACBF">
          <ResponsiveContainer width="100%" height={150}>
            <AreaChart data={dailyData} margin={{ top: 5, right: 4, left: -28, bottom: 0 }}>
              <defs>
                <linearGradient id="gradCompleted" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2AACBF" stopOpacity={0.3}/>
                  <stop offset="100%" stopColor="#2AACBF" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gradCreated" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F0A500" stopOpacity={0.2}/>
                  <stop offset="100%" stopColor="#F0A500" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false}/>
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#374151" }} tickLine={false} interval={3}/>
              <YAxis tick={{ fontSize: 9, fill: "#374151" }} tickLine={false} allowDecimals={false}/>
              <Tooltip content={<GlassTooltip />}/>
              <Area type="monotone" dataKey="completed" name="Completed" stroke="#2AACBF" strokeWidth={2}
                fill="url(#gradCompleted)" dot={false}/>
              <Area type="monotone" dataKey="created" name="Created" stroke="#F0A500" strokeWidth={1.5}
                fill="url(#gradCreated)" dot={false} strokeDasharray="4 3"/>
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-5 justify-center mt-2">
            {[{ color: "#2AACBF", label: "Completed" }, { color: "#F0A500", label: "Created", dashed: true }].map((l, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className="h-px w-5" style={{ backgroundColor: l.color, opacity: l.dashed ? 0.6 : 1,
                  backgroundImage: l.dashed ? `repeating-linear-gradient(to right,${l.color} 0,${l.color} 4px,transparent 4px,transparent 7px)` : undefined }}/>
                <span className="text-[10px] text-white/30">{l.label}</span>
              </div>
            ))}
          </div>
        </Section>

        {/* Quadrant breakdown: donut + bars */}
        <Section title="Quadrant Breakdown" accent="#2BAE8E">
          <div className="flex gap-4 items-center">
            <div className="flex-shrink-0">
              <ResponsiveContainer width={110} height={110}>
                <PieChart>
                  <Pie data={pieData.length ? pieData : [{ name: "None", value: 1, color: "#1E2035" }]}
                    cx="50%" cy="50%" innerRadius={30} outerRadius={52} paddingAngle={3} dataKey="value">
                    {(pieData.length ? pieData : [{ color: "#1E2035" }]).map((e, i) => (
                      <Cell key={i} fill={e.color}/>
                    ))}
                  </Pie>
                  <Tooltip content={<GlassTooltip />}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2.5">
              {enriched.map(c => {
                const pct = c.total > 0 ? Math.round((c.completed / c.total) * 100) : 0;
                return (
                  <div key={c.category}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.color }}/>
                        <span className="text-xs font-semibold text-white/60">{c.displayName}</span>
                      </div>
                      <span className="text-[11px] font-bold text-white">{c.completed}<span className="text-white/30">/{c.total}</span></span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden bg-white/5">
                      <div className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, backgroundColor: c.color }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Section>

        {/* Bar chart */}
        <Section title="Tasks per Quadrant" accent="#6366f1">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={enriched} margin={{ top: 5, right: 4, left: -28, bottom: 20 }} barSize={14} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff04" vertical={false}/>
              <XAxis dataKey="displayName" tick={{ fontSize: 9, fill: "#6B7280" }} tickLine={false}
                angle={-15} textAnchor="end" interval={0}/>
              <YAxis tick={{ fontSize: 9, fill: "#374151" }} tickLine={false} allowDecimals={false}/>
              <Tooltip content={<GlassTooltip />}/>
              <Bar dataKey="completed" name="Completed" radius={[4,4,0,0]}>
                {enriched.map((e,i) => <Cell key={i} fill={e.color}/>)}
              </Bar>
              <Bar dataKey="pending" name="Pending" fill="#1A1A2E" radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Section>

        {/* Priority */}
        <Section title="Priority Breakdown" accent="#FBBF24">
          <div className="space-y-4">
            {priorityStats.map(p => {
              const pct = p.total > 0 ? Math.round((p.completed / p.total) * 100) : 0;
              const d = PRIORITY[p.priority] ?? { label: p.priority, color: "#6B7280" };
              return (
                <div key={p.priority}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color, boxShadow: `0 0 6px ${d.color}60` }}/>
                      <span className="text-sm font-semibold text-white/70">{d.label} Priority</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-white/25">{p.completed}/{p.total}</span>
                      <span className="text-sm font-black" style={{ color: d.color }}>{pct}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden bg-white/5">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: `linear-gradient(90deg,${d.color}aa,${d.color})` }}/>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>

        {/* Timeline */}
        <Section title="Recent Completions" accent="#2BAE8E">
          {recentActivity.length === 0 ? (
            <div className="py-8 text-center">
              <CheckCircle2 size={28} className="mx-auto mb-2 text-white/10"/>
              <p className="text-sm text-white/20">Complete tasks to see your timeline</p>
            </div>
          ) : (
            <div className="relative pl-6">
              {/* Gradient timeline line */}
              <div className="absolute left-[9px] top-0 bottom-0 w-px"
                style={{ background: "linear-gradient(to bottom,#2AACBF40,#2BAE8E20,transparent)" }}/>
              {recentActivity.map((item, i) => {
                const color = catColor(item.category);
                return (
                  <div key={item.id} className={`relative ${i < recentActivity.length - 1 ? "pb-4" : ""}`}>
                    {/* Dot */}
                    <div className="absolute -left-[15px] top-1 w-3 h-3 rounded-full border-2 flex-shrink-0"
                      style={{ backgroundColor: color, borderColor: "#06060F", boxShadow: `0 0 8px ${color}60` }}/>
                    <p className="text-sm font-semibold text-white leading-snug">{item.title}</p>
                    <p className="text-[10px] text-white/25 mt-0.5">
                      {catLabel(item.category)} · {item.completedAt ? format(new Date(item.completedAt), "MMM d 'at' h:mm a") : ""}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </Section>

      </div>

      <BottomNav active="stats" dark />
    </div>
  );
}

/* ─── Section card ─────────────────────────────────────────── */
function Section({ title, accent, children }: { title: string; accent: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl overflow-hidden" style={{ background: "#0A0A18", border: "1px solid rgba(255,255,255,0.05)" }}>
      {/* Accent top bar */}
      <div className="h-px w-full" style={{ background: `linear-gradient(90deg,${accent}60,transparent)` }}/>
      <div className="px-4 pt-4 pb-4">
        <h2 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <span className="w-1 h-3 rounded-full inline-block" style={{ backgroundColor: accent }}/>
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
