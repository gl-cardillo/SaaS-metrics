-- MRR per month: running total of subscription revenue
WITH months AS (
  -- one row per calendar month, even ones with no events
  SELECT generate_series(
    date_trunc('month', (SELECT MIN("occurredAt") FROM "SubscriptionEvent")),
    date_trunc('month', now()),
    interval '1 month'
  )::date AS month
),
monthly_deltas AS (
  -- one row per month, with five conditional sums computed in a single pass
  SELECT
    date_trunc('month', e."occurredAt")::date AS month,
    SUM(e."mrrDelta") FILTER (WHERE e.type = 'CREATED')    AS new_mrr,
    SUM(e."mrrDelta") FILTER (WHERE e.type = 'UPGRADED')   AS expansion_mrr,
    SUM(e."mrrDelta") FILTER (WHERE e.type = 'DOWNGRADED') AS contraction_mrr,
    SUM(e."mrrDelta") FILTER (WHERE e.type = 'CANCELLED')  AS churned_mrr,
    SUM(e."mrrDelta")                                      AS net_mrr_change
  FROM "SubscriptionEvent" e
  GROUP BY 1
)
SELECT
  m.month,
  COALESCE(d.new_mrr, 0)          AS new_mrr,
  COALESCE(d.expansion_mrr, 0)    AS expansion_mrr,
  COALESCE(d.contraction_mrr, 0)  AS contraction_mrr,
  COALESCE(d.churned_mrr, 0)      AS churned_mrr,
  -- cumulative sum of every month's net change up to and including this one
  SUM(COALESCE(d.net_mrr_change, 0)) OVER (ORDER BY m.month) AS mrr
FROM months m
LEFT JOIN monthly_deltas d ON d.month = m.month -- LEFT JOIN keeps quiet months instead of dropping them
ORDER BY m.month;


-- Churn rate per month
WITH months AS (
  SELECT generate_series(
    date_trunc('month', (SELECT MIN("startDate") FROM "Subscription")),
    date_trunc('month', now()),
    interval '1 month'
  )::date AS month_start
),
bounds AS (
  -- turn each month into a [start, end) range
  SELECT month_start, (month_start + interval '1 month')::date AS month_end
  FROM months
),
customer_counts AS (
  SELECT
    b.month_start,
    -- signed up before this month and hadn't ended yet
    COUNT(s.id) FILTER (
      WHERE s."startDate" < b.month_start
        AND (s."endDate" IS NULL OR s."endDate" >= b.month_start)
    ) AS active_at_start,
    -- ended somewhere inside this month's window
    COUNT(s.id) FILTER (
      WHERE s."endDate" >= b.month_start AND s."endDate" < b.month_end
    ) AS churned_customers
  FROM bounds b
  LEFT JOIN "Subscription" s ON TRUE -- cross join every month with every subscription, then count per month
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
  LEFT JOIN "SubscriptionEvent" e ON TRUE
  GROUP BY b.month_start
)
SELECT
  c.month_start,
  c.active_at_start,
  c.churned_customers,
  ROUND(100.0 * c.churned_customers / NULLIF(c.active_at_start, 0), 2) AS customer_churn_rate_pct,
  COALESCE(m.mrr_start_of_month, 0) AS mrr_start_of_month,
  COALESCE(m.churned_mrr, 0)        AS churned_mrr,
  ROUND(100.0 * COALESCE(m.churned_mrr, 0) / NULLIF(m.mrr_start_of_month, 0), 2) AS revenue_churn_rate_pct
FROM customer_counts c
JOIN mrr_figures m ON m.month_start = c.month_start
ORDER BY c.month_start;


-- group customers by signup month, track % still active N months later
WITH cohorts AS (
  -- each customer paired with their own subscription's start/end dates
  SELECT
    c.id AS customer_id,
    date_trunc('month', c."createdAt")::date AS cohort_month,
    s."startDate",
    s."endDate"
  FROM "Customer" c
  JOIN "Subscription" s ON s."customerId" = c.id
),
cohort_sizes AS (
  -- how many customers signed up in each cohort month
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
  CROSS JOIN periods p -- every customer paired with every N value, filtered down below
  -- only report a pair once the whole cohort has actually reached that age
  WHERE (co.cohort_month + (p.months_since_signup || ' months')::interval) <= date_trunc('month', now())
  GROUP BY co.cohort_month, p.months_since_signup
)
SELECT
  r.cohort_month,
  cs.cohort_size,
  r.months_since_signup,
  r.retained_customers,
  ROUND(100.0 * r.retained_customers / cs.cohort_size, 2) AS retention_pct
FROM retention r
JOIN cohort_sizes cs ON cs.cohort_month = r.cohort_month
ORDER BY r.cohort_month, r.months_since_signup;
