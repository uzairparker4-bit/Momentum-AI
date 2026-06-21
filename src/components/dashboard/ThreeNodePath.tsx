"use client";

import { useState, useTransition } from "react";
import { completeTask } from "@/actions/goals";
import type { Task } from "@/actions/goals";

interface ThreeNodePathProps {
  tasks: Task[];
  phaseId: string;
  goalId: string;
  onPhaseComplete: () => void;
}

export default function ThreeNodePath({
  tasks,
  phaseId,
  goalId,
  onPhaseComplete,
}: ThreeNodePathProps) {
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleComplete = (taskId: string) => {
    if (isPending || completingId) return;
    setCompletingId(taskId);

    // Optimistically hide the completed task to trigger smooth animation
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

  // Show up to 3 nodes, filtering out optimistically completed ones
  const pending = tasks.filter((t) => t.status === "pending" && !completedIds.has(t.id));
  const visible = pending.slice(0, 3);

  const focusTask = visible[0];

  if (!focusTask) return null;

  const nodeCount = visible.length;
  // x positions for 1, 2, or 3 nodes centred in viewBox
  const positions: Record<number, number[]> = {
    1: [400],
    2: [220, 580],
    3: [130, 400, 670],
  };
  const xs = positions[nodeCount] ?? positions[3];

  return (
    <div className="w-full max-w-2xl mx-auto px-4 select-none">
      <div className="relative w-full h-60 sm:h-80">
        {/* SVG connector path */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 800 320"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {nodeCount >= 2 && (
            <path
              d={`M ${xs[0]} 160 C ${(xs[0] + xs[1]) / 2} 120, ${(xs[0] + xs[1]) / 2} 200, ${xs[1]} 160`}
              className="node-connector"
              style={{ stroke: "#2a2a2a", strokeDasharray: "6 5" }}
            />
          )}
          {nodeCount >= 3 && (
            <path
              d={`M ${xs[1]} 160 C ${(xs[1] + xs[2]) / 2} 120, ${(xs[1] + xs[2]) / 2} 200, ${xs[2]} 160`}
              className="node-connector"
              style={{ stroke: "#2a2a2a", strokeDasharray: "6 5", opacity: 0.5 }}
            />
          )}
        </svg>

        {/* Nodes */}
        {visible.map((task, idx) => {
          const isFocus = idx === 0;
          const pct = ((xs[idx] / 800) * 100).toFixed(2);
          const completing = completingId === task.id;

          return (
            <div
              key={task.id}
              className={`absolute flex flex-col items-center transition-all duration-300 ${
                isFocus
                  ? "w-28 sm:w-44"
                  : idx === 1
                  ? "w-24 sm:w-36"
                  : "w-20 sm:w-32"
              }`}
              style={{
                left: `${pct}%`,
                top: "50%",
                transform: "translate(-50%, -50%)",
              }}
            >
              {/* Circle node */}
              <button
                id={isFocus ? "focus-node-btn" : `node-${idx}-btn`}
                onClick={() => isFocus && handleComplete(task.id)}
                disabled={!isFocus || !!completingId}
                title={isFocus ? "Mark complete" : undefined}
                className={`rounded-full flex flex-col items-center justify-center p-2.5 transition-all duration-300 flex-shrink-0 ${
                  isFocus
                    ? "w-[80px] h-[80px] sm:w-[120px] sm:h-[120px]"
                    : idx === 1
                    ? "w-[64px] h-[64px] sm:w-[88px] sm:h-[88px]"
                    : "w-[52px] h-[52px] sm:w-[72px] sm:h-[72px]"
                }`}
                style={{
                  background: isFocus
                    ? "rgba(79,209,197,0.1)"
                    : idx === 1
                    ? "rgba(79,209,197,0.04)"
                    : "rgba(255,255,255,0.02)",
                  border: isFocus
                    ? "2px solid #4FD1C5"
                    : idx === 1
                    ? "1px solid rgba(79,209,197,0.3)"
                    : "1px solid #2a2a2a",
                  cursor: isFocus ? "pointer" : "default",
                  ...(isFocus && !completing
                    ? { animation: "pulse-glow 3s ease-in-out infinite" }
                    : {}),
                  ...(completing
                    ? { opacity: 0.3, transform: "scale(0.9)" }
                    : {}),
                }}
              >
                <p
                  className={`text-center font-light leading-tight overflow-hidden line-clamp-3 select-none ${
                    isFocus
                      ? "text-[10px] sm:text-[11px] font-medium"
                      : idx === 1
                      ? "text-[9px] sm:text-[10px]"
                      : "text-[8px] sm:text-[10px]"
                  }`}
                  style={{
                    color: isFocus ? "#4FD1C5" : idx === 1 ? "rgba(79,209,197,0.6)" : "#606060",
                  }}
                >
                  {task.task_title}
                </p>
              </button>

              {/* Detail text below */}
              {isFocus && task.task_detail && (
                <p
                  className="mt-3 text-center text-[10px] sm:text-xs leading-normal max-w-[120px] sm:max-w-[160px]"
                  style={{
                    color: "#606060",
                  }}
                >
                  {task.task_detail}
                </p>
              )}

              {/* "Tap to complete" hint on focus node */}
              {isFocus && (
                <p
                  className="mt-2 sm:mt-4 text-[9px] sm:text-xs uppercase tracking-wider"
                  style={{ color: "rgba(79,209,197,0.4)" }}
                >
                  tap when done
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
