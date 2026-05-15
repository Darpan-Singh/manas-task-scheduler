"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import TaskModal from "@/components/TaskModal";
import BottomNav from "@/components/BottomNav";
import { Task, Category, CATEGORY_CONFIG } from "@/lib/types";

const QUADRANTS = [
  {
    id: "TASKS" as Category,
    label: "DO",
    sub: "Urgent · Important",
    color: "#E05454",
    darkColor: "#C03030",
    bg: "from-[#E05454] to-[#C03030]",
  },
  {
    id: "TESTS" as Category,
    label: "DECIDE",
    sub: "Not Urgent · Important",
    color: "#2AACBF",
    darkColor: "#1A8C9F",
    bg: "from-[#2AACBF] to-[#1A8C9F]",
  },
  {
    id: "PRACTISE" as Category,
    label: "DELEGATE",
    sub: "Urgent · Not Important",
    color: "#F0A500",
    darkColor: "#C88000",
    bg: "from-[#F0A500] to-[#C88000]",
  },
  {
    id: "REVISION" as Category,
    label: "DELETE",
    sub: "Not Urgent · Not Important",
    color: "#2BAE8E",
    darkColor: "#1A8E6E",
    bg: "from-[#2BAE8E] to-[#1A8E6E]",
  },
];

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [targetCategory, setTargetCategory] = useState<Category>("TASKS");

  // Drag state — stored in refs so pointer move doesn't cause re-renders
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredQ, setHoveredQ] = useState<Category | null>(null);
  const [fabOffset, setFabOffset] = useState({ x: 0, y: 0 });

  const fabRef = useRef<HTMLButtonElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const fabStart = useRef({ x: 0, y: 0 });

  const fetchTasks = async () => {
    const res = await fetch("/api/tasks");
    setTasks(await res.json());
    setLoading(false);
  };
  useEffect(() => { fetchTasks(); }, []);

  const handleAddTask = async (data: Partial<Task>) => {
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    fetchTasks();
  };

  // Given a pointer position, figure out which quadrant it's over
  const getQuadrant = useCallback((clientX: number, clientY: number): Category | null => {
    const grid = gridRef.current;
    if (!grid) return null;
    const r = grid.getBoundingClientRect();
    const rx = clientX - r.left;
    const ry = clientY - r.top;
    if (rx < 0 || ry < 0 || rx > r.width || ry > r.height) return null;
    const midX = r.width / 2;
    const midY = r.height / 2;
    if (rx < midX && ry < midY) return "TASKS";
    if (rx >= midX && ry < midY) return "TESTS";
    if (rx < midX && ry >= midY) return "PRACTISE";
    return "REVISION";
  }, []);

  // Pointer events — single handler for mouse + touch
  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
    fabRef.current?.setPointerCapture(e.pointerId);
    dragging.current = true;
    fabStart.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
    setFabOffset({ x: 0, y: 0 });
  };

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragging.current) return;
    const dx = e.clientX - fabStart.current.x;
    const dy = e.clientY - fabStart.current.y;
    setFabOffset({ x: dx, y: dy });
    setHoveredQ(getQuadrant(e.clientX, e.clientY));
  }, [getQuadrant]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragging.current) return;
    dragging.current = false;

    const dx = e.clientX - fabStart.current.x;
    const dy = e.clientY - fabStart.current.y;
    const moved = Math.abs(dx) + Math.abs(dy) > 12;
    const q = getQuadrant(e.clientX, e.clientY);

    // Animate back first, then open modal
    setFabOffset({ x: 0, y: 0 });
    setHoveredQ(null);
    setIsDragging(false);

    if (moved && q) {
      setTimeout(() => {
        setTargetCategory(q);
        setModalOpen(true);
      }, 180);
    }
  }, [getQuadrant]);

  const now = new Date();
  const getStats = (category: Category) => {
    const cat = tasks.filter((t) => t.category === category);
    return {
      pending: cat.filter((t) => !t.completed).length,
      completed: cat.filter((t) => t.completed).length,
      overdue: cat.filter((t) => !t.completed && t.dueDate && new Date(t.dueDate) < now).length,
    };
  };

  const hoveredCfg = hoveredQ ? QUADRANTS.find((q) => q.id === hoveredQ) : null;

  return (
    <div className="page-enter min-h-screen bg-[#0A0A0F] flex flex-col max-w-md mx-auto pb-16">
      {/* Header */}
      <header className="flex items-center justify-between px-5 pt-5 pb-3">
        <div>
          <p className="text-white/40 text-xs uppercase tracking-widest font-medium">Eisenhower Matrix</p>
          <p className="text-white font-bold text-xl">My Tasks</p>
        </div>
        <button
          onClick={() => { setTargetCategory("TASKS"); setModalOpen(true); }}
          className="px-4 py-2 rounded-full bg-white/10 border border-white/10 text-white text-sm font-semibold active:scale-95 transition-transform"
        >
          + Add Task
        </button>
      </header>

      {/* Grid */}
      <main
        ref={gridRef}
        className="flex-1 grid grid-cols-2 gap-2 px-2 relative"
        style={{ userSelect: "none" }}
      >
        {QUADRANTS.map((q) => {
          const stats = getStats(q.id);
          const isHovered = hoveredQ === q.id;
          const isDimmed = isDragging && hoveredQ !== null && !isHovered;

          return (
            <Link
              key={q.id}
              href={`/category/${q.id.toLowerCase()}`}
              onClick={(e) => isDragging && e.preventDefault()}
              className={`relative flex flex-col justify-between p-5 rounded-3xl bg-gradient-to-br ${q.bg} overflow-hidden`}
              style={{
                transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1), opacity 0.2s, box-shadow 0.2s",
                transform: isHovered ? "scale(1.04)" : isDimmed ? "scale(0.97)" : "scale(1)",
                opacity: isDimmed ? 0.55 : 1,
                boxShadow: isHovered ? `0 0 40px ${q.color}80, 0 8px 32px rgba(0,0,0,0.4)` : "0 4px 20px rgba(0,0,0,0.3)",
              }}
            >
              {/* Dot pattern */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)`,
                  backgroundSize: "18px 18px",
                  opacity: isHovered ? 0.8 : 0.4,
                  transition: "opacity 0.2s",
                }}
              />

              {/* Drop target overlay */}
              {isHovered && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/10 rounded-3xl backdrop-blur-[2px]">
                  <div
                    className="rounded-2xl px-5 py-3 text-center"
                    style={{ backgroundColor: q.darkColor + "CC" }}
                  >
                    <p className="text-white text-2xl font-black">{q.label}</p>
                    <p className="text-white/80 text-xs font-semibold mt-1">Drop to add here</p>
                  </div>
                </div>
              )}

              {/* Label */}
              <div className="relative" style={{ opacity: isHovered ? 0.3 : 1, transition: "opacity 0.2s" }}>
                <p className="text-white font-black text-xl tracking-wide">{q.label}</p>
                <p className="text-white/60 text-xs font-medium mt-0.5">{q.sub}</p>
              </div>

              {/* Stats */}
              <div className="relative mt-4 space-y-2" style={{ opacity: isHovered ? 0.3 : 1, transition: "opacity 0.2s" }}>
                {loading ? (
                  <>
                    <div className="shimmer h-12 w-16 rounded-xl" />
                    <div className="shimmer h-3 w-20 rounded-full" />
                    <div className="shimmer h-1 w-full rounded-full" />
                  </>
                ) : (
                  <>
                    <div className="flex items-end gap-2">
                      <span className="text-white text-5xl font-bold leading-none">{stats.pending}</span>
                      <span className="text-white/60 text-sm font-semibold mb-1">left</span>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                      {stats.completed > 0 && (
                        <div className="flex items-center gap-1">
                          <CheckCircle2 size={12} className="text-white/70" />
                          <span className="text-white/70 text-xs font-semibold">{stats.completed} done</span>
                        </div>
                      )}
                      {stats.overdue > 0 && (
                        <div className="flex items-center gap-1">
                          <AlertTriangle size={12} className="text-yellow-300" />
                          <span className="text-yellow-300 text-xs font-semibold">{stats.overdue} late</span>
                        </div>
                      )}
                    </div>
                    {(stats.pending + stats.completed) > 0 && (
                      <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-white/70 rounded-full"
                          style={{ width: `${Math.round((stats.completed / (stats.pending + stats.completed)) * 100)}%` }}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            </Link>
          );
        })}

        {/* Center axis lines */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 bottom-0 left-1/2 w-px bg-black/40" />
          <div className="absolute left-0 right-0 top-1/2 h-px bg-black/40" />
        </div>

        {/* FAB — always at center, draggable */}
        <button
          ref={fabRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClick={() => {
            if (!isDragging) {
              setTargetCategory("TASKS");
              setModalOpen(true);
            }
          }}
          className="absolute z-30 flex flex-col items-center justify-center rounded-full"
          style={{
            width: 72,
            height: 72,
            left: "50%",
            top: "50%",
            willChange: "transform",
            transform: isDragging
              ? `translate(calc(-50% + ${fabOffset.x}px), calc(-50% + ${fabOffset.y}px)) scale(${hoveredQ ? 1.2 : 1.05})`
              : "translate(-50%, -50%) scale(1)",
            transition: isDragging
              ? "background-color 0.15s, box-shadow 0.15s, transform 0.05s linear"
              : "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.2s, box-shadow 0.2s",
            backgroundColor: hoveredCfg ? hoveredCfg.color : "white",
            boxShadow: isDragging
              ? hoveredCfg
                ? `0 0 0 6px ${hoveredCfg.color}40, 0 0 60px ${hoveredCfg.color}80, 0 8px 32px rgba(0,0,0,0.6)`
                : "0 0 0 4px rgba(255,255,255,0.2), 0 12px 40px rgba(0,0,0,0.6)"
              : "0 0 0 3px rgba(255,255,255,0.15), 0 6px 24px rgba(0,0,0,0.5)",
            cursor: isDragging ? "grabbing" : "grab",
            touchAction: "none",
          }}
          aria-label="Drag to quadrant to add a task"
        >
          <span
            className="font-light leading-none transition-all duration-150"
            style={{
              fontSize: isDragging ? "2rem" : "1.75rem",
              color: hoveredCfg ? "white" : "#1a1a1a",
            }}
          >
            +
          </span>
          {!isDragging && (
            <span
              className="text-[9px] font-bold uppercase tracking-wider mt-0.5 leading-none"
              style={{ color: "#6b7280" }}
            >
              drag
            </span>
          )}
          {isDragging && hoveredCfg && (
            <span
              className="text-[9px] font-black uppercase tracking-wider leading-none text-white"
              style={{ marginTop: 2 }}
            >
              {hoveredCfg.label}
            </span>
          )}
        </button>
      </main>

      {/* Drag hint */}
      <div className="flex items-center justify-center py-2">
        <p
          className="text-xs font-semibold tracking-widest uppercase transition-all duration-300"
          style={{ color: isDragging && hoveredCfg ? hoveredCfg.color : "rgba(255,255,255,0.2)" }}
        >
          {isDragging && hoveredCfg
            ? `Adding to ${hoveredCfg.label}`
            : "Drag + to quadrant · Tap to quick-add"}
        </p>
      </div>

      <BottomNav active="home" dark />

      <TaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleAddTask}
        defaultCategory={targetCategory}
      />
    </div>
  );
}
