import { faker } from "@faker-js/faker";
import { prisma } from "../src/lib/prisma";

async function main() {
  await prisma.customer.deleteMany();

  const customers = faker.helpers.uniqueArray(faker.internet.email, 12).map((email) => ({
    name: faker.person.fullName(),
    email,
    createdAt: faker.date.past({ years: 1 }),
  }));

  await prisma.customer.createMany({ data: customers });
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
