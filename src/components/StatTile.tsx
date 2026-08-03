type StatTileProps = {
  label: string;
  value: string;
  sublabel?: string;
  status?: "good" | "warning" | "serious" | "critical";
  loading?: boolean;
};

const statusColor: Record<NonNullable<StatTileProps["status"]>, string> = {
  good: "var(--status-good)",
  warning: "var(--status-warning)",
  serious: "var(--status-serious)",
  critical: "var(--status-critical)",
};

export const StatTile = ({ label, value, sublabel, status, loading }: StatTileProps) => {
  return (
    <div
      className="flex flex-col gap-1 rounded-xl border p-5 transition-opacity"
      style={{
        background: "var(--card-bg)",
        borderColor: status ? statusColor[status] : "var(--card-border)",
        opacity: loading ? 0.5 : 1,
      }}
    >
      <span className="text-sm font-medium text-(--text-muted)">{label}</span>
      <span className="text-4xl font-bold tabular-nums text-(--text-primary)">{value}</span>
      {sublabel && (
        <span
          className="text-sm font-medium"
          style={{ color: status ? statusColor[status] : "var(--text-secondary)" }}
        >
          {sublabel}
        </span>
      )}
    </div>
  );
};
