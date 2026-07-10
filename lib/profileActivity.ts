import type { CanonicalActionActivityContract, ToggleActionContract } from "@/packages/contracts/src";
import type { InquiryComment, InquiryItem, ResearchProfile } from "@/lib/mockData";
import { cleanHandle, hasHandle, isDeletedComment, isDeletedPost, isSavedBy } from "@/lib/symposiumCore";

export type ProfilePostActionKind = "fork" | "signal" | "save";

export const itemMatchesProfilePostAction = (
  item: InquiryItem,
  person: ResearchProfile,
  action: ProfilePostActionKind,
  defaultSavedHandle?: string
) => {
  if (isDeletedPost(item)) return false;
  if (action === "fork") return hasHandle(item.forkedBy, person.handle);
  if (action === "signal") return hasHandle(item.signaledBy, person.handle);
  return isSavedBy(item, person.handle, defaultSavedHandle);
};

export const uniqueProfileActivityEntries = <T extends { recency: number }>(
  entries: T[],
  contentKey: (entry: T) => string
) => {
  const unique = new Map<string, T>();

  for (const entry of entries) {
    const key = contentKey(entry);
    const current = unique.get(key);
    if (!current || entry.recency > current.recency) unique.set(key, entry);
  }

  return [...unique.values()].sort((a, b) => b.recency - a.recency);
};

export const reconcileProfileActivitySlots = <T extends { id: string }>(current: T[], next: T[]) => {
  const nextById = new Map(next.map((slot) => [slot.id, slot]));
  const currentIds = new Set(current.map((slot) => slot.id));
  const added = next.filter((slot) => !currentIds.has(slot.id));
  const retained = current.flatMap((slot) => {
    const updated = nextById.get(slot.id);
    return updated ? [updated] : [];
  });

  return [...added, ...retained];
};

export const canonicalActivityKey = (
  activity: Pick<CanonicalActionActivityContract, "subjectType" | "subjectId" | "actorHandle" | "action">
) =>
  `${activity.subjectType}:${activity.subjectId}:${cleanHandle(activity.actorHandle)}:${activity.action}`;

export const canonicalActionState = (
  activities: CanonicalActionActivityContract[],
  subjectType: CanonicalActionActivityContract["subjectType"],
  subjectId: string,
  actorHandle: string,
  action: ToggleActionContract
) =>
  activities.find(
    (activity) =>
      activity.subjectType === subjectType &&
      activity.subjectId === subjectId &&
      cleanHandle(activity.actorHandle) === cleanHandle(actorHandle) &&
      activity.action === action
  );

export const isCanonicalActionActivity = (value: unknown): value is CanonicalActionActivityContract => {
  if (!value || typeof value !== "object") return false;
  const activity = value as Partial<CanonicalActionActivityContract>;
  return (
    (activity.subjectType === "post" || activity.subjectType === "comment") &&
    typeof activity.subjectId === "string" &&
    typeof activity.postId === "string" &&
    typeof activity.actorHandle === "string" &&
    (activity.action === "save" || activity.action === "signal" || activity.action === "fork") &&
    typeof activity.active === "boolean" &&
    Number.isInteger(activity.count) &&
    Number(activity.count) >= 0 &&
    Number.isInteger(activity.revision) &&
    Number(activity.revision) >= 1 &&
    typeof activity.occurredAt === "string" &&
    Number.isFinite(Date.parse(activity.occurredAt))
  );
};

export const mergeCanonicalActivities = (
  current: CanonicalActionActivityContract[],
  incoming: CanonicalActionActivityContract[]
) => {
  const merged = new Map(current.map((activity) => [canonicalActivityKey(activity), activity]));
  for (const activity of incoming) {
    const key = canonicalActivityKey(activity);
    const existing = merged.get(key);
    if (!existing || activity.revision >= existing.revision) merged.set(key, activity);
  }
  return [...merged.values()].sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
};

export const reconcileCanonicalActivityRefresh = ({
  current,
  incoming,
  pendingKeys,
  currentRevisions,
  requestStartRevisions
}: {
  current: CanonicalActionActivityContract[];
  incoming: CanonicalActionActivityContract[];
  pendingKeys: ReadonlySet<string>;
  currentRevisions: Record<string, number>;
  requestStartRevisions: Record<string, number>;
}) => {
  const incomingByKey = new Map(incoming.map((activity) => [canonicalActivityKey(activity), activity]));
  const retained = current.filter((activity) => {
    const key = canonicalActivityKey(activity);
    const incomingActivity = incomingByKey.get(key);
    if (pendingKeys.has(key)) return true;
    if (incomingActivity) return activity.revision > incomingActivity.revision;
    return (currentRevisions[key] ?? 0) > (requestStartRevisions[key] ?? 0);
  });
  return mergeCanonicalActivities(incoming, retained);
};

export const createLocalCanonicalActivity = ({
  subjectType,
  subjectId,
  postId,
  actorHandle,
  action,
  active,
  occurredAt = new Date().toISOString()
}: Pick<
  CanonicalActionActivityContract,
  "subjectType" | "subjectId" | "postId" | "actorHandle" | "action" | "active"
> & { occurredAt?: string }): CanonicalActionActivityContract => ({
  subjectType,
  subjectId,
  postId,
  actorHandle: cleanHandle(actorHandle),
  action,
  active,
  count: active ? 1 : 0,
  revision: Date.now(),
  occurredAt
});

