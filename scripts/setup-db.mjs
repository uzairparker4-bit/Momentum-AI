// scripts/setup-db.mjs
// Run with: node scripts/setup-db.mjs
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://ehbaiocwaunvfswsjhhj.supabase.co";
const SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVoYmFpb2N3YXVudmZzd3NqaGhqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTU1MTE2NSwiZXhwIjoyMDk1MTI3MTY1fQ.mijGZif3ZcvDZqQkWsoNZqHfg8sbEuxgXThPjlvhdnQ";

const db = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

const TABLES = ["users", "goals", "phases", "tasks", "sessions"];

async function checkTables() {
  console.log("\n🔍 Checking Supabase tables...\n");
  const missing = [];

  for (const table of TABLES) {
    const { error } = await db.from(table).select("*").limit(1);
    if (error && error.code === "42P01") {
      console.log(`  ❌ ${table} — NOT FOUND`);
      missing.push(table);
    } else if (error) {
      console.log(`  ⚠️  ${table} — error: ${error.message}`);
    } else {
      console.log(`  ✅ ${table} — exists`);
    }
  }

  if (missing.length > 0) {
    console.log(`\n⚠️  Missing tables: ${missing.join(", ")}`);
    console.log(`\n👉 Run the SQL in supabase/schema.sql in your Supabase SQL Editor:`);
    console.log(`   https://supabase.com/dashboard/project/ehbaiocwaunvfswsjhhj/sql/new\n`);
  } else {
    console.log("\n✅ All tables present. Database is ready.\n");
  }
}

checkTables().catch((e) => {
  console.error("Connection failed:", e.message);
  process.exit(1);
});
