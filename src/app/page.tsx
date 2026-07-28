import { prisma } from "@/lib/prisma";

export default async function Home() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-24">
      <h1 className="text-4xl font-bold">SaaS Metrics Dashboard</h1>
      <table className="min-w-md text-left">
        <thead>
          <tr>
            <th className="pr-4">Name</th>
            <th className="pr-4">Email</th>
            <th>Joined</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id}>
              <td className="pr-4">{customer.name}</td>
              <td className="pr-4">{customer.email}</td>
              <td>{customer.createdAt.toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
