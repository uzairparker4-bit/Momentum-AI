'use server';

import { PrismaClient } from '@prisma/client';
import { GoogleGenAI } from '@google/genai';
import { revalidatePath } from 'next/cache';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getAI() {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'YOUR_ACTUAL_GEMINI_KEY_HERE') {
    throw new Error('GEMINI_API_KEY is missing or is still a placeholder in your .env file.');
  }
  return new GoogleGenAI({ apiKey: key });
}

function stripJsonFences(text: string): string {
  return text.replace(/^```(?:json)?/im, '').replace(/```$/im, '').trim();
}

interface PhaseData {
  title: string;
  summary: string;
  tasks: string[];
}

interface AIProjectPlan {
  phases: PhaseData[];
}

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

export async function getMockUser() {
  let user = await prisma.user.findFirst();
  if (!user) {
    user = await prisma.user.create({ data: { email: 'beta@momentum.ai' } });
  }
  return user;
}

export async function updateUserActivity(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { last_active_timestamp: new Date() },
  });
}

// ---------------------------------------------------------------------------
// Wayback Protocol
// ---------------------------------------------------------------------------

export async function triggerWaybackProtocol(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  const diffHours =
    Math.abs(new Date().getTime() - user.last_active_timestamp.getTime()) / 36e5;

  if (diffHours > 72) {
    const missedDays = Math.floor(diffHours / 24);
    const activeProjects = await prisma.project.findMany({ where: { user_id: userId } });
    for (const proj of activeProjects) {
      const newDueDate = new Date(proj.due_date);
      newDueDate.setDate(newDueDate.getDate() + missedDays);
      await prisma.project.update({ where: { id: proj.id }, data: { due_date: newDueDate } });
    }
    return missedDays;
  }
  return 0;
}

// ---------------------------------------------------------------------------
// AI: Generate full project plan
// ---------------------------------------------------------------------------

