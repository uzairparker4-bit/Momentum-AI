import { config } from "dotenv";
config({ path: ".env.local" });
import { generatePlan } from "../src/lib/gemini";

async function run() {
  try {
    const plan = await generatePlan({
      goal: "Finish my novel",
      targetDate: "2026-12-01"
    });
    console.log("Success:", JSON.stringify(plan, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
