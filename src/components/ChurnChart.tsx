"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { ChurnRow } from "@/lib/queries";
import { formatMonth } from "@/lib/formatMonth";

const pct = (value: number | null) =>
  value === null ? "—" : `${value.toFixed(2)}%`;

export const ChurnChart = ({
  data,
  loading,
}: {
  data: ChurnRow[];
  loading: boolean;
}) => {
  return (
    <section
      className="flex flex-col gap-3 rounded-xl border p-4 transition-opacity"
      style={{ background: "var(--card-bg)", borderColor: "var(--card-border)", opacity: loading ? 0.5 : 1 }}
    >
      <h2 className="text-sm font-semibold text-white">Monthly churn rate</h2>
      <ResponsiveContainer width="100%" height={240}>
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
          />
          <Tooltip
            formatter={(value) => pct(Number(value))}
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
          <Line
            type="monotone"
            dataKey="customerChurnRatePct"
            name="Customer churn"
            stroke="var(--series-blue)"
            strokeWidth={2}
            dot={{ r: 4 }}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="revenueChurnRatePct"
            name="Revenue churn"
            stroke="var(--series-orange)"
            strokeWidth={2}
            dot={{ r: 4 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>

      <details className="text-sm">
        <summary className="cursor-pointer text-(--text-secondary) hover:text-white">
          View as table
        </summary>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-left text-xs [font-variant-numeric:tabular-nums]">
            <thead>
              <tr className="text-(--text-muted)">
                <th className="pr-4 py-1">Month</th>
                <th className="pr-4 py-1">Active at start</th>
                <th className="pr-4 py-1">Churned customers</th>
                <th className="pr-4 py-1">Customer churn</th>
                <th className="pr-4 py-1">Revenue churn</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.month} className="border-t text-(--text-secondary)" style={{ borderColor: "var(--card-border)" }}>
                  <td className="pr-4 py-1">{formatMonth(row.month)}</td>
                  <td className="pr-4 py-1">{row.activeAtStart}</td>
                  <td className="pr-4 py-1">{row.churnedCustomers}</td>
                  <td className="pr-4 py-1">{pct(row.customerChurnRatePct)}</td>
                  <td className="pr-4 py-1">{pct(row.revenueChurnRatePct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </section>
  );
};
