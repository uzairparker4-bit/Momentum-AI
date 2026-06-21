interface PhaseIndicatorProps {
  phaseNumber: number;
  phaseName: string;
  totalPhases: number;
  targetDate: string | null;
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
  targetDate,
}: PhaseIndicatorProps) {
  return (
    <header className="pt-14 pb-10 px-6 text-center">
      {/* Phase label */}
      <div className="inline-block mb-4">
        <div
          className="phase-container inline-block text-left px-5 py-3 rounded-xl"
          style={{ background: "rgba(246,173,85,0.06)" }}
        >
          <p
            className="text-xs uppercase tracking-widest mb-0.5"
            style={{ color: "rgba(246,173,85,0.6)" }}
          >
            Phase {phaseNumber} of {totalPhases}
          </p>
          <p
            className="text-lg font-medium"
            style={{ color: "#F6AD55", letterSpacing: "-0.01em" }}
          >
            {phaseName}
          </p>
        </div>
      </div>

      {/* Target date — shown quietly, never labelled "deadline" */}
      {targetDate && (
        <p className="text-sm mt-2" style={{ color: "#606060" }}>
          Your adjusted target:{" "}
          <span style={{ color: "#a0a0a0" }}>{formatTargetDate(targetDate)}</span>
        </p>
      )}
    </header>
  );
}
