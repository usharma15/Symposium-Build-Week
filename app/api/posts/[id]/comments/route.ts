import { addComment, getSnapshot, type CreateCommentInput } from "@/lib/dataStore";
import { jsonError, readJson } from "@/lib/api";
import { proxyLiveBackend } from "@/lib/liveBackendClient";
import { randomUUID } from "node:crypto";
import {
  deleteLocalOwnerAttachments,
  LocalAttachmentStoreError,
  replaceLocalOwnerAttachments
} from "@/lib/localAttachmentStore";
import { findCommentInTree, isDeletedPost } from "@/lib/symposiumCore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Context = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: Context) {
  const { id } = await context.params;
  const idempotencyKey = request.headers.get("Idempotency-Key") ?? undefined;
  const body = await readJson<Partial<CreateCommentInput> & { attachmentIds?: unknown[]; authorHandle?: string }>(request);

  if (!body) {
    return jsonError("Invalid JSON body.", 400);
  }

  const input: CreateCommentInput = {
    body: String(body.body ?? "").trim(),
    stance: String(body.stance ?? "Comment").trim(),
    parentId: body.parentId ? String(body.parentId) : null
  };
  const attachmentIds = Array.isArray(body.attachmentIds)
    ? body.attachmentIds.map((attachmentId) => String(attachmentId))
    : [];

  if (!input.body) {
    return jsonError("Comment body is required.", 400);
  }

  const live = await proxyLiveBackend(`/v1/posts/${id}/comments`, {
    method: "POST",
    body: { ...input, attachmentIds, authorHandle: body.authorHandle },
    actorHandle: body.authorHandle ? String(body.authorHandle) : undefined,
    idempotencyKey
  });
  if (live) return live;

  const commentId = randomUUID();
  try {
    const snapshot = await getSnapshot();
    const existing = snapshot.items.find((item) => item.id === id);
    if (
      !existing ||
      isDeletedPost(existing) ||
      (input.parentId && !findCommentInTree(existing.comments, input.parentId))
    ) {
      return jsonError("Post not found, deleted, or cannot accept this reply.", 404);
    }
    if (attachmentIds.length && (existing.room === "office" || existing.kind === "draft")) {
      return jsonError("Private comment attachments require protected delivery before they can be published.", 412);
    }
    const attachments = await replaceLocalOwnerAttachments({
      actorHandle: String(body.authorHandle ?? ""),
      attachmentIds,
      ownerId: commentId,
      ownerType: "comment"
    });
    const result = await addComment(id, { ...input, id: commentId, attachments }, String(body.authorHandle ?? ""));
    if (!result) {
      await deleteLocalOwnerAttachments("comment", commentId);
      return jsonError("Post not found, deleted, or cannot accept this reply.", 404);
    }

    return Response.json(result);
  } catch (error) {
    if (error instanceof LocalAttachmentStoreError) return jsonError(error.message, error.status);
    throw error;
  }
}
