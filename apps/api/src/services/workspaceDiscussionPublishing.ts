import { createHash } from "node:crypto";
import type { PoolClient } from "pg";
import {
  versionedDocumentSchema,
  type InquiryCommentContract,
  type VersionedDocumentContract
} from "../../../../packages/contracts/src";
import {
  attachmentsByOwner,
  type AttachmentRow
} from "../repository/foundation";
import { prepareWorkspacePublicationAttachments } from "./workspaceAttachmentPublishing";

type WorkspaceDiscussionRow = {
  id: string;
  parentId: string | null;
  authorHandle: string | null;
  authorName: string;
  stance: string;
  body: string;
  document: unknown | null;
  revision: number;
  createdAt: Date | string;
  editedAt: Date | string | null;
  deletedAt: Date | string | null;
};

type WorkspaceDiscussionActionRow = {
  commentId: string;
  actorHandle: string;
  action: "save" | "signal";
  active: boolean;
  count: number;
  revision: number;
  createdAt: Date | string;
  updatedAt: Date | string;
};

type PreparedWorkspaceDiscussionComment = WorkspaceDiscussionRow & {
  publicId: string;
  publicAttachmentIds: string[];
  publicDocument?: VersionedDocumentContract;
  metrics: InquiryCommentContract["metrics"];
  savedBy: string[];
  signaledBy: string[];
};

export type PreparedWorkspaceDiscussion = {
  comments: PreparedWorkspaceDiscussionComment[];
  actions: WorkspaceDiscussionActionRow[];
};

const emptyDocument: VersionedDocumentContract = {
  version: 1,
  nodes: [{ id: "workspace-publication-empty", type: "paragraph", content: [], align: "left", indent: 0 }],
  settings: { width: "standard", margin: "normal" }
};

const publishedCommentId = (noteId: string, revision: number, sourceCommentId: string) =>
  `comment-workspace-${createHash("sha256")
    .update(`symposium:workspace-comment-publication:${noteId}:${revision}:${sourceCommentId}`)
    .digest("hex")
    .slice(0, 24)}`;

const iso = (value: Date | string | null | undefined) => value ? new Date(value).toISOString() : undefined;