async function generateProjectPlan(goal: string, reason: string): Promise<AIProjectPlan> {
  const ai = getAI();

  const systemPrompt = `You are Momentum, a hyper-focused AI execution agent specialising in breaking ambitious goals into achievable action plans. Your output must always be a raw JSON object — no markdown, no prose, no explanation. Every task you generate must be:
- Completely unique within the plan
- Hyper-specific and directly actionable for the user's exact goal
- Written as a concrete verb-led instruction (e.g. "Draft a 200-word outline of your portfolio homepage sections")
- Never generic (NEVER output phrases like "Initialize setup", "Review requirements", "Begin execution", "Step 1", or any placeholder text)`;

  const userPrompt = `
The user wants to achieve the following goal: "${goal}"
Their core motivation is: "${reason}"

Generate a 3-phase execution plan. Each phase must build meaningfully on the previous one (Foundation → Build → Launch/Refine pattern or equivalent for this goal type).

Return ONLY a raw JSON object — no markdown fences, no extra text — in this exact shape:
{
  "phases": [
    {
      "title": "Short, evocative phase name (e.g. 'Foundations & Clarity')",
      "summary": "One sentence describing what this phase achieves",
      "tasks": [
        "Hyper-specific actionable task 1 tailored to: ${goal}",
        "Hyper-specific actionable task 2 tailored to: ${goal}",
        "Hyper-specific actionable task 3 tailored to: ${goal}"
      ]
    },
    {
      "title": "Phase 2 title",
      "summary": "One sentence",
      "tasks": ["Task 4", "Task 5", "Task 6"]
    },
    {
      "title": "Phase 3 title",
      "summary": "One sentence",
      "tasks": ["Task 7", "Task 8", "Task 9"]
    }
  ]
}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: systemPrompt + '\n\n' + userPrompt }] }],
    config: { responseMimeType: 'application/json' },
  });

  const raw = stripJsonFences(response.text || '{}');
  const data = JSON.parse(raw) as AIProjectPlan;

  // Validate shape
  if (!Array.isArray(data.phases) || data.phases.length === 0) {
    throw new Error('AI returned an invalid plan shape.');
  }
  return data;
}

// ---------------------------------------------------------------------------
// Create Project
// ---------------------------------------------------------------------------

export async function createProjectWithAI(
  userId: string,
  goal: string,
  reason: string,
  dueDate: Date,
) {
  // 1. Persist project shell immediately
  const project = await prisma.project.create({
    data: { user_id: userId, goal, original_reason: reason, due_date: dueDate },
  });

  let plan: AIProjectPlan;
  try {
    plan = await generateProjectPlan(goal, reason);
  } catch (err) {
    console.error('[Momentum] AI plan generation failed — activating context-aware fallback:', err);
    // Fallback: still 3 real phases, but generic enough to make sense for any goal
    plan = {
      phases: [
        {
          title: 'Phase 1: Foundation',
          summary: `Lay the groundwork for "${goal}"`,
          tasks: [
            `Research the core requirements needed to achieve "${goal}"`,
            `Identify and gather the tools, resources, or dependencies for "${goal}"`,
            `Create a focused outline or plan specifically for "${goal}"`,
          ],
        },
        {
          title: 'Phase 2: Build',
          summary: `Execute the core work for "${goal}"`,
          tasks: [
            `Complete the first major deliverable towards "${goal}"`,
            `Iterate and refine based on early results from "${goal}"`,
            `Validate your progress against the original vision of "${goal}"`,
          ],
        },
        {
          title: 'Phase 3: Launch & Refine',
          summary: `Polish and ship "${goal}"`,
          tasks: [
            `Run a final quality check on everything produced for "${goal}"`,
            `Share or deploy the output of "${goal}" to its intended audience`,
            `Document lessons learned and next steps after completing "${goal}"`,
          ],
        },
      ],
    };
  }

  // 2. Persist all phases and their tasks
  for (let i = 0; i < plan.phases.length; i++) {
    const phaseData = plan.phases[i];
    const phase = await prisma.phase.create({
      data: {
        project_id: project.id,
        title: phaseData.title,
        order: i + 1,
        status: i === 0 ? 'IN_PROGRESS' : 'PENDING',
      },
    });

    for (let j = 0; j < phaseData.tasks.length; j++) {
      await prisma.task.create({
        data: {
          phase_id: phase.id,
          title: phaseData.tasks[j],
          order: j + 1,
          status: 'PENDING',
        },
      });
    }
  }

  revalidatePath('/');
  return project.id;
}

// ---------------------------------------------------------------------------
// Complete Task → unlock next phase
// ---------------------------------------------------------------------------

export async function completeTask(taskId: string) {
  const task = await prisma.task.update({
    where: { id: taskId },
    data: { status: 'COMPLETED' },
    include: { phase: { include: { project: true } } },
  });

  const remaining = await prisma.task.count({
    where: { phase_id: task.phase_id, status: 'PENDING' },
  });

  if (remaining === 0) {
    // Mark current phase complete
    await prisma.phase.update({
      where: { id: task.phase_id },
      data: { status: 'COMPLETED' },
    });

    // Find and activate the next phase
    const nextPhase = await prisma.phase.findFirst({
      where: { project_id: task.phase.project_id, order: task.phase.order + 1 },
      include: { tasks: true },
    });

    if (nextPhase) {
      await prisma.phase.update({
        where: { id: nextPhase.id },
        data: { status: 'IN_PROGRESS' },
      });
    }
  }

  revalidatePath('/');
}

// ---------------------------------------------------------------------------
// Re-Anchor Protocol: regenerate tasks for a stuck phase
// ---------------------------------------------------------------------------

export async function regenerateTasks(phaseId: string, userReason: string) {
  const ai = getAI();

  const phase = await prisma.phase.findUnique({
    where: { id: phaseId },
    include: { project: true },
  });
  if (!phase) return;

  // Clear pending tasks
  await prisma.task.deleteMany({ where: { phase_id: phaseId, status: 'PENDING' } });

  const prompt = `You are Momentum, an AI execution agent. The user is stuck on the phase "${phase.title}" for their goal "${phase.project.goal}".
Their renewed motivation: "${userReason}".

Generate 3 highly approachable, friction-reducing, and hyper-specific micro-steps to get them moving again immediately.
Rules:
- Each task must be a concrete verb-led instruction tailored to "${phase.project.goal}"
- Tasks must be smaller and more immediate than the original phase tasks
- NEVER use generic phrases like "Step 1", "Initialize", "Review requirements"

Return ONLY a raw JSON object:
{ "tasks": ["Specific task 1", "Specific task 2", "Specific task 3"] }`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      config: { responseMimeType: 'application/json' },
    });

    const raw = stripJsonFences(response.text || '{}');
    const data = JSON.parse(raw) as { tasks: string[] };
    if (Array.isArray(data.tasks)) {
      for (let i = 0; i < data.tasks.length; i++) {
        await prisma.task.create({
          data: { phase_id: phaseId, title: data.tasks[i], order: i + 1, status: 'PENDING' },
        });
      }
    }
  } catch (err) {
    console.error('[Momentum] Re-Anchor AI call failed:', err);
  }

  revalidatePath('/');
}

// ---------------------------------------------------------------------------
// Dashboard State
// ---------------------------------------------------------------------------

export async function getDashboardState(userId: string) {
  return prisma.project.findFirst({
    where: {
      user_id: userId,
      phases: { some: { status: { not: 'COMPLETED' } } },
    },
    include: {
      phases: {
        orderBy: { order: 'asc' },
        include: { tasks: { orderBy: { order: 'asc' } } },
      },
    },
    orderBy: { due_date: 'asc' },
  });
}
