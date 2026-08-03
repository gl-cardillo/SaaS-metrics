"use client";

import type { CohortRetentionRow } from "@/lib/queries";
import { formatMonth } from "@/lib/formatMonth";

// Sequential blue ramp, light -> dark, 13 stops
const RAMP = [
  "#cde2fb", "#b7d3f6", "#9ec5f4", "#86b6ef", "#6da7ec", "#5598e7",
  "#3987e5", "#2a78d6", "#256abf", "#1c5cab", "#184f95", "#104281", "#0d366b",
];

const textColorFor = (hex: string): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.6 ? "#0b0b0b" : "#ffffff";
};

const stepFor = (pct: number): { bg: string; fg: string } => {
  const idx = Math.min(RAMP.length - 1, Math.max(0, Math.round((pct / 100) * (RAMP.length - 1))));
  const bg = RAMP[idx];
  return { bg, fg: textColorFor(bg) };
};

export const CohortHeatmap = ({
  data,
  loading,
}: {
  data: CohortRetentionRow[];
  loading: boolean;
}) => {
  const cohortMonths = [...new Set(data.map((r) => r.cohortMonth))].sort();
  const maxMonth = data.reduce(
    (max, r) => Math.max(max, r.monthsSinceSignup),
    0,
  );
  const columns = Array.from({ length: maxMonth + 1 }, (_, i) => i);

  const cellFor = (cohortMonth: string, monthsSinceSignup: number) =>
    data.find(
      (r) =>
        r.cohortMonth === cohortMonth &&
        r.monthsSinceSignup === monthsSinceSignup,
    );

  const sizeByCohort = new Map(data.map((r) => [r.cohortMonth, r.cohortSize]));

  return (
    <section
      className="flex flex-col gap-3 rounded-xl border p-4 transition-opacity"
      style={{ background: "var(--card-bg)", borderColor: "var(--card-border)", opacity: loading ? 0.5 : 1 }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-(--text-primary)">Cohort retention</h2>
        <div className="flex items-center gap-2 text-xs text-(--text-muted)">
          <span>0%</span>
          <span
            className="h-2 w-24 rounded-full"
            style={{ background: `linear-gradient(to right, ${RAMP[0]}, ${RAMP[RAMP.length - 1]})` }}
          />
          <span>100%</span>
        </div>
      </div>
      <div className="max-h-105 overflow-auto rounded-lg">
        <table className="border-separate [border-spacing:3px] text-[11px] [font-variant-numeric:tabular-nums]">
          <thead>
            <tr>
              <th
                className="sticky top-0 left-0 z-20 w-20 px-2 py-1.5 text-left font-medium text-(--text-muted)"
                style={{ background: "var(--card-bg)" }}
              >
                Cohort
              </th>
              <th
                className="sticky top-0 left-20 z-20 w-14 px-2 py-1.5 text-left font-medium text-(--text-muted)"
                style={{ background: "var(--card-bg)" }}
              >
                Size
              </th>
              {columns.map((m) => (
                <th
                  key={m}
                  className="sticky top-0 z-10 w-9 px-1 py-1.5 text-center font-medium text-(--text-muted)"
                  style={{ background: "var(--card-bg)" }}
                >
                  M{m}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cohortMonths.map((cohortMonth) => (
              <tr key={cohortMonth}>
                <td
                  className="sticky left-0 z-10 w-20 rounded-md px-2 py-1.5 font-medium text-(--text-secondary)"
                  style={{ background: "var(--card-bg)" }}
                >
                  {formatMonth(cohortMonth)}
                </td>
                <td
                  className="sticky left-20 z-10 w-14 rounded-md px-2 py-1.5 text-(--text-secondary)"
                  style={{ background: "var(--card-bg)" }}
                >
                  {sizeByCohort.get(cohortMonth)}
                </td>
                {columns.map((m) => {
                  const cell = cellFor(cohortMonth, m);
                  if (!cell)
                    return (
                      <td
                        key={m}
                        className="w-9 rounded-md"
                        style={{ background: "var(--cell-empty)" }}
                      />
                    );
                  const { bg, fg } = stepFor(cell.retentionPct);
                  return (
                    <td
                      key={m}
                      title={`${formatMonth(cohortMonth)}, month ${m}: ${cell.retentionPct}% retained (${cell.retainedCustomers}/${cell.cohortSize})`}
                      className="w-9 rounded-md py-1.5 text-center font-medium"
                      style={{ background: bg, color: fg }}
                    >
                      {cell.retentionPct.toFixed(0)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
};
