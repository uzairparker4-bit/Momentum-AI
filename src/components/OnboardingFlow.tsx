"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createGoalWithPlan } from "@/actions/goals";

type Path = "A" | "B" | null;

interface Answers {
  goal: string;
  stuckPoint: string;
  timePerDay: string;
  month: string;
  year: string;
}

const TIME_OPTIONS = ["15 min", "30 min", "1 hour", "2+ hours"];

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function getYears() {
  const y = new Date().getFullYear();
  return Array.from({ length: 6 }, (_, i) => String(y + i));
}

export default function OnboardingFlow({ userId }: { userId: string }) {
  const router = useRouter();
  const [path, setPath] = useState<Path>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({
    goal: "",
    stuckPoint: "",
    timePerDay: "30 min",
    month: MONTHS[new Date().getMonth()],
    year: String(new Date().getFullYear() + 1),
  });
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [hasPlanError, setHasPlanError] = useState(false);

  const update = (key: keyof Answers, val: string) =>
    setAnswers((prev) => ({ ...prev, [key]: val }));

  const targetDateStr = () => {
    const m = MONTHS.indexOf(answers.month) + 1;
    return `${answers.year}-${String(m).padStart(2, "0")}-01`;
  };

  const handleSubmit = () => {
    if (!answers.goal.trim()) { setError("Please describe your goal."); return; }
    setError("");
    setHasPlanError(false);
    startTransition(async () => {
      try {
        await createGoalWithPlan({
          userId,
          goal: answers.goal,
          targetDate: targetDateStr(),
          stuckPoint: path === "B" ? answers.stuckPoint : undefined,
          timePerDay: path === "B" ? answers.timePerDay : undefined,
        });
        router.push("/dashboard");
      } catch (e) {
        setHasPlanError(true);
        setError("We're having trouble building your plan right now. Please try again in a few minutes.");
        console.error(e);
      }
    });
  };

  // ── Plan Error Screen ────────────────────────────────────
  if (hasPlanError) {
    return (
      <Screen>
        <Label>Error</Label>
        <Heading>We&apos;re having trouble building your plan right now. Please try again in a few minutes.</Heading>
        <button
          id="try-again-btn"
          onClick={() => {
            setHasPlanError(false);
            setError("");
            handleSubmit();
          }}
          disabled={isPending}
          className="btn-capsule btn-capsule-teal mt-8 w-full"
        >
          {isPending ? <Spinner /> : "Try Again"}
        </button>
      </Screen>
    );
  }

  // ── Path selector ────────────────────────────────────────
  if (!path) {
    return (
      <Screen>
        <Label>Let&apos;s start.</Label>
        <Heading>What brings you here today?</Heading>
        <div className="flex flex-col gap-4 mt-10">
          <PathCard
            id="path-a"
            title="I know my goal"
            subtitle="I have something specific in mind and just need a clear path."
            onClick={() => { setPath("A"); setStep(0); }}
          />
          <PathCard
            id="path-b"
            title="Help me plan it"
            subtitle="I know I want to get unstuck, but I need help figuring out the steps."
            onClick={() => { setPath("B"); setStep(0); }}
          />
        </div>
      </Screen>
    );
  }

  // ── Path A ───────────────────────────────────────────────
  if (path === "A") {
    if (step === 0) return (
      <Screen>
        <Label>Step 1 of 2</Label>
        <Heading>What do you want to achieve?</Heading>
        <textarea
          id="goal-input"
          className="input-field mt-8 h-32"
          placeholder="e.g. I want to complete my online course and get certified by July 2026"
          value={answers.goal}
          onChange={(e) => update("goal", e.target.value)}
          autoFocus
        />
        <p className="text-xs mt-2" style={{ color: "#808080" }}>
          Tip: include your target date and how much time you can give daily for a better plan
        </p>
        {error && <p className="text-sm mt-2" style={{ color: "#F6AD55" }}>{error}</p>}
        <Next disabled={!answers.goal.trim()} onClick={() => { if (!answers.goal.trim()) { setError("Please describe your goal."); return; } setError(""); setStep(1); }} />
      </Screen>
    );

    if (step === 1) return (
      <Screen>
        <Label>Step 2 of 2</Label>
        <Heading>By when do you want to achieve it?</Heading>
        <MonthYearPicker answers={answers} update={update} />
        <button
          id="submit-plan-btn"
          onClick={handleSubmit}
          disabled={isPending}
          className="btn-capsule btn-capsule-teal mt-8 w-full"
        >
          {isPending ? <Spinner /> : "Build my plan"}
        </button>
        {error && <p className="text-sm mt-3" style={{ color: "#F6AD55" }}>{error}</p>}
      </Screen>
    );
  }

  // ── Path B ───────────────────────────────────────────────
  if (path === "B") {
    if (step === 0) return (
      <Screen>
        <Label>Step 1 of 4</Label>
        <Heading>What do you want to achieve?</Heading>
        <textarea
          id="goal-input-b"
          className="input-field mt-8 h-32"
          placeholder="e.g. Launch my freelance design business"
          value={answers.goal}
          onChange={(e) => update("goal", e.target.value)}
          autoFocus
        />
        {error && <p className="text-sm mt-2" style={{ color: "#F6AD55" }}>{error}</p>}
        <Next disabled={!answers.goal.trim()} onClick={() => { if (!answers.goal.trim()) { setError("Please describe your goal."); return; } setError(""); setStep(1); }} />
      </Screen>
    );

    if (step === 1) return (
      <Screen>
        <Label>Step 2 of 4</Label>
        <Heading>Where exactly are you feeling stuck right now?</Heading>
        <textarea
          id="stuck-input"
          className="input-field mt-8 h-32"
          placeholder="e.g. I keep starting but stop when it's time to show my work to people"
          value={answers.stuckPoint}
          onChange={(e) => update("stuckPoint", e.target.value)}
          autoFocus
        />
        <Next onClick={() => setStep(2)} />
      </Screen>
    );

    if (step === 2) return (
      <Screen>
        <Label>Step 3 of 4</Label>
        <Heading>How much time can you realistically give per day?</Heading>
        <div className="grid grid-cols-2 gap-3 mt-8">
          {TIME_OPTIONS.map((opt) => (
            <button
              key={opt}
              id={`time-${opt.replace(/\s/g, "-")}`}
              onClick={() => { update("timePerDay", opt); setStep(3); }}
              className="py-4 px-6 rounded-2xl text-sm font-medium transition-all"
              style={{
                background: answers.timePerDay === opt ? "rgba(79,209,197,0.12)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${answers.timePerDay === opt ? "#4FD1C5" : "#2a2a2a"}`,
                color: answers.timePerDay === opt ? "#4FD1C5" : "#e8e8e8",
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      </Screen>
    );

    if (step === 3) return (
      <Screen>
        <Label>Step 4 of 4</Label>
        <Heading>By when do you want to achieve it?</Heading>
        <MonthYearPicker answers={answers} update={update} />
        <button
          id="submit-plan-btn-b"
          onClick={handleSubmit}
          disabled={isPending}
          className="btn-capsule btn-capsule-teal mt-8 w-full"
        >
          {isPending ? <Spinner /> : "Build my plan"}
        </button>
        {error && <p className="text-sm mt-3" style={{ color: "#F6AD55" }}>{error}</p>}
      </Screen>
    );
  }

  return null;
}

// ── Sub-components ──────────────────────────────────────────

function Screen({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: "#0d0d0d" }}
    >
      <div className="w-full max-w-lg animate-fade-in">{children}</div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs uppercase tracking-widest mb-4" style={{ color: "#606060" }}>
      {children}
    </p>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return (
    <h1 className="text-2xl font-light leading-snug" style={{ color: "#e8e8e8", letterSpacing: "-0.01em" }}>
      {children}
    </h1>
  );
}

function Next({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      id="next-btn"
      onClick={onClick}
      disabled={disabled}
      className="btn-capsule btn-capsule-teal mt-8 w-full"
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      Continue →
    </button>
  );
}

function MonthYearPicker({
  answers, update,
}: {
  answers: Answers;
  update: (k: keyof Answers, v: string) => void;
}) {
  const selectStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid #2a2a2a",
    borderRadius: "12px",
    padding: "0.875rem 1rem",
    color: "#e8e8e8",
    fontSize: "1rem",
    width: "100%",
    outline: "none",
    fontFamily: "Inter, system-ui, sans-serif",
    cursor: "pointer",
  };
  return (
    <div className="flex gap-4 mt-8">
      <select id="month-select" value={answers.month} onChange={(e) => update("month", e.target.value)} style={selectStyle}>
        {MONTHS.map((m) => (
          <option key={m} value={m} style={{ color: "#0d0d0d", backgroundColor: "#ffffff" }}>
            {m}
          </option>
        ))}
      </select>
      <select id="year-select" value={answers.year} onChange={(e) => update("year", e.target.value)} style={selectStyle}>
        {getYears().map((y) => (
          <option key={y} value={y} style={{ color: "#0d0d0d", backgroundColor: "#ffffff" }}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}

function PathCard({ id, title, subtitle, onClick }: { id: string; title: string; subtitle: string; onClick: () => void }) {
  return (
    <button
      id={id}
      onClick={onClick}
      className="text-left p-6 rounded-2xl transition-all"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #2a2a2a" }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "#4FD1C5";
        (e.currentTarget as HTMLButtonElement).style.background = "rgba(79,209,197,0.05)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "#2a2a2a";
        (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)";
      }}
    >
      <p className="text-base font-medium mb-1" style={{ color: "#e8e8e8" }}>{title}</p>
      <p className="text-sm" style={{ color: "#a0a0a0", fontWeight: 300 }}>{subtitle}</p>
    </button>
  );
}

function Spinner() {
  return (
    <span className="flex items-center gap-2">
      <span
        style={{
          width: 16, height: 16, borderRadius: "50%",
          border: "2px solid rgba(13,13,13,0.3)",
          borderTopColor: "#0d0d0d",
          display: "inline-block",
          animation: "spin 0.8s linear infinite",
        }}
      />
      Building your plan...

    </span>
  );
}
