"use client";

import {
  LineChart,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { NrrRow } from "@/lib/queries";
import { formatMonth } from "@/lib/formatMonth";
import { EmptyState } from "./EmptyState";
import { ExportButton } from "./ExportButton";

const currency = (value: number) =>
  `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

const pct = (value: number | null) =>
  value === null ? "—" : `${value.toFixed(1)}%`;

export const NrrChart = ({
  data,
  loading,
}: {
  data: NrrRow[];
  loading: boolean;
}) => {
  const hasData = data.some((row) => row.nrrPct !== null);

  return (
    <section
      className="flex flex-col gap-3 rounded-xl border p-4 transition-opacity"
      style={{ background: "var(--card-bg)", borderColor: "var(--card-border)", opacity: loading ? 0.5 : 1 }}
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-(--text-primary)">Net revenue retention</h2>
        <ExportButton filename="net-revenue-retention.csv" rows={data} />
      </div>

      {!loading && !hasData ? (
        <EmptyState message="No net revenue retention data for this range." />
      ) : (
        <>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data} margin={{ left: 8, right: 8 }}>
              <CartesianGrid stroke="var(--grid-line)" vertical={false} />
              <XAxis
                dataKey="month"
                tickFormatter={formatMonth}
                stroke="var(--text-muted)"
                tick={{ fill: "var(--text-muted)", fontSize: 12 }}
              />
              <YAxis
                tickFormatter={(v: number) => `${v}%`}
                stroke="var(--text-muted)"
                tick={{ fill: "var(--text-muted)", fontSize: 12 }}
                width={50}
                domain={["dataMin - 5", "dataMax + 5"]}
              />
              <Tooltip
                formatter={(value) => pct(value === null ? null : Number(value))}
                labelFormatter={(label) => formatMonth(String(label))}
                contentStyle={{
                  background: "var(--card-bg-raised)",
                  border: "1px solid var(--card-border)",
                  color: "var(--text-primary)",
                }}
                labelStyle={{ color: "var(--text-secondary)" }}
              />
              <ReferenceLine y={100} stroke="var(--text-muted)" strokeDasharray="4 4" />
              <Line
                type="monotone"
                dataKey="nrrPct"
                name="NRR"
                stroke="var(--series-aqua)"
                strokeWidth={2}
                dot={{ r: 4 }}
                connectNulls
              />
            </LineChart>
          </ResponsiveContainer>

          <details className="text-sm">
            <summary className="cursor-pointer text-(--text-secondary) hover:text-(--text-primary)">
              View as table
            </summary>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-left text-xs [font-variant-numeric:tabular-nums]">
                <thead>
                  <tr className="text-(--text-muted)">
                    <th className="pr-4 py-1">Month</th>
                    <th className="pr-4 py-1">Starting MRR</th>
                    <th className="pr-4 py-1">Expansion</th>
                    <th className="pr-4 py-1">Contraction</th>
                    <th className="pr-4 py-1">Churned</th>
                    <th className="pr-4 py-1">NRR</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((row) => (
                    <tr key={row.month} className="border-t text-(--text-secondary)" style={{ borderColor: "var(--card-border)" }}>
                      <td className="pr-4 py-1">{formatMonth(row.month)}</td>
                      <td className="pr-4 py-1">{currency(row.mrrStartOfMonth)}</td>
                      <td className="pr-4 py-1">{currency(row.expansionMrr)}</td>
                      <td className="pr-4 py-1">{currency(row.contractionMrr)}</td>
                      <td className="pr-4 py-1">{currency(row.churnedMrr)}</td>
                      <td className="pr-4 py-1">{pct(row.nrrPct)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}
    </section>
  );
};
