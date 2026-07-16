import { jsonError, readJson } from "@/lib/api";
import { proxyLiveBackend } from "@/lib/liveBackendClient";
import { mutateLocalCommunityMembership } from "@/lib/localCommunityStore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const { id } = await context.params;
  const body = await readJson<{ action?: string; actorHandle?: string }>(request);
  const action = body?.action;
  const actorHandle = body?.actorHandle ?? "";
  if (action !== "join" && action !== "leave" && action !== "access") return jsonError("Choose a valid membership action.", 400);
  if (!actorHandle) return jsonError("Choose a profile before changing membership.", 401);
  const livePath = action === "join"
    ? `/v1/communities/${encodeURIComponent(id)}/join`
    : action === "leave"
      ? `/v1/communities/${encodeURIComponent(id)}/membership`
      : `/v1/communities/${encodeURIComponent(id)}/access`;
  const live = await proxyLiveBackend(livePath, {
    method: action === "leave" ? "DELETE" : "POST",
    body: {},
    actorHandle,
    idempotencyKey: request.headers.get("Idempotency-Key") ?? undefined
  });
  if (live) return live;
  try {
    return Response.json(await mutateLocalCommunityMembership(id, actorHandle, action));
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Membership could not be changed.", 403);
  }
}
