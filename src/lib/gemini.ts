import { GoogleGenAI } from "@google/genai";

// -------------------------------------------------------------------
// Configuration
// -------------------------------------------------------------------
const MODEL = "gemini-2.5-flash";

const TONE =
  "You are a calm, direct friend who has been through hard times with goals. Never use motivational‑speaker energy. No 'You've got this!' or 'Amazing work!'. Be specific, concrete, and warm — like a trusted colleague who simply tells you the next honest step.";

// -------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------
function getClient(): GoogleGenAI {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY is not configured in .env.local");
  }
  return new GoogleGenAI({ apiKey: key });
}

function stripFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/im, "").replace(/\s*```$/im, "").trim();
}

// -------------------------------------------------------------------
// Types
// -------------------------------------------------------------------
export interface GeneratedPhase {
  phase_name: string;
  steps: { title: string; detail: string }[];
}

export interface GeneratedPlan {
  phases: GeneratedPhase[];
}

// -------------------------------------------------------------------
// Core API functions
// -------------------------------------------------------------------
export async function generatePlan(params: {
  goal: string;
  targetDate: string;
  stuckPoint?: string;
  timePerDay?: string;
}): Promise<GeneratedPlan> {
  console.log(
    "[generatePlan] input params:",
    JSON.stringify(
      params,
      (key, value) => (value === undefined ? null : value),
      2
    )
  );
  const ai = getClient();
  const { goal, targetDate, stuckPoint, timePerDay } = params;

  const contextLines = [
    `Goal: "${goal}"`,
    `Target: ${targetDate}`,
    stuckPoint ? `Where they feel stuck: "${stuckPoint}"` : null,
    timePerDay ? `Time available per day: ${timePerDay}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = `${TONE}\n\nThe user wants to finish something they have already started but abandoned. Here is their context:\n\n${contextLines}\n\nGenerate a plan of 3 to 4 named phases. Each phase has exactly 3 micro‑steps. Each micro‑step must be:\n- One specific action completable in a single sitting\n- Concrete — never vague like "research the topic"\n- Written as a direct instruction, e.g. "Watch the first 20 minutes of Module 1 and write 3 key points"\n- Small enough that the user can feel real progress\n\nRespond ONLY with a valid JSON object. No prose, no markdown fences. Exact shape:\n{\n  "phases": [\n    {\n      "phase_name": "Phase 1 of 3: The Foundation",\n      "steps": [\n        { "title": "Short title (max 8 words)", "detail": "One sentence describing exactly what to do" },\n        { "title": "...", "detail": "..." },\n        { "title": "...", "detail": "..." }\n      ]\n    }\n  ]\n}`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseMimeType: "application/json" },
    });
    console.log("[generatePlan] raw Gemini response:", response);

    // Extract the text from possible response shapes
    let rawText = "";
    if (response?.text) {
      rawText = response.text;
    } else if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
      rawText = response.candidates[0].content.parts[0].text;
    }
    console.log("[generatePlan] extracted raw text:", rawText);
    if (!rawText) {
      throw new Error("Empty Gemini response text");
    }

    const clean = stripFences(rawText);
    const data = JSON.parse(clean) as GeneratedPlan;
    if (!Array.isArray(data.phases) || data.phases.length === 0) {
      throw new Error("Invalid plan shape from Gemini");
    }
    return data;
  } catch (err) {
    console.error("[generatePlan] Gemini API call or parsing error:", err);
    throw err;
  }
}

export async function generateReAnchorSteps(params: {
  goal: string;
  phaseName: string;
  currentStepTitle: string;
  userReason: string;
}): Promise<{ title: string; detail: string }[]> {
  const ai = getClient();
  const { goal, phaseName, currentStepTitle, userReason } = params;

  const prompt = `${TONE}\n\nThe user is stuck. They were working on:\nGoal: "${goal}"\nCurrent phase: "${phaseName}"\nLast step they saw: "${currentStepTitle}"\nWhat they wrote when asked why they started: "${userReason}"\n\nGenerate 3 micro‑steps that are even smaller and easier than what they had before. The first step MUST be completable in under 10 minutes. Each step should reduce friction, not add pressure.\n\nRespond ONLY with valid JSON. No prose, no markdown fences:\n{\n  "steps": [\n    { "title": "Short title (max 8 words)", "detail": "One sentence — specific, low‑friction action" },\n    { "title": "...", "detail": "..." },\n    { "title": "...", "detail": "..." }\n  ]\n}`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: { responseMimeType: "application/json" },
  });

  // Extract raw text similarly to generatePlan
  let rawText = "";
  if (response?.text) {
    rawText = response.text;
  } else if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
    rawText = response.candidates[0].content.parts[0].text;
  }
  if (!rawText) {
    throw new Error("Empty Gemini response text for Re‑Anchor");
  }
  const clean = stripFences(rawText);
  const data = JSON.parse(clean) as { steps: { title: string; detail: string }[] };
  return data.steps;
}

export async function generateDriftMessage(params: {
  goal: string;
  lastStepTitle: string;
}): Promise<string> {
  const ai = getClient();
  const { goal, lastStepTitle } = params;

  const prompt = `${TONE}

A user is returning to their goal after being away for a while. They were working on:
Goal: "${goal}"
Last step: "${lastStepTitle}"

Write a single short paragraph (2-3 sentences max) welcoming them back. The tone must be completely free of guilt, pressure, or judgment. Like a friend saying "hey, you're back — no big deal, here's where we are." Never mention how long they were away. Never say sorry or apologize. Just calm, grounded, and forward-facing.

Respond ONLY with the plain text paragraph. No quotes, no markdown.`;

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  });

  let rawText = "";
  if (response?.text) {
    rawText = response.text;
  } else if (response?.candidates?.[0]?.content?.parts?.[0]?.text) {
    rawText = response.candidates[0].content.parts[0].text;
  }
  return rawText.trim();
}

