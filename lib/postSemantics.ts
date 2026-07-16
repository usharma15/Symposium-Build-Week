import type {
  ContentKindContract,
  PostTypeContract,
  WorkspacePublicationTargetContract
} from "@/packages/contracts/src";

type PostSemanticSource = {
  kind: ContentKindContract;
  room: string;
  postType?: PostTypeContract;
  patronage?: unknown;
  opportunity?: unknown;
};

export const postTypeForItem = (item: PostSemanticSource): PostTypeContract | null => {
  if (item.room === "office") return null;
  if (item.patronage || item.room === "funding") return "proposal";
  if (item.opportunity || item.room === "opportunities") return "opportunity";
  if (item.postType) return item.postType;
  if (item.kind === "paper") return "paper";
  if (item.kind === "thought" || item.kind === "note") return "thought";
  return null;
};

export const editorKindForPostType = (postType: PostTypeContract): "paper" | "thought" =>
  postType === "paper" || postType === "proposal" ? "paper" : "thought";

export const roomForPostType = (postType: PostTypeContract) =>
  postType === "proposal"
    ? "funding" as const
    : postType === "opportunity"
      ? "opportunities" as const
      : postType === "paper"
        ? "library" as const
        : "amphitheater" as const;

export const postTypeForWorkspaceTarget = (
  target: WorkspacePublicationTargetContract
): PostTypeContract | null =>
  target === "paper" || target === "thought" || target === "proposal" || target === "opportunity"
    ? target
    : null;

export const itemHasPostType = (item: PostSemanticSource, postType: PostTypeContract) =>
  postTypeForItem(item) === postType;

export const preservePostSemanticProjection = <T extends PostSemanticSource>(
  incoming: T,
  current?: T
): T => {
  if (!current) return incoming;
  const postType = postTypeForItem(incoming) ?? postTypeForItem(current) ?? undefined;
  const patronage = postType === "proposal" && !incoming.patronage ? current.patronage : incoming.patronage;
  const opportunity = postType === "opportunity" && !incoming.opportunity ? current.opportunity : incoming.opportunity;
  if (postType === incoming.postType && patronage === incoming.patronage && opportunity === incoming.opportunity) {
    return incoming;
  }
  return { ...incoming, postType, patronage, opportunity };
};