export const prepareWorkspaceDiscussionPublication = async (
  client: PoolClient,
  input: { noteId: string; revision: number; ownerHandle: string }
): Promise<PreparedWorkspaceDiscussion> => {
  const [commentResult, attachmentResult, actionResult, viewResult] = await Promise.all([
    client.query<WorkspaceDiscussionRow>(
      `SELECT
         id::text,
         parent_id::text AS "parentId",
         author_handle AS "authorHandle",
         author_name AS "authorName",
         stance,
         body,
         content_document AS document,
         revision,
         created_at AS "createdAt",
         edited_at AS "editedAt",
         deleted_at AS "deletedAt"
       FROM workspace_note_comments
       WHERE note_id = $1
       ORDER BY created_at ASC, id ASC`,
      [input.noteId]
    ),
    client.query<{ commentId: string; attachmentIds: string[] }>(
      `SELECT owner_id AS "commentId", array_agg(id::text ORDER BY created_at ASC) AS "attachmentIds"
       FROM attachments
       WHERE owner_type = 'note_comment'
         AND owner_id IN (SELECT id::text FROM workspace_note_comments WHERE note_id = $1)
         AND status IN ('uploaded', 'previewed')
       GROUP BY owner_id`,
      [input.noteId]
    ),
    client.query<WorkspaceDiscussionActionRow>(
      `SELECT
         comment_id::text AS "commentId",
         actor_handle AS "actorHandle",
         action,
         active,
         count,
         revision,
         created_at AS "createdAt",
         updated_at AS "updatedAt"
       FROM workspace_note_comment_actions
       WHERE note_id = $1
       ORDER BY created_at ASC, id ASC`,
      [input.noteId]
    ),
    client.query<{ commentId: string; readCount: string }>(
      `SELECT target_id AS "commentId", count(*)::text AS "readCount"
       FROM content_views
       WHERE target_type = 'note_comment'
         AND target_id IN (SELECT id::text FROM workspace_note_comments WHERE note_id = $1)
       GROUP BY target_id`,
      [input.noteId]
    )
  ]);

  const attachmentIdsByComment = new Map(
    attachmentResult.rows.map((row) => [row.commentId, row.attachmentIds ?? []])
  );
  const actionsByComment = new Map<string, WorkspaceDiscussionActionRow[]>();
  for (const action of actionResult.rows) {
    actionsByComment.set(action.commentId, [...(actionsByComment.get(action.commentId) ?? []), action]);
  }
  const readsByComment = new Map(viewResult.rows.map((row) => [row.commentId, row.readCount]));

  const comments: PreparedWorkspaceDiscussionComment[] = [];
  for (const source of commentResult.rows) {
    const sourceAttachmentIds = attachmentIdsByComment.get(source.id) ?? [];
    const parsedDocument = source.document ? versionedDocumentSchema.parse(source.document) : undefined;
    const publishedContent = await prepareWorkspacePublicationAttachments(client, {
      noteId: input.noteId,
      revision: input.revision,
      attachmentIds: sourceAttachmentIds,
      document: parsedDocument ?? emptyDocument,
      ownerType: "comment",
      sourceOwnerType: "note_comment",
      sourceOwnerId: source.id,
      uploaderHandle: source.authorHandle ?? input.ownerHandle
    });
    const sourceActions = actionsByComment.get(source.id) ?? [];
    const activeActions = source.deletedAt ? [] : sourceActions.filter((action) => action.active);
    const savedBy = activeActions.filter((action) => action.action === "save").map((action) => action.actorHandle);
    const signaledBy = activeActions.filter((action) => action.action === "signal").map((action) => action.actorHandle);
    comments.push({
      ...source,
      publicId: publishedCommentId(input.noteId, input.revision, source.id),
      publicAttachmentIds: publishedContent.attachmentIds,
      publicDocument: parsedDocument ? publishedContent.document : undefined,
      metrics: {
        signal: String(signaledBy.length),
        forks: "0",
        saves: String(savedBy.length),
        reads: source.deletedAt ? "0" : readsByComment.get(source.id) ?? "0"
      },
      savedBy,
      signaledBy
    });
  }

  const deletedCommentIds = new Set(comments.filter((comment) => comment.deletedAt).map((comment) => comment.id));
  return {
    comments,
    actions: actionResult.rows.map((action) => deletedCommentIds.has(action.commentId)
      ? { ...action, active: false, count: 0 }
      : action)
  };
};

