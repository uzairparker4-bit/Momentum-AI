"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface PhaseCompleteOverlayProps {
  completedPhaseName: string;
  nextPhaseName: string | null;
  onContinue: () => void;
}

export default function PhaseCompleteOverlay({
  completedPhaseName,
  nextPhaseName,
  onContinue,
}: PhaseCompleteOverlayProps) {
  const router = useRouter();
  const [fading, setFading] = useState(false);

  const handleContinue = () => {
    setFading(true);
    setTimeout(() => {
      router.refresh();
      onContinue();
    }, 600);
  };

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center text-center px-8 z-50"
      style={{
        background: "#0d0d0d",
        transition: "opacity 0.6s ease",
        opacity: fading ? 0 : 1,
      }}
    >
      <div className="animate-fade-in">
        {/* Teal checkmark circle */}
        <div
          className="mx-auto mb-8 flex items-center justify-center"
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: "rgba(79,209,197,0.1)",
            border: "1px solid rgba(79,209,197,0.3)",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M5 13l4 4L19 7" stroke="#4FD1C5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <p className="text-sm uppercase tracking-widest mb-3" style={{ color: "#606060" }}>
          {completedPhaseName}
        </p>
        <h1 className="text-2xl font-light mb-2" style={{ color: "#e8e8e8" }}>
          Phase complete.
        </h1>
        <p className="text-base font-light mb-10" style={{ color: "#a0a0a0" }}>
          Moving forward.
        </p>

        {nextPhaseName && (
          <p className="text-sm mb-8" style={{ color: "#606060" }}>
            Next: <span style={{ color: "#F6AD55" }}>{nextPhaseName}</span>
          </p>
        )}

        <button
          id="phase-continue-btn"
          onClick={handleContinue}
          className="btn-capsule btn-capsule-teal"
        >
          {nextPhaseName ? "Continue →" : "I did it"}
        </button>
      </div>
    </div>
  );
}
