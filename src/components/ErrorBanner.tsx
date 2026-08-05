export const ErrorBanner = ({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) => (
  <div
    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 text-sm"
    style={{
      background: "var(--card-bg)",
      borderColor: "var(--status-critical)",
      color: "var(--text-primary)",
    }}
    role="alert"
  >
    <span>
      <span className="font-medium" style={{ color: "var(--status-critical)" }}>
        Couldn&apos;t load the dashboard.
      </span>{" "}
      <span className="text-(--text-secondary)">{message}</span>
    </span>
    <button
      type="button"
      onClick={onRetry}
      className="rounded-md border px-3 py-1 font-medium text-(--text-primary) hover:opacity-80"
      style={{ borderColor: "var(--card-border)", background: "var(--card-bg-raised)" }}
    >
      Retry
    </button>
  </div>
);
