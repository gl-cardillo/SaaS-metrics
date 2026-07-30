import { getMonthlyMrr } from "@/lib/queries";

export async function GET() {
  const data = await getMonthlyMrr();
  return Response.json(data);
}
