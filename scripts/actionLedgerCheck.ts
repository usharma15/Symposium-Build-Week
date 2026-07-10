import assert from "node:assert/strict";
import { resolveActionTransition } from "@/apps/api/src/repository/actions";
import type { InquiryComment, InquiryItem } from "@/lib/mockData";
import {
  isCanonicalActionActivity,
  mergeCanonicalActivities,
  projectCanonicalActionLedger,
  reconcileCanonicalActivityRefresh
} from "@/lib/profileActivity";
import {
  commentMetricsFallback,
  mutateCommentForActor,
  mutateItemForActor,
  setCommentActionMembership,
  setItemActionMembership
} from "@/lib/symposiumCore";

assert.deepEqual(resolveActionTransition(undefined, true), {
  previousActive: false,
  nextActive: true,
  changed: true
});
assert.deepEqual(resolveActionTransition(true, true), {
  previousActive: true,
  nextActive: true,
  changed: false
});
assert.deepEqual(resolveActionTransition(true), {
  previousActive: true,
  nextActive: false,
  changed: true
});

const item: InquiryItem = {
  id: "ledger-post",
  kind: "thought",
  room: "symposium",
  title: "Ledger verification",
  author: "Ada",
  affiliation: "Independent",
  date: "Now",
  status: "Open",
  metrics: { signal: "3", critiques: "0", forks: "4", saves: "5", reads: "6" },
  gatheringReason: "Verification",
  excerpt: "Verification",
  body: "Verification",
  tags: [],
  signals: [],
  claims: [],
  objections: [],
  evidence: [],
  tests: [],
  forks: [],
  comments: [],
  savedBy: ["@stale"]
};

const reconciledInactive = setItemActionMembership(item, "save", "@ada", false);
const activated = mutateItemForActor(reconciledInactive, "save", "@ada", "@ada", true);
assert.deepEqual(activated.savedBy?.sort(), ["@ada", "@stale"]);
assert.equal(activated.metrics.saves, "6");

const reconciledActive = setItemActionMembership(activated, "save", "@ada", true);
const idempotent = mutateItemForActor(reconciledActive, "save", "@ada", "@ada", true);
assert.equal(idempotent.metrics.saves, "6");

const comment: InquiryComment = {
  id: "ledger-comment",
  author: "Ada",
  stance: "Comment",
  body: "Verification",
  metrics: { ...commentMetricsFallback, forks: "2" },
  forkedBy: ["@ada"],
  replies: []
};
const reconciledComment = setCommentActionMembership(comment, "fork", "@ada", true);
const idempotentComment = mutateCommentForActor(reconciledComment, "fork", "@ada", true);
assert.equal(idempotentComment.metrics?.forks, "2");

const baseActivity = {
  subjectType: "post" as const,
  subjectId: item.id,
  postId: item.id,
  actorHandle: "@ada",
  action: "save" as const,
  count: 1,
  occurredAt: "2026-07-09T20:00:00.000Z"
};
const merged = mergeCanonicalActivities(
  [{ ...baseActivity, active: false, revision: 2 }],
  [{ ...baseActivity, active: true, revision: 1 }]
);
assert.equal(merged.length, 1);
assert.equal(merged[0].revision, 2);
assert.equal(merged[0].active, false);

const projected = projectCanonicalActionLedger(
  [{ ...activated, savedBy: ["@stale", "@ada"], forkedBy: ["@stale"] }],
  [
    { ...baseActivity, active: false, count: 0, revision: 2 },
    {
      ...baseActivity,
      action: "fork",
      active: true,
      count: 1,
      revision: 3,
      occurredAt: "2026-07-09T20:01:00.000Z"
    }
  ]
);
assert.deepEqual(projected[0].savedBy, []);
assert.equal(projected[0].saved, false);
assert.deepEqual(projected[0].forkedBy, ["@ada"]);
assert.equal(isCanonicalActionActivity({ ...baseActivity, active: true, revision: 0 }), false);

const activityKey = "post:ledger-post:@ada:save";
const retainedDuringRequest = reconcileCanonicalActivityRefresh({
  current: [{ ...baseActivity, active: false, count: 0, revision: 2 }],
  incoming: [],
  pendingKeys: new Set(),
  currentRevisions: { [activityKey]: 2 },
  requestStartRevisions: { [activityKey]: 1 }
});
assert.equal(retainedDuringRequest[0]?.active, false);
assert.equal(retainedDuringRequest[0]?.revision, 2);

const removedByAuthoritativeRefresh = reconcileCanonicalActivityRefresh({
  current: [{ ...baseActivity, active: true, revision: 1 }],
  incoming: [],
  pendingKeys: new Set(),
  currentRevisions: { [activityKey]: 1 },
  requestStartRevisions: { [activityKey]: 1 }
});
assert.equal(removedByAuthoritativeRefresh.length, 0);

const retainedOptimistic = reconcileCanonicalActivityRefresh({
  current: [{ ...baseActivity, active: true, revision: 1 }],
  incoming: [],
  pendingKeys: new Set([activityKey]),
  currentRevisions: {},
  requestStartRevisions: {}
});
assert.equal(retainedOptimistic.length, 1);

console.log(
  JSON.stringify(
    {
      ok: true,
      checked: [
        "ledger transitions",
        "materialized membership reconciliation",
        "canonical projection repair",
        "refresh race reconciliation",
        "stale revision rejection"
      ]
    },
    null,
    2
  )
);

export {};
