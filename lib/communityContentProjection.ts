import type { InquiryComment, InquiryItem, ResearchCommunity } from "@/lib/mockData";

const findComment = (comments: InquiryComment[], commentId: string): InquiryComment | null => {
  for (const comment of comments) {
    if (comment.id === commentId) return { ...comment, replies: [] };
    const nested = findComment(comment.replies ?? [], commentId);
    if (nested) return nested;
  }
  return null;
};

const citationOnlyProjection = (item: InquiryItem, citation: { postCited: boolean; commentIds: Set<string> }): InquiryItem => {
  const comments = [...citation.commentIds].flatMap((commentId) => {
    const comment = findComment(item.comments, commentId);
    return comment ? [{
      ...comment,
      metrics: { signal: "—", forks: "—", saves: "—", reads: "—" },
      savedBy: [],
      signaledBy: [],
      forkedBy: [],
      replies: []
    }] : [];
  });
  const primaryComment = comments[0];
  return {
    ...item,
    ...(!citation.postCited && primaryComment ? {
      title: "Cited community comment",
      author: primaryComment.author,
      authorHandle: primaryComment.authorHandle,
      body: "",
      excerpt: "",
      document: undefined,
      createdAt: primaryComment.createdAt
    } : {}),
    communityAccess: "citation-only",
    metrics: { signal: "—", critiques: "—", forks: "—", saves: "—", reads: "—" },
    tags: [],
    signals: [],
    claims: [],
    objections: [],
    evidence: [],
    tests: [],
    forks: [],
    comments,
    attachments: undefined,
    quote: undefined,
    patronage: undefined,
    opportunity: undefined,
    saved: false,
    savedBy: [],
    signaledBy: [],
    forkedBy: []
  };
};

export const projectCommunityItemsForViewer = (
  items: InquiryItem[],
  communities: ResearchCommunity[]
) => {
  const communityById = new Map(communities.map((community) => [community.id, community]));
  const citedSources = new Map<string, { postCited: boolean; commentIds: Set<string> }>();
  for (const item of items) {
    if (item.postType !== "paper" || !item.quote?.available) continue;
    const source = items.find((candidate) => candidate.id === item.quote?.sourcePostId);
    if (!source?.communityId) continue;
    const citation = citedSources.get(source.id) ?? { postCited: false, commentIds: new Set<string>() };
    if (item.quote.sourceType === "comment") citation.commentIds.add(item.quote.sourceId);
    else citation.postCited = true;
    citedSources.set(source.id, citation);
  }

  return items.flatMap((item) => {
    if (!item.communityId || item.postType === "paper") return [{ ...item, communityAccess: "full" as const }];
    const community = communityById.get(item.communityId);
    if (!community || community.visibility === "public" || community.membershipStatus === "active") {
      return [{ ...item, communityAccess: "full" as const }];
    }
    const citation = citedSources.get(item.id);
    return citation ? [citationOnlyProjection(item, citation)] : [];
  });
};
