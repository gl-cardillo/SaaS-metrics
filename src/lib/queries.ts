import { prisma } from "./prisma";

const num = (value: unknown): number => {
  return value === null || value === undefined ? 0 : Number(value);
};

export type DashboardFilters = {
  startDate?: string | null;
  endDate?: string | null;
  planTier?: string | null;
};

const normalize = (filters: DashboardFilters) => ({
  startDate: filters.startDate ?? null,
  endDate: filters.endDate ?? null,
  planTier: filters.planTier ?? null,
});

export type MrrRow = {
  month: string;
  newMrr: number;
  expansionMrr: number;
  contractionMrr: number;
  churnedMrr: number;
  mrr: number;
};

// Monthly MRR breakdown, filtered by date range and current plan tier
export async function getMonthlyMrr(filters: DashboardFilters = {}): Promise<MrrRow[]> {
  const { startDate, endDate, planTier } = normalize(filters);

  const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
    WITH months AS (
      SELECT generate_series(
        date_trunc('month', (SELECT MIN("occurredAt") FROM "SubscriptionEvent")),
        date_trunc('month', now()),
        interval '1 month'
      )::date AS month
    ),
    monthly_deltas AS (
      SELECT
        date_trunc('month', e."occurredAt")::date AS month,
        SUM(e."mrrDelta") FILTER (WHERE e.type = 'CREATED')    AS new_mrr,
        SUM(e."mrrDelta") FILTER (WHERE e.type = 'UPGRADED')   AS expansion_mrr,
        SUM(e."mrrDelta") FILTER (WHERE e.type = 'DOWNGRADED') AS contraction_mrr,
        SUM(e."mrrDelta") FILTER (WHERE e.type = 'CANCELLED')  AS churned_mrr,
        SUM(e."mrrDelta")                                      AS net_mrr_change
      FROM "SubscriptionEvent" e
      JOIN "Subscription" s ON s.id = e."subscriptionId"
      JOIN "Plan" p ON p.id = s."planId"
      WHERE (${planTier}::text IS NULL OR p.name = ${planTier})
      GROUP BY 1
    ),
    full_series AS (
      SELECT
        m.month,
        COALESCE(d.new_mrr, 0)          AS new_mrr,
        COALESCE(d.expansion_mrr, 0)    AS expansion_mrr,
        COALESCE(d.contraction_mrr, 0)  AS contraction_mrr,
        COALESCE(d.churned_mrr, 0)      AS churned_mrr,
        SUM(COALESCE(d.net_mrr_change, 0)) OVER (ORDER BY m.month) AS mrr
      FROM months m
      LEFT JOIN monthly_deltas d ON d.month = m.month
    )
    SELECT
      to_char(month, 'YYYY-MM-DD') AS month,
      new_mrr, expansion_mrr, contraction_mrr, churned_mrr, mrr
    FROM full_series
    WHERE (${startDate}::date IS NULL OR month >= ${startDate}::date)
      AND (${endDate}::date IS NULL OR month <= ${endDate}::date)
    ORDER BY month
  `;

  return rows.map((r) => ({
    month: String(r.month),
    newMrr: num(r.new_mrr),
    expansionMrr: num(r.expansion_mrr),
    contractionMrr: num(r.contraction_mrr),
    churnedMrr: num(r.churned_mrr),
    mrr: num(r.mrr),
  }));
}

export type ChurnRow = {
  month: string;
  activeAtStart: number;
  churnedCustomers: number;
  customerChurnRatePct: number | null;
  mrrStartOfMonth: number;
  churnedMrr: number;
  revenueChurnRatePct: number | null;
};

// Monthly customer and revenue churn rates, filtered by date range and plan tier
export async function getMonthlyChurn(filters: DashboardFilters = {}): Promise<ChurnRow[]> {
  const { startDate, endDate, planTier } = normalize(filters);

  const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
    WITH months AS (
      SELECT generate_series(
        date_trunc('month', COALESCE(${startDate}::date, (SELECT MIN("startDate") FROM "Subscription"))),
        date_trunc('month', COALESCE(${endDate}::date, now())),
        interval '1 month'
      )::date AS month_start
    ),
    bounds AS (
      SELECT month_start, (month_start + interval '1 month')::date AS month_end
      FROM months
    ),
    customer_counts AS (
      SELECT
        b.month_start,
        COUNT(s.id) FILTER (
          WHERE s."startDate" < b.month_start
            AND (s."endDate" IS NULL OR s."endDate" >= b.month_start)
        ) AS active_at_start,
        COUNT(s.id) FILTER (
          WHERE s."endDate" >= b.month_start AND s."endDate" < b.month_end
        ) AS churned_customers
      FROM bounds b
      LEFT JOIN "Subscription" s ON (
        ${planTier}::text IS NULL
        OR EXISTS (SELECT 1 FROM "Plan" pp WHERE pp.id = s."planId" AND pp.name = ${planTier})
      )
      GROUP BY b.month_start
    ),
    mrr_figures AS (
      SELECT
        b.month_start,
        SUM(e."mrrDelta") FILTER (WHERE e."occurredAt" < b.month_start) AS mrr_start_of_month,
        -SUM(e."mrrDelta") FILTER (
          WHERE e.type = 'CANCELLED'
            AND e."occurredAt" >= b.month_start
            AND e."occurredAt" < b.month_end
        ) AS churned_mrr
      FROM bounds b
      LEFT JOIN "SubscriptionEvent" e ON (
        ${planTier}::text IS NULL
        OR EXISTS (
          SELECT 1 FROM "Subscription" ss JOIN "Plan" pp ON pp.id = ss."planId"
          WHERE ss.id = e."subscriptionId" AND pp.name = ${planTier}
        )
      )
      GROUP BY b.month_start
    )
    SELECT
      to_char(c.month_start, 'YYYY-MM-DD') AS month_start,
      c.active_at_start,
      c.churned_customers,
      ROUND(100.0 * c.churned_customers / NULLIF(c.active_at_start, 0), 2) AS customer_churn_rate_pct,
      COALESCE(m.mrr_start_of_month, 0) AS mrr_start_of_month,
      COALESCE(m.churned_mrr, 0)        AS churned_mrr,
      ROUND(100.0 * COALESCE(m.churned_mrr, 0) / NULLIF(m.mrr_start_of_month, 0), 2) AS revenue_churn_rate_pct
    FROM customer_counts c
    JOIN mrr_figures m ON m.month_start = c.month_start
    ORDER BY c.month_start
  `;

  return rows.map((r) => ({
    month: String(r.month_start),
    activeAtStart: num(r.active_at_start),
    churnedCustomers: num(r.churned_customers),
    customerChurnRatePct: r.customer_churn_rate_pct === null ? null : num(r.customer_churn_rate_pct),
    mrrStartOfMonth: num(r.mrr_start_of_month),
    churnedMrr: num(r.churned_mrr),
    revenueChurnRatePct: r.revenue_churn_rate_pct === null ? null : num(r.revenue_churn_rate_pct),
  }));
}

