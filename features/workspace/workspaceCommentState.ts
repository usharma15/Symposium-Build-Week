import type { InquiryComment } from "@/lib/mockData";

const flattenComments = (comments: InquiryComment[], target = new Map<string, InquiryComment>()) => {
  for (const comment of comments) {
    if (comment.id) target.set(comment.id, { ...comment, replies: [] });
    flattenComments(comment.replies ?? [], target);
  }
  return target;
};

const commentTime = (comment: InquiryComment) => Date.parse(comment.createdAt ?? "") || 0;

export const reconcileWorkspaceComments = (
  current: InquiryComment[],
  incoming: InquiryComment[]
): InquiryComment[] => {
  const currentById = flattenComments(current);
  const incomingById = flattenComments(incoming);
  const merged = new Map<string, InquiryComment>();
  for (const [id, comment] of currentById) merged.set(id, comment);
  for (const [id, comment] of incomingById) {
    const existing = merged.get(id);
    if (!existing || (comment.revision ?? 1) >= (existing.revision ?? 1)) merged.set(id, comment);
  }

  const roots: InquiryComment[] = [];
  const ordered = [...merged.values()].sort((left, right) => {
    const difference = commentTime(left) - commentTime(right);
    return difference || String(left.id).localeCompare(String(right.id));
  });
  for (const comment of ordered) {
    comment.replies = [];
  }
  for (const comment of ordered) {
    const parent = comment.parentId ? merged.get(comment.parentId) : undefined;
    if (parent) parent.replies!.push(comment);
    else roots.push(comment);
  }
  return roots;
};
