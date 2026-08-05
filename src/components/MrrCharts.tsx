"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { MrrRow } from "@/lib/queries";
import { formatMonth } from "@/lib/formatMonth";
import { EmptyState } from "./EmptyState";
import { ExportButton } from "./ExportButton";

const currency = (value: number) =>
  `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export const MrrCharts = ({
  data,
  loading,
}: {
  data: MrrRow[];
  loading: boolean;
}) => {
  if (!loading && data.length === 0) {
    return (
      <section
        className="flex flex-col rounded-xl border p-4 transition-opacity"
        style={{ background: "var(--card-bg)", borderColor: "var(--card-border)", opacity: loading ? 0.5 : 1 }}
      >
        <h2 className="text-sm font-semibold text-(--text-primary)">MRR</h2>
        <EmptyState message="No MRR data for this range." />
      </section>
    );
  }

  return (
    <section
      className="flex flex-col gap-6 rounded-xl border p-4 transition-opacity"
      style={{ background: "var(--card-bg)", borderColor: "var(--card-border)", opacity: loading ? 0.5 : 1 }}
    >
      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-(--text-primary)">MRR trend</h2>
          <ExportButton filename="mrr.csv" rows={data} />
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={data} margin={{ left: 8, right: 8 }}>
            <CartesianGrid stroke="var(--grid-line)" vertical={false} />
            <XAxis
              dataKey="month"
              tickFormatter={formatMonth}
              stroke="var(--text-muted)"
              tick={{ fill: "var(--text-muted)", fontSize: 12 }}
            />
            <YAxis
              tickFormatter={currency}
              stroke="var(--text-muted)"
              tick={{ fill: "var(--text-muted)", fontSize: 12 }}
              width={70}
            />
            <Tooltip
              formatter={(value) => currency(Number(value))}
              labelFormatter={(label) => formatMonth(String(label))}
              contentStyle={{
                background: "var(--card-bg-raised)",
                border: "1px solid var(--card-border)",
                color: "var(--text-primary)",
              }}
              labelStyle={{ color: "var(--text-secondary)" }}
            />
            <Area
              type="monotone"
              dataKey="mrr"
              name="MRR"
              stroke="var(--series-blue)"
              fill="var(--series-blue)"
              fillOpacity={0.18}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-(--text-primary)">MRR movement</h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ left: 8, right: 8 }}>
            <CartesianGrid stroke="var(--grid-line)" vertical={false} />
            <XAxis
              dataKey="month"
              tickFormatter={formatMonth}
              stroke="var(--text-muted)"
              tick={{ fill: "var(--text-muted)", fontSize: 12 }}
            />
            <YAxis
              tickFormatter={currency}
              stroke="var(--text-muted)"
              tick={{ fill: "var(--text-muted)", fontSize: 12 }}
              width={70}
            />
            <Tooltip
              formatter={(value) => currency(Number(value))}
              labelFormatter={(label) => formatMonth(String(label))}
              contentStyle={{
                background: "var(--card-bg-raised)",
                border: "1px solid var(--card-border)",
                color: "var(--text-primary)",
              }}
              labelStyle={{ color: "var(--text-secondary)" }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12, color: "var(--text-secondary)" }}
            />
            <Bar dataKey="newMrr" name="New" stackId="mrr" fill="var(--series-blue)" />
            <Bar dataKey="expansionMrr" name="Expansion" stackId="mrr" fill="var(--series-aqua)" />
            <Bar dataKey="contractionMrr" name="Contraction" stackId="mrr" fill="var(--series-yellow)" />
            <Bar dataKey="churnedMrr" name="Churned" stackId="mrr" fill="var(--series-red)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer text-(--text-secondary) hover:text-(--text-primary)">
          View as table
        </summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left text-xs [font-variant-numeric:tabular-nums]">
            <thead>
              <tr className="text-(--text-muted)">
                <th className="pr-4 py-1">Month</th>
                <th className="pr-4 py-1">New</th>
                <th className="pr-4 py-1">Expansion</th>
                <th className="pr-4 py-1">Contraction</th>
                <th className="pr-4 py-1">Churned</th>
                <th className="pr-4 py-1">MRR</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.month} className="border-t text-(--text-secondary)" style={{ borderColor: "var(--card-border)" }}>
                  <td className="pr-4 py-1">{formatMonth(row.month)}</td>
                  <td className="pr-4 py-1">{currency(row.newMrr)}</td>
                  <td className="pr-4 py-1">{currency(row.expansionMrr)}</td>
                  <td className="pr-4 py-1">{currency(row.contractionMrr)}</td>
                  <td className="pr-4 py-1">{currency(row.churnedMrr)}</td>
                  <td className="pr-4 py-1">{currency(row.mrr)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
};
