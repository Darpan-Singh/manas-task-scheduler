import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, subDays, addHours, startOfTomorrow, endOfDay, format } from "date-fns";
import type { Task } from "@prisma/client";

export async function GET() {
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  const next24h = addHours(now, 24);
  const endOfToday = endOfDay(now);

  const [allTasks, recentCompleted] = await Promise.all([
    prisma.task.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.task.findMany({
      where: { completed: true, completedAt: { gte: thirtyDaysAgo } },
      orderBy: { completedAt: "asc" },
    }),
  ]);

  // Category stats
  const categoryStats = ["TASKS", "TESTS", "PRACTISE", "REVISION"].map((cat) => {
    const catTasks = allTasks.filter((t: Task) => t.category === cat);
    const completed = catTasks.filter((t: Task) => t.completed).length;
    const total = catTasks.length;
    const overdue = catTasks.filter(
      (t: Task) => !t.completed && t.dueDate && new Date(t.dueDate) < now
    ).length;
    return { category: cat, total, completed, pending: total - completed, overdue };
  });

  // 14-day daily activity
  const dailyData: { date: string; completed: number; created: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const day = startOfDay(subDays(now, i));
    const nextDay = startOfDay(subDays(now, i - 1));
    const completed = allTasks.filter(
      (t: Task) =>
        t.completedAt &&
        new Date(t.completedAt) >= day &&
        new Date(t.completedAt) < nextDay
    ).length;
    const created = allTasks.filter(
      (t: Task) => new Date(t.createdAt) >= day && new Date(t.createdAt) < nextDay
    ).length;
    dailyData.push({ date: format(day, "MMM d"), completed, created });
  }

  // Priority stats
  const priorityStats = ["HIGH", "MEDIUM", "LOW"].map((p) => ({
    priority: p,
    total: allTasks.filter((t: Task) => t.priority === p).length,
    completed: allTasks.filter((t: Task) => t.priority === p && t.completed).length,
  }));

  // Summary stats
  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t: Task) => t.completed).length;
  const overdueTasks = allTasks.filter(
    (t: Task) => !t.completed && t.dueDate && new Date(t.dueDate) < now
  ).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const tasksWithDeadline = allTasks.filter((t: Task) => t.dueDate).length;
  const dueToday = allTasks.filter(
    (t: Task) => !t.completed && t.dueDate &&
      new Date(t.dueDate) >= now && new Date(t.dueDate) <= endOfToday
  ).length;
  const dueSoon = allTasks.filter(
    (t: Task) => !t.completed && t.dueDate &&
      new Date(t.dueDate) > now && new Date(t.dueDate) <= next24h
  ).length;

  // Streak
  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const day = startOfDay(subDays(now, i));
    const nextDay = startOfDay(subDays(now, i - 1));
    const hasCompleted = allTasks.some(
      (t: Task) =>
        t.completedAt &&
        new Date(t.completedAt) >= day &&
        new Date(t.completedAt) < nextDay
    );
    if (hasCompleted) streak++;
    else if (i > 0) break;
  }

  // Recent completions timeline
  const recentActivity = recentCompleted
    .slice(-10)
    .reverse()
    .map((t: Task) => ({
      id: t.id,
      title: t.title,
      category: t.category,
      completedAt: t.completedAt,
    }));

  // Upcoming deadlines (pending tasks with due dates, sorted soonest first, max 10)
  const upcomingDeadlines = allTasks
    .filter((t: Task) => !t.completed && t.dueDate)
    .sort((a: Task, b: Task) =>
      new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime()
    )
    .slice(0, 10)
    .map((t: Task) => ({
      id: t.id,
      title: t.title,
      category: t.category,
      priority: t.priority,
      dueDate: t.dueDate,
      isOverdue: new Date(t.dueDate!) < now,
      isDueToday: new Date(t.dueDate!) >= now && new Date(t.dueDate!) <= endOfToday,
      isDueSoon: new Date(t.dueDate!) > now && new Date(t.dueDate!) <= next24h,
    }));

  return NextResponse.json({
    summary: {
      totalTasks, completedTasks, overdueTasks, completionRate, streak,
      tasksWithDeadline, dueToday, dueSoon,
    },
    categoryStats,
    dailyData,
    priorityStats,
    recentActivity,
    upcomingDeadlines,
  });
}
