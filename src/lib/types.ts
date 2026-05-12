export type Category = "TASKS" | "TESTS" | "PRACTISE" | "REVISION";
export type Priority = "LOW" | "MEDIUM" | "HIGH";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  category: Category;
  priority: Priority;
  dueDate: string | null;
  completed: boolean;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export const CATEGORY_CONFIG: Record<
  Category,
  { label: string; color: string; bg: string; ring: string; ringLight: string; text: string }
> = {
  TASKS: {
    label: "TASKS",
    color: "#E05454",
    bg: "bg-[#E05454]",
    ring: "#C03A3A",
    ringLight: "#EE8888",
    text: "text-white",
  },
  TESTS: {
    label: "TESTS",
    color: "#2AACBF",
    bg: "bg-[#2AACBF]",
    ring: "#1E8A9E",
    ringLight: "#2AACBF",
    text: "text-white",
  },
  PRACTISE: {
    label: "PRACTISE",
    color: "#F0A500",
    bg: "bg-[#F0A500]",
    ring: "#C48500",
    ringLight: "#F0A500",
    text: "text-white",
  },
  REVISION: {
    label: "REVISION",
    color: "#2BAE8E",
    bg: "bg-[#2BAE8E]",
    ring: "#1E8A6E",
    ringLight: "#2BAE8E",
    text: "text-white",
  },
};

export const PRIORITY_CONFIG: Record<Priority, { label: string; color: string }> = {
  HIGH: { label: "High", color: "#EF4444" },
  MEDIUM: { label: "Medium", color: "#F59E0B" },
  LOW: { label: "Low", color: "#10B981" },
};
