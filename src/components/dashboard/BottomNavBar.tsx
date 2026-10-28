"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { deleteActiveGoal, reAnchorTasks } from "@/actions/goals";
import type { Task } from "@/actions/goals";

interface BottomNavBarProps {
  userId: string;
  phaseId: string;
  goalTitle: string;
  phaseName: string;
  currentTask: Task | null;
}

export default function BottomNavBar({
  userId,
  phaseId,
  goalTitle,
  phaseName,
  currentTask,
}: BottomNavBarProps) {
  const router = useRouter();
  const [openReAnchor, setOpenReAnchor] = useState(false);
  const [reason, setReason] = useState("");
  const [done, setDone] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleRewrite = async () => {
    if (
      confirm(
        "Are you sure you want to rewrite your goal? This will clear your current plan and progress."
      )
    ) {
      await deleteActiveGoal(userId);
      router.push("/onboarding");
    }
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  const handleReAnchorSubmit = () => {
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
        setOpenReAnchor(false);
        setDone(false);
        setReason("");
      }, 1800);
    });
  };

  return (
    <>
      {/* Fixed bottom navigation bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between shadow-sm select-none"
        style={{
          background: "#ffffff",
          borderTop: "1px solid #efefef",
          padding: "10px 32px 20px",
        }}
      >
        {/* Left: Rewrite goal */}
        <button
          id="nav-rewrite-goal-btn"
          onClick={handleRewrite}
          className="flex flex-col items-center gap-1 group focus:outline-none"
        >
          <div
            className="flex items-center justify-center text-sm transition-transform group-active:scale-95"
            style={{
              width: "32px",
              height: "32px",
              background: "#f3f4f6",
              borderRadius: "10px",
            }}
          >
            ✏️
          </div>
          <span
            className="font-medium tracking-tight"
            style={{ fontSize: "9px", color: "#6b7280" }}
          >
            Rewrite goal
          </span>
        </button>

        {/* Center: Lost? Start here (sitting 30px above the bar) */}
        <div className="relative flex flex-col items-center">
          <button
            id="nav-re-anchor-btn"
            onClick={() => setOpenReAnchor(true)}
            className="flex items-center justify-center text-2xl transition-all hover:scale-105 active:scale-95 focus:outline-none"
            style={{
              width: "52px",
              height: "52px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
              boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)",
              border: "3px solid #f4f6fb",
              marginTop: "-30px",
            }}
          >
            🧭
          </button>
          <span
            className="font-medium tracking-tight mt-1"
            style={{ fontSize: "9px", color: "#6b7280" }}
          >
            Lost? Start here
          </span>
        </div>

        {/* Right: Sign out */}
        <button
          id="nav-sign-out-btn"
          onClick={handleSignOut}
          className="flex flex-col items-center gap-1 group focus:outline-none"
        >
          <div
            className="flex items-center justify-center text-sm transition-transform group-active:scale-95"
            style={{
              width: "32px",
              height: "32px",
              background: "#f3f4f6",
              borderRadius: "10px",
            }}
          >
            🚪
          </div>
          <span
            className="font-medium tracking-tight"
            style={{ fontSize: "9px", color: "#6b7280" }}
          >
            Sign out
          </span>
        </button>
      </nav>

      {/* Re-Anchor Modal */}
      {openReAnchor && (
        <div
          className="overlay-backdrop"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpenReAnchor(false);
          }}
        >
          <div
            className="w-full max-w-md mx-6 animate-slide-up"
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: 24,
              padding: "2.5rem 2rem",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            }}
          >
            {done ? (
              <div className="text-center py-4">
                <p className="text-base font-semibold" style={{ color: "#059669" }}>
                  Here is your simplest way forward from right now.
                </p>
              </div>
            ) : (
              <>
                <p
                  className="text-xl font-bold mb-2 leading-snug"
                  style={{ color: "#111827" }}
                >
                  What was the original reason
                  <br />
                  you started this?
                </p>
                <p className="text-sm mb-6" style={{ color: "#6b7280" }}>
                  Take your time. Write whatever feels true.
                </p>

                <textarea
                  id="re-anchor-input"
                  className="input-field"
                  style={{
                    height: 120,
                    marginBottom: "1.5rem",
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    color: "#111827",
                  }}
                  placeholder="e.g. I wanted to prove to myself I could actually finish something..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  autoFocus
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => setOpenReAnchor(false)}
                    className="btn-capsule flex-1"
                    style={{
                      fontSize: "0.875rem",
                      background: "#f3f4f6",
                      color: "#4b5563",
                      border: "1px solid #e5e7eb",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    id="re-anchor-submit-btn"
                    onClick={handleReAnchorSubmit}
                    disabled={!reason.trim() || isPending}
                    className="btn-capsule flex-1"
                    style={{
                      fontSize: "0.875rem",
                      background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                      color: "#ffffff",
                      boxShadow: "0 4px 14px rgba(16, 185, 129, 0.3)",
                      opacity: !reason.trim() || isPending ? 0.6 : 1,
                    }}
                  >
                    {isPending ? (
                      <span className="flex items-center gap-2">
                        <span
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: "50%",
                            border: "2px solid rgba(255,255,255,0.3)",
                            borderTopColor: "#ffffff",
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
