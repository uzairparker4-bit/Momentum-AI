import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing supabase credentials in env");
  process.exit(1);
}

const db = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const { data: goals, error: goalsErr } = await db.from("goals").select("*");
  if (goalsErr) {
    console.error("Error fetching goals:", goalsErr);
    return;
  }
  console.log(`=== Goals (${goals?.length || 0}) ===`);
  console.log(JSON.stringify(goals, null, 2));

  for (const goal of (goals || [])) {
    const { data: phases, error: phasesErr } = await db.from("phases").select("*").eq("goal_id", goal.id).order("phase_number", { ascending: true });
    if (phasesErr) {
      console.error(`Error fetching phases for goal ${goal.id}:`, phasesErr);
      continue;
    }
    console.log(`\n--- Phases for Goal: "${goal.title}" (ID: ${goal.id}) ---`);
    for (const phase of (phases || [])) {
      const { data: tasks, error: tasksErr } = await db.from("tasks").select("*").eq("phase_id", phase.id).order("order_index", { ascending: true });
      if (tasksErr) {
        console.error(`Error fetching tasks for phase ${phase.id}:`, tasksErr);
        continue;
      }
      console.log(`Phase ${phase.phase_number}: "${phase.phase_name}" [Status: ${phase.status}] (${tasks?.length || 0} tasks)`);
      for (const task of (tasks || [])) {
        console.log(`  - Task [Order ${task.order_index}]: "${task.task_title}" [Status: ${task.status}]`);
      }
    }
  }

  const { data: sessions, error: sessionsErr } = await db.from("sessions").select("*");
  if (sessionsErr) {
     console.error("Error fetching sessions:", sessionsErr);
  } else {
     console.log(`\n=== Sessions (${sessions?.length || 0}) ===`);
     console.log(JSON.stringify(sessions, null, 2));
  }
}

run();
