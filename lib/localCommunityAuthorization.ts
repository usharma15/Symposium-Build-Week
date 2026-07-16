import type { InquiryItem } from "@/lib/mockData";
import { listLocalCommunities } from "@/lib/localCommunityStore";
import { projectCommunityItemsForViewer } from "@/lib/communityContentProjection";

export const localCommunityReadAllowed = async (item: InquiryItem, actorHandle: string) => {
  if (!item.communityId || item.postType === "paper") return true;
  const community = (await listLocalCommunities(actorHandle)).find((candidate) => candidate.id === item.communityId);
  return Boolean(community && (community.visibility === "public" || community.membershipStatus === "active"));
};

export const localCommunityParticipationAllowed = async (item: InquiryItem, actorHandle: string) => {
  if (!item.communityId || item.postType === "paper") return true;
  const community = (await listLocalCommunities(actorHandle)).find((candidate) => candidate.id === item.communityId);
  return community?.membershipStatus === "active";
};

export const localQuoteSourceItems = async (items: InquiryItem[], actorHandle: string) =>
  projectCommunityItemsForViewer(items, await listLocalCommunities(actorHandle))
    .filter((item) => item.communityAccess !== "citation-only");
