import { type NextRequest } from "next/server";
import { getMonthlyMrr } from "@/lib/queries";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const data = await getMonthlyMrr({
    startDate: params.get("start"),
    endDate: params.get("end"),
    planTier: params.get("tier"),
  });
  return Response.json(data);
}
