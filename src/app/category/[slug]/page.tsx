"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Pencil, CheckCircle2, Circle } from "lucide-react";
import { format, isPast } from "date-fns";
import TaskModal from "@/components/TaskModal";
import { Task, Category, CATEGORY_CONFIG, PRIORITY_CONFIG } from "@/lib/types";

const slugToCategory: Record<string, Category> = {
  tasks: "TASKS",
  tests: "TESTS",
  practise: "PRACTISE",
  revision: "REVISION",
};

export default function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const category = slugToCategory[slug] || "TASKS";
  const cfg = CATEGORY_CONFIG[category];

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);

  const fetchTasks = async () => {
    const res = await fetch(`/api/tasks?category=${category}`);
    const data = await res.json();
    setTasks(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, [category]);

  const handleToggle = async (task: Task) => {
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !task.completed }),
    });
    fetchTasks();
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
        body: JSON.stringify({ ...data, category }),
      });
    }
    setEditing(null);
    fetchTasks();
  };

  const pending = tasks.filter((t) => !t.completed);
  const completed = tasks.filter((t) => t.completed);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col max-w-md mx-auto">
      {/* Header */}
      <header
        className="sticky top-0 z-10 px-5 py-4 flex items-center gap-3"
        style={{ backgroundColor: cfg.color }}
      >
        <Link href="/" className="text-white opacity-80 hover:opacity-100">
          <ArrowLeft size={22} />
        </Link>
        <span className="flex-1 text-white font-bold tracking-widest text-sm">
          {cfg.label}
        </span>
        <span className="text-white text-sm opacity-80">
          {pending.length} to go
        </span>
      </header>

      {/* Task list */}
      <main className="flex-1 px-4 py-4 space-y-2 pb-24">
        {loading ? (
          <div className="text-center text-gray-400 py-16 text-sm">Loading...</div>
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
                onToggle={() => handleToggle(task)}
                onEdit={() => { setEditing(task); setModalOpen(true); }}
                onDelete={() => handleDelete(task.id)}
              />
            ))}
            {completed.length > 0 && (
              <>
                <p className="text-xs text-gray-400 font-semibold uppercase tracking-widest pt-4 pb-1 px-1">
                  Completed
                </p>
                {completed.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    color={cfg.color}
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

      {/* FAB */}
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
      />
    </div>
  );
}

function TaskCard({
  task,
  color,
  onToggle,
  onEdit,
  onDelete,
}: {
  task: Task;
  color: string;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isOverdue =
    !task.completed && task.dueDate && isPast(new Date(task.dueDate));
  const priorityCfg = PRIORITY_CONFIG[task.priority];

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm px-4 py-3 flex items-start gap-3 transition-opacity ${
        task.completed ? "opacity-50" : ""
      }`}
    >
      <button onClick={onToggle} className="mt-0.5 flex-shrink-0">
        {task.completed ? (
          <CheckCircle2 size={22} style={{ color }} />
        ) : (
          <Circle size={22} className="text-gray-300" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm font-medium text-gray-800 ${
            task.completed ? "line-through text-gray-400" : ""
          }`}
        >
          {task.title}
        </p>
        {task.description && (
          <p className="text-xs text-gray-400 mt-0.5 truncate">{task.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: priorityCfg.color + "20", color: priorityCfg.color }}
          >
            {priorityCfg.label}
          </span>
          {task.dueDate && (
            <span
              className={`text-[10px] font-medium ${
                isOverdue ? "text-red-500" : "text-gray-400"
              }`}
            >
              {isOverdue ? "Overdue · " : ""}
              {format(new Date(task.dueDate), "MMM d")}
            </span>
          )}
        </div>
      </div>
      <div className="flex gap-1 flex-shrink-0">
        <button
          onClick={onEdit}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Pencil size={15} />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}
