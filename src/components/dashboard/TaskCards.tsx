"use client";

import { useState, useTransition } from "react";
import { completeTask } from "@/actions/goals";
import type { Task } from "@/actions/goals";

interface TaskCardsProps {
  tasks: Task[];
  phaseId: string;
  goalId: string;
  onPhaseComplete: () => void;
}

const EMOJI_LIST = ["🌱", "⚡", "🎯", "✨", "🚀", "🔥"];

export default function TaskCards({
  tasks,
  phaseId,
  goalId,
  onPhaseComplete,
}: TaskCardsProps) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Find remaining pending tasks
  const pendingTasks = tasks.filter(
    (t) => t.status === "pending" && !completedIds.has(t.id)
  );

  const activeTask = pendingTasks[0] ?? null;

  const handleComplete = (taskId: string) => {
    if (isPending || completingId) return;
    setCompletingId(taskId);

    setCompletedIds((prev) => {
      const next = new Set(prev);
      next.add(taskId);
      return next;
    });

    startTransition(async () => {
      const result = await completeTask(taskId, phaseId, goalId);
      setCompletingId(null);
      if (result.phaseComplete) {
        setTimeout(() => onPhaseComplete(), 400);
      }
    });
  };

  const toggleExpand = (task: Task, isCurrentActive: boolean) => {
    if (!isCurrentActive) return; // Locked tasks cannot be expanded
    setExpandedId((prev) => (prev === task.id ? null : task.id));
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 flex flex-col gap-3 select-none">
      {tasks.map((task, index) => {
        const isCompleted = task.status === "completed" || completedIds.has(task.id);
        const isActive = activeTask?.id === task.id;
        const isUpNext = !isCompleted && !isActive && pendingTasks[1]?.id === task.id;
        const isLocked = !isCompleted && !isActive && !isUpNext;
        const isExpanded = expandedId === task.id || (isActive && expandedId === null);
        const emoji = EMOJI_LIST[index % EMOJI_LIST.length];

        let statusText = "Complete above to unlock";
        let statusColor = "#9ca3af";
        if (isCompleted) {
          statusText = "Completed";
          statusColor = "#10b981";
        } else if (isActive) {
          statusText = "In progress";
          statusColor = "#059669";
        } else if (isUpNext) {
          statusText = "Up next";
          statusColor = "#6b7280";
        }

        return (
          <div
            key={task.id}
            onClick={() => toggleExpand(task, isActive)}
            className={`transition-all duration-200 overflow-hidden ${
              isActive ? "cursor-pointer" : isCompleted ? "opacity-60" : "opacity-80 cursor-not-allowed"
            }`}
            style={{
              background: "#ffffff",
              borderRadius: "16px",
              boxShadow: isActive
                ? "0 4px 16px rgba(16, 185, 129, 0.12), 0 1px 4px rgba(0,0,0,0.06)"
                : "0 1px 4px rgba(0,0,0,0.06)",
              border: isActive ? "1.5px solid #a7f3d0" : "1px solid #f0f0f0",
              padding: "1rem 1.15rem",
            }}
          >
            <div className="flex items-center gap-3.5">
              {/* Left emoji icon in 40x40 rounded square */}
              <div
                className="flex items-center justify-center text-lg flex-shrink-0"
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  background: isCompleted
                    ? "#ecfdf5"
                    : isActive
                    ? "#d1fae5"
                    : "#f3f4f6",
                }}
              >
                {isCompleted ? "✅" : emoji}
              </div>

              {/* Task title and status text */}
              <div className="flex-1 min-w-0">
                <p
                  className="font-bold text-sm leading-snug truncate"
                  style={{ color: isCompleted ? "#6b7280" : "#111827" }}
                >
                  {task.task_title}
                </p>
                <p
                  className="text-xs font-medium mt-0.5"
                  style={{ color: statusColor }}
                >
                  {statusText}
                </p>
              </div>

              {/* Chevron icon if active */}
              {isActive && (
                <div
                  className="text-gray-400 text-xs transition-transform duration-200"
                  style={{
                    transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                >
                  ▼
                </div>
              )}
            </div>

            {/* Expanded section: task description + Mark as done button */}
            {isActive && isExpanded && (
              <div className="mt-3.5 pt-3 border-t border-gray-100 flex flex-col gap-3">
                {task.task_detail && (
                  <p className="text-xs leading-relaxed" style={{ color: "#4b5563" }}>
                    {task.task_detail}
                  </p>
                )}

                <button
                  id="mark-task-done-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleComplete(task.id);
                  }}
                  disabled={isPending || completingId === task.id}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.99]"
                  style={{
                    background: "#ecfdf5",
                    border: "1px solid #a7f3d0",
                    color: "#065f46",
                  }}
                >
                  {completingId === task.id ? (
                    <span>Completing...</span>
                  ) : (
                    <>
                      <span>✓</span>
                      <span>Mark as done</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
