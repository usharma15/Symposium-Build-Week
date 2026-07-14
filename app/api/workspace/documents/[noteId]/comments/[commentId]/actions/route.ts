import { readJson } from "@/lib/api";
import { proxyLiveBackend } from "@/lib/liveBackendClient";
import { applyLocalWorkspaceCommentAction } from "@/lib/localWorkspaceCommentStore";
import { privateWorkspaceResponse, workspaceActorHandle, workspaceRouteError } from "@/lib/workspaceRouteSupport";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = { params: Promise<{ noteId: string; commentId: string }> };

export async function POST(request: Request, context: Context) {
  const { noteId, commentId } = await context.params;
  const body = await readJson<Record<string, unknown> & { actorHandle?: string }>(request);
  const actorHandle = workspaceActorHandle(request, body?.actorHandle);
  const payload = { ...body };
  delete payload.actorHandle;
  const live = await proxyLiveBackend(
    `/v1/workspace/documents/${encodeURIComponent(noteId)}/comments/${encodeURIComponent(commentId)}/actions`,
    {
      method: "POST",
      body: payload,
      actorHandle,
      idempotencyKey: request.headers.get("Idempotency-Key") ?? undefined
    }
  );
  if (live) return live;
  try {
    return privateWorkspaceResponse(await applyLocalWorkspaceCommentAction(noteId, commentId, payload, actorHandle));
  } catch (error) {
    return workspaceRouteError(error);
  }
}
