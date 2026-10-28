"use client";

import { useState } from "react";
import TaskCards from "@/components/dashboard/TaskCards";
import PhaseCompleteOverlay from "@/components/dashboard/PhaseCompleteOverlay";
import type { Task, Phase, Goal } from "@/actions/goals";

interface DashboardClientProps {
  goal: Goal;
  phase: Phase;
  tasks: Task[];
  totalPhases: number;
  nextPhaseName: string | null;
}

export default function DashboardClient({
  goal,
  phase,
  tasks,
  nextPhaseName,
}: DashboardClientProps) {
  const [phaseComplete, setPhaseComplete] = useState(false);

  if (phaseComplete) {
    return (
      <PhaseCompleteOverlay
        completedPhaseName={phase.phase_name}
        nextPhaseName={nextPhaseName}
        onContinue={() => setPhaseComplete(false)}
      />
    );
  }

  return (
    <TaskCards
      key={phase.id}
      tasks={tasks}
      phaseId={phase.id}
      goalId={goal.id}
      onPhaseComplete={() => setPhaseComplete(true)}
    />
  );
}
