"use client";

import { PLAN_TIERS } from "@/lib/constants";

export type FilterValue = {
  start: string;
  end: string;
  tier: string;
};

type FiltersProps = {
  value: FilterValue;
  onChange: (value: FilterValue) => void;
};

export const Filters = ({ value, onChange }: FiltersProps) => {
  const inputClass =
    "rounded-md border px-2 py-1 text-(--text-primary) outline-none focus:border-[var(--accent)]";
  const inputStyle = { background: "var(--card-bg-raised)", borderColor: "var(--card-border)" };

  return (
    <div
      className="flex flex-wrap items-end gap-4 rounded-xl border p-4"
      style={{ background: "var(--card-bg)", borderColor: "var(--card-border)" }}
    >
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-(--text-muted)">From</span>
        <input
          type="date"
          value={value.start}
          onChange={(e) => onChange({ ...value, start: e.target.value })}
          className={inputClass}
          style={inputStyle}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-(--text-muted)">To</span>
        <input
          type="date"
          value={value.end}
          onChange={(e) => onChange({ ...value, end: e.target.value })}
          className={inputClass}
          style={inputStyle}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-(--text-muted)">Plan tier</span>
        <select
          value={value.tier}
          onChange={(e) => onChange({ ...value, tier: e.target.value })}
          className={inputClass}
          style={inputStyle}
        >
          <option value="">All tiers</option>
          {PLAN_TIERS.map((tier) => (
            <option key={tier} value={tier}>
              {tier}
            </option>
          ))}
        </select>
      </label>
      {(value.start || value.end || value.tier) && (
        <button
          type="button"
          onClick={() => onChange({ start: "", end: "", tier: "" })}
          className="text-sm underline underline-offset-2 text-(--text-secondary) hover:text-(--text-primary)"
        >
          Clear filters
        </button>
      )}
    </div>
  );
};
