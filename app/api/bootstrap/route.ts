import { getSnapshot } from "@/lib/dataStore";
import { proxyLiveBackend } from "@/lib/liveBackendClient";
import { profile } from "@/lib/mockData";
import { listLocalCommunities } from "@/lib/localCommunityStore";
import { projectCommunityItemsForViewer } from "@/lib/communityContentProjection";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const actorHandle = new URL(request.url).searchParams.get("actorHandle") ?? undefined;
  const live = await proxyLiveBackend("/v1/bootstrap", { actorHandle });
  if (live) return live;

  const snapshot = await getSnapshot();
  const communities = await listLocalCommunities(actorHandle);
  return Response.json({
    ...snapshot,
    items: projectCommunityItemsForViewer(snapshot.items, communities),
    communities,
    defaultProfile: profile
  });
}
