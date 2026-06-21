import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const db = createClient(supabaseUrl, supabaseServiceKey);

async function run() {
  const { data: users, error } = await db.from("users").select("*");
  if (error) {
    console.error("Error:", error);
    return;
  }
  console.log("=== Users ===");
  console.log(users);
}
run();
