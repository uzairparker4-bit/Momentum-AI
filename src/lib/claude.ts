import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-4-20250514";

const TONE =
  "You are a calm, direct friend who has been through hard times with goals. Never use motivational-speaker energy. No 'You've got this!' or 'Amazing work!'. Be specific, concrete, and warm — like a trusted colleague who simply tells you the next honest step.";

function getClient(): Anthropic {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key.startsWith("REPLACE")) {
    throw new Error("ANTHROPIC_API_KEY is not configured in .env.local");
  }
  return new Anthropic({ apiKey: key });
}

function stripFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/im, "").replace(/\s*```$/im, "").trim();
}

// ─── Types ──────────────────────────────────────────────────

export interface GeneratedPhase {
  phase_name: string;
  steps: { title: string; detail: string }[];
}

export interface GeneratedPlan {
  phases: GeneratedPhase[];
}

// ─── Goal Splitting (Path A & B) ────────────────────────────

export async function generatePlan(params: {
  goal: string;
  targetDate: string;
  stuckPoint?: string;
  timePerDay?: string;
}): Promise<GeneratedPlan> {
  const client = getClient();
  const { goal, targetDate, stuckPoint, timePerDay } = params;

  const contextLines = [
    `Goal: "${goal}"`,
    `Target: ${targetDate}`,
    stuckPoint ? `Where they feel stuck: "${stuckPoint}"` : null,
    timePerDay ? `Time available per day: ${timePerDay}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = `${TONE}

The user wants to finish something they have already started but abandoned. Here is their context:

${contextLines}

Generate a plan of 3 to 4 named phases. Each phase has exactly 3 micro-steps. Each micro-step must be:
- One specific action completable in a single sitting
- Concrete — never vague like "research the topic"
- Written as a direct instruction, e.g. "Watch the first 20 minutes of Module 1 and write 3 key points"
- Small enough that the user can feel real progress

Respond ONLY with a valid JSON object. No prose, no markdown fences. Exact shape:
{
  "phases": [
    {
      "phase_name": "Phase 1 of 3: The Foundation",
      "steps": [
        { "title": "Short title (max 8 words)", "detail": "One sentence describing exactly what to do" },
        { "title": "...", "detail": "..." },
        { "title": "...", "detail": "..." }
      ]
    }
  ]
}`;

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = stripFences(
    (message.content[0] as { type: string; text: string }).text
  );
  const data = JSON.parse(raw) as GeneratedPlan;
  if (!Array.isArray(data.phases) || data.phases.length === 0) {
    throw new Error("Invalid plan shape from Claude");
  }
  return data;
}

// ─── Re-Anchor Protocol ──────────────────────────────────────

export async function generateReAnchorSteps(params: {
  goal: string;
  phaseName: string;
  currentStepTitle: string;
  userReason: string;
}): Promise<{ title: string; detail: string }[]> {
  const client = getClient();
  const { goal, phaseName, currentStepTitle, userReason } = params;

  const prompt = `${TONE}

The user is stuck. They were working on:
Goal: "${goal}"
Current phase: "${phaseName}"
Last step they saw: "${currentStepTitle}"
What they wrote when asked why they started: "${userReason}"

Generate 3 micro-steps that are even smaller and easier than what they had before. The first step MUST be completable in under 10 minutes. Each step should reduce friction, not add pressure.

Respond ONLY with valid JSON. No prose, no markdown fences:
{
  "steps": [
    { "title": "Short title (max 8 words)", "detail": "One sentence — specific, low-friction action" },
    { "title": "...", "detail": "..." },
    { "title": "...", "detail": "..." }
  ]
}`;

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });

  const raw = stripFences(
    (message.content[0] as { type: string; text: string }).text
  );
  const data = JSON.parse(raw) as { steps: { title: string; detail: string }[] };
  return data.steps;
}

// ─── Drift Re-Entry Message ──────────────────────────────────

export async function generateDriftMessage(params: {
  goal: string;
  lastStepTitle: string;
}): Promise<string> {
  const client = getClient();
  const { goal, lastStepTitle } = params;

  const prompt = `${TONE}

A user is returning to their goal after being away for a while. They were working on:
Goal: "${goal}"
Last step: "${lastStepTitle}"

Write a single short paragraph (2-3 sentences max) welcoming them back. The tone must be completely free of guilt, pressure, or judgment. Like a friend saying "hey, you're back — no big deal, here's where we are." Never mention how long they were away. Never say sorry or apologize. Just calm, grounded, and forward-facing.

Respond ONLY with the plain text paragraph. No quotes, no markdown.`;

  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 150,
    messages: [{ role: "user", content: prompt }],
  });

  return (
    (message.content[0] as { type: string; text: string }).text?.trim() ?? ""
  );
}
