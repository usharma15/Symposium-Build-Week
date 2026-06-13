import { getSnapshot } from "@/lib/dataStore";
import { profile } from "@/lib/mockData";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = await getSnapshot();
  return Response.json({
    ...snapshot,
    defaultProfile: profile
  });
}
