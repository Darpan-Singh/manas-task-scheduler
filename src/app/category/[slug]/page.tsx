"use client";

import { useEffect, useState, use } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Pencil, CheckCircle2, Circle } from "lucide-react";
import { format, isPast, isToday } from "date-fns";
import TaskModal from "@/components/TaskModal";
import { Task, Category, CATEGORY_CONFIG, PRIORITY_CONFIG } from "@/lib/types";

const SPACE_KEY = "active_space_id";

const slugToCategory: Record<string, Category> = {
  tasks: "TASKS",
  tests: "TESTS",
  practise: "PRACTISE",
  revision: "REVISION",
};

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const searchParams = useSearchParams();
  const category = slugToCategory[slug] || "TASKS";
  const cfg = CATEGORY_CONFIG[category];

  // spaceId from URL param (passed by home page link) or localStorage fallback
  const spaceId =
    searchParams.get("spaceId") ??
    (typeof window !== "undefined" ? localStorage.getItem(SPACE_KEY) : null);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [animating, setAnimating] = useState<Set<string>>(new Set());

  const fetchTasks = async () => {
    const qs = new URLSearchParams({ category });
    if (spaceId) qs.set("spaceId", spaceId);
    const res = await fetch(`/api/tasks?${qs}`);
    setTasks(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, [category, spaceId]);

  const handleToggle = async (task: Task) => {
    const completing = !task.completed;
    setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, completed: completing } : t));
    if (completing) {
      setAnimating((prev) => new Set(prev).add(task.id));
      setTimeout(() => setAnimating((prev) => { const s = new Set(prev); s.delete(task.id); return s; }), 500);
    }
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: completing }),
      });
    } catch {
      setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, completed: task.completed } : t));
    }
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    fetchTasks();
  };

  const handleSave = async (data: Partial<Task>) => {
    if (editing) {
      await fetch(`/api/tasks/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
    } else {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, category, spaceId }),
      });
    }
    setEditing(null);
    fetchTasks();
  };

  const pending = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);

  return (
    <div className="page-enter min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto">
      <header
        className="sticky top-0 z-10 px-5 py-4 flex items-center gap-3"
        style={{ backgroundColor: cfg.color }}
      >
        <Link href="/" className="text-white opacity-80 hover:opacity-100">
          <ArrowLeft size={22} />
        </Link>
        <div className="flex-1">
          <p className="text-white font-black text-base leading-tight">{cfg.label}</p>
          <p className="text-white/70 text-xs font-medium">{cfg.sub}</p>
        </div>
        <span className="text-white text-sm font-semibold opacity-80">
          {pending.length} left
        </span>
      </header>

      <main className="flex-1 px-4 py-4 space-y-2 pb-28">
        {loading ? (
          <div className="space-y-2">
            {[68, 50, 75, 42].map((w, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm px-4 py-3 flex items-start gap-3">
                <div className="w-[22px] h-[22px] rounded-full shimmer-light mt-0.5 flex-shrink-0" />
                <div className="flex-1 space-y-2 py-0.5">
                  <div className="h-4 rounded-full shimmer-light" style={{ width: `${w}%` }} />
                  <div className="h-3 rounded-full shimmer-light w-2/5" />
                  <div className="h-5 w-14 rounded-full shimmer-light" />
                </div>
              </div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center text-gray-400 py-16">
            <p className="text-4xl mb-3">✓</p>
            <p className="text-sm">No tasks yet. Tap + to add one!</p>
          </div>
        ) : (
          <>
            {pending.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                color={cfg.color}
                isAnimating={animating.has(task.id)}
                onToggle={() => handleToggle(task)}
                onEdit={() => { setEditing(task); setModalOpen(true); }}
                onDelete={() => handleDelete(task.id)}
              />
            ))}
            {completed.length > 0 && (
              <>
                <p className="text-sm text-gray-400 font-bold uppercase tracking-widest pt-4 pb-1 px-1">
                  Completed
                </p>
                {completed.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    color={cfg.color}
                    isAnimating={animating.has(task.id)}
                    onToggle={() => handleToggle(task)}
                    onEdit={() => { setEditing(task); setModalOpen(true); }}
                    onDelete={() => handleDelete(task.id)}
                  />
                ))}
              </>
            )}
          </>
        )}
      </main>

      <button
        onClick={() => { setEditing(null); setModalOpen(true); }}
        className="fixed bottom-6 right-6 z-20 flex items-center justify-center w-14 h-14 rounded-full shadow-xl transition-opacity hover:opacity-90"
        style={{ backgroundColor: cfg.color }}
        aria-label="Add task"
      >
        <Plus size={26} className="text-white" strokeWidth={2.5} />
      </button>

      <TaskModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditing(null); }}
        onSave={handleSave}
        initial={editing}
        defaultCategory={category}
        spaceId={spaceId}
      />
    </div>
  );
}

function TaskCard({
  task,
  color,
  isAnimating,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: Task;
  color: string;
  isAnimating: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isOverdue = !task.completed && task.dueDate && isPast(new Date(task.dueDate));
  const priorityCfg = PRIORITY_CONFIG[task.priority];

  return (
    <div className={`bg-white rounded-2xl shadow-sm px-4 py-3 flex items-start gap-3 transition-opacity ${task.completed ? "opacity-50" : ""}`}>
      <button onClick={onToggle} className="mt-0.5 flex-shrink-0">
        {task.completed ? (
          <CheckCircle2 size={22} style={{ color }} className={isAnimating ? "tick-pop" : ""} />
        ) : (
          <Circle size={22} className="text-gray-300" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-base font-semibold text-gray-800 leading-snug ${task.completed ? "line-through text-gray-400" : ""}`}>
          {task.title}
        </p>
        {task.description && (
          <p className="text-sm text-gray-400 mt-0.5 truncate">{task.description}</p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <span
            className="text-xs font-bold px-2.5 py-0.5 rounded-full"
            style={{ backgroundColor: priorityCfg.color + "20", color: priorityCfg.color }}
          >
            {priorityCfg.label}
          </span>
          {task.dueDate && (() => {
            const due = new Date(task.dueDate);
            const hasTime = due.getHours() !== 0 || due.getMinutes() !== 0;
            const dateStr = isToday(due) ? "Today" : format(due, "MMM d");
            const timeStr = hasTime ? format(due, " 'at' h:mm a") : "";
            return (
              <span className={`text-xs font-semibold flex items-center gap-1 ${isOverdue ? "text-red-500" : "text-gray-400"}`}>
                {isOverdue && <span className="text-red-500">Overdue ·</span>}
                {dateStr}{timeStr}
              </span>
            );
          })()}
        </div>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
          <Pencil size={15} />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
