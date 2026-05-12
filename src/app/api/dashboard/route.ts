import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, subDays, format } from "date-fns";
import type { Task } from "@prisma/client";

export async function GET() {
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);

  const [allTasks, recentCompleted] = await Promise.all([
    prisma.task.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.task.findMany({
      where: { completed: true, completedAt: { gte: thirtyDaysAgo } },
      orderBy: { completedAt: "asc" },
    }),
  ]);

  const categoryStats = ["TASKS", "TESTS", "PRACTISE", "REVISION"].map((cat) => {
    const catTasks = allTasks.filter((t: Task) => t.category === cat);
    const completed = catTasks.filter((t: Task) => t.completed).length;
    const total = catTasks.length;
    const overdue = catTasks.filter(
      (t: Task) => !t.completed && t.dueDate && new Date(t.dueDate) < now
    ).length;
    return { category: cat, total, completed, pending: total - completed, overdue };
  });

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

  const priorityStats = ["HIGH", "MEDIUM", "LOW"].map((p) => ({
    priority: p,
    total: allTasks.filter((t: Task) => t.priority === p).length,
    completed: allTasks.filter((t: Task) => t.priority === p && t.completed).length,
  }));

  const totalTasks = allTasks.length;
  const completedTasks = allTasks.filter((t: Task) => t.completed).length;
  const overdueTasks = allTasks.filter(
    (t: Task) => !t.completed && t.dueDate && new Date(t.dueDate) < now
  ).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

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

  const recentActivity = recentCompleted
    .slice(-10)
    .reverse()
    .map((t: Task) => ({
      id: t.id,
      title: t.title,
      category: t.category,
      completedAt: t.completedAt,
    }));

  return NextResponse.json({
    summary: { totalTasks, completedTasks, overdueTasks, completionRate, streak },
    categoryStats,
    dailyData,
    priorityStats,
    recentActivity,
  });
}
