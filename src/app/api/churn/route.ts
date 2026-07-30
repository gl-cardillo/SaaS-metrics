import { getMonthlyChurn } from "@/lib/queries";

export async function GET() {
  const data = await getMonthlyChurn();
  return Response.json(data);
}
