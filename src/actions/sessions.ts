"use server";

import { createServerClient, isSupabaseConfigured } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function upsertSession(userId: string) {
  if (!isSupabaseConfigured()) return;
  const db = createServerClient();
  await db.from("sessions").upsert(
    { user_id: userId, last_active_timestamp: new Date().toISOString() },
    { onConflict: "user_id" }
  );
}

export async function getDriftStatus(userId: string): Promise<{
  isDrifted: boolean;
  missedDays: number;
  lastStepTitle: string | null;
}> {
  if (!isSupabaseConfigured()) return { isDrifted: false, missedDays: 0, lastStepTitle: null };
  const db = createServerClient();

  const { data: session } = await db
    .from("sessions")
    .select("last_active_timestamp")
    .eq("user_id", userId)
    .single();

  if (!session) {
    // First time — create session and no drift
    await db.from("sessions").upsert(
      { user_id: userId, last_active_timestamp: new Date().toISOString(), momentum_score: 0 },
      { onConflict: "user_id" }
    );
    return { isDrifted: false, missedDays: 0, lastStepTitle: null };
  }

  const lastActive = new Date(session.last_active_timestamp);
  const gapHours = (Date.now() - lastActive.getTime()) / 36e5;

  if (gapHours <= 48) {
    return { isDrifted: false, missedDays: 0, lastStepTitle: null };
  }

  const missedDays = Math.floor(gapHours / 24);

  // Find the last task the user was on
  const { data: lastTask } = await db
    .from("tasks")
    .select(`task_title, phase_id, phases!inner(goal_id, goals!inner(user_id))`)
    .eq("phases.goals.user_id", userId)
    .eq("status", "pending")
    .order("order_index", { ascending: true })
    .limit(1)
    .single();

  return {
    isDrifted: true,
    missedDays,
    lastStepTitle: lastTask?.task_title ?? null,
  };
}

export async function applyDriftRecovery(userId: string, goalId: string, missedDays: number) {
  if (!isSupabaseConfigured()) return;
  const db = createServerClient();

  // Silently extend target date by missed days
  const { data: goal } = await db
    .from("goals")
    .select("target_date")
    .eq("id", goalId)
    .single();

  if (goal?.target_date) {
    const newDate = new Date(goal.target_date);
    newDate.setDate(newDate.getDate() + missedDays);
    await db
      .from("goals")
      .update({ target_date: newDate.toISOString().split("T")[0] })
      .eq("id", goalId);
  }

  // Update last active
  await db
    .from("sessions")
    .update({ last_active_timestamp: new Date().toISOString() })
    .eq("user_id", userId);

  revalidatePath("/dashboard");
}

export async function updateLastActive(userId: string) {
  if (!isSupabaseConfigured()) return;
  const db = createServerClient();
  await db
    .from("sessions")
    .update({ last_active_timestamp: new Date().toISOString() })
    .eq("user_id", userId);
}
