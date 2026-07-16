import { createPost, getSnapshot, type CreatePostInput } from "@/lib/dataStore";
import type { ContentKind, RoomId } from "@/lib/mockData";
import { jsonError, readJson } from "@/lib/api";
import { proxyLiveBackend } from "@/lib/liveBackendClient";
import { contentKinds, postRooms } from "@/lib/symposiumCore";
import { ContentQuoteError, resolveLocalContentQuote } from "@/lib/contentQuotes";
import { contentQuoteSourceSchema, opportunityPostInputSchema, patronageProposalInputSchema, postTypeSchema, versionedDocumentSchema } from "@/packages/contracts/src";
import {
  LocalAttachmentStoreError,
  replaceLocalOwnerAttachments,
  resolveLocalPostAttachments
} from "@/lib/localAttachmentStore";
import { listLocalCommunities } from "@/lib/localCommunityStore";
import { projectCommunityItemsForViewer } from "@/lib/communityContentProjection";
import { localQuoteSourceItems } from "@/lib/localCommunityAuthorization";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const actorHandle = new URL(request.url).searchParams.get("actorHandle") ?? undefined;
  const live = await proxyLiveBackend("/v1/posts", { actorHandle });
  if (live) return live;

  const snapshot = await getSnapshot();
  const communities = await listLocalCommunities(actorHandle);
  return Response.json({
    items: projectCommunityItemsForViewer(snapshot.items, communities)
      .filter((item) => !item.communityId || item.postType === "paper")
  });
}

export async function POST(request: Request) {
  const idempotencyKey = request.headers.get("Idempotency-Key") ?? undefined;
  const body = await readJson<Partial<CreatePostInput> & {
    attachmentIds?: unknown[];
    authorHandle?: string;
    communityId?: string;
    quoteSource?: unknown;
    patronage?: unknown;
    opportunity?: unknown;
  }>(request);

  if (!body) {
    return jsonError("Invalid JSON body.", 400);
  }

  const kind = String(body.kind ?? "");
  const room = String(body.room ?? "");
  const postType = postTypeSchema.safeParse(body.postType);
  if (!postType.success) return jsonError("Choose a valid publication type.", 400);
  const attachmentIds = Array.isArray(body.attachmentIds)
    ? body.attachmentIds.map((attachmentId) => String(attachmentId))
    : Array.isArray(body.attachments)
      ? body.attachments.map((attachment) => String(attachment.id))
      : [];
  const input: CreatePostInput = {
    title: String(body.title ?? "").trim(),
    body: String(body.body ?? "").trim(),
    document: body.document === undefined ? undefined : versionedDocumentSchema.safeParse(body.document).data,
    kind: contentKinds.includes(kind as ContentKind) ? (kind as ContentKind) : "thought",
    postType: postType.data,
    room: postRooms.includes(room as Exclude<RoomId, "hall">)
      ? (room as Exclude<RoomId, "hall">)
      : "symposium",
    communityId: body.communityId ? String(body.communityId) : undefined,
    attachments: Array.isArray(body.attachments) ? body.attachments : []
  };

  if (!input.title || !input.body) {
    return jsonError("Title and body are required.", 400);
  }
  if (input.kind !== "paper" && input.kind !== "thought" && input.kind !== "note") {
    return jsonError("Private drafts and code artifacts publish through the Workspace, not the public post endpoint.", 400);
  }
  if (body.document !== undefined && !versionedDocumentSchema.safeParse(body.document).success) {
    return jsonError("The post document is invalid or unsupported.", 400);
  }
  const quoteSource = body.quoteSource === undefined ? undefined : contentQuoteSourceSchema.safeParse(body.quoteSource);
  if (quoteSource && !quoteSource.success) return jsonError("Choose an available post or comment to quote.", 400);
  const patronage = body.patronage === undefined ? undefined : patronageProposalInputSchema.safeParse(body.patronage);
  if (patronage && !patronage.success) return jsonError("Add a valid funding goal and proposal status.", 400);
  const opportunity = body.opportunity === undefined ? undefined : opportunityPostInputSchema.safeParse(body.opportunity);
  if (opportunity && !opportunity.success) return jsonError("Add valid opportunity details.", 400);
  if ((input.room === "funding") !== Boolean(patronage?.success) || (patronage?.success && input.kind !== "paper")) {
    return jsonError("Patronage proposals publish as paper-grade posts in the Patronage Hall.", 400);
  }
  if ((input.room === "opportunities") !== Boolean(opportunity?.success) || (opportunity?.success && input.kind !== "thought")) {
    return jsonError("Opportunities publish as thought-grade posts with application metadata.", 400);
  }
  const expectedPostType = patronage?.success
    ? "proposal"
    : opportunity?.success
      ? "opportunity"
      : input.kind === "paper"
        ? "paper"
        : "thought";
  if (input.postType !== expectedPostType) {
    return jsonError("The publication type must describe the post independently of its editor format.", 400);
  }
  if (input.communityId && input.postType === "paper" && input.room !== "library") {
    return jsonError("Community papers publish canonically in the Library.", 400);
  }

  const live = await proxyLiveBackend("/v1/posts", {
    method: "POST",
    body: {
      title: input.title,
      body: input.body,
      document: input.document,
      kind: input.kind,
      postType: input.postType,
      room: input.room,
      communityId: input.communityId,
      authorHandle: body.authorHandle,
      attachmentIds,
      quoteSource: quoteSource?.data,
      patronage: patronage?.data,
      opportunity: opportunity?.data
    },
    actorHandle: body.authorHandle ? String(body.authorHandle) : undefined,
    idempotencyKey
  });
  if (live) return live;

  try {
    if (input.communityId) {
      const community = (await listLocalCommunities(String(body.authorHandle ?? ""))).find((candidate) => candidate.id === input.communityId);
      if (!community || community.membershipStatus !== "active") return jsonError("Join this community before participating.", 403);
    }
    if (attachmentIds.length && input.room === "office") {
      return jsonError("Private post attachments require protected delivery before they can be published.", 412);
    }
    const snapshot = await getSnapshot();
    const localAttachments = attachmentIds.length
      ? await resolveLocalPostAttachments(attachmentIds, String(body.authorHandle ?? ""))
      : [];
    const quote = resolveLocalContentQuote(
      await localQuoteSourceItems(snapshot.items, String(body.authorHandle ?? "")),
      quoteSource?.data
    );
    const item = await createPost({ ...input, attachments: localAttachments, quote, patronage: patronage?.data, opportunity: opportunity?.data }, String(body.authorHandle ?? ""));
    await replaceLocalOwnerAttachments({
      actorHandle: String(body.authorHandle ?? ""),
      attachmentIds,
      ownerId: item.id,
      ownerType: "post"
    });
    return Response.json({ item });
  } catch (error) {
    if (error instanceof ContentQuoteError) return jsonError(error.message, error.status);
    if (error instanceof LocalAttachmentStoreError) return jsonError(error.message, error.status);
    throw error;
  }
}