export type CohortRetentionRow = {
  cohortMonth: string;
  cohortSize: number;
  monthsSinceSignup: number;
  retainedCustomers: number;
  retentionPct: number;
};

// Customer retention by signup cohort, filtered by date range and plan tier
export async function getCohortRetention(filters: DashboardFilters = {}): Promise<CohortRetentionRow[]> {
  const { startDate, endDate, planTier } = normalize(filters);

  const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
    WITH cohorts AS (
      SELECT
        c.id AS customer_id,
        date_trunc('month', c."createdAt")::date AS cohort_month,
        s."startDate",
        s."endDate"
      FROM "Customer" c
      JOIN "Subscription" s ON s."customerId" = c.id
      JOIN "Plan" p ON p.id = s."planId"
      WHERE (${planTier}::text IS NULL OR p.name = ${planTier})
        AND (${startDate}::date IS NULL OR date_trunc('month', c."createdAt") >= date_trunc('month', ${startDate}::date))
        AND (${endDate}::date IS NULL OR date_trunc('month', c."createdAt") <= date_trunc('month', ${endDate}::date))
    ),
    cohort_sizes AS (
      SELECT cohort_month, COUNT(*) AS cohort_size
      FROM cohorts
      GROUP BY cohort_month
    ),
    periods AS (
      SELECT generate_series(0, 23) AS months_since_signup
    ),
    retention AS (
      SELECT
        co.cohort_month,
        p.months_since_signup,
        COUNT(*) FILTER (
          WHERE (co."endDate" IS NULL OR co."endDate" > (co."startDate" + (p.months_since_signup || ' months')::interval))
        ) AS retained_customers
      FROM cohorts co
      CROSS JOIN periods p
      WHERE (co.cohort_month + (p.months_since_signup || ' months')::interval) <= date_trunc('month', now())
      GROUP BY co.cohort_month, p.months_since_signup
    )
    SELECT
      to_char(r.cohort_month, 'YYYY-MM-DD') AS cohort_month,
      cs.cohort_size,
      r.months_since_signup,
      r.retained_customers,
      ROUND(100.0 * r.retained_customers / cs.cohort_size, 2) AS retention_pct
    FROM retention r
    JOIN cohort_sizes cs ON cs.cohort_month = r.cohort_month
    ORDER BY r.cohort_month, r.months_since_signup
  `;

  return rows.map((r) => ({
    cohortMonth: String(r.cohort_month),
    cohortSize: num(r.cohort_size),
    monthsSinceSignup: num(r.months_since_signup),
    retainedCustomers: num(r.retained_customers),
    retentionPct: num(r.retention_pct),
  }));
}
