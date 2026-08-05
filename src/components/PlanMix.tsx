"use client";

import type { PlanMixRow } from "@/lib/queries";
import { PLAN_TIERS } from "@/lib/constants";
import { EmptyState } from "./EmptyState";
import { ExportButton } from "./ExportButton";

const COLOR_BY_TIER: Record<string, string> = {
  [PLAN_TIERS[0]]: "var(--series-blue)",
  [PLAN_TIERS[1]]: "var(--series-orange)",
  [PLAN_TIERS[2]]: "var(--series-aqua)",
};

export const PlanMix = ({
  data,
  loading,
}: {
  data: PlanMixRow[];
  loading: boolean;
}) => {
  const total = data.reduce((sum, r) => sum + r.activeCustomers, 0);
  const rows = [...data].sort((a, b) => b.activeCustomers - a.activeCustomers);

  return (
    <section
      className="flex flex-col gap-3 rounded-xl border p-4 transition-opacity"
      style={{
        background: "var(--card-bg)",
        borderColor: "var(--card-border)",
        opacity: loading ? 0.5 : 1,
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-(--text-primary)">Plan mix</h2>
        <ExportButton filename="plan-mix.csv" rows={data} />
      </div>
      <div className="flex flex-col gap-3">
        {rows.map((row) => {
          const share = total > 0 ? (row.activeCustomers / total) * 100 : 0;
          const color = COLOR_BY_TIER[row.planName] ?? "var(--text-muted)";
          return (
            <div key={row.planName} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between text-sm">
                <span className="font-medium text-(--text-primary)">{row.planName}</span>
                <span className="text-(--text-secondary) tabular-nums">
                  {row.activeCustomers}{" "}
                  <span className="text-(--text-muted)">
                    ({share.toFixed(0)}%)
                  </span>
                </span>
              </div>
              <div
                className="h-2 w-full rounded-full"
                style={{ background: "var(--card-bg-raised)" }}
              >
                <div
                  className="h-2 rounded-full transition-[width]"
                  style={{ width: `${share}%`, background: color }}
                />
              </div>
            </div>
          );
        })}
        {rows.length === 0 && !loading && (
          <EmptyState message="No active subscriptions in range." />
        )}
      </div>
    </section>
  );
};
