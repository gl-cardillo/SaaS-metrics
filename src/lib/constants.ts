export const PLAN_TIERS = ["Starter", "Pro", "Business"] as const;

export type PlanTier = (typeof PLAN_TIERS)[number];
