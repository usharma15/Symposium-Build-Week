import type { InquiryItem } from "@/lib/mockData";
import type { WorkspaceDocument } from "@/lib/workspaceTypes";
import type { PostToneContract } from "@/packages/contracts/src";
import { postTypeForItem } from "@/lib/postSemantics";

export type PostTone = PostToneContract;

export const postToneClassName = (tone: PostTone | null) =>
  tone ? `post-tone post-tone-${tone}` : "";

export const postToneForItem = (
  item: Pick<InquiryItem, "kind" | "room" | "patronage" | "opportunity" | "postType">
): PostTone | null => {
  const postType = postTypeForItem(item);
  if (postType === "proposal") return "patronage";
  if (postType === "opportunity") return "opportunity";
  if (postType === "thought") return "thought";
  if (postType === "paper") return "paper";
  return null;
};

export const postToneForWorkspaceDocument = (
  document: Pick<WorkspaceDocument, "kind" | "publicationTarget" | "proposal">
): PostTone | null => {
  const target = String(document.publicationTarget);
  if (document.proposal || target === "proposal") return "patronage";
  if (target === "opportunity") return "opportunity";
  if (document.kind === "thought" || target === "thought") return "thought";
  if (document.kind === "paper" || target === "paper") return "paper";
  return null;
};
