"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { LayoutDashboard, Flame, CheckCircle2, AlertTriangle } from "lucide-react";
import TaskModal from "@/components/TaskModal";
import { Task, Category, CATEGORY_CONFIG } from "@/lib/types";

// Eisenhower quadrant config mapped to our categories
const QUADRANTS = [
  {
    id: "TASKS" as Category,
    label: "DO",
    sub: "Urgent · Important",
    color: "#E05454",
    bg: "from-[#E05454] to-[#C83C3C]",
    glow: "#E0545440",
    position: "top-left",
  },
  {
    id: "TESTS" as Category,
    label: "DECIDE",
    sub: "Not Urgent · Important",
    color: "#2AACBF",
    bg: "from-[#2AACBF] to-[#1A8C9F]",
    glow: "#2AACBF40",
    position: "top-right",
  },
  {
    id: "PRACTISE" as Category,
    label: "DELEGATE",
    sub: "Urgent · Not Important",
    color: "#F0A500",
    bg: "from-[#F0A500] to-[#D08800]",
    glow: "#F0A50040",
    position: "bottom-left",
  },
  {
    id: "REVISION" as Category,
    label: "DELETE",
    sub: "Not Urgent · Not Important",
    color: "#2BAE8E",
    bg: "from-[#2BAE8E] to-[#1A8E6E]",
    glow: "#2BAE8E40",
    position: "bottom-right",
  },
];

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [targetCategory, setTargetCategory] = useState<Category>("TASKS");
  const [hoveredQuadrant, setHoveredQuadrant] = useState<Category | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const [fabOrigin, setFabOrigin] = useState({ x: 0, y: 0 });
  const fabRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragActive = useRef(false);
  const startPos = useRef({ x: 0, y: 0 });

  const fetchTasks = async () => {
    const res = await fetch("/api/tasks");
    const data = await res.json();
    setTasks(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  // Detect which quadrant a point is in
  const getQuadrantAtPoint = useCallback((clientX: number, clientY: number): Category | null => {
    const container = containerRef.current;
    if (!container) return null;
    const rect = container.getBoundingClientRect();
    const relX = clientX - rect.left;
    const relY = clientY - rect.top;
    const midX = rect.width / 2;
    const midY = rect.height / 2;
    if (relX < midX && relY < midY) return "TASKS";
    if (relX >= midX && relY < midY) return "TESTS";
    if (relX < midX && relY >= midY) return "PRACTISE";
    return "REVISION";
  }, []);

  // Touch drag handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    dragActive.current = true;
    setIsDragging(true);
    startPos.current = { x: touch.clientX, y: touch.clientY };
    setDragPos({ x: 0, y: 0 });
    if (fabRef.current) {
      const r = fabRef.current.getBoundingClientRect();
      setFabOrigin({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragActive.current) return;
    e.preventDefault();
    const touch = e.touches[0];
    setDragPos({
      x: touch.clientX - startPos.current.x,
      y: touch.clientY - startPos.current.y,
    });
    const q = getQuadrantAtPoint(touch.clientX, touch.clientY);
    setHoveredQuadrant(q);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!dragActive.current) return;
    dragActive.current = false;
    setIsDragging(false);
    setDragPos({ x: 0, y: 0 });

    const touch = e.changedTouches[0];
    const q = getQuadrantAtPoint(touch.clientX, touch.clientY);
    if (q) {
      setTargetCategory(q);
      setModalOpen(true);
    }
    setHoveredQuadrant(null);
  };

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    dragActive.current = true;
    setIsDragging(true);
    startPos.current = { x: e.clientX, y: e.clientY };
    setDragPos({ x: 0, y: 0 });
    if (fabRef.current) {
      const r = fabRef.current.getBoundingClientRect();
      setFabOrigin({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
    }
  };

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragActive.current) return;
      setDragPos({
        x: e.clientX - startPos.current.x,
        y: e.clientY - startPos.current.y,
      });
      const q = getQuadrantAtPoint(e.clientX, e.clientY);
      setHoveredQuadrant(q);
    };
    const onMouseUp = (e: MouseEvent) => {
      if (!dragActive.current) return;
      dragActive.current = false;
      setIsDragging(false);
      setDragPos({ x: 0, y: 0 });
      const q = getQuadrantAtPoint(e.clientX, e.clientY);
      if (q && Math.abs(e.clientX - startPos.current.x) + Math.abs(e.clientY - startPos.current.y) > 10) {
        setTargetCategory(q);
        setModalOpen(true);
      }
      setHoveredQuadrant(null);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [getQuadrantAtPoint]);

  const handleAddTask = async (data: Partial<Task>) => {
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    fetchTasks();
  };

  const now = new Date();

  const getStats = (category: Category) => {
    const cat = tasks.filter((t) => t.category === category);
    return {
      pending: cat.filter((t) => !t.completed).length,
      completed: cat.filter((t) => t.completed).length,
      overdue: cat.filter((t) => !t.completed && t.dueDate && new Date(t.dueDate) < now).length,
    };
  };

  return (
    <div className="min-h-screen bg-[#0A0A0F] flex flex-col max-w-md mx-auto relative overflow-hidden select-none">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-4 z-10 relative">
        <Link href="/dashboard">
          <LayoutDashboard size={20} className="text-white/50 hover:text-white/80 transition-colors" />
        </Link>
        <div className="text-center">
          <p className="text-[10px] text-white/40 uppercase tracking-widest">Eisenhower Matrix</p>
          <p className="text-white font-semibold text-sm">My Tasks</p>
        </div>
        <Link href="/habits">
          <Flame size={20} className="text-purple-400/70 hover:text-purple-400 transition-colors" />
        </Link>
      </header>

      {/* Quadrant grid */}
      <div
        ref={containerRef}
        className="flex-1 grid grid-cols-2 relative"
        style={{ minHeight: "calc(100vh - 120px)" }}
      >
        {QUADRANTS.map((q) => {
          const stats = getStats(q.id);
          const cfg = CATEGORY_CONFIG[q.id];
          const isHovered = hoveredQuadrant === q.id;

          return (
            <Link
              key={q.id}
              href={`/category/${q.id.toLowerCase()}`}
              className={`relative flex flex-col justify-between p-5 bg-gradient-to-br ${q.bg} overflow-hidden transition-all duration-200`}
              style={{
                boxShadow: isHovered ? `inset 0 0 60px rgba(255,255,255,0.15)` : "none",
                transform: isHovered ? "scale(1.02)" : "scale(1)",
              }}
              onClick={(e) => isDragging && e.preventDefault()}
            >
              {/* Subtle background pattern */}
              <div
                className="absolute inset-0 opacity-5"
                style={{
                  backgroundImage: `radial-gradient(circle at 20% 80%, white 1px, transparent 1px)`,
                  backgroundSize: "20px 20px",
                }}
              />

              {/* Drop hint when dragging */}
              {isDragging && (
                <div
                  className="absolute inset-0 border-4 rounded-none transition-all duration-150 pointer-events-none"
                  style={{
                    borderColor: isHovered ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.1)",
                    backgroundColor: isHovered ? "rgba(255,255,255,0.1)" : "transparent",
                  }}
                />
              )}
              {isDragging && isHovered && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-4 py-2">
                    <p className="text-white text-xs font-bold">Drop to add here</p>
                  </div>
                </div>
              )}

              {/* Top: quadrant label */}
              <div>
                <p className="text-white/60 text-[9px] font-bold tracking-widest uppercase">
                  {q.label}
                </p>
                <p className="text-white/40 text-[8px] mt-0.5">{q.sub}</p>
              </div>

              {/* Stats */}
              <div className="space-y-2">
                <div className="flex items-end gap-2">
                  <span className="text-white text-4xl font-light leading-none">
                    {stats.pending}
                  </span>
                  <span className="text-white/50 text-xs mb-1">pending</span>
                </div>

                <div className="flex gap-3">
                  {stats.completed > 0 && (
                    <div className="flex items-center gap-1">
                      <CheckCircle2 size={10} className="text-white/60" />
                      <span className="text-white/60 text-[10px]">{stats.completed} done</span>
                    </div>
                  )}
                  {stats.overdue > 0 && (
                    <div className="flex items-center gap-1">
                      <AlertTriangle size={10} className="text-yellow-300/80" />
                      <span className="text-yellow-300/80 text-[10px]">{stats.overdue} late</span>
                    </div>
                  )}
                </div>

                {/* Mini progress bar */}
                {(stats.pending + stats.completed) > 0 && (
                  <div className="h-0.5 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white/60 rounded-full"
                      style={{
                        width: `${Math.round((stats.completed / (stats.pending + stats.completed)) * 100)}%`,
                      }}
                    />
                  </div>
                )}
              </div>
            </Link>
          );
        })}

        {/* Center axis lines */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-black/30" />
          <div className="absolute left-0 right-0 top-1/2 h-px bg-black/30" />
        </div>

        {/* Axis labels */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 flex justify-between px-2 pointer-events-none">
          <span className="text-white/25 text-[8px] font-bold uppercase tracking-widest rotate-180 [writing-mode:vertical-lr]">
            Urgent
          </span>
          <span className="text-white/25 text-[8px] font-bold uppercase tracking-widest [writing-mode:vertical-lr]">
            Not Urgent
          </span>
        </div>
        <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 flex flex-col justify-between py-2 pointer-events-none">
          <span className="text-white/25 text-[8px] font-bold uppercase tracking-widest text-center">
            Important
          </span>
          <span className="text-white/25 text-[8px] font-bold uppercase tracking-widest text-center">
            Not Important
          </span>
        </div>

        {/* FAB — draggable */}
        <button
          ref={fabRef}
          className="absolute z-20 flex flex-col items-center justify-center rounded-full shadow-2xl cursor-grab active:cursor-grabbing"
          style={{
            width: 64,
            height: 64,
            left: "50%",
            top: "50%",
            transform: isDragging
              ? `translate(calc(-50% + ${dragPos.x}px), calc(-50% + ${dragPos.y}px)) scale(1.15)`
              : "translate(-50%, -50%) scale(1)",
            backgroundColor: isDragging
              ? hoveredQuadrant
                ? CATEGORY_CONFIG[hoveredQuadrant].color
                : "white"
              : "white",
            transition: isDragging ? "background-color 0.15s, box-shadow 0.15s" : "transform 0.3s cubic-bezier(0.34,1.56,0.64,1), background-color 0.15s",
            boxShadow: isDragging
              ? `0 0 40px ${hoveredQuadrant ? CATEGORY_CONFIG[hoveredQuadrant].color + "80" : "rgba(255,255,255,0.3)"}`
              : "0 4px 24px rgba(0,0,0,0.5)",
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={() => {
            if (!isDragging) {
              setTargetCategory("TASKS");
              setModalOpen(true);
            }
          }}
          aria-label="Add task — drag to quadrant or tap"
        >
          <span
            className="text-2xl font-light leading-none transition-colors duration-150"
            style={{ color: isDragging && hoveredQuadrant ? "white" : "#1a1a1a" }}
          >
            +
          </span>
          {!isDragging && (
            <span className="text-[7px] text-gray-400 mt-0.5 leading-none">drag</span>
          )}
        </button>
      </div>

      {/* Bottom hint */}
      <div className="flex items-center justify-center py-3">
        <p className="text-white/20 text-[9px] tracking-widest uppercase">
          Drag + to quadrant · Tap to add
        </p>
      </div>

      <TaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleAddTask}
        defaultCategory={targetCategory}
      />
    </div>
  );
}
