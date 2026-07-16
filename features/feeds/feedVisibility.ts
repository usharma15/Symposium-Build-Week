import type { FeedScope, InquiryItem, ResearchProfile, RoomId } from "@/lib/mockData";
import type { OfficeMode } from "@/features/navigation/viewState";
import { itemAuthoredByProfile } from "@/features/profiles/ProfileViews";
import { isSavedBy } from "@/lib/symposiumCore";
import { itemHasPostType } from "@/lib/postSemantics";
import { communityPostIsExternallyDiscoverable } from "@/features/communities/communityPolicy";

export const selectVisibleFeedItems = (input: {
  items: InquiryItem[];
  activeRoom: RoomId;
  officeMode: OfficeMode;
  feedScope: FeedScope;
  currentProfile: ResearchProfile;
  fallbackProfile: ResearchProfile;
  followingHandles: string[];
}) => input.items
  .filter((item) => input.activeRoom === "communities" || communityPostIsExternallyDiscoverable(item))
  .filter((item) => {
    if (input.activeRoom === "hall" || input.activeRoom === "symposium") {
      return itemHasPostType(item, "paper") || itemHasPostType(item, "thought");
    }
    if (input.activeRoom === "office") {
      if (input.officeMode === "saved") return isSavedBy(item, input.currentProfile.handle, input.fallbackProfile.handle);
      return input.officeMode === "notes"
        && (itemAuthoredByProfile(item, input.currentProfile) || item.room === "office");
    }
    if (input.activeRoom === "library") return itemHasPostType(item, "paper");
    if (input.activeRoom === "amphitheater") return itemHasPostType(item, "thought");
    if (input.activeRoom === "funding") return itemHasPostType(item, "proposal");
    if (input.activeRoom === "opportunities") return itemHasPostType(item, "opportunity");
    if (input.activeRoom === "communities") return item.room === "communities";
    return true;
  })
  .filter((item) => input.feedScope !== "following"
    || itemAuthoredByProfile(item, input.currentProfile)
    || Boolean(item.authorHandle && input.followingHandles.includes(item.authorHandle))
    || isSavedBy(item, input.currentProfile.handle, input.fallbackProfile.handle));
