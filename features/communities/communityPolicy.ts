import type { InquiryItem, ResearchCommunity, ResearchProfile } from "@/lib/mockData";
import { cleanHandle } from "@/lib/symposiumCore";
import { itemHasPostType } from "@/lib/postSemantics";

export const communityMembershipStatus = (
  community: ResearchCommunity,
  profile: Pick<ResearchProfile, "handle">
) => {
  if (community.membershipStatus) return community.membershipStatus;
  return community.memberHandles.some((handle) => cleanHandle(handle) === cleanHandle(profile.handle))
    ? "active" as const
    : "none" as const;
};
export const isActiveCommunityMember = (
  community: ResearchCommunity,
  profile: Pick<ResearchProfile, "handle">
) => communityMembershipStatus(community, profile) === "active";

export const canViewCommunity = (
  community: ResearchCommunity,
  profile: Pick<ResearchProfile, "handle">
) => community.visibility === "public" || isActiveCommunityMember(community, profile);

export const canParticipateInCommunity = (
  community: ResearchCommunity,
  profile: Pick<ResearchProfile, "handle">
) => isActiveCommunityMember(community, profile);

export const communityMembershipLabel = (
  community: ResearchCommunity,
  profile: Pick<ResearchProfile, "handle">
) => {
  const status = communityMembershipStatus(community, profile);
  if (status === "active") return "Leave community";
  if (status === "requested") return "Requested";
  if (status === "invited") return "Accept invitation";
  return community.visibility === "private" ? "Request to join" : "Join community";
};

export const communityPostIsExternallyDiscoverable = (item: InquiryItem) =>
  !item.communityId || itemHasPostType(item, "paper");

export const communityPostIsInteractive = (item: InquiryItem) =>
  item.communityAccess !== "citation-only";

export const communityRecencyScore = (community: ResearchCommunity) => {
  const parsed = Date.parse(community.lastAccessedAt ?? "");
  return Number.isFinite(parsed) ? parsed : 0;
};
