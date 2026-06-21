"use client";

import { useState, useTransition } from "react";
import { reAnchorTasks } from "@/actions/goals";
import type { Task } from "@/actions/goals";

interface ReAnchorButtonProps {
  phaseId: string;
  goalTitle: string;
  phaseName: string;
  currentTask: Task | null;
}

export default function ReAnchorButton({
  phaseId,
  goalTitle,
  phaseName,
  currentTask,
}: ReAnchorButtonProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = () => {
    if (!reason.trim()) return;
    startTransition(async () => {
      await reAnchorTasks({
        phaseId,
        goalTitle,
        phaseName,
        currentStepTitle: currentTask?.task_title ?? "first step",
        userReason: reason,
      });
      setDone(true);
      setTimeout(() => {
        setOpen(false);
        setDone(false);
        setReason("");
      }, 1800);
    });
  };

  return (
    <>
      {/* Always-visible capsule button */}
      <div className="fixed bottom-8 left-0 right-0 flex justify-center px-6 z-40">
        <button
          id="re-anchor-btn"
          onClick={() => setOpen(true)}
          className="btn-capsule btn-capsule-ghost"
          style={{ fontSize: "0.875rem", padding: "0.65rem 1.75rem" }}
        >
          I don&apos;t know where to start
        </button>
      </div>

      {/* Modal overlay */}
      {open && (
        <div className="overlay-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div
            className="w-full max-w-md mx-6 animate-slide-up"
            style={{
              background: "#1a1a1a",
              border: "1px solid #2a2a2a",
              borderRadius: 24,
              padding: "2.5rem 2rem",
            }}
          >
            {done ? (
              <div className="text-center py-4">
                <p className="text-base" style={{ color: "#4FD1C5" }}>
                  Here is your simplest way forward from right now.
                </p>
              </div>
            ) : (
              <>
                <p
                  className="text-xl font-light mb-2 leading-snug"
                  style={{ color: "#e8e8e8" }}
                >
                  What was the original reason
                  <br />
                  you started this?
                </p>
                <p className="text-sm mb-6" style={{ color: "#606060" }}>
                  Take your time. Write whatever feels true.
                </p>

                <textarea
                  id="re-anchor-input"
                  className="input-field"
                  style={{ height: 120, marginBottom: "1.5rem" }}
                  placeholder="e.g. I wanted to prove to myself I could actually finish something..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  autoFocus
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => setOpen(false)}
                    className="btn-capsule btn-capsule-ghost flex-1"
                    style={{ fontSize: "0.875rem" }}
                  >
                    Cancel
                  </button>
                  <button
                    id="re-anchor-submit-btn"
                    onClick={handleSubmit}
                    disabled={!reason.trim() || isPending}
                    className="btn-capsule btn-capsule-teal flex-1"
                    style={{ fontSize: "0.875rem", opacity: !reason.trim() || isPending ? 0.6 : 1 }}
                  >
                    {isPending ? (
                      <span className="flex items-center gap-2">
                        <span
                          style={{
                            width: 14, height: 14, borderRadius: "50%",
                            border: "2px solid rgba(13,13,13,0.3)",
                            borderTopColor: "#0d0d0d",
                            display: "inline-block",
                            animation: "spin 0.8s linear infinite",
                          }}
                        />
                        Finding your path...

                      </span>
                    ) : (
                      "Show me the way"
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
