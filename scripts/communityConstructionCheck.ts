import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  createCommunityInputSchema,
  createPostInputSchema,
  researchCommunitySchema,
  type InquiryItemContract,
} from "../packages/contracts/src";
import {
  canViewCommunity,
  communityMembershipLabel,
  communityPostIsExternallyDiscoverable
} from "../features/communities/communityPolicy";
import { getCommunityItems } from "../features/discovery/discoveryPolicy";
import { projectCommunityItemsForViewer } from "../lib/communityContentProjection";

const profile = { handle: "@viewer" };
const community = researchCommunitySchema.parse({
  id: "test-community",
  name: "Test Community",
  field: "Tests and verification",
  summary: "A community used to verify the shared construction path.",
  visibility: "private",
  online: 2,
  memberHandles: [],
  keywords: ["test"],
  seedCounts: { papers: 0, thoughts: 0, opportunities: 0 },
  callStatus: "quiet",
  membershipStatus: "none"
});

const item = (input: Partial<InquiryItemContract> & Pick<InquiryItemContract, "id" | "kind" | "postType" | "room" | "title">): InquiryItemContract => ({
  author: "Researcher",
  authorHandle: "@researcher",
  affiliation: "Test bench",
  date: "Now",
  status: "New",
  metrics: { signal: "0", critiques: "0", forks: "0", saves: "0", reads: "0" },
  gatheringReason: "Verification",
  excerpt: "Verification item",
  body: "Verification item body",
  tags: [],
  signals: [],
  claims: [],
  objections: [],
  evidence: [],
  tests: [],
  forks: [],
  comments: [],
  ...input
});

const privateThought = item({
  id: "private-thought",
  kind: "thought",
  postType: "thought",
  room: "amphitheater",
  title: "Private source",
  communityId: community.id
});
const publicPaper = item({
  id: "public-paper",
  kind: "paper",
  postType: "paper",
  room: "library",
  title: "Public paper",
  communityId: community.id,
  quote: {
    sourceType: "post",
    sourceId: privateThought.id,
    sourcePostId: privateThought.id,
    available: true,
    attachmentCount: 0
  }
});
const privateCommentSource = item({
  id: "private-comment-source",
  kind: "thought",
  postType: "thought",
  room: "amphitheater",
  title: "Private comment context",
  communityId: community.id,
  comments: [{
    id: "private-cited-comment",
    author: "Comment Author",
    authorHandle: "@comment-author",
    body: "Only this cited comment should survive the private projection.",
    stance: "note",
    replies: [{
      id: "private-hidden-reply",
      author: "Hidden Reply Author",
      body: "This reply is community context and must stay hidden.",
      stance: "reply"
    }]
  }]
});
const commentCitingPaper = item({
  id: "comment-citing-paper",
  kind: "paper",
  postType: "paper",
  room: "library",
  title: "Paper citing a private comment",
  communityId: community.id,
  quote: {
    sourceType: "comment",
    sourceId: "private-cited-comment",
    sourcePostId: privateCommentSource.id,
    available: true,
    attachmentCount: 0
  }
});

assert.equal(canViewCommunity(community, profile), false, "Private communities must remain closed to non-members.");
assert.equal(communityMembershipLabel(community, profile), "Request to join");
assert.equal(communityPostIsExternallyDiscoverable(privateThought), false, "Community thoughts must not enter external discovery.");
assert.equal(communityPostIsExternallyDiscoverable(publicPaper), true, "Community papers must remain globally discoverable.");
assert.deepEqual(getCommunityItems([privateThought, publicPaper], community).map((entry) => entry.id), [privateThought.id, publicPaper.id], "Community feeds must use explicit community identity.");

const projected = projectCommunityItemsForViewer([privateThought, publicPaper], [community]);
assert.deepEqual(projected.map((entry) => entry.id), [privateThought.id, publicPaper.id], "A paper-cited private source must remain directly available.");
assert.equal(projected[0]?.communityAccess, "citation-only", "Private cited sources must be non-interactive projections.");
assert.equal(projected[1]?.communityAccess, "full", "Papers must retain full public access.");

const commentProjected = projectCommunityItemsForViewer([privateCommentSource, commentCitingPaper], [community]);
const citedCommentSource = commentProjected.find((entry) => entry.id === privateCommentSource.id);
assert.equal(citedCommentSource?.title, "Cited community comment", "A private cited comment must not reveal its parent post context.");
assert.equal(citedCommentSource?.authorHandle, "@comment-author", "A private cited comment may reveal only its own author.");
assert.equal(citedCommentSource?.body, "", "A private cited comment must not reveal the parent post body.");
assert.deepEqual(citedCommentSource?.comments.map((comment) => comment.id), ["private-cited-comment"], "Only the exact cited comment may remain visible.");
assert.deepEqual(citedCommentSource?.comments[0]?.replies, [], "Replies around a cited private comment must remain hidden.");

assert.equal(createCommunityInputSchema.safeParse({
  name: "New Bench",
  field: "Instrument tests",
  summary: "A place to test instruments together.",
  visibility: "public"
}).success, true);

const basePost = {
  title: "Community paper",
  body: "A fully public paper from a community.",
  kind: "paper" as const,
  postType: "paper" as const,
  authorHandle: "@viewer",
  communityId: community.id,
  attachmentIds: [],
  attachments: []
};
assert.equal(createPostInputSchema.safeParse({ ...basePost, room: "library" }).success, true);
assert.equal(createPostInputSchema.safeParse({ ...basePost, room: "amphitheater" }).success, false, "Community papers must publish in the Library.");

const main = async () => {
const sources = await Promise.all([
  readFile(new URL("../features/communities/CommunityViews.tsx", import.meta.url), "utf8"),
  readFile(new URL("../apps/api/src/repository/communities.ts", import.meta.url), "utf8"),
  readFile(new URL("../apps/api/src/repository/foundation.ts", import.meta.url), "utf8"),
  readFile(new URL("../app/api/communities/[id]/membership/route.ts", import.meta.url), "utf8")
]);
const [views, repository, foundation, membershipRoute] = sources;
assert.match(views, /communityMembershipLabel/, "The selected view must use one canonical membership control.");
assert.match(views, /Create community/, "The directory must expose community creation.");
assert.match(views, /Events & calls/, "The active right rail must expose events and calls.");
assert.match(repository, /assertCommunityParticipation/, "Community writes must enforce active participation.");
assert.match(repository, /last_accessed_at/, "Recent community access must persist server-side.");
assert.match(foundation, /citationOnlyItemProjection/, "Bootstrap delivery must enforce citation-only private source projection.");
assert.match(membershipRoute, /action === "leave"/, "The single membership control must support leave through the same client route.");

console.log("community construction checks passed");
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
