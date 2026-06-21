import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getActiveGoal, getActivePhaseTasks } from "@/actions/goals";
import { getDriftStatus, updateLastActive } from "@/actions/sessions";
import { generateDriftMessage } from "@/lib/gemini";
import PhaseIndicator from "@/components/dashboard/PhaseIndicator";
import ReAnchorButton from "@/components/dashboard/ReAnchorButton";
import DashboardClient from "@/components/dashboard/DashboardClient";
import DriftReEntry from "@/components/DriftReEntry";
import DashboardControls from "@/components/dashboard/DashboardControls";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const userId = session.user.id;
  const goal = await getActiveGoal(userId);
  if (!goal) redirect("/onboarding");

  // ── Drift check ─────────────────────────────────────────
  const drift = await getDriftStatus(userId);

  if (drift.isDrifted) {
    let driftMessage = "";
    try {
      driftMessage = await generateDriftMessage({
        goal: goal.title,
        lastStepTitle: drift.lastStepTitle ?? "your last step",
      });
    } catch {
      driftMessage = "You know where this is going. It is still here, waiting for you, exactly where you left it.";
    }

    return (
      <DriftReEntry
        userId={userId}
        goalId={goal.id}
        goalTitle={goal.title}
        lastStepTitle={drift.lastStepTitle}
        missedDays={drift.missedDays}
        driftMessage={driftMessage}
      />
    );
  }

  // ── Normal dashboard ─────────────────────────────────────
  await updateLastActive(userId);

  const { phase, tasks, totalPhases } = await getActivePhaseTasks(goal.id);

  // All phases done → goal complete screen
  if (!phase) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center text-center px-8"
        style={{ background: "#0d0d0d" }}
      >
        <div className="animate-fade-in max-w-md">
          <div
            className="mx-auto mb-8 flex items-center justify-center"
            style={{
              width: 80, height: 80, borderRadius: "50%",
              background: "rgba(79,209,197,0.1)",
              border: "1px solid rgba(79,209,197,0.3)",
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M5 13l4 4L19 7" stroke="#4FD1C5" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-2xl font-light mb-3" style={{ color: "#e8e8e8" }}>
            You finished it.
          </h1>
          <p className="text-base" style={{ color: "#a0a0a0", fontWeight: 300 }}>
            {goal.title}
          </p>
          <p className="text-sm mt-6" style={{ color: "#606060" }}>
            That is not nothing. That is the whole thing.
          </p>
        </div>
      </div>
    );
  }

  // Get next phase name for overlay
  const { phase: nextPhaseCheck } = await getActivePhaseTasks(goal.id);
  const nextPhaseName =
    phase.phase_number < totalPhases
      ? `Phase ${phase.phase_number + 1} of ${totalPhases}`
      : null;

  const pendingTasks = tasks.filter((t) => t.status === "pending");
  const focusTask = pendingTasks[0] ?? null;

  return (
    <main
      className="min-h-screen flex flex-col pb-28"
      style={{ background: "#0d0d0d" }}
    >
      {/* Ambient background glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 40%, rgba(79,209,197,0.04) 0%, transparent 70%)",
        }}
      />

      {/* Controls: Go Back, Rewrite Goal, Sign Out */}
      <DashboardControls userId={userId} />

      {/* Top: Phase indicator */}
      <PhaseIndicator
        phaseNumber={phase.phase_number}
        phaseName={phase.phase_name}
        totalPhases={totalPhases}
        targetDate={goal.target_date}
      />

      {/* Center: 3-node path */}
      <div className="flex-1 flex items-center justify-center w-full">
        <DashboardClient
          goal={goal}
          phase={phase}
          tasks={tasks}
          totalPhases={totalPhases}
          nextPhaseName={nextPhaseName}
        />
      </div>

      {/* Bottom: Re-Anchor (always visible, fixed) */}
      <ReAnchorButton
        phaseId={phase.id}
        goalTitle={goal.title}
        phaseName={phase.phase_name}
        currentTask={focusTask}
      />
    </main>
  );
}
