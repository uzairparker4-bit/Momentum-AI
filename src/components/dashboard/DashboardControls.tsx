"use client";

import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { deleteActiveGoal } from "@/actions/goals";

interface DashboardControlsProps {
  userId: string;
}

export default function DashboardControls({ userId }: DashboardControlsProps) {
  const router = useRouter();

  const handleRewrite = async () => {
    if (confirm("Are you sure you want to rewrite your goal? This will clear your current plan and progress.")) {
      await deleteActiveGoal(userId);
      router.push("/onboarding");
    }
  };

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-6 pt-6 flex justify-between items-center z-30 relative select-none">
      {/* Left controls: Rewrite Goal */}
      <div className="flex items-center gap-6">
        <button
          onClick={handleRewrite}
          className="text-xs uppercase tracking-wider font-light flex items-center gap-1.5 transition-colors"
          style={{ color: "#606060" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "#4FD1C5";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "#606060";
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"></path>
          </svg>
          Rewrite Goal
        </button>
      </div>

      {/* Right controls: Sign Out */}
      <div>
        <button
          onClick={handleSignOut}
          className="text-xs uppercase tracking-wider font-light transition-colors"
          style={{ color: "#606060" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#e8e8e8")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#606060")}
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
