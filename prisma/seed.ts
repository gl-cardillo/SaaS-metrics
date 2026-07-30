import { randomUUID } from "node:crypto";
import { faker } from "@faker-js/faker";
import { prisma } from "../src/lib/prisma";

const NOW = new Date();
const HISTORY_MONTHS = 24;
const CUSTOMER_COUNT = 1000;
const CHUNK_SIZE = 500;

type Tier = 0 | 1 | 2;
type BillingPeriod = "MONTHLY" | "ANNUAL";

const TIERS: { name: string; monthly: number; annual: number }[] = [
  { name: "Starter", monthly: 19, annual: 190 },
  { name: "Pro", monthly: 49, annual: 490 },
  { name: "Business", monthly: 149, annual: 1490 },
];
// randomly pick an item from a weighted list of items
function weightedPick<T>(items: { value: T; weight: number }[]): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let roll = Math.random() * total;
  for (const item of items) {
    if (roll < item.weight) return item.value;
    roll -= item.weight;
  }
  return items[items.length - 1].value;
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setUTCMonth(result.getUTCMonth() + months);
  return result;
}

function monthsBetween(from: Date, to: Date): number {
  return (
    (to.getUTCFullYear() - from.getUTCFullYear()) * 12 +
    (to.getUTCMonth() - from.getUTCMonth())
  );
}

function monthlyEquivalent(tier: Tier, billingPeriod: BillingPeriod): number {
  const def = TIERS[tier];
  return billingPeriod === "MONTHLY" ? def.monthly : def.annual / 12;
}

function planPrice(tier: Tier, billingPeriod: BillingPeriod): number {
  const def = TIERS[tier];
  return billingPeriod === "MONTHLY" ? def.monthly : def.annual;
}

// cancellation probability for each month
function churnProbability(
  tenureMonths: number,
  hadUnresolvedFailure: boolean,
): number {
  const base = tenureMonths <= 2 ? 0.09 : tenureMonths <= 6 ? 0.05 : 0.02;
  return Math.min(0.6, hadUnresolvedFailure ? base + 0.15 : base);
}

async function createManyChunked<T>(
  insert: (chunk: T[]) => Promise<unknown>,
  data: T[],
) {
  for (let i = 0; i < data.length; i += CHUNK_SIZE) {
    await insert(data.slice(i, i + CHUNK_SIZE));
  }
}

