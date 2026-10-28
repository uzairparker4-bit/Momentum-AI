interface PhaseIndicatorProps {
  phaseNumber: number;
  phaseName: string;
  totalPhases: number;
  completedTasksCount: number;
  totalTasksCount: number;
  targetDate: string | null;
  goalTitle?: string;
}

function formatTargetDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export default function PhaseIndicator({
  phaseNumber,
  phaseName,
  totalPhases,
  completedTasksCount,
  totalTasksCount,
  targetDate,
  goalTitle,
}: PhaseIndicatorProps) {
  const progressPercent =
    totalTasksCount > 0
      ? Math.round((completedTasksCount / totalTasksCount) * 100)
      : 0;

  return (
    <header className="pt-8 pb-6 px-6 text-center max-w-md mx-auto w-full">
      {/* Greeting / Goal title */}
      <h1
        className="text-xl font-bold mb-1 tracking-tight"
        style={{ color: "#111827" }}
      >
        {goalTitle ? goalTitle : "Welcome back"}
      </h1>

      <p className="text-xs mb-4" style={{ color: "#6b7280" }}>
        One step at a time.
      </p>

      {/* Green Pill Badge: Phase X of 3 · [phase name] */}
      <div className="flex justify-center mb-3">
        <span
          className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold"
          style={{
            background: "#d1fae5",
            color: "#065f46",
          }}
        >
          Phase {phaseNumber} of {totalPhases} · {phaseName}
        </span>
      </div>

      {/* Thin progress bar: background #e5e7eb, fill linear-gradient #10b981 to #34d399 */}
      <div className="w-full max-w-xs mx-auto">
        <div
          className="w-full h-1.5 rounded-full overflow-hidden"
          style={{ background: "#e5e7eb" }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${Math.max(4, progressPercent)}%`,
              background: "linear-gradient(90deg, #10b981 0%, #34d399 100%)",
            }}
          />
        </div>
      </div>

      {/* Target date — quiet display */}
      {targetDate && (
        <p className="text-[11px] mt-2.5" style={{ color: "#6b7280" }}>
          Target:{" "}
          <span style={{ color: "#111827", fontWeight: 500 }}>
            {formatTargetDate(targetDate)}
          </span>
        </p>
      )}
    </header>
  );
}