const legacyActivityTimestamp = (createdAt: string | undefined) => {
  const timestamp = createdAt ? Date.parse(createdAt) : Number.NaN;
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : new Date(0).toISOString();
};

const legacyCommentActivities = (
  item: InquiryItem,
  comments: InquiryComment[],
  actorHandle: string,
  actions: Set<ToggleActionContract>,
  entries: CanonicalActionActivityContract[]
) => {
  for (const comment of comments) {
    if (!comment.id || isDeletedComment(comment)) continue;
    for (const action of actions) {
      const handles = action === "save" ? comment.savedBy : action === "signal" ? comment.signaledBy : comment.forkedBy;
      if (!hasHandle(handles, actorHandle)) continue;
      entries.push({
        subjectType: "comment",
        subjectId: comment.id,
        postId: item.id,
        actorHandle,
        action,
        active: true,
        count: 1,
        revision: 1,
        occurredAt: legacyActivityTimestamp(comment.createdAt ?? item.createdAt)
      });
    }
    legacyCommentActivities(item, comment.replies ?? [], actorHandle, actions, entries);
  }
};

export const buildLegacyProfileActivity = (
  items: InquiryItem[],
  actorHandle: string,
  allowedActions: ToggleActionContract[] = ["save", "signal", "fork"]
) => {
  const cleanActor = cleanHandle(actorHandle);
  const actions = new Set(allowedActions);
  const entries: CanonicalActionActivityContract[] = [];

  for (const item of items) {
    if (isDeletedPost(item)) continue;
    for (const action of actions) {
      const handles = action === "save" ? item.savedBy : action === "signal" ? item.signaledBy : item.forkedBy;
      if (!hasHandle(handles, cleanActor)) continue;
      entries.push({
        subjectType: "post",
        subjectId: item.id,
        postId: item.id,
        actorHandle: cleanActor,
        action,
        active: true,
        count: 1,
        revision: 1,
        occurredAt: legacyActivityTimestamp(item.createdAt)
      });
    }
    legacyCommentActivities(item, item.comments, cleanActor, actions, entries);
  }

  return entries.sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
};

export const buildLegacyActionLedger = (items: InquiryItem[]) => {
  const entries = new Map<string, CanonicalActionActivityContract>();
  const addActivity = (activity: CanonicalActionActivityContract) => {
    if (cleanHandle(activity.actorHandle) === "@") return;
    entries.set(canonicalActivityKey(activity), activity);
  };
  const collectCommentActivities = (item: InquiryItem, comments: InquiryComment[]) => {
    for (const comment of comments) {
      if (!comment.id || isDeletedComment(comment)) continue;
      const occurredAt = legacyActivityTimestamp(comment.createdAt ?? item.createdAt);
      for (const [action, handles] of [
        ["save", comment.savedBy],
        ["signal", comment.signaledBy],
        ["fork", comment.forkedBy]
      ] as const) {
        for (const actorHandle of handles ?? []) {
          addActivity({
            subjectType: "comment",
            subjectId: comment.id,
            postId: item.id,
            actorHandle: cleanHandle(actorHandle),
            action,
            active: true,
            count: 1,
            revision: 1,
            occurredAt
          });
        }
      }
      collectCommentActivities(item, comment.replies ?? []);
    }
  };

  for (const item of items) {
    if (isDeletedPost(item)) continue;
    const occurredAt = legacyActivityTimestamp(item.createdAt);
    for (const [action, handles] of [
      ["save", item.savedBy],
      ["signal", item.signaledBy],
      ["fork", item.forkedBy]
    ] as const) {
      for (const actorHandle of handles ?? []) {
        addActivity({
          subjectType: "post",
          subjectId: item.id,
          postId: item.id,
          actorHandle: cleanHandle(actorHandle),
          action,
          active: true,
          count: 1,
          revision: 1,
          occurredAt
        });
      }
    }
    collectCommentActivities(item, item.comments);
  }

  return [...entries.values()].sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt));
};

type ActionProjection = Record<ToggleActionContract, string[]>;

export const projectCanonicalActionLedger = (
  items: InquiryItem[],
  activities: CanonicalActionActivityContract[]
) => {
  const projections = new Map<string, ActionProjection>();
  for (const activity of activities) {
    const key = `${activity.subjectType}:${activity.subjectId}`;
    const projection = projections.get(key) ?? { save: [], signal: [], fork: [] };
    if (activity.active && !projection[activity.action].includes(cleanHandle(activity.actorHandle))) {
      projection[activity.action].push(cleanHandle(activity.actorHandle));
    }
    projections.set(key, projection);
  }

  const projectComments = (comments: InquiryComment[]): InquiryComment[] =>
    comments.map((comment) => {
      const projection = comment.id ? projections.get(`comment:${comment.id}`) : undefined;
      return {
        ...comment,
        ...(projection
          ? {
              savedBy: projection.save,
              signaledBy: projection.signal,
              forkedBy: projection.fork
            }
          : {}),
        replies: projectComments(comment.replies ?? [])
      };
    });

  return items.map((item) => {
    const projection = projections.get(`post:${item.id}`);
    return {
      ...item,
      ...(projection
        ? {
            saved: projection.save.length > 0,
            savedBy: projection.save,
            signaledBy: projection.signal,
            forkedBy: projection.fork
          }
        : {}),
      comments: projectComments(item.comments)
    };
  });
};
