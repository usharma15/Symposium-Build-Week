import { jsonError, readJson } from "@/lib/api";
import { proxyLiveBackend } from "@/lib/liveBackendClient";
import { createLocalCommunityCall, listLocalCommunityCalls } from "@/lib/localCommunityStore";
import { createCommunityCallInputSchema } from "@/packages/contracts/src";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  const { id } = await context.params;
  const actorHandle = new URL(request.url).searchParams.get("actorHandle") ?? undefined;
  const live = await proxyLiveBackend(`/v1/communities/${encodeURIComponent(id)}/calls`, { actorHandle });
  if (live) return live;
  try {
    return Response.json({ calls: await listLocalCommunityCalls(id, actorHandle) });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Calls are unavailable.", 403);
  }
}
export async function POST(request: Request, context: Context) {
  const { id } = await context.params;
  const body = await readJson<Record<string, unknown>>(request);
  if (!body) return jsonError("Invalid JSON body.", 400);
  const parsed = createCommunityCallInputSchema.safeParse({ ...body, communityId: id });
  if (!parsed.success) return jsonError("Add a title and choose voice or video.", 400);
  const actorHandle = typeof body.actorHandle === "string" ? body.actorHandle : "";
  const live = await proxyLiveBackend(`/v1/communities/${encodeURIComponent(id)}/calls`, {
    method: "POST",
    body: parsed.data,
    actorHandle,
    idempotencyKey: request.headers.get("Idempotency-Key") ?? undefined
  });
  if (live) return live;
  try {
    return Response.json({ call: await createLocalCommunityCall(parsed.data, actorHandle) });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Call could not be created.", 403);
  }
}
