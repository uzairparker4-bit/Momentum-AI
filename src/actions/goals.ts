"use server";

import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { generatePlan, generateReAnchorSteps } from "@/lib/gemini";
import { revalidatePath } from "next/cache";

// ─── Types ──────────────────────────────────────────────────

export interface Task {
  id: string;
  task_title: string;
  task_detail: string | null;
  status: string;
  order_index: number;
  phase_id: string;
}

export interface Phase {
  id: string;
  goal_id: string;
  phase_number: number;
  phase_name: string;
  status: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  original_reason: string | null;
  target_date: string | null;
  status: string;
}

// ─── Get Active Goal ─────────────────────────────────────────

export async function getActiveGoal(userId: string): Promise<Goal | null> {
  if (!isSupabaseConfigured()) return null;
  const db = createServerClient();
  const { data } = await db
    .from("goals")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();
  return data ?? null;
}

// ─── Get Active Phase + Tasks ────────────────────────────────

export async function getActivePhaseTasks(goalId: string): Promise<{
  phase: Phase | null;
  tasks: Task[];
  totalPhases: number;
}> {
  if (!isSupabaseConfigured()) return { phase: null, tasks: [], totalPhases: 0 };
  const db = createServerClient();

  const { data: phases } = await db
    .from("phases")
    .select("*")
    .eq("goal_id", goalId)
    .order("phase_number", { ascending: true });

  if (!phases || phases.length === 0) return { phase: null, tasks: [], totalPhases: 0 };

  const activePhase =
    phases.find((p) => p.status === "in_progress") ??
    phases.find((p) => p.status === "pending") ??
    null;

  if (!activePhase) return { phase: null, tasks: [], totalPhases: phases.length };

  const { data: tasks } = await db
    .from("tasks")
    .select("*")
    .eq("phase_id", activePhase.id)
    .order("order_index", { ascending: true });

  return {
    phase: activePhase as Phase,
    tasks: (tasks ?? []) as Task[],
    totalPhases: phases.length,
  };
}

// ─── Create Goal + AI Plan ───────────────────────────────────

export async function createGoalWithPlan(params: {
  userId: string;
  goal: string;
  description?: string;
  originalReason?: string;
  targetDate: string;
  stuckPoint?: string;
  timePerDay?: string;
}) {
  console.log(
    "[createGoalWithPlan] params received:",
    JSON.stringify(
      params,
      (key, value) => (value === undefined ? null : value),
      2
    )
  );

  if (!isSupabaseConfigured()) throw new Error("Supabase not configured");
  const db = createServerClient();

  // 1. Create goal row
  const { data: goal, error: goalError } = await db
    .from("goals")
    .insert({
      user_id: params.userId,
      title: params.goal,
      description: params.description ?? null,
      original_reason: params.originalReason ?? null,
      target_date: params.targetDate,
      status: "active",
    })
    .select()
    .single();

  if (goalError || !goal) throw new Error("Failed to create goal: " + goalError?.message);

  // 2. Generate plan with Gemini
  let plan;
  try {
    plan = await generatePlan({
      goal: params.goal,
      targetDate: params.targetDate,
      stuckPoint: params.stuckPoint,
      timePerDay: params.timePerDay,
    });
  } catch (err) {
    console.error("[AI] Plan generation failed. Deleting active goal and throwing error:", err);
    await db.from("goals").delete().eq("id", goal.id);
    throw err;
  }

  // 3. Persist phases and tasks
  for (let i = 0; i < plan.phases.length; i++) {
    const p = plan.phases[i];
    const { data: phase, error: phaseErr } = await db
      .from("phases")
      .insert({
        goal_id: goal.id,
        phase_number: i + 1,
        phase_name: p.phase_name,
        status: i === 0 ? "in_progress" : "pending",
      })
      .select()
      .single();

    if (phaseErr || !phase) continue;

    for (let j = 0; j < p.steps.length; j++) {
      await db.from("tasks").insert({
        phase_id: phase.id,
        task_title: p.steps[j].title,
        task_detail: p.steps[j].detail,
        status: "pending",
        order_index: j + 1,
      });
    }
  }

  // 4. Upsert session record
  await db.from("sessions").upsert(
    { user_id: params.userId, last_active_timestamp: new Date().toISOString(), momentum_score: 0 },
    { onConflict: "user_id" }
  );

  revalidatePath("/dashboard");
  return goal.id;
}

// ─── Complete Task ───────────────────────────────────────────

export async function completeTask(
  taskId: string,
  phaseId: string,
  goalId: string
): Promise<{ phaseComplete: boolean }> {
  if (!isSupabaseConfigured()) return { phaseComplete: false };
  const db = createServerClient();

  await db.from("tasks").update({ status: "completed" }).eq("id", taskId);

  const { data: remaining } = await db
    .from("tasks")
    .select("id")
    .eq("phase_id", phaseId)
    .eq("status", "pending");

  if (!remaining || remaining.length === 0) {
    await db.from("phases").update({ status: "completed" }).eq("id", phaseId);

    const { data: nextPhase } = await db
      .from("phases")
      .select("id")
      .eq("goal_id", goalId)
      .eq("status", "pending")
      .order("phase_number", { ascending: true })
      .limit(1)
      .single();

    if (nextPhase) {
      await db.from("phases").update({ status: "in_progress" }).eq("id", nextPhase.id);
    } else {
      await db.from("goals").update({ status: "completed" }).eq("id", goalId);
    }

    revalidatePath("/dashboard");
    return { phaseComplete: true };
  }

  revalidatePath("/dashboard");
  return { phaseComplete: false };
}

// ─── Re-Anchor Protocol ──────────────────────────────────────

export async function reAnchorTasks(params: {
  phaseId: string;
  goalTitle: string;
  phaseName: string;
  currentStepTitle: string;
  userReason: string;
}) {
  if (!isSupabaseConfigured()) return;
  const db = createServerClient();

  await db.from("tasks").delete().eq("phase_id", params.phaseId).eq("status", "pending");

  let steps;
  try {
    steps = await generateReAnchorSteps({
      goal: params.goalTitle,
      phaseName: params.phaseName,
      currentStepTitle: params.currentStepTitle,
      userReason: params.userReason,
    });
  } catch (err) {
    console.error("[AI] Re-anchor failed:", err);
    steps = [
      { title: "Open your notes", detail: "Spend 5 minutes reading what you have written so far about this goal" },
      { title: "Write one next sentence", detail: "Describe in one sentence what the very next physical action is" },
      { title: "Do just that one thing", detail: "Set a 10-minute timer and do only that single action" },
    ];
  }

  for (let i = 0; i < steps.length; i++) {
    await db.from("tasks").insert({
      phase_id: params.phaseId,
      task_title: steps[i].title,
      task_detail: steps[i].detail,
      status: "pending",
      order_index: i + 1,
    });
  }

  revalidatePath("/dashboard");
}

export async function deleteActiveGoal(userId: string) {
  if (!isSupabaseConfigured()) return;
  const db = createServerClient();

  await db
    .from("goals")
    .delete()
    .eq("user_id", userId)
    .eq("status", "active");

  revalidatePath("/dashboard");
}

