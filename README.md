## SaaS Metrics Dashboard

A dashboard for the numbers that actually tell you if a SaaS business is healthy: how MRR moves month to month (new, expansion, contraction, churn), the gap between customer churn and revenue churn, and whether cohorts actually stick around over time.

Nothing is pre-aggregated. Every figure is computed at query time from subscription and billing history — the seed data models a couple years of a fake company's life (signups, upgrades, downgrades, cancellations) so the metrics have to be derived the same way they would against a real production database.

### Live

[saa-s-metrics.vercel.app](https://saa-s-metrics.vercel.app/)

### Stack

Next.js, Tailwind, Prisma, PostgreSQL (Supabase), Vercel.

### Getting started

```bash
npm install
npm run dev
```
