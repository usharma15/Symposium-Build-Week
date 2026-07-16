import { searchInputSchema } from "../../../../packages/contracts/src";
import { isDeletedPost } from "@/lib/symposiumCore";
import { getPublicInitialState, searchablePostText } from "./foundation";

export const search = async (rawInput: unknown, requesterHandle?: string | null) => {
  const input = searchInputSchema.parse(rawInput);
  const term = input.query.toLowerCase();
  const snapshot = await getPublicInitialState(requesterHandle);
  return {
    posts: snapshot.items
      .filter((item) => !isDeletedPost(item))
      .filter((item) => item.room !== "office" && item.kind !== "draft")
      .filter((item) => searchablePostText({ ...item, authorName: item.author }).toLowerCase().includes(term))
      .map((item) => ({
        ...item,
        saved: false,
        savedBy: [],
        signaledBy: [],
        forkedBy: [],
        comments: item.communityAccess === "citation-only" ? item.comments : []
      }))
      .slice(0, input.limit),
    profiles: Object.values(snapshot.profiles)
      .filter((person) => [person.name, person.handle, person.role, person.location, person.bio, ...person.fields].join(" ").toLowerCase().includes(term))
      .slice(0, input.limit),
    communities: (snapshot.communities ?? [])
      .filter((community) => [community.name, community.field, community.summary, ...community.keywords].join(" ").toLowerCase().includes(term))
      .slice(0, input.limit)
  };
};