export const publishPreparedWorkspaceDiscussion = async (
  client: PoolClient,
  input: {
    discussion: PreparedWorkspaceDiscussion;
    postId: string;
    rootParentId: string | null;
  }
) => {
  if (!input.discussion.comments.length) {
    return { comments: [] as InquiryCommentContract[], totalCount: 0, activeCount: 0 };
  }

  const publicIdBySource = new Map(
    input.discussion.comments.map((comment) => [comment.id, comment.publicId])
  );
  const remaining = [...input.discussion.comments];
  const orderedComments: PreparedWorkspaceDiscussionComment[] = [];
  const scheduled = new Set<string>();
  while (remaining.length) {
    const ready = remaining.filter((comment) =>
      !comment.parentId || scheduled.has(comment.parentId) || !publicIdBySource.has(comment.parentId)
    );
    if (!ready.length) throw new Error("The draft discussion contains a circular parent relationship.");
    for (const comment of ready) {
      orderedComments.push(comment);
      scheduled.add(comment.id);
      remaining.splice(remaining.indexOf(comment), 1);
    }
  }
  for (const comment of orderedComments) {
    const parentId = comment.parentId
      ? publicIdBySource.get(comment.parentId) ?? input.rootParentId
      : input.rootParentId;
    await client.query(
      `INSERT INTO comments (
         id, post_id, parent_id, author_handle, author_name, stance, body, content_document,
         revision, metrics, saved_by, signaled_by, forked_by, edited_at, deleted_at, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, '[]'::jsonb, $13, $14, $15, $16)`,
      [
        comment.publicId,
        input.postId,
        parentId,
        comment.authorHandle,
        comment.authorName,
        comment.stance,
        comment.body,
        comment.publicDocument ? JSON.stringify(comment.publicDocument) : null,
        comment.revision,
        JSON.stringify(comment.metrics),
        JSON.stringify(comment.savedBy),
        JSON.stringify(comment.signaledBy),
        comment.editedAt,
        comment.deletedAt,
        comment.createdAt,
        comment.editedAt ?? comment.createdAt
      ]
    );
    if (comment.publicAttachmentIds.length) {
      const attached = await client.query(
        `UPDATE attachments
         SET owner_id = $1, updated_at = now()
         WHERE owner_type = 'comment' AND owner_id IS NULL AND id = ANY($2::uuid[])
         RETURNING id`,
        [comment.publicId, comment.publicAttachmentIds]
      );
      if (attached.rowCount !== comment.publicAttachmentIds.length) {
        throw new Error("A published draft comment attachment could not be assigned to its public comment.");
      }
    }
    await client.query(
      `INSERT INTO content_views (
         target_type, target_id, actor_handle, bucket_start, trigger, surface, created_at, updated_at
       )
       SELECT 'comment', $2, actor_handle, bucket_start, trigger, 'thread', created_at, updated_at
       FROM content_views
       WHERE target_type = 'note_comment' AND target_id = $1
       ON CONFLICT (target_type, target_id, actor_handle, bucket_start) DO NOTHING`,
      [comment.id, comment.publicId]
    );
  }

  for (const action of input.discussion.actions) {
    const commentId = publicIdBySource.get(action.commentId);
    if (!commentId) continue;
    await client.query(
      `INSERT INTO comment_actions (
         comment_id, post_id, actor_handle, action, active, count, revision, created_at, updated_at
       ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        commentId,
        input.postId,
        action.actorHandle,
        action.action,
        action.active,
        action.count,
        action.revision,
        action.createdAt,
        action.updatedAt
      ]
    );
  }

  const publicAttachmentIds = input.discussion.comments.flatMap((comment) => comment.publicAttachmentIds);
  const attachmentRows = publicAttachmentIds.length
    ? await client.query<AttachmentRow>(
        `SELECT
           id::text,
           owner_type AS "ownerType",
           owner_id AS "ownerId",
           file_name AS "fileName",
           content_type AS "contentType",
           byte_size AS "byteSize",
           status,
           metadata,
           object_key AS "objectKey",
           created_at AS "createdAt"
         FROM attachments
         WHERE id = ANY($1::uuid[])`,
        [publicAttachmentIds]
      )
    : { rows: [] as AttachmentRow[] };
  const attachments = attachmentsByOwner(attachmentRows.rows);
  const contractBySource = new Map<string, InquiryCommentContract>();
  for (const comment of input.discussion.comments) {
    const parentId = comment.parentId
      ? publicIdBySource.get(comment.parentId) ?? input.rootParentId
      : input.rootParentId;
    contractBySource.set(comment.id, {
      id: comment.publicId,
      parentId,
      author: comment.authorName,
      authorHandle: comment.authorHandle ?? undefined,
      stance: comment.stance,
      body: comment.body,
      document: comment.publicDocument,
      revision: comment.revision,
      createdAt: iso(comment.createdAt),
      editedAt: iso(comment.editedAt),
      deletedAt: iso(comment.deletedAt),
      metrics: comment.metrics,
      savedBy: comment.savedBy,
      signaledBy: comment.signaledBy,
      forkedBy: [],
      attachments: (attachments.get(comment.publicId) ?? []).map((attachment) => attachment),
      replies: []
    });
  }
  const roots: InquiryCommentContract[] = [];
  for (const comment of input.discussion.comments) {
    const published = contractBySource.get(comment.id)!;
    const parent = comment.parentId ? contractBySource.get(comment.parentId) : undefined;
    if (parent) parent.replies!.push(published);
    else roots.push(published);
  }
  return {
    comments: roots,
    totalCount: input.discussion.comments.length,
    activeCount: input.discussion.comments.filter((comment) => !comment.deletedAt).length
  };
};
