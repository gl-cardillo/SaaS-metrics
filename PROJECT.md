# SaaS Metrics Dashboard

A dashboard for the metrics of a SaaS business: MRR, churn, and cohort retention.

I wanted to build something that shows how a SaaS business actually operates — how MRR moves month over month (new revenue, expansion, contraction, churn), the difference between customer churn and revenue churn, and how cohort retention tells you whether people are actually sticking around.

## Stack

- Next.js (TypeScript)
- Tailwind
- PostgreSQL via Supabase 
- Prisma for the ORM
- Deployed on Vercel

## Data model (conceptual)

Customers subscribe to plans over time, and those subscriptions get created, upgraded, downgraded, or cancelled. None of the metrics are stored directly — MRR, churn, cohorts, all of it gets derived from subscription history. That means the seed data actually has to behave like a real business: months of history, real churn, real plan changes. Otherwise the metrics don't mean anything.

## Dashboard

- MRR trend over time, broken into new / expansion / contraction / churned revenue
- Monthly customer churn rate and revenue churn rate
- Cohort retention grid — customers grouped by signup month, tracked for how well each cohort retains over time
