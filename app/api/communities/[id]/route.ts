import { jsonError } from "@/lib/api";
import { proxyLiveBackend } from "@/lib/liveBackendClient";
import { listLocalCommunities } from "@/lib/localCommunityStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  const { id } = await context.params;
  const actorHandle = new URL(request.url).searchParams.get("actorHandle") ?? undefined;
  const live = await proxyLiveBackend(`/v1/communities/${encodeURIComponent(id)}`, { actorHandle });
  if (live) return live;
  const community = (await listLocalCommunities(actorHandle)).find((candidate) => candidate.id === id);
  return community ? Response.json({ community }) : jsonError("Community not found.", 404);
}
