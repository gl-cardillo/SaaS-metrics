"use client";

import { useCallback, useEffect, useState } from "react";
import { Filters, type FilterValue } from "./Filters";
import { MrrCharts } from "./MrrCharts";
import { ChurnChart } from "./ChurnChart";
import { NrrChart } from "./NrrChart";
import { CohortHeatmap } from "./CohortHeatmap";
import { PlanMix } from "./PlanMix";
import { StatTile } from "./StatTile";
import { ErrorBanner } from "./ErrorBanner";
import { DashboardSkeleton } from "./Skeleton";
import type { MrrRow, NrrRow, ChurnRow, CohortRetentionRow, PlanMixRow } from "@/lib/queries";

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

const nrrStatus = (value: number | null): "good" | "warning" | "critical" | undefined => {
  if (value === null) return undefined;
  if (value < 85) return "critical";
  if (value < 100) return "warning";
  return "good";
};

const buildQuery = (filters: FilterValue): string => {
  const params = new URLSearchParams();
  if (filters.start) params.set("start", filters.start);
  if (filters.end) params.set("end", filters.end);
  if (filters.tier) params.set("tier", filters.tier);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

async function fetchJson<T>(url: string, signal: AbortSignal): Promise<T> {
  const res = await fetch(url, { signal });
  if (!res.ok) {
    throw new Error(`${url.split("?")[0]} returned ${res.status}`);
  }
  return res.json();
}

export const Dashboard = () => {
  const [filters, setFilters] = useState<FilterValue>({
    start: "",
    end: "",
    tier: "",
  });
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);
  const [mrr, setMrr] = useState<MrrRow[]>([]);
  const [nrr, setNrr] = useState<NrrRow[]>([]);
  const [churn, setChurn] = useState<ChurnRow[]>([]);
  const [cohorts, setCohorts] = useState<CohortRetentionRow[]>([]);
  const [planMix, setPlanMix] = useState<PlanMixRow[]>([]);

  const fetchAll = useCallback((current: FilterValue, signal: AbortSignal) => {
    const qs = buildQuery(current);

    setLoading(true);
    setError(null);
    Promise.all([
      fetchJson<MrrRow[]>(`/api/mrr${qs}`, signal),
      fetchJson<NrrRow[]>(`/api/nrr${qs}`, signal),
      fetchJson<ChurnRow[]>(`/api/churn${qs}`, signal),
      fetchJson<CohortRetentionRow[]>(`/api/cohorts${qs}`, signal),
      fetchJson<PlanMixRow[]>(`/api/plan-mix${qs}`, signal),
    ])
      .then(([mrrData, nrrData, churnData, cohortData, planMixData]) => {
        setMrr(mrrData);
        setNrr(nrrData);
        setChurn(churnData);
        setCohorts(cohortData);
        setPlanMix(planMixData);
        setLoading(false);
        setInitialLoad(false);
      })
      .catch((err) => {
        if (err instanceof Error && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Something went wrong.");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchAll(filters, controller.signal);
    return () => controller.abort();
  }, [filters, retryToken, fetchAll]);

  const handleRetry = () => setRetryToken((t) => t + 1);

  const latestMrr = mrr.at(-1);
  const priorMrr = mrr.at(-2);
  const mrrDelta =
    latestMrr && priorMrr ? latestMrr.mrr - priorMrr.mrr : null;
  const latestChurn = churn.at(-1);
  const latestNrr = [...nrr].reverse().find((row) => row.nrrPct !== null) ?? null;

  return (
    <div className="flex flex-col gap-6">
      <Filters value={filters} onChange={setFilters} />

      {error && <ErrorBanner message={error} onRetry={handleRetry} />}

      {initialLoad && loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
              label="Net revenue retention"
              value={latestNrr ? pct(latestNrr.nrrPct) : "—"}
              sublabel="Existing customers"
              status={latestNrr ? nrrStatus(latestNrr.nrrPct) : undefined}
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
              <NrrChart data={nrr} loading={loading} />
              <PlanMix data={planMix} loading={loading} />
            </div>
          </div>

          <CohortHeatmap data={cohorts} loading={loading} />
        </>
      )}
    </div>
  );
};
