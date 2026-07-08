import assert from "node:assert/strict";
import type { InquiryComment } from "@/lib/mockData";
import {
  appendCommentToTree,
  commentActionActive,
  commentMetricsFallback,
  findCommentInTree,
  mapCommentTree,
  mutateCommentForActor
} from "@/lib/symposiumCore";

const root: InquiryComment = {
  id: "root",
  author: "Ada",
  authorHandle: "@ada",
  stance: "Comment",
  body: "Root comment",
  metrics: { ...commentMetricsFallback },
  replies: [
    {
      id: "child",
      parentId: "root",
      author: "Grace",
      authorHandle: "@grace",
      stance: "Reply",
      body: "Child comment",
      metrics: { ...commentMetricsFallback },
      replies: []
    }
  ]
};

const topLevel = appendCommentToTree([root], {
  id: "new-root",
  author: "Katherine",
  authorHandle: "@katherine",
  stance: "Comment",
  body: "Another root",
  metrics: { ...commentMetricsFallback },
  replies: []
});
assert.equal(topLevel.inserted, true);
assert.equal(topLevel.comments.length, 2);

const nested = appendCommentToTree([root], {
  id: "grandchild",
  parentId: "child",
  author: "Dorothy",
  authorHandle: "@dorothy",
  stance: "Reply",
  body: "Nested reply",
  metrics: { ...commentMetricsFallback },
  replies: []
});
assert.equal(nested.inserted, true);
assert.equal(findCommentInTree(nested.comments, "grandchild")?.parentId, "child");

const rejected = appendCommentToTree([root], {
  id: "orphan",
  parentId: "missing",
  author: "Orphan",
  authorHandle: "@orphan",
  stance: "Reply",
  body: "Should not insert",
  metrics: { ...commentMetricsFallback },
  replies: []
});
assert.equal(rejected.inserted, false);
assert.equal(findCommentInTree(rejected.comments, "orphan"), null);

const saved = mutateCommentForActor(root, "save", "@ada", true);
assert.equal(saved.metrics?.saves, "1");
assert.equal(commentActionActive(saved, "save", "@ada"), true);

const unsaved = mutateCommentForActor(saved, "save", "@ada", false);
assert.equal(unsaved.metrics?.saves, "0");
assert.equal(commentActionActive(unsaved, "save", "@ada"), false);

const mapped = mapCommentTree([root], "child", (comment) => ({
  ...comment,
  body: "Updated child"
}));
assert.equal(mapped.updated?.id, "child");
assert.equal(findCommentInTree(mapped.comments, "child")?.body, "Updated child");

const deleted: InquiryComment = {
  ...root,
  deletedAt: "2026-07-07T00:00:00.000Z",
  savedBy: [],
  metrics: { ...commentMetricsFallback }
};
const deletedAfterAction = mutateCommentForActor(deleted, "save", "@ada", true);
assert.deepEqual(deletedAfterAction, deleted);

console.log(JSON.stringify({ ok: true, checked: "symposiumCore comment helpers" }, null, 2));

export {};
