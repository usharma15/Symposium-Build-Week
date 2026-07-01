import { proxyLiveBackend } from "@/lib/liveBackendClient";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = url.searchParams.toString();
  const live = await proxyLiveBackend(`/v1/events${query ? `?${query}` : ""}`);
  if (live) return live;

  return Response.json({ events: [], cursor: url.searchParams.get("cursor") });
}
