"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { applyDriftRecovery } from "@/actions/sessions";

interface DriftReEntryProps {
  userId: string;
  goalId: string;
  goalTitle: string;
  lastStepTitle: string | null;
  missedDays: number;
  driftMessage?: string;
}

export default function DriftReEntry({
  userId,
  goalId,
  goalTitle,
  lastStepTitle,
  missedDays,
  driftMessage,
}: DriftReEntryProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [clicked, setClicked] = useState(false);

  const handleReturn = () => {
    setClicked(true);
    startTransition(async () => {
      await applyDriftRecovery(userId, goalId, missedDays);
      router.refresh();
    });
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: "#0d0d0d" }}
    >
      {/* Ambient glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 35% at 50% 55%, rgba(246,173,85,0.05) 0%, transparent 70%)",
        }}
      />

      <div
        className="relative z-10 max-w-md w-full animate-fade-in"
        style={{ animationDelay: "0.1s", opacity: 0, animationFillMode: "forwards" }}
      >
        {/* Soft icon */}
        <div className="flex justify-center mb-10">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(246,173,85,0.08)",
              border: "1px solid rgba(246,173,85,0.15)",
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 15c-.55 0-1-.45-1-1v-4c0-.55.45-1 1-1s1 .45 1 1v4c0 .55-.45 1-1 1zm1-8h-2V7h2v2z"
                fill="#F6AD55"
                opacity="0.7"
              />
            </svg>
          </div>
        </div>

        {/* Main message */}
        <h1
          className="text-3xl font-light mb-4 leading-snug"
          style={{ color: "#e8e8e8", letterSpacing: "-0.02em" }}
        >
          You&apos;ve been away for a bit.
          <br />
          <span style={{ color: "#a0a0a0" }}>That&apos;s okay.</span>
        </h1>

        {/* Dynamic Claude-generated drift message */}
        {driftMessage && (
          <p
            className="text-base leading-relaxed mb-8"
            style={{ color: "#a0a0a0", fontWeight: 300 }}
          >
            {driftMessage}
          </p>
        )}

        {/* What they were working on */}
        {(lastStepTitle || goalTitle) && (
          <div
            className="mb-10 px-6 py-5 rounded-2xl text-left"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid #2a2a2a",
            }}
          >
            <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "#606060" }}>
              You were working on
            </p>
            <p className="text-base font-medium" style={{ color: "#e8e8e8" }}>
              {goalTitle}
            </p>
            {lastStepTitle && (
              <p className="text-sm mt-1" style={{ color: "#a0a0a0" }}>
                {lastStepTitle}
              </p>
            )}
          </div>
        )}

        <p className="text-sm mb-8" style={{ color: "#606060" }}>
          Here is your way back.
        </p>

        {/* CTA */}
        <button
          id="drift-return-btn"
          onClick={handleReturn}
          disabled={isPending || clicked}
          className="btn-capsule btn-capsule-teal"
          style={{ width: "100%", opacity: isPending ? 0.7 : 1 }}
        >
          {isPending ? (
            <>
              <span
                className="w-4 h-4 rounded-full border-2 inline-block"
                style={{
                  borderColor: "rgba(13,13,13,0.3)",
                  borderTopColor: "#0d0d0d",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              Finding your place...
            </>
          ) : (
            "Take me back"
          )}
        </button>
      </div>


    </div>
  );
}
