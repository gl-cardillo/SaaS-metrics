"use client";

import { useEffect, useState } from "react";
import { Filters, type FilterValue } from "./Filters";
import { MrrCharts } from "./MrrCharts";
import { ChurnChart } from "./ChurnChart";
import { CohortHeatmap } from "./CohortHeatmap";
import { PlanMix } from "./PlanMix";
import { StatTile } from "./StatTile";
import type { MrrRow, ChurnRow, CohortRetentionRow, PlanMixRow } from "@/lib/queries";

const currency = (value: number) =>
  `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const pct = (value: number | null) =>
  value === null ? "—" : `${value.toFixed(1)}%`;

const churnStatus = (value: number | null): "good" | "warning" | "critical" | undefined => {
  if (value === null) return undefined;
  if (value >= 6) return "critical";
  if (value >= 3) return "warning";
  return "good";
};

function buildQuery(filters: FilterValue): string {
  const params = new URLSearchParams();
  if (filters.start) params.set("start", filters.start);
  if (filters.end) params.set("end", filters.end);
  if (filters.tier) params.set("tier", filters.tier);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export const Dashboard = () => {
  const [filters, setFilters] = useState<FilterValue>({
    start: "",
    end: "",
    tier: "",
  });
  const [loading, setLoading] = useState(true);
  const [mrr, setMrr] = useState<MrrRow[]>([]);
  const [churn, setChurn] = useState<ChurnRow[]>([]);
  const [cohorts, setCohorts] = useState<CohortRetentionRow[]>([]);
  const [planMix, setPlanMix] = useState<PlanMixRow[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    const qs = buildQuery(filters);

    setLoading(true);
    Promise.all([
      fetch(`/api/mrr${qs}`, { signal: controller.signal }).then((r) =>
        r.json(),
      ),
      fetch(`/api/churn${qs}`, { signal: controller.signal }).then((r) =>
        r.json(),
      ),
      fetch(`/api/cohorts${qs}`, { signal: controller.signal }).then((r) =>
        r.json(),
      ),
      fetch(`/api/plan-mix${qs}`, { signal: controller.signal }).then((r) =>
        r.json(),
      ),
    ])
      .then(([mrrData, churnData, cohortData, planMixData]) => {
        setMrr(mrrData);
        setChurn(churnData);
        setCohorts(cohortData);
        setPlanMix(planMixData);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") setLoading(false);
      });

    return () => controller.abort();
  }, [filters]);

  const latestMrr = mrr.at(-1);
  const priorMrr = mrr.at(-2);
  const mrrDelta =
    latestMrr && priorMrr ? latestMrr.mrr - priorMrr.mrr : null;
  const latestChurn = churn.at(-1);

  return (
    <div className="flex flex-col gap-6">
      <Filters value={filters} onChange={setFilters} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="MRR"
          value={latestMrr ? currency(latestMrr.mrr) : "—"}
          sublabel={
            mrrDelta === null
              ? undefined
              : `${mrrDelta >= 0 ? "+" : ""}${currency(mrrDelta)} vs last month`
          }
          status={mrrDelta === null ? undefined : mrrDelta >= 0 ? "good" : "warning"}
          loading={loading}
        />
        <StatTile
          label="New MRR this month"
          value={latestMrr ? currency(latestMrr.newMrr) : "—"}
          loading={loading}
        />
        <StatTile
          label="Customer churn"
          value={latestChurn ? pct(latestChurn.customerChurnRatePct) : "—"}
          sublabel="This month"
          status={latestChurn ? churnStatus(latestChurn.customerChurnRatePct) : undefined}
          loading={loading}
        />
        <StatTile
          label="Revenue churn"
          value={latestChurn ? pct(latestChurn.revenueChurnRatePct) : "—"}
          sublabel="This month"
          status={latestChurn ? churnStatus(latestChurn.revenueChurnRatePct) : undefined}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <MrrCharts data={mrr} loading={loading} />
        <div className="flex flex-col gap-4">
          <ChurnChart data={churn} loading={loading} />
          <PlanMix data={planMix} loading={loading} />
        </div>
      </div>

      <CohortHeatmap data={cohorts} loading={loading} />
    </div>
  );
};