async function main() {
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.subscriptionEvent.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.plan.deleteMany();
  await prisma.customer.deleteMany();

  const plans: {
    id: string;
    name: string;
    price: number;
    billingPeriod: BillingPeriod;
    tier: Tier;
  }[] = [];
  for (let tier = 0; tier < TIERS.length; tier++) {
    const def = TIERS[tier];
    plans.push({
      id: randomUUID(),
      name: def.name,
      price: def.monthly,
      billingPeriod: "MONTHLY",
      tier: tier as Tier,
    });
    plans.push({
      id: randomUUID(),
      name: def.name,
      price: def.annual,
      billingPeriod: "ANNUAL",
      tier: tier as Tier,
    });
  }
  await prisma.plan.createMany({
    data: plans.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      billingPeriod: p.billingPeriod,
      isActive: true,
    })),
  });

  function planId(tier: Tier, billingPeriod: BillingPeriod): string {
    const plan = plans.find(
      (p) => p.tier === tier && p.billingPeriod === billingPeriod,
    );
    if (!plan) throw new Error(`No plan for tier ${tier} / ${billingPeriod}`);
    return plan.id;
  }

  const cohortWeights = Array.from({ length: HISTORY_MONTHS }, (_, i) => ({
    value: i,
    weight: Math.pow(i + 1, 1.6),
  }));

  const names = faker.helpers.uniqueArray(faker.internet.email, CUSTOMER_COUNT);

  const customerRows: {
    id: string;
    name: string;
    email: string;
    createdAt: Date;
  }[] = [];
  const subscriptionRows: {
    id: string;
    customerId: string;
    planId: string;
    status: "ACTIVE" | "CANCELLED";
    startDate: Date;
    endDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }[] = [];
  const eventRows: {
    id: string;
    subscriptionId: string;
    type: "CREATED" | "UPGRADED" | "DOWNGRADED" | "CANCELLED";
    previousPlanId: string | null;
    newPlanId: string | null;
    mrrDelta: number;
    occurredAt: Date;
    createdAt: Date;
  }[] = [];
  const invoiceRows: {
    id: string;
    subscriptionId: string;
    customerId: string;
    amount: number;
    status: "PAID" | "OPEN" | "UNCOLLECTIBLE";
    periodStart: Date;
    periodEnd: Date;
    issuedAt: Date;
    dueAt: Date;
    createdAt: Date;
  }[] = [];
  const paymentRows: {
    id: string;
    invoiceId: string;
    amount: number;
    status: "SUCCEEDED" | "FAILED";
    method: string;
    paidAt: Date | null;
    createdAt: Date;
  }[] = [];

  for (let i = 0; i < CUSTOMER_COUNT; i++) {
    const cohortMonth = weightedPick(cohortWeights);
    const cohortStart = addMonths(NOW, -(HISTORY_MONTHS - 1 - cohortMonth));
    const daysInWindow =
      cohortMonth === HISTORY_MONTHS - 1 ? new Date().getUTCDate() : 28;
    const signupDate = new Date(cohortStart);
    signupDate.setUTCDate(1 + Math.floor(Math.random() * daysInWindow));

    const customerId = randomUUID();
    const name = faker.person.fullName();
    customerRows.push({
      id: customerId,
      name,
      email: names[i],
      createdAt: signupDate,
    });

    let tier = weightedPick<Tier>([
      { value: 0, weight: 50 },
      { value: 1, weight: 35 },
      { value: 2, weight: 15 },
    ]);
    const billingPeriod = weightedPick<BillingPeriod>([
      { value: "MONTHLY", weight: 70 },
      { value: "ANNUAL", weight: 30 },
    ]);

    const subscriptionId = randomUUID();
    const totalTenureMonths = monthsBetween(signupDate, NOW);

    eventRows.push({
      id: randomUUID(),
      subscriptionId,
      type: "CREATED",
      previousPlanId: null,
      newPlanId: planId(tier, billingPeriod),
      mrrDelta: monthlyEquivalent(tier, billingPeriod),
      occurredAt: signupDate,
      createdAt: signupDate,
    });

    let cancelledAt: Date | null = null;
    let hadUnresolvedFailure = false;

    for (let m = 0; m <= totalTenureMonths; m++) {
      const monthDate = addMonths(signupDate, m);
      const isAnniversary = billingPeriod === "MONTHLY" || m % 12 === 0;

      if (isAnniversary) {
        const invoiceId = randomUUID();
        const periodEnd = addMonths(
          monthDate,
          billingPeriod === "MONTHLY" ? 1 : 12,
        );
        const amount = planPrice(tier, billingPeriod);

        const isFailure = Math.random() < 0.05;
        if (!isFailure) {
          invoiceRows.push({
            id: invoiceId,
            subscriptionId,
            customerId,
            amount,
            status: "PAID",
            periodStart: monthDate,
            periodEnd,
            issuedAt: monthDate,
            dueAt: addMonths(monthDate, 0),
            createdAt: monthDate,
          });
          paymentRows.push({
            id: randomUUID(),
            invoiceId,
            amount,
            status: "SUCCEEDED",
            method: faker.helpers.arrayElement([
              "card",
              "bank_transfer",
              "paypal",
            ]),
            paidAt: monthDate,
            createdAt: monthDate,
          });
          hadUnresolvedFailure = false;
        } else {
          const recovered = Math.random() < 0.7;
          const daysSinceIssue =
            NOW.getTime() - monthDate.getTime() > 60 * 24 * 60 * 60 * 1000;
          invoiceRows.push({
            id: invoiceId,
            subscriptionId,
            customerId,
            amount,
            status: recovered
              ? "PAID"
              : daysSinceIssue
                ? "UNCOLLECTIBLE"
                : "OPEN",
            periodStart: monthDate,
            periodEnd,
            issuedAt: monthDate,
            dueAt: addMonths(monthDate, 0),
            createdAt: monthDate,
          });
          const failedPaymentDate = monthDate;
          paymentRows.push({
            id: randomUUID(),
            invoiceId,
            amount,
            status: "FAILED",
            method: faker.helpers.arrayElement([
              "card",
              "bank_transfer",
              "paypal",
            ]),
            paidAt: null,
            createdAt: failedPaymentDate,
          });
          if (recovered) {
            const retryDate = new Date(
              failedPaymentDate.getTime() + 3 * 24 * 60 * 60 * 1000,
            );
            paymentRows.push({
              id: randomUUID(),
              invoiceId,
              amount,
              status: "SUCCEEDED",
              method: faker.helpers.arrayElement([
                "card",
                "bank_transfer",
                "paypal",
              ]),
              paidAt: retryDate,
              createdAt: retryDate,
            });
          }
          hadUnresolvedFailure = !recovered;
        }
      }

      if (m === 0) continue;

      if (Math.random() < churnProbability(m, hadUnresolvedFailure)) {
        cancelledAt = monthDate;
        eventRows.push({
          id: randomUUID(),
          subscriptionId,
          type: "CANCELLED",
          previousPlanId: planId(tier, billingPeriod),
          newPlanId: null,
          mrrDelta: -monthlyEquivalent(tier, billingPeriod),
          occurredAt: monthDate,
          createdAt: monthDate,
        });
        break;
      }

      const changeRoll = Math.random();
      if (changeRoll < 0.035 && tier < 2) {
        const previousPlanId = planId(tier, billingPeriod);
        const previousMrr = monthlyEquivalent(tier, billingPeriod);
        tier = (tier + 1) as Tier;
        eventRows.push({
          id: randomUUID(),
          subscriptionId,
          type: "UPGRADED",
          previousPlanId,
          newPlanId: planId(tier, billingPeriod),
          mrrDelta: monthlyEquivalent(tier, billingPeriod) - previousMrr,
          occurredAt: monthDate,
          createdAt: monthDate,
        });
      } else if (changeRoll < 0.055 && tier > 0) {
        const previousPlanId = planId(tier, billingPeriod);
        const previousMrr = monthlyEquivalent(tier, billingPeriod);
        tier = (tier - 1) as Tier;
        eventRows.push({
          id: randomUUID(),
          subscriptionId,
          type: "DOWNGRADED",
          previousPlanId,
          newPlanId: planId(tier, billingPeriod),
          mrrDelta: monthlyEquivalent(tier, billingPeriod) - previousMrr,
          occurredAt: monthDate,
          createdAt: monthDate,
        });
      }
    }

    subscriptionRows.push({
      id: subscriptionId,
      customerId,
      planId: planId(tier, billingPeriod),
      status: cancelledAt ? "CANCELLED" : "ACTIVE",
      startDate: signupDate,
      endDate: cancelledAt,
      createdAt: signupDate,
      updatedAt: cancelledAt ?? NOW,
    });
  }

  await createManyChunked(
    (chunk) => prisma.customer.createMany({ data: chunk }),
    customerRows,
  );
  await createManyChunked(
    (chunk) => prisma.subscription.createMany({ data: chunk }),
    subscriptionRows,
  );
  await createManyChunked(
    (chunk) => prisma.subscriptionEvent.createMany({ data: chunk }),
    eventRows,
  );
  await createManyChunked(
    (chunk) => prisma.invoice.createMany({ data: chunk }),
    invoiceRows,
  );
  await createManyChunked(
    (chunk) => prisma.payment.createMany({ data: chunk }),
    paymentRows,
  );

  console.log(
    `Seeded ${customerRows.length} customers, ${subscriptionRows.length} subscriptions, ${eventRows.length} events, ${invoiceRows.length} invoices, ${paymentRows.length} payments.`,
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
