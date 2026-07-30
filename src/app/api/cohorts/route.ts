import { getCohortRetention } from "@/lib/queries";

export async function GET() {
  const data = await getCohortRetention();
  return Response.json(data);
}
